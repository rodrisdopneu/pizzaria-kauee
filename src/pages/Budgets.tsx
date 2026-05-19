import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, PiggyBank, Trash2, AlertTriangle } from "lucide-react";
import { formatBRL, startOfMonth, endOfMonth, toISODate } from "@/lib/format";
import { useCategories } from "@/hooks/useCategories";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Budgets() {
  const { user } = useAuth();
  const { categories } = useCategories("expense");
  const [items, setItems] = useState<any[]>([]);
  const [spent, setSpent] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category_id: "", amount: "" });

  const monthStart = toISODate(startOfMonth());
  const monthEnd = toISODate(endOfMonth());

  const load = async () => {
    if (!user) return;
    const { data: budgets } = await supabase.from("budgets").select("*, categories(name, color)").eq("month", monthStart);
    setItems(budgets ?? []);
    const { data: tx } = await supabase.from("transactions").select("amount, category_id").eq("type", "expense").gte("occurred_on", monthStart).lte("occurred_on", monthEnd);
    const map: Record<string, number> = {};
    (tx ?? []).forEach((t: any) => { if (t.category_id) map[t.category_id] = (map[t.category_id] ?? 0) + Number(t.amount); });
    setSpent(map);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const amount = parseFloat(form.amount.replace(",", "."));
    if (!form.category_id || !amount || amount <= 0) return toast.error("Selecione categoria e valor");
    const { error } = await supabase.from("budgets").upsert({
      user_id: user.id, category_id: form.category_id, amount, month: monthStart,
    }, { onConflict: "user_id,category_id,month" });
    if (error) return toast.error(error.message);
    toast.success("Orçamento salvo!"); setOpen(false); setForm({ category_id: "", amount: "" }); load();
  };

  const remove = async (id: string) => { await supabase.from("budgets").delete().eq("id", id); load(); };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><PiggyBank className="h-4 w-4 text-primary" /> Orçamentos do mês</div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Limites por categoria</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gradient-primary text-primary-foreground border-0"><Plus className="h-4 w-4 mr-1" /> Novo orçamento</Button></DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Definir orçamento mensal</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label>Categoria</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Valor mensal (R$)</Label><Input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} inputMode="decimal" placeholder="500" /></div>
              <Button type="submit" className="w-full">Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? <Card className="p-12 text-center text-muted-foreground">Crie orçamentos para controlar seus gastos por categoria.</Card> : (
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map((b) => {
            const used = spent[b.category_id] ?? 0;
            const pct = Math.min(100, (used / Number(b.amount)) * 100);
            const exceeded = used > Number(b.amount);
            const warn = pct >= 80 && !exceeded;
            return (
              <Card key={b.id} className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg" style={{ backgroundColor: `${b.categories?.color}20`, color: b.categories?.color }}>
                      <div className="h-full w-full grid place-items-center"><PiggyBank className="h-4 w-4" /></div>
                    </div>
                    <h3 className="font-display font-semibold">{b.categories?.name}</h3>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button size="icon" variant="ghost"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Excluir orçamento?</AlertDialogTitle></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => remove(b.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className={`text-xl font-display font-bold ${exceeded ? "text-expense" : ""}`}>{formatBRL(used)}</span>
                    <span className="text-sm text-muted-foreground">de {formatBRL(Number(b.amount))}</span>
                  </div>
                  <Progress value={pct} className={exceeded ? "[&>div]:bg-expense" : warn ? "[&>div]:bg-warning" : ""} />
                  <div className={`flex items-center gap-1 text-xs font-medium ${exceeded ? "text-expense" : warn ? "text-warning" : "text-muted-foreground"}`}>
                    {(exceeded || warn) && <AlertTriangle className="h-3 w-3" />}
                    {exceeded ? `Estourou em ${formatBRL(used - Number(b.amount))}` : warn ? "Atenção: perto do limite" : `Restam ${formatBRL(Number(b.amount) - used)}`}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
