import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { fallbackProducts, type Product } from "@/lib/store-data";

export const listPublicProducts = createServerFn({ method: "GET" }).handler(async (): Promise<Product[]> => {
  try {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const url = process.env["SUPABASE_URL"]!;
    if (!key || !url) return fallbackProducts;
    const supabase = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        },
      },
    });
    const { data, error } = await supabase
      .from("products")
      .select("id, slug, name, category, description, details, care, price, image_key, image_urls, sizes, published, featured, sort_order")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error || !data?.length) return fallbackProducts;
    return data as Product[];
  } catch {
    return fallbackProducts;
  }
});
