import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitLead } from "@/lib/leads";

const interests = [
  "Флорариум",
  "Моссариум",
  "Панно из мха",
  "Панно с логотипом",
  "Круг с подсветкой",
  "Бонсай",
  "Композиция на заказ",
  "Озеленение офиса",
  "Подарочный сертификат",
  "Мастер-класс",
  "Пока не определились",
];

const budgets = ["до 5 000 ₽", "5 000 – 10 000 ₽", "10 000 – 25 000 ₽", "25 000 – 50 000 ₽", "более 50 000 ₽", "Затрудняюсь ответить"];
const timings = ["Как можно скорее", "В течение недели", "В течение месяца", "Просто присматриваюсь"];
const contacts = ["Телефон", "WhatsApp", "Telegram", "Почта"];

const selectClass = "h-11 w-full border border-input bg-background px-3 text-sm";

export function LeadForm({ kind = "callback", preset = "", total = null, onSuccess }: { kind?: "order" | "estimate" | "workshop" | "certificate" | "callback"; preset?: string; total?: number | null; onSuccess?: () => void }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError("");
    setState("sending");
    try {
      await submitLead({
        kind,
        customer_name: String(data.get("name") ?? ""),
        phone: String(data.get("phone") ?? ""),
        email: String(data.get("email") ?? ""),
        message: String(data.get("message") ?? ""),
        total,
        details: {
          source: typeof window === "undefined" ? "" : window.location.pathname,
          interest: String(data.get("interest") ?? ""),
          budget: String(data.get("budget") ?? ""),
          timing: String(data.get("timing") ?? ""),
          contact: String(data.get("contact") ?? ""),
        },
      });
      form.reset();
      setState("sent");
      onSuccess?.();
    } catch (reason) {
      setState("idle");
      setError(reason instanceof Error ? reason.message : "Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам.");
    }
  }

  if (state === "sent") return <div className="border border-accent bg-accent/15 p-6"><p className="font-display text-3xl">Спасибо</p><p className="mt-2 text-sm text-muted-foreground">Заявка получена. Мы свяжемся с вами в рабочее время.</p><Button variant="outline" className="mt-5" onClick={() => setState("idle")}>Отправить ещё одну</Button></div>;

  return <form onSubmit={handleSubmit} className="grid gap-4">
    <Input name="name" required minLength={2} maxLength={100} placeholder="Ваше имя" aria-label="Ваше имя" />
    <div className="grid gap-4 sm:grid-cols-2">
      <Input name="phone" required minLength={7} maxLength={30} placeholder="Телефон" aria-label="Телефон" />
      <Input name="email" type="email" maxLength={255} placeholder="Почта (необязательно)" aria-label="Почта" />
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-1.5 text-xs text-muted-foreground">Что вас интересует
        <select name="interest" className={selectClass} defaultValue={interests[0]}>{interests.map((item) => <option key={item}>{item}</option>)}</select>
      </label>
      <label className="grid gap-1.5 text-xs text-muted-foreground">Ориентир по бюджету
        <select name="budget" className={selectClass} defaultValue={budgets[5]}>{budgets.map((item) => <option key={item}>{item}</option>)}</select>
      </label>
      <label className="grid gap-1.5 text-xs text-muted-foreground">Когда нужно
        <select name="timing" className={selectClass} defaultValue={timings[1]}>{timings.map((item) => <option key={item}>{item}</option>)}</select>
      </label>
      <label className="grid gap-1.5 text-xs text-muted-foreground">Как удобнее связаться
        <select name="contact" className={selectClass} defaultValue={contacts[0]}>{contacts.map((item) => <option key={item}>{item}</option>)}</select>
      </label>
    </div>
    <Textarea name="message" maxLength={2000} defaultValue={preset} placeholder="Расскажите, что хотите создать: размер, место, пожелания по цвету и растениям" aria-label="Комментарий" className="min-h-28" />
    <label className="flex items-start gap-2 text-xs text-muted-foreground"><input type="checkbox" required className="mt-0.5 accent-primary" />Согласен с политикой конфиденциальности</label>
    {error && <p className="text-sm text-destructive">{error}</p>}
    <Button type="submit" size="lg" disabled={state === "sending"}>{state === "sending" ? "Отправляем…" : "Отправить заявку"}</Button>
  </form>;
}
