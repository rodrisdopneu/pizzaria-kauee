import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { toast } from "sonner";
import { toISODate } from "@/lib/format";
import { z } from "zod";

const schema = z.object({
  description: z.string().trim().min(1, "Informe a descrição").max(120),
  amount: z.number().positive("Valor deve ser maior que zero"),
});

type Props = {
  type: "income" | "expense";
  trigger?: React.ReactNode;
  initial?: any;
  onSaved?: () => void;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
};

export default function TransactionDialog({ type, trigger, initial, onSaved, open: openProp, onOpenChange }: Props) {
  const { user } = useAuth();
  const { categories } = useCategories(type);
  const [open, setOpen] = useState(false);
  const isOpen = openProp ?? open;
  const setIsOpen = onOpenChange ?? setOpen;
  const [submitting, setSubmitting] = useState(false);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [occurredOn, setOccurredOn] = useState(toISODate(new Date()));
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      setDescription(initial?.description ?? "");
      setAmount(initial?.amount?.toString() ?? "");
      setCategoryId(initial?.category_id ?? "");
      setPaymentMethod(initial?.payment_method ?? "");
      setOccurredOn(initial?.occurred_on ?? toISODate(new Date()));
      setNotes(initial?.notes ?? "");
    }
  }, [isOpen, initial]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount.replace(",", "."));
    try { schema.parse({ description, amount: num }); } catch (err: any) { toast.error(err.errors[0].message); return; }
    if (!user) return;
    setSubmitting(true);
    const payload = {
      user_id: user.id, type, description: description.trim(), amount: num,
      category_id: categoryId || null, payment_method: paymentMethod || null,
      occurred_on: occurredOn, notes: notes || null,
    };
    const { error } = initial?.id
      ? await supabase.from("transactions").update(payload).eq("id", initial.id)
      : await supabase.from("transactions").insert(payload);
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(initial?.id ? "Atualizado!" : `${type === "income" ? "Receita" : "Despesa"} registrada!`);
    setIsOpen(false);
    onSaved?.();
  };

  const label = type === "income" ? "Receita" : "Despesa";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{initial?.id ? `Editar ${label.toLowerCase()}` : `Nova ${label.toLowerCase()}`}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div><Label>Descrição</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={type === "income" ? "Ex: Salário" : "Ex: Mercado"} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Valor (R$)</Label><Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" inputMode="decimal" /></div>
            <div><Label>Data</Label><Input type="date" value={occurredOn} onChange={(e) => setOccurredOn(e.target.value)} /></div>
          </div>
          <div>
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Método de pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                <SelectItem value="Pix">Pix</SelectItem>
                <SelectItem value="Cartão de débito">Cartão de débito</SelectItem>
                <SelectItem value="Cartão de crédito">Cartão de crédito</SelectItem>
                <SelectItem value="Transferência">Transferência</SelectItem>
                <SelectItem value="Boleto">Boleto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Observações</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
          <Button type="submit" className="w-full" disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NewTransactionButton({ type, onSaved }: { type: "income" | "expense"; onSaved?: () => void }) {
  return (
    <TransactionDialog type={type} onSaved={onSaved}
      trigger={<Button className={type === "income" ? "bg-income hover:bg-income/90" : "bg-expense hover:bg-expense/90"}><Plus className="h-4 w-4 mr-1" /> Nova {type === "income" ? "receita" : "despesa"}</Button>} />
  );
}
