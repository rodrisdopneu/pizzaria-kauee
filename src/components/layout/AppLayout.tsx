import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, ArrowDownCircle, ArrowUpCircle, CalendarClock, Target, Wallet2, Settings, LogOut, Wallet, PiggyBank, Moon, Sun, LineChart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const nav = [
  { to: "/", label: "Painel", icon: LayoutDashboard, end: true },
  { to: "/receitas", label: "Receitas", icon: ArrowUpCircle },
  { to: "/despesas", label: "Despesas", icon: ArrowDownCircle },
  { to: "/contas", label: "Contas", icon: CalendarClock },
  { to: "/metas", label: "Metas", icon: Target },
  { to: "/orcamentos", label: "Orçamentos", icon: PiggyBank },
  { to: "/historico", label: "Histórico", icon: LineChart },
];

const mobileNav = [nav[0], nav[2], nav[3], nav[6], nav[4]];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [name, setName] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => setName(data?.display_name ?? user.email?.split("@")[0] ?? ""));
  }, [user]);

  const handleLogout = async () => { await signOut(); navigate("/auth"); };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-sidebar-border bg-sidebar fixed inset-y-0 left-0 z-30">
        <div className="p-6 flex items-center gap-2 font-display font-bold text-lg">
          <div className="h-9 w-9 rounded-xl gradient-primary grid place-items-center text-white shadow-glow"><Wallet className="h-5 w-5" /></div>
          <span>MeuControle<span className="text-primary">+</span></span>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end as any}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive ? "bg-primary text-primary-foreground shadow-md" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}>
              <Icon className="h-4.5 w-4.5" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <button onClick={() => navigate("/perfil")} className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-sidebar-accent transition-colors text-left">
            <div className="h-9 w-9 rounded-full gradient-primary grid place-items-center text-white text-sm font-semibold">
              {name.slice(0, 1).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{name || "Usuário"}</div>
              <div className="text-xs text-muted-foreground truncate">Ver perfil</div>
            </div>
          </button>
          <div className="flex items-center justify-end gap-1 mt-1">
            <Button size="icon" variant="ghost" onClick={toggle} title="Alternar tema">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button size="icon" variant="ghost" onClick={handleLogout} title="Sair"><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </aside>

      {/* Top bar Mobile */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/perfil")} className="h-9 w-9 rounded-full gradient-primary grid place-items-center text-white text-sm font-semibold shadow-glow" title="Meu perfil">
            {name.slice(0, 1).toUpperCase() || "U"}
          </button>
          <div className="font-display font-bold">MeuControle<span className="text-primary">+</span></div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={toggle} title="Alternar tema">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={handleLogout}><LogOut className="h-4 w-4" /></Button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8 animate-fade-in">{children}</div>
      </main>

      {/* Bottom Nav Mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur-xl border-t border-border">
        <div className="grid grid-cols-5">
          {mobileNav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end as any}
              className={({ isActive }) => cn(
                "flex flex-col items-center justify-center gap-1 py-2.5 text-xs transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
              <Icon className="h-5 w-5" /> <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
