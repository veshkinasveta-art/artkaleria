import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitLead } from "@/lib/leads";

export function LeadForm({ kind = "callback", preset = "", total = null, onSuccess }: { kind?: "order" | "estimate" | "workshop" | "certificate" | "callback"; preset?: string; total?: number | null; onSuccess?: () => void }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setState("sending");
    const data = new FormData(event.currentTarget);
    try { await submitLead({ kind, customer_name: String(data.get("name") ?? ""), phone: String(data.get("phone") ?? ""), email: String(data.get("email") ?? ""), message: String(data.get("message") ?? ""), total, details: { source: window.location.pathname } }); setState("sent"); event.currentTarget.reset(); onSuccess?.(); }
    catch (reason) { setState("idle"); setError(reason instanceof Error ? reason.message : "Не удалось отправить заявку"); }
  }
  if (state === "sent") return <div className="border border-accent bg-accent/15 p-6"><p className="font-display text-3xl">Спасибо</p><p className="mt-2 text-sm text-muted-foreground">Заявка получена. Мы свяжемся с вами в рабочее время.</p></div>;
  return <form onSubmit={handleSubmit} className="grid gap-4">
    <Input name="name" required minLength={2} maxLength={100} placeholder="Ваше имя" aria-label="Ваше имя" />
    <div className="grid gap-4 sm:grid-cols-2"><Input name="phone" required minLength={7} maxLength={30} placeholder="Телефон" aria-label="Телефон" /><Input name="email" type="email" maxLength={255} placeholder="Почта (необязательно)" aria-label="Почта" /></div>
    <Textarea name="message" maxLength={2000} defaultValue={preset} placeholder="Расскажите, что хотите создать" aria-label="Комментарий" className="min-h-28" />
    <label className="flex items-start gap-2 text-xs text-muted-foreground"><input type="checkbox" required className="mt-0.5 accent-primary" />Согласен с политикой конфиденциальности</label>
    {error && <p className="text-sm text-destructive">{error}</p>}
    <Button type="submit" size="lg" disabled={state === "sending"}>{state === "sending" ? "Отправляем…" : "Отправить заявку"}</Button>
  </form>;
}