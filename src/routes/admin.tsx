import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, LogOut, PackagePlus, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { formatPrice } from "@/lib/store-data";

type Lead = Tables<"leads">;
type Product = Tables<"products">;
type View = "leads" | "products";
const kindLabels: Record<Lead["kind"], string> = { order: "Заказ", estimate: "Расчёт", workshop: "Мастер-класс", certificate: "Сертификат", callback: "Обратный звонок" };
const statusLabels: Record<Lead["status"], string> = { new: "Новая", in_progress: "В работе", completed: "Завершена" };

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [
    { title: "Управление студией — Калерия" },
    { name: "description", content: "Закрытая панель заявок и товаров арт-студии Калерия." },
    { property: "og:title", content: "Управление студией — Калерия" },
    { property: "og:description", content: "Закрытая панель заявок и товаров." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("leads");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { await navigate({ to: "/auth" }); return; }
    const { data: role } = await supabase.from("user_roles").select("id").eq("user_id", auth.user.id).eq("role", "admin").maybeSingle();
    if (!role) { setAllowed(false); setLoading(false); return; }
    setAllowed(true);
    const [leadResult, productResult] = await Promise.all([
      supabase.from("leads").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
    ]);
    setLeads(leadResult.data ?? []);
    setProducts(productResult.data ?? []);
    setLoading(false);
  }, [navigate]);

  useEffect(() => { void load(); }, [load]);

  async function updateLead(id: string, status: Lead["status"]) {
    const { error } = await supabase.from("leads").update({ status }).eq("id", id);
    setMessage(error ? "Не удалось обновить заявку." : "Статус заявки обновлён.");
    if (!error) setLeads((items) => items.map((item) => item.id === id ? { ...item, status } : item));
  }

  async function toggleProduct(product: Product) {
    const { error } = await supabase.from("products").update({ published: !product.published }).eq("id", product.id);
    setMessage(error ? "Не удалось изменить публикацию." : "Публикация обновлена.");
    if (!error) setProducts((items) => items.map((item) => item.id === product.id ? { ...item, published: !item.published } : item));
  }

  if (loading || allowed === null) return <main className="page py-24"><p>Загружаем панель…</p></main>;
  if (!allowed) return <main className="page py-24"><h1 className="font-display text-6xl">Доступ закрыт</h1><p className="mt-5 text-muted-foreground">У этой учётной записи нет прав владельца.</p><Button className="mt-8" onClick={() => supabase.auth.signOut().then(() => navigate({ to: "/auth" }))}>Выйти</Button></main>;

  return <main className="page py-12">
    <header className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8">
      <div><p className="eyebrow">Арт-студия Калерия</p><h1 className="mt-3 font-display text-6xl font-medium">Управление</h1></div>
      <div className="flex gap-2"><Button variant="outline" size="icon" title="Обновить" onClick={() => void load()}><RefreshCw /></Button><Button variant="outline" onClick={() => supabase.auth.signOut().then(() => navigate({ to: "/auth" }))}><LogOut /> Выйти</Button></div>
    </header>
    <div className="my-8 flex gap-2"><Button variant={view === "leads" ? "default" : "outline"} onClick={() => setView("leads")}>Заявки · {leads.length}</Button><Button variant={view === "products" ? "default" : "outline"} onClick={() => setView("products")}>Товары · {products.length}</Button></div>
    {message ? <p className="mb-5 border-l-2 border-accent pl-3 text-sm" role="status">{message}</p> : null}
    {view === "leads" ? <div className="grid gap-4">{leads.length ? leads.map((lead) => <article key={lead.id} className="grid gap-5 border border-border bg-card p-5 lg:grid-cols-[1fr_1fr_12rem]">
      <div><p className="text-xs uppercase text-muted-foreground">{kindLabels[lead.kind]} · {new Date(lead.created_at).toLocaleDateString("ru-RU")}</p><h2 className="mt-2 font-display text-3xl">{lead.customer_name}</h2><a className="mt-3 block text-sm" href={`tel:${lead.phone}`}>{lead.phone}</a>{lead.email ? <a className="mt-1 block text-sm" href={`mailto:${lead.email}`}>{lead.email}</a> : null}</div>
      <div><p className="whitespace-pre-wrap text-sm leading-6">{lead.message || "Без комментария"}</p>{lead.total ? <strong className="mt-3 block">Ориентир: {formatPrice(lead.total)}</strong> : null}</div>
      <label className="text-xs uppercase text-muted-foreground">Статус<Select value={lead.status} onValueChange={(value) => void updateLead(lead.id, value as Lead["status"])}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></label>
    </article>) : <p className="py-12 text-muted-foreground">Заявок пока нет.</p>}</div> : <ProductManager products={products} onSaved={load} onToggle={toggleProduct} />}
  </main>;
}

function ProductManager({ products, onSaved, onToggle }: { products: Product[]; onSaved: () => Promise<void>; onToggle: (product: Product) => Promise<void> }) {
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true);
    const data = new FormData(event.currentTarget);
    const payload = {
      name: String(data.get("name") ?? ""), slug: String(data.get("slug") ?? ""), category: String(data.get("category") ?? "florarium"),
      description: String(data.get("description") ?? ""), details: String(data.get("details") ?? ""), care: String(data.get("care") ?? ""),
      image_key: String(data.get("image_key") ?? "florarium"), price: Number(data.get("price") ?? 0),
      sizes: String(data.get("sizes") ?? "").split(",").map((item) => item.trim()).filter(Boolean), published: data.get("published") === "on", featured: data.get("featured") === "on",
    };
    if (editing) await supabase.from("products").update(payload).eq("id", editing.id); else await supabase.from("products").insert(payload);
    setSaving(false); setEditing(null); setOpen(false); await onSaved();
  }

  return <div><Button onClick={() => { setEditing(null); setOpen(true); }}><PackagePlus /> Добавить товар</Button>
    {open ? <form onSubmit={save} className="my-6 grid gap-4 border border-border bg-card p-6 md:grid-cols-2">
      <label className="grid gap-2 text-sm">Название<Input name="name" required defaultValue={editing?.name} /></label><label className="grid gap-2 text-sm">Адрес страницы<Input name="slug" required defaultValue={editing?.slug} /></label>
      <label className="grid gap-2 text-sm">Категория<Input name="category" required defaultValue={editing?.category ?? "florarium"} /></label><label className="grid gap-2 text-sm">Цена, ₽<Input name="price" required type="number" min="0" defaultValue={editing?.price} /></label>
      <label className="grid gap-2 text-sm md:col-span-2">Короткое описание<Textarea name="description" required defaultValue={editing?.description} /></label><label className="grid gap-2 text-sm md:col-span-2">Подробности<Textarea name="details" defaultValue={editing?.details} /></label>
      <label className="grid gap-2 text-sm">Уход<Input name="care" defaultValue={editing?.care} /></label><label className="grid gap-2 text-sm">Ключ фотографии<Input name="image_key" defaultValue={editing?.image_key ?? "florarium"} /></label>
      <label className="grid gap-2 text-sm md:col-span-2">Размеры через запятую<Input name="sizes" defaultValue={editing?.sizes.join(", ")} /></label>
      <label className="flex items-center gap-2 text-sm"><Checkbox name="published" defaultChecked={editing?.published ?? true} /> Опубликован</label><label className="flex items-center gap-2 text-sm"><Checkbox name="featured" defaultChecked={editing?.featured ?? false} /> На главной</label>
      <div className="flex gap-2 md:col-span-2"><Button disabled={saving}>{saving ? "Сохраняем…" : <><Check /> Сохранить</>}</Button><Button type="button" variant="outline" onClick={() => { setOpen(false); setEditing(null); }}>Отмена</Button></div>
    </form> : null}
    <div className="mt-6 grid gap-3">{products.map((product) => <article key={product.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-border py-5"><div><h2 className="font-display text-2xl">{product.name}</h2><p className="mt-1 text-sm text-muted-foreground">{product.category} · {formatPrice(product.price)}</p></div><div className="flex items-center gap-2"><Button variant="outline" onClick={() => { setEditing(product); setOpen(true); }}>Редактировать</Button><Button variant={product.published ? "secondary" : "outline"} onClick={() => void onToggle(product)}>{product.published ? "На сайте" : "Скрыт"}</Button></div></article>)}</div>
  </div>;
}