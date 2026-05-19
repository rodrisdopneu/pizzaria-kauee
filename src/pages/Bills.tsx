import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CalendarClock, Check, AlertCircle, Trash2, Pencil } from "lucide-react";
import { formatBRL, formatDate, toISODate } from "@/lib/format";
import { useCategories } from "@/hooks/useCategories";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type Bill = { id?: string; description: string; amount: string; due_date: string; category_id: string; recurrence: "none" | "weekly" | "monthly" | "yearly"; installments_total: string; installments_paid: string; status?: string };

export default function Bills() {
  const { user } = useAuth();
  const { categories } = useCategories("expense");
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const empty: Bill = { description: "", amount: "", due_date: toISODate(new Date()), category_id: "", recurrence: "none", installments_total: "", installments_paid: "0" };
  const [form, setForm] = useState<Bill>(empty);

  const load = async () => {
    if (!user) return;
    const today = toISODate(new Date());
    await supabase.from("bills").update({ status: "overdue" }).lt("due_date", today).eq("status", "pending");
    const { data } = await supabase.from("bills").select("*, categories(name, color)").order("due_date");
    setItems(data ?? []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const num = parseFloat(form.amount.replace(",", "."));
    if (!form.description.trim() || !num || num <= 0) return toast.error("Preencha descrição e valor");
    const totalParc = form.installments_total ? parseInt(form.installments_total) : null;
    const paidParc = form.installments_paid ? parseInt(form.installments_paid) : 0;
    const payload = {
      user_id: user.id, description: form.description.trim(), amount: num,
      due_date: form.due_date, category_id: form.category_id || null, recurrence: form.recurrence,
      installments_total: totalParc, installments_paid: paidParc,
    };
    const { error } = editing
      ? await supabase.from("bills").update(payload).eq("id", editing.id)
      : await supabase.from("bills").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Salvo!"); setOpen(false); setEditing(null); setForm(empty); load();
  };

  const togglePaid = async (b: any) => {
    if (b.status === "paid") {
      const newPaid = Math.max(0, (b.installments_paid ?? 0) - 1);
      await supabase.from("bills").update({ status: "pending", paid_on: null, installments_paid: newPaid }).eq("id", b.id);
    } else {
      const newPaid = (b.installments_paid ?? 0) + 1;
      await supabase.from("bills").update({ status: "paid", paid_on: toISODate(new Date()), installments_paid: newPaid }).eq("id", b.id);
      await supabase.from("transactions").insert({
        user_id: user!.id, type: "expense", amount: Number(b.amount),
        description: b.description, category_id: b.category_id, occurred_on: toISODate(new Date()),
        notes: "Pagamento de conta",
      });
      toast.success("Conta paga e despesa registrada!");
    }
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("bills").delete().eq("id", id);
    toast.success("Removido"); load();
  };

  const startEdit = (b: any) => {
    setEditing(b);
    setForm({ description: b.description, amount: String(b.amount), due_date: b.due_date, category_id: b.category_id ?? "", recurrence: b.recurrence, installments_total: b.installments_total ? String(b.installments_total) : "", installments_paid: String(b.installments_paid ?? 0) });
    setOpen(true);
  };

  const pending = items.filter((i) => i.status !== "paid");
  const totalPending = pending.reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><CalendarClock className="h-4 w-4 text-warning" /> Contas a pagar</div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Pendente: <span className="text-warning">{formatBRL(totalPending)}</span></h1>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm(empty); } }}>
          <DialogTrigger asChild><Button className="gradient-primary text-primary-foreground border-0"><Plus className="h-4 w-4 mr-1" /> Nova conta</Button></DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>{editing ? "Editar conta" : "Nova conta a pagar"}</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: Energia" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Valor (R$)</Label><Input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} inputMode="decimal" placeholder="0,00" /></div>
                <div><Label>Vencimento</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Recorrência</Label>
                <Select value={form.recurrence} onValueChange={(v: any) => setForm({ ...form, recurrence: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem repetição</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Total de meses/parcelas</Label>
                  <Input value={form.installments_total} onChange={(e) => setForm({ ...form, installments_total: e.target.value })} inputMode="numeric" placeholder="Ex: 12 (opcional)" />
                </div>
                <div>
                  <Label>Já pagas</Label>
                  <Input value={form.installments_paid} onChange={(e) => setForm({ ...form, installments_paid: e.target.value })} inputMode="numeric" placeholder="0" />
                </div>
              </div>
              <Button type="submit" className="w-full">Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? <Card className="p-12 text-center text-muted-foreground">Nenhuma conta cadastrada.</Card> : (
        <Card className="divide-y">
          {items.map((b) => {
            const days = Math.ceil((new Date(b.due_date).getTime() - Date.now()) / 86400000);
            const isPaid = b.status === "paid";
            const isOverdue = b.status === "overdue";
            return (
              <div key={b.id} className={`flex items-center justify-between p-4 transition-colors ${isPaid ? "opacity-60" : "hover:bg-accent/30"}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <button onClick={() => togglePaid(b)} className={`h-10 w-10 rounded-xl grid place-items-center transition-all ${isPaid ? "bg-income text-white" : isOverdue ? "bg-expense/10 text-expense" : "bg-warning/10 text-warning hover:bg-warning/20"}`}>
                    {isPaid ? <Check className="h-5 w-5" /> : isOverdue ? <AlertCircle className="h-5 w-5" /> : <CalendarClock className="h-5 w-5" />}
                  </button>
                  <div className="min-w-0">
                    <div className={`font-medium truncate ${isPaid ? "line-through" : ""}`}>{b.description}</div>
                    <div className="text-xs text-muted-foreground">
                      {isPaid ? `Pago em ${formatDate(b.paid_on)}` : isOverdue ? `Atrasada ${Math.abs(days)}d` : days === 0 ? "Vence hoje" : `Em ${days}d • ${formatDate(b.due_date)}`}
                      {b.categories?.name && ` • ${b.categories.name}`}
                      {b.installments_total ? ` • ${b.installments_paid ?? 0}/${b.installments_total} (faltam ${Math.max(0, b.installments_total - (b.installments_paid ?? 0))})` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{formatBRL(Number(b.amount))}</div>
                  <Button size="icon" variant="ghost" onClick={() => startEdit(b)}><Pencil className="h-4 w-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button size="icon" variant="ghost"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Excluir conta?</AlertDialogTitle></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => remove(b.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
