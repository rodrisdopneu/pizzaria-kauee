import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatBRL, monthLabel, startOfMonth, endOfMonth, toISODate, formatDate } from "@/lib/format";
import { ArrowDownCircle, ArrowUpCircle, TrendingUp, TrendingDown, Sparkles, History as HistoryIcon, Check, CalendarClock, AlertCircle } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, LineChart, Line, ReferenceLine } from "recharts";
import { toast } from "sonner";

type MonthRow = { key: string; label: string; income: number; expense: number; balance: number; projected?: boolean };

export default function History() {
  const { user } = useAuth();
  const [history, setHistory] = useState<MonthRow[]>([]);
  const [projection, setProjection] = useState<MonthRow[]>([]);
  const [futureBills, setFutureBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const now = new Date();

    const startRange = toISODate(startOfMonth(new Date(now.getFullYear(), now.getMonth() - 11, 1)));
    const endRange = toISODate(endOfMonth(now));

    const { data: tx } = await supabase
      .from("transactions")
      .select("amount, type, occurred_on")
      .gte("occurred_on", startRange)
      .lte("occurred_on", endRange);

    const months: MonthRow[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const inMonth = (tx ?? []).filter((t: any) => t.occurred_on.startsWith(key));
      const income = inMonth.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0);
      const expense = inMonth.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0);
      months.push({
        key,
        label: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        income,
        expense,
        balance: income - expense,
      });
    }
    setHistory(months);

    const closed = months.slice(0, -1);
    const sample = closed.slice(-6).filter((m) => m.income + m.expense > 0);
    const avgIncome = sample.length ? sample.reduce((s, m) => s + m.income, 0) / sample.length : 0;
    const avgExpense = sample.length ? sample.reduce((s, m) => s + m.expense, 0) / sample.length : 0;

    const { data: bills } = await supabase
      .from("bills")
      .select("id, description, amount, due_date, status, category_id, recurrence, installments_total, installments_paid, categories(name, color)")
      .in("status", ["pending", "overdue"])
      .order("due_date");

    // Build month buckets for next 6 months
    const monthKeys: { key: string; label: string; date: Date }[] = [];
    for (let i = 1; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      monthKeys.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        date: d,
      });
    }
    const expenseByMonth = new Map<string, number>(monthKeys.map((m) => [m.key, 0]));
    const billsByMonthMap = new Map<string, any[]>(monthKeys.map((m) => [m.key, []]));
    const validKeys = new Set(monthKeys.map((m) => m.key));
    const lastKey = monthKeys[monthKeys.length - 1].key;

    for (const b of bills ?? []) {
      const isAssinatura = (b as any).categories?.name === "Assinatura";
      const amt = Number(b.amount);
      const rec = b.recurrence as string;
      const installmentsTotal = b.installments_total as number | null;
      const installmentsPaid = (b.installments_paid as number) ?? 0;

      let remaining: number;
      if (rec === "monthly") {
        remaining = installmentsTotal
          ? Math.max(0, installmentsTotal - installmentsPaid)
          : isAssinatura
            ? Infinity
            : 6;
      } else if (rec === "weekly" || rec === "yearly") {
        remaining = Infinity;
      } else {
        remaining = 1;
      }

      const occ = new Date(b.due_date + "T00:00:00");
      let count = 0;
      let safety = 0;
      while (count < remaining && safety < 200) {
        const key = `${occ.getFullYear()}-${String(occ.getMonth() + 1).padStart(2, "0")}`;
        if (key > lastKey) break;
        if (validKeys.has(key)) {
          expenseByMonth.set(key, (expenseByMonth.get(key) ?? 0) + amt);
          billsByMonthMap.get(key)!.push({
            ...b,
            occurrence_date: toISODate(occ),
            is_recurring_projection: count > 0 || rec !== "none",
          });
        }
        if (rec === "monthly") occ.setMonth(occ.getMonth() + 1);
        else if (rec === "weekly") occ.setDate(occ.getDate() + 7);
        else if (rec === "yearly") occ.setFullYear(occ.getFullYear() + 1);
        else break;
        count++;
        safety++;
      }
    }

    const futureBillsList: any[] = [];
    monthKeys.forEach((m) => {
      const arr = billsByMonthMap.get(m.key) ?? [];
      arr.forEach((b) => futureBillsList.push({ ...b, _month_key: m.key, _month_label: m.label }));
    });
    setFutureBills(futureBillsList);

    const proj: MonthRow[] = monthKeys.map((m) => {
      const billsTotal = expenseByMonth.get(m.key) ?? 0;
      const expense = Math.max(avgExpense, billsTotal);
      return {
        key: m.key,
        label: m.label,
        income: avgIncome,
        expense,
        balance: avgIncome - expense,
        projected: true,
      };
    });
    setProjection(proj);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const payBill = async (b: any) => {
    if (!user) return;
    const { error } = await supabase.from("bills").update({ status: "paid", paid_on: toISODate(new Date()) }).eq("id", b.id);
    if (error) return toast.error(error.message);
    await supabase.from("transactions").insert({
      user_id: user.id, type: "expense", amount: Number(b.amount),
      description: b.description, category_id: b.category_id, occurred_on: toISODate(new Date()),
      notes: "Pagamento de conta",
    });
    toast.success("Conta marcada como paga!");
    load();
  };

  const billsByMonth = useMemo(() => {
    const map = new Map<string, { label: string; bills: any[]; total: number }>();
    projection.forEach((m) => map.set(m.key, { label: m.label, bills: [], total: 0 }));
    futureBills.forEach((b) => {
      const key = b._month_key ?? b.due_date.slice(0, 7);
      const entry = map.get(key);
      if (entry) { entry.bills.push(b); entry.total += Number(b.amount); }
    });
    return Array.from(map.entries()).map(([key, v]) => ({ key, ...v }));
  }, [projection, futureBills]);

  const combined = useMemo(() => [...history, ...projection], [history, projection]);

  const totals = useMemo(() => {
    const closed = history.slice(0, -1);
    const totalIn = closed.reduce((s, m) => s + m.income, 0);
    const totalEx = closed.reduce((s, m) => s + m.expense, 0);
    const months = Math.max(1, closed.length);
    return {
      avgIncome: totalIn / months,
      avgExpense: totalEx / months,
      avgBalance: (totalIn - totalEx) / months,
      bestMonth: closed.reduce<MonthRow | null>((best, m) => (!best || m.balance > best.balance ? m : best), null),
      worstMonth: closed.reduce<MonthRow | null>((worst, m) => (!worst || m.balance < worst.balance ? m : worst), null),
    };
  }, [history]);

  const projectedBalance = projection.reduce((s, m) => s + m.balance, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Histórico & Projeções</h1>
        <p className="text-muted-foreground">Acompanhe a evolução e veja para onde sua vida financeira está indo.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stat-card">
          <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Receita média</span><ArrowUpCircle className="h-4 w-4 text-income" /></div>
          <div className="mt-2 text-xl font-display font-bold text-income">{formatBRL(totals.avgIncome)}</div>
        </Card>
        <Card className="stat-card">
          <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Despesa média</span><ArrowDownCircle className="h-4 w-4 text-expense" /></div>
          <div className="mt-2 text-xl font-display font-bold text-expense">{formatBRL(totals.avgExpense)}</div>
        </Card>
        <Card className="stat-card">
          <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Saldo médio</span><TrendingUp className="h-4 w-4 text-primary" /></div>
          <div className={`mt-2 text-xl font-display font-bold ${totals.avgBalance >= 0 ? "text-income" : "text-expense"}`}>{formatBRL(totals.avgBalance)}</div>
        </Card>
        <Card className="stat-card">
          <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Projeção 6 meses</span><Sparkles className="h-4 w-4 text-primary" /></div>
          <div className={`mt-2 text-xl font-display font-bold ${projectedBalance >= 0 ? "text-income" : "text-expense"}`}>{formatBRL(projectedBalance)}</div>
        </Card>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="history"><HistoryIcon className="h-4 w-4 mr-1" /> Histórico</TabsTrigger>
          <TabsTrigger value="projection"><Sparkles className="h-4 w-4 mr-1" /> Projeção</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4 mt-4">
          <Card className="p-5">
            <h3 className="font-display font-semibold mb-4">Últimos 12 meses</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${v / 1000}k`} />
                  <Tooltip formatter={(v: number) => formatBRL(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                  <Legend />
                  <Bar dataKey="income" name="Receitas" fill="hsl(var(--income))" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expense" name="Despesas" fill="hsl(var(--expense))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-medium">Mês</th>
                    <th className="px-4 py-3 font-medium text-right">Receitas</th>
                    <th className="px-4 py-3 font-medium text-right">Despesas</th>
                    <th className="px-4 py-3 font-medium text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice().reverse().map((m) => (
                    <tr key={m.key} className="border-t border-border hover:bg-accent/30">
                      <td className="px-4 py-3 capitalize font-medium">{m.label}</td>
                      <td className="px-4 py-3 text-right text-income">{formatBRL(m.income)}</td>
                      <td className="px-4 py-3 text-right text-expense">{formatBRL(m.expense)}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${m.balance >= 0 ? "text-income" : "text-expense"}`}>{formatBRL(m.balance)}</td>
                    </tr>
                  ))}
                  {history.length === 0 && !loading && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Sem dados ainda.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {totals.bestMonth && totals.worstMonth && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="stat-card">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4 text-income" /> Melhor mês</div>
                <div className="mt-1 text-lg font-display font-bold capitalize">{totals.bestMonth.label}</div>
                <div className="text-income font-semibold">{formatBRL(totals.bestMonth.balance)}</div>
              </Card>
              <Card className="stat-card">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingDown className="h-4 w-4 text-expense" /> Pior mês</div>
                <div className="mt-1 text-lg font-display font-bold capitalize">{totals.worstMonth.label}</div>
                <div className={`font-semibold ${totals.worstMonth.balance >= 0 ? "text-income" : "text-expense"}`}>{formatBRL(totals.worstMonth.balance)}</div>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="projection" className="space-y-4 mt-4">
          <Card className="p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-display font-semibold">Projeção dos próximos 6 meses</h3>
                <p className="text-xs text-muted-foreground">Baseada na média dos últimos meses + contas futuras já cadastradas.</p>
              </div>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combined}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${v / 1000}k`} />
                  <Tooltip formatter={(v: number) => formatBRL(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                  <Legend />
                  <ReferenceLine x={history[history.length - 1]?.label} stroke="hsl(var(--primary))" strokeDasharray="4 4" label={{ value: "Hoje", fill: "hsl(var(--primary))", fontSize: 11 }} />
                  <Line type="monotone" dataKey="income" name="Receitas" stroke="hsl(var(--income))" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="expense" name="Despesas" stroke="hsl(var(--expense))" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="balance" name="Saldo" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-medium">Mês</th>
                    <th className="px-4 py-3 font-medium text-right">Receita prevista</th>
                    <th className="px-4 py-3 font-medium text-right">Despesa prevista</th>
                    <th className="px-4 py-3 font-medium text-right">Saldo previsto</th>
                  </tr>
                </thead>
                <tbody>
                  {projection.map((m) => (
                    <tr key={m.key} className="border-t border-border hover:bg-accent/30">
                      <td className="px-4 py-3 capitalize font-medium">{m.label}</td>
                      <td className="px-4 py-3 text-right text-income">{formatBRL(m.income)}</td>
                      <td className="px-4 py-3 text-right text-expense">{formatBRL(m.expense)}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${m.balance >= 0 ? "text-income" : "text-expense"}`}>{formatBRL(m.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <CalendarClock className="h-4 w-4 text-warning" />
              <h3 className="font-display font-semibold">Contas futuras por mês</h3>
            </div>
            {futureBills.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma conta futura cadastrada para os próximos 6 meses.</p>
            ) : (
              <div className="space-y-5">
                {billsByMonth.filter((m) => m.bills.length > 0).map((m) => (
                  <div key={m.key}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="capitalize font-medium">{m.label}</div>
                      <div className="text-sm text-muted-foreground">Total: <span className="font-semibold text-expense">{formatBRL(m.total)}</span></div>
                    </div>
                    <div className="rounded-lg border divide-y">
                      {m.bills.map((b: any, idx: number) => {
                        const isOverdue = b.status === "overdue";
                        const isRecur = b.is_recurring_projection;
                        return (
                          <div key={`${b.id}-${b.occurrence_date ?? idx}`} className="flex items-center justify-between p-3 hover:bg-accent/30 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <button
                                onClick={() => !isRecur && payBill(b)}
                                disabled={isRecur}
                                title={isRecur ? "Recorrência prevista" : "Marcar como paga"}
                                className={`h-9 w-9 rounded-lg grid place-items-center transition-all ${isRecur ? "bg-muted text-muted-foreground cursor-default" : isOverdue ? "bg-expense/10 text-expense hover:bg-expense/20" : "bg-warning/10 text-warning hover:bg-warning/20"}`}
                              >
                                {isRecur ? <CalendarClock className="h-4 w-4" /> : isOverdue ? <AlertCircle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                              </button>
                              <div className="min-w-0">
                                <div className="font-medium truncate">{b.description}{isRecur && <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground">prevista</span>}</div>
                                <div className="text-xs text-muted-foreground">
                                  {isRecur ? `Prevista ${formatDate(b.occurrence_date)}` : `Vence ${formatDate(b.due_date)}`}
                                  {b.categories?.name && ` • ${b.categories.name}`}
                                </div>
                              </div>
                            </div>
                            <div className="font-semibold text-expense whitespace-nowrap">{formatBRL(Number(b.amount))}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {billsByMonth.every((m) => m.bills.length === 0) && (
                  <p className="text-sm text-muted-foreground">Nenhuma conta cadastrada nos próximos 6 meses.</p>
                )}
              </div>
            )}
          </Card>

          <Card className="stat-card bg-primary/5 border-primary/20">
            <div className="text-sm text-muted-foreground">💡 Dica</div>
            <p className="mt-1 text-sm">
              A projeção usa a <strong>média dos últimos 6 meses fechados</strong>. Quando há contas futuras já cadastradas em um mês, o valor de despesa exibido é o maior entre a média e o total das contas previstas — assim você não é pego de surpresa.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
