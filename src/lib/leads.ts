import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const leadSchema = z.object({
  kind: z.enum(["order", "estimate", "workshop", "certificate", "callback"]),
  customer_name: z.string().trim().min(2, "Укажите имя").max(100),
  phone: z.string().trim().min(7, "Укажите телефон").max(30),
  email: z.string().trim().email("Проверьте почту").max(255).optional().or(z.literal("")),
  message: z.string().trim().max(2000).default(""),
  total: z.number().int().nonnegative().nullable().default(null),
  details: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).default({}),
});

export async function submitLead(input: z.input<typeof leadSchema>) {
  const value = leadSchema.parse(input);
  const { error } = await supabase.from("leads").insert({ ...value, email: value.email || null });
  if (error) throw error;
}