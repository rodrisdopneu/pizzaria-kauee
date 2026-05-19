import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDownCircle, ArrowUpCircle, Wallet, TrendingUp, Plus, AlertCircle, CalendarClock } from "lucide-react";
import { formatBRL, monthLabel, startOfMonth, endOfMonth, toISODate, formatDate } from "@/lib/format";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import TransactionDialog from "@/components/forms/TransactionDialog";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [recent, setRecent] = useState<any[]>([]);
  const [byCat, setByCat] = useState<any[]>([]);
  const [trend, setTrend] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);

  const load = async () => {
    if (!user) return;
    const now = new Date();
    const start = toISODate(startOfMonth(now));
    const end = toISODate(endOfMonth(now));

    const [{ data: prof }, { data: tx }, { data: catRows }, { data: billsData }] = await Promise.all([
      supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
      supabase.from("transactions").select("*").gte("occurred_on", start).lte("occurred_on", end),
      supabase.from("transactions").select("amount, type, categories(name, color)").gte("occurred_on", start).lte("occurred_on", end).eq("type", "expense"),
      supabase.from("bills").select("*").eq("status", "pending").order("due_date").limit(5),
    ]);

    setName(prof?.display_name ?? user.email?.split("@")[0] ?? "");
    const inc = (tx ?? []).filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0);
    const exp = (tx ?? []).filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0);
    setIncome(inc); setExpense(exp);
    setRecent((tx ?? []).slice().sort((a: any, b: any) => b.occurred_on.localeCompare(a.occurred_on)).slice(0, 5));

    const byCatMap = new Map<string, { name: string; value: number; color: string }>();
    (catRows ?? []).forEach((r: any) => {
      const key = r.categories?.name ?? "Sem categoria";
      const cur = byCatMap.get(key) ?? { name: key, value: 0, color: r.categories?.color ?? "#94a3b8" };
      cur.value += Number(r.amount);
      byCatMap.set(key, cur);
    });
    setByCat(Array.from(byCatMap.values()).sort((a, b) => b.value - a.value).slice(0, 6));

    // Trend: last 6 months
    const months: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const s = toISODate(startOfMonth(d)); const e = toISODate(endOfMonth(d));
      const { data } = await supabase.from("transactions").select("amount, type").gte("occurred_on", s).lte("occurred_on", e);
      const i_ = (data ?? []).filter((t: any) => t.type === "income").reduce((a: number, t: any) => a + Number(t.amount), 0);
      const e_ = (data ?? []).filter((t: any) => t.type === "expense").reduce((a: number, t: any) => a + Number(t.amount), 0);
      months.push({ name: d.toLocaleDateString("pt-BR", { month: "short" }), Receitas: i_, Despesas: e_ });
    }
    setTrend(months);
    setBills(billsData ?? []);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const balance = income - expense;
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Olá, {name || "por aí"} 👋</h1>
          <p className="text-muted-foreground capitalize">{monthLabel(new Date())}</p>
        </div>
        <div className="flex gap-2">
          <TransactionDialog type="income" onSaved={load} trigger={<Button variant="outline" className="border-income/30 text-income hover:bg-income/10"><Plus className="h-4 w-4 mr-1" /> Receita</Button>} />
          <TransactionDialog type="expense" onSaved={load} trigger={<Button className="gradient-primary text-primary-foreground border-0"><Plus className="h-4 w-4 mr-1" /> Despesa</Button>} />
        </div>
      </div>

      {/* Saldo destaque */}
      <Card className="stat-card gradient-card text-white border-0 overflow-hidden relative">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="relative">
          <div className="flex items-center gap-2 text-white/80 text-sm font-medium"><Wallet className="h-4 w-4" /> Saldo do mês</div>
          <div className="mt-2 text-4xl font-display font-bold">{formatBRL(balance)}</div>
          <div className="mt-3 text-sm text-white/80">Taxa de economia: <span className="font-semibold text-white">{savingsRate}%</span></div>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="stat-card bg-card">
          <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Receitas</span><div className="h-9 w-9 rounded-xl bg-income/10 grid place-items-center"><ArrowUpCircle className="h-5 w-5 text-income" /></div></div>
          <div className="mt-3 text-2xl font-display font-bold text-income">{formatBRL(income)}</div>
        </Card>
        <Card className="stat-card bg-card">
          <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Despesas</span><div className="h-9 w-9 rounded-xl bg-expense/10 grid place-items-center"><ArrowDownCircle className="h-5 w-5 text-expense" /></div></div>
          <div className="mt-3 text-2xl font-display font-bold text-expense">{formatBRL(expense)}</div>
        </Card>
        <Card className="stat-card bg-card col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Contas pendentes</span><div className="h-9 w-9 rounded-xl bg-warning/10 grid place-items-center"><CalendarClock className="h-5 w-5 text-warning" /></div></div>
          <div className="mt-3 text-2xl font-display font-bold">{bills.length}</div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4"><h3 className="font-display font-semibold">Evolução (6 meses)</h3><TrendingUp className="h-4 w-4 text-muted-foreground" /></div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--income))" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(var(--income))" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gEx" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--expense))" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(var(--expense))" stopOpacity={0} /></linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${v / 1000}k`} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} formatter={(v: number) => formatBRL(v)} />
                <Area type="monotone" dataKey="Receitas" stroke="hsl(var(--income))" fill="url(#gIn)" strokeWidth={2} />
                <Area type="monotone" dataKey="Despesas" stroke="hsl(var(--expense))" fill="url(#gEx)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-semibold mb-4">Despesas por categoria</h3>
          {byCat.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-12">Sem despesas neste mês.</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCat} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {byCat.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatBRL(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold">Últimas movimentações</h3>
            <Link to="/despesas" className="text-xs text-primary font-medium">Ver tudo</Link>
          </div>
          {recent.length === 0 ? <div className="text-sm text-muted-foreground text-center py-8">Nenhuma movimentação ainda.</div> : (
            <ul className="space-y-2">
              {recent.map((t) => (
                <li key={t.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-9 w-9 rounded-xl grid place-items-center ${t.type === "income" ? "bg-income/10 text-income" : "bg-expense/10 text-expense"}`}>
                      {t.type === "income" ? <ArrowUpCircle className="h-4 w-4" /> : <ArrowDownCircle className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{t.description}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(t.occurred_on)}</div>
                    </div>
                  </div>
                  <div className={`text-sm font-semibold ${t.type === "income" ? "text-income" : "text-expense"}`}>
                    {t.type === "income" ? "+" : "-"}{formatBRL(Number(t.amount))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold">Próximas contas</h3>
            <Link to="/contas" className="text-xs text-primary font-medium">Ver tudo</Link>
          </div>
          {bills.length === 0 ? <div className="text-sm text-muted-foreground text-center py-8">Nenhuma conta pendente. 🎉</div> : (
            <ul className="space-y-2">
              {bills.map((b) => {
                const days = Math.ceil((new Date(b.due_date).getTime() - Date.now()) / 86400000);
                const overdue = days < 0;
                return (
                  <li key={b.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-9 w-9 rounded-xl grid place-items-center ${overdue ? "bg-expense/10 text-expense" : "bg-warning/10 text-warning"}`}>
                        {overdue ? <AlertCircle className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{b.description}</div>
                        <div className="text-xs text-muted-foreground">{overdue ? `Atrasada ${Math.abs(days)}d` : days === 0 ? "Vence hoje" : `Em ${days}d • ${formatDate(b.due_date)}`}</div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold">{formatBRL(Number(b.amount))}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
