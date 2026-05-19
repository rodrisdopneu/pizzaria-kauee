import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Target, Trash2, Pencil, TrendingUp } from "lucide-react";
import { formatBRL, formatDate } from "@/lib/format";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Goals() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", target_amount: "", current_amount: "", deadline: "" });

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("goals").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const target = parseFloat(form.target_amount.replace(",", "."));
    const current = parseFloat((form.current_amount || "0").replace(",", "."));
    if (!form.title.trim() || !target || target <= 0) return toast.error("Preencha título e valor da meta");
    const payload: any = { user_id: user.id, title: form.title.trim(), target_amount: target, current_amount: current, deadline: form.deadline || null };
    const { error } = editing
      ? await supabase.from("goals").update(payload).eq("id", editing.id)
      : await supabase.from("goals").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Salvo!"); setOpen(false); setEditing(null); setForm({ title: "", target_amount: "", current_amount: "", deadline: "" }); load();
  };

  const addProgress = async (g: any, value: number) => {
    const newAmount = Math.max(0, Number(g.current_amount) + value);
    await supabase.from("goals").update({ current_amount: newAmount }).eq("id", g.id);
    load();
  };

  const remove = async (id: string) => { await supabase.from("goals").delete().eq("id", id); load(); };

  const startEdit = (g: any) => { setEditing(g); setForm({ title: g.title, target_amount: String(g.target_amount), current_amount: String(g.current_amount), deadline: g.deadline ?? "" }); setOpen(true); };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><Target className="h-4 w-4 text-primary" /> Metas financeiras</div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Seus objetivos</h1>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm({ title: "", target_amount: "", current_amount: "", deadline: "" }); } }}>
          <DialogTrigger asChild><Button className="gradient-primary text-primary-foreground border-0"><Plus className="h-4 w-4 mr-1" /> Nova meta</Button></DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>{editing ? "Editar meta" : "Nova meta"}</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Viagem" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Valor alvo</Label><Input value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} inputMode="decimal" placeholder="5000" /></div>
                <div><Label>Já guardado</Label><Input value={form.current_amount} onChange={(e) => setForm({ ...form, current_amount: e.target.value })} inputMode="decimal" placeholder="0" /></div>
              </div>
              <div><Label>Prazo (opcional)</Label><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
              <Button type="submit" className="w-full">Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? <Card className="p-12 text-center text-muted-foreground">Nenhuma meta ainda. Defina seu primeiro objetivo!</Card> : (
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map((g) => {
            const pct = Math.min(100, (Number(g.current_amount) / Number(g.target_amount)) * 100);
            const done = pct >= 100;
            return (
              <Card key={g.id} className="p-5 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-display font-semibold">{g.title}</h3>
                    {g.deadline && <p className="text-xs text-muted-foreground">Até {formatDate(g.deadline)}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => startEdit(g)}><Pencil className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button size="icon" variant="ghost"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Excluir meta?</AlertDialogTitle></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => remove(g.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-display font-bold">{formatBRL(Number(g.current_amount))}</span>
                    <span className="text-sm text-muted-foreground">de {formatBRL(Number(g.target_amount))}</span>
                  </div>
                  <Progress value={pct} className={done ? "[&>div]:bg-income" : ""} />
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${done ? "text-income" : "text-muted-foreground"}`}>{done ? "🎉 Meta atingida!" : `${pct.toFixed(0)}% concluído`}</span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => { const v = prompt("Quanto adicionar?"); if (v) addProgress(g, parseFloat(v.replace(",", "."))); }}><TrendingUp className="h-3 w-3 mr-1" /> Adicionar</Button>
                    </div>
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
