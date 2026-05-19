-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;$$;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- CATEGORIES
CREATE TYPE public.category_type AS ENUM ('income','expense');
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type public.category_type NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  icon TEXT NOT NULL DEFAULT 'Tag',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own categories all" ON public.categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- TRANSACTIONS
CREATE TYPE public.transaction_type AS ENUM ('income','expense');
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.transaction_type NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  description TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  payment_method TEXT,
  notes TEXT,
  occurred_on DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tx all" ON public.transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER tx_updated BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX tx_user_date_idx ON public.transactions(user_id, occurred_on DESC);

-- BILLS
CREATE TYPE public.bill_status AS ENUM ('pending','paid','overdue');
CREATE TYPE public.bill_recurrence AS ENUM ('none','weekly','monthly','yearly');
CREATE TABLE public.bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  due_date DATE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  status public.bill_status NOT NULL DEFAULT 'pending',
  recurrence public.bill_recurrence NOT NULL DEFAULT 'none',
  paid_on DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own bills all" ON public.bills FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER bills_updated BEFORE UPDATE ON public.bills FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- GOALS
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount NUMERIC(14,2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  deadline DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goals all" ON public.goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER goals_updated BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- BUDGETS
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  month DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_id, month)
);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own budgets all" ON public.budgets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER budgets_updated BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Handle new user: create profile + default categories
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)));

  INSERT INTO public.categories (user_id, name, type, color, icon) VALUES
    (NEW.id, 'Salário', 'income', '#10b981', 'Wallet'),
    (NEW.id, 'Freelance', 'income', '#06b6d4', 'Briefcase'),
    (NEW.id, 'Investimentos', 'income', '#8b5cf6', 'TrendingUp'),
    (NEW.id, 'Outros', 'income', '#64748b', 'Plus'),
    (NEW.id, 'Alimentação', 'expense', '#f59e0b', 'UtensilsCrossed'),
    (NEW.id, 'Transporte', 'expense', '#3b82f6', 'Car'),
    (NEW.id, 'Moradia', 'expense', '#ef4444', 'Home'),
    (NEW.id, 'Lazer', 'expense', '#ec4899', 'Gamepad2'),
    (NEW.id, 'Saúde', 'expense', '#14b8a6', 'HeartPulse'),
    (NEW.id, 'Educação', 'expense', '#6366f1', 'GraduationCap'),
    (NEW.id, 'Compras', 'expense', '#a855f7', 'ShoppingBag'),
    (NEW.id, 'Outros', 'expense', '#64748b', 'MoreHorizontal');

  RETURN NEW;
END;$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();