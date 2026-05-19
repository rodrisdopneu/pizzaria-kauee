-- Adiciona Assinatura para usuários existentes
INSERT INTO public.categories (user_id, name, type, color, icon)
SELECT id, 'Assinatura', 'expense', '#0ea5e9', 'Repeat'
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories c
  WHERE c.user_id = auth.users.id AND c.name = 'Assinatura' AND c.type = 'expense'
);

-- Atualiza trigger para incluir Assinatura em novos cadastros
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    (NEW.id, 'Assinatura', 'expense', '#0ea5e9', 'Repeat'),
    (NEW.id, 'Outros', 'expense', '#64748b', 'MoreHorizontal');

  RETURN NEW;
END;$function$;