import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Category = {
  id: string; name: string; type: "income" | "expense"; color: string; icon: string;
};

export function useCategories(type?: "income" | "expense") {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    if (!user) return;
    setLoading(true);
    let q = supabase.from("categories").select("*").eq("user_id", user.id).order("name");
    if (type) q = q.eq("type", type);
    const { data } = await q;
    setCategories((data ?? []) as Category[]);
    setLoading(false);
  };

  useEffect(() => { fetch(); /* eslint-disable-next-line */ }, [user, type]);

  return { categories, loading, refetch: fetch };
}
