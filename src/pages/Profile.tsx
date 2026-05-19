import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserCircle2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ display_name: "", bio: "", phone: "", birth_date: "" });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) setForm({
          display_name: data.display_name ?? "",
          bio: data.bio ?? "",
          phone: data.phone ?? "",
          birth_date: data.birth_date ?? "",
        });
      });
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      display_name: form.display_name.trim() || null,
      bio: form.bio.trim() || null,
      phone: form.phone.trim() || null,
      birth_date: form.birth_date || null,
    }).eq("id", user.id);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Perfil atualizado!");
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
      </Button>
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-2xl gradient-primary grid place-items-center text-white shadow-glow">
          <UserCircle2 className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Meu perfil</h1>
          <p className="text-sm text-muted-foreground">Personalize como você quer ser chamado</p>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={save} className="space-y-4">
          <div>
            <Label>Como quer ser chamado(a)</Label>
            <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} placeholder="Seu nome" />
          </div>
          <div>
            <Label>E-mail</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" />
            </div>
            <div>
              <Label>Data de nascimento</Label>
              <Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Sobre você</Label>
            <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Conte um pouco sobre você..." rows={4} />
          </div>
          <Button type="submit" disabled={loading} className="gradient-primary text-primary-foreground border-0">
            {loading ? "Salvando..." : "Salvar alterações"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
