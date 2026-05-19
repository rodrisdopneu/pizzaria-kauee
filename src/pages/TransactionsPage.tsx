import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Search, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { formatBRL, formatDate } from "@/lib/format";
import TransactionDialog, { NewTransactionButton } from "@/components/forms/TransactionDialog";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function TransactionsPage({ type }: { type: "income" | "expense" }) {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<any | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("transactions")
      .select("*, categories(name, color)").eq("type", type).order("occurred_on", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user, type]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removido"); load();
  };

  const filtered = items.filter((i) => i.description.toLowerCase().includes(search.toLowerCase()));
  const total = filtered.reduce((s, i) => s + Number(i.amount), 0);
  const label = type === "income" ? "Receitas" : "Despesas";
  const Icon = type === "income" ? ArrowUpCircle : ArrowDownCircle;
  const color = type === "income" ? "text-income" : "text-expense";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><Icon className={`h-4 w-4 ${color}`} /> {label}</div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Total: <span className={color}>{formatBRL(total)}</span></h1>
        </div>
        <NewTransactionButton type={type} onSaved={load} />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">Nenhum registro.</Card>
      ) : (
        <Card className="divide-y">
          {filtered.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-4 hover:bg-accent/30 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-xl grid place-items-center" style={{ backgroundColor: `${t.categories?.color ?? "#94a3b8"}20`, color: t.categories?.color ?? "#94a3b8" }}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{t.description}</div>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-x-2">
                    <span>{formatDate(t.occurred_on)}</span>
                    {t.categories?.name && <span>• {t.categories.name}</span>}
                    {t.payment_method && <span>• {t.payment_method}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`font-semibold ${color}`}>{type === "income" ? "+" : "-"}{formatBRL(Number(t.amount))}</div>
                <Button size="icon" variant="ghost" onClick={() => setEditing(t)}><Pencil className="h-4 w-4" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button size="icon" variant="ghost"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Excluir?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => remove(t.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </Card>
      )}

      {editing && <TransactionDialog type={type} initial={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} onSaved={load} />}
    </div>
  );
}
