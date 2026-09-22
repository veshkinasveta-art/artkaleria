import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Download, LogOut, PackagePlus, RefreshCw, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice, productImages } from "@/lib/store-data";
import { ProductForm, categories } from "@/components/admin/product-form";
import { DashboardPanel } from "@/components/admin/dashboard-panel";
import { removeProductImage } from "@/lib/product-images";

type Lead = Tables<"leads">;
type Product = Tables<"products">;
type View = "dashboard" | "leads" | "products";
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
      supabase.from("products").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
    ]);
    setLeads(leadResult.data ?? []);
    setProducts(productResult.data ?? []);
    setLoading(false);
  }, [navigate]);

  useEffect(() => { void load(); }, [load]);

  const signOut = () => supabase.auth.signOut().then(() => navigate({ to: "/auth" }));

  if (loading || allowed === null) return <main className="page py-24"><p>Загружаем панель…</p></main>;
  if (!allowed) return <main className="page py-24"><h1 className="font-display text-6xl">Доступ закрыт</h1><p className="mt-5 text-muted-foreground">У этой учётной записи нет прав владельца.</p><Button className="mt-8" onClick={() => void signOut()}>Выйти</Button></main>;

  const newLeads = leads.filter((lead) => lead.status === "new").length;

  return <main className="page py-12">
    <header className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8">
      <div><p className="eyebrow">Арт-студия Калерия</p><h1 className="mt-3 font-display text-6xl font-medium">Управление</h1><p className="mt-3 text-sm text-muted-foreground">Новых заявок: {newLeads} · товаров на сайте: {products.filter((product) => product.published).length} из {products.length}</p></div>
      <div className="flex gap-2"><Button variant="outline" size="icon" title="Обновить" onClick={() => void load()}><RefreshCw /></Button><Button variant="outline" onClick={() => void signOut()}><LogOut /> Выйти</Button></div>
    </header>
    <div className="my-8 flex gap-2"><Button variant={view === "leads" ? "default" : "outline"} onClick={() => setView("leads")}>Заказы и заявки · {leads.length}</Button><Button variant={view === "products" ? "default" : "outline"} onClick={() => setView("products")}>Товары · {products.length}</Button></div>
    {message ? <p className="mb-5 border-l-2 border-accent pl-3 text-sm" role="status">{message}</p> : null}
    {view === "leads"
      ? <LeadsPanel leads={leads} setLeads={setLeads} notify={setMessage} />
      : <ProductsPanel products={products} reload={load} notify={setMessage} />}
  </main>;
}

function LeadsPanel({ leads, setLeads, notify }: { leads: Lead[]; setLeads: (fn: (items: Lead[]) => Lead[]) => void; notify: (text: string) => void }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [kind, setKind] = useState("all");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const visible = useMemo(() => leads.filter((lead) => {
    const query = search.trim().toLowerCase();
    const matchesQuery = !query || [lead.customer_name, lead.phone, lead.email ?? "", lead.message].join(" ").toLowerCase().includes(query);
    return matchesQuery && (status === "all" || lead.status === status) && (kind === "all" || lead.kind === kind);
  }), [leads, search, status, kind]);

  async function update(id: string, patch: Partial<Lead>) {
    const { error } = await supabase.from("leads").update(patch).eq("id", id);
    notify(error ? "Не удалось сохранить изменения." : "Изменения сохранены.");
    if (!error) setLeads((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  function exportCsv() {
    const rows = [["Дата", "Тип", "Статус", "Имя", "Телефон", "Почта", "Сумма", "Сообщение", "Комментарий"], ...visible.map((lead) => [new Date(lead.created_at).toLocaleString("ru-RU"), kindLabels[lead.kind], statusLabels[lead.status], lead.customer_name, lead.phone, lead.email ?? "", lead.total ? String(lead.total) : "", lead.message, lead.admin_note])];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(";")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    link.download = `kaleria-zayavki-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }

  return <div className="grid gap-5">
    <div className="flex flex-wrap items-center gap-3">
      <Input placeholder="Поиск по имени, телефону, тексту" value={search} onChange={(event) => setSearch(event.target.value)} className="max-w-xs" />
      <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Все статусы</SelectItem>{Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
      <Select value={kind} onValueChange={setKind}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Все типы</SelectItem>{Object.entries(kindLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
      <Button variant="outline" onClick={exportCsv}><Download /> Выгрузить</Button>
      <span className="text-sm text-muted-foreground">Показано: {visible.length}</span>
    </div>
    {visible.length ? visible.map((lead) => {
      const details = (lead.details ?? {}) as Record<string, unknown>;
      const entries = Object.entries(details).filter(([, value]) => value !== null && value !== "");
      return <article key={lead.id} className="grid gap-5 border border-border bg-card p-5 lg:grid-cols-[1fr_1.2fr_14rem]">
        <div>
          <p className="text-xs uppercase text-muted-foreground">{kindLabels[lead.kind]} · {new Date(lead.created_at).toLocaleString("ru-RU")}</p>
          <h2 className="mt-2 font-display text-3xl">{lead.customer_name}</h2>
          <a className="mt-3 block text-sm underline" href={`tel:${lead.phone}`}>{lead.phone}</a>
          {lead.email ? <a className="mt-1 block text-sm underline" href={`mailto:${lead.email}`}>{lead.email}</a> : null}
        </div>
        <div>
          <p className="whitespace-pre-wrap text-sm leading-6">{lead.message || "Без комментария"}</p>
          {entries.length ? <dl className="mt-3 grid gap-1 text-xs text-muted-foreground">{entries.map(([key, value]) => <div key={key} className="flex gap-2"><dt>{key}:</dt><dd className="text-foreground">{String(value)}</dd></div>)}</dl> : null}
          {lead.total ? <strong className="mt-3 block">Ориентир: {formatPrice(lead.total)}</strong> : null}
          <div className="mt-4 grid gap-2">
            <Textarea rows={2} placeholder="Внутренний комментарий" value={notes[lead.id] ?? lead.admin_note} onChange={(event) => setNotes((items) => ({ ...items, [lead.id]: event.target.value }))} />
            <Button size="sm" variant="outline" className="justify-self-start" onClick={() => void update(lead.id, { admin_note: notes[lead.id] ?? lead.admin_note })}><Save /> Сохранить комментарий</Button>
          </div>
        </div>
        <label className="text-xs uppercase text-muted-foreground">Статус<Select value={lead.status} onValueChange={(value) => void update(lead.id, { status: value as Lead["status"] })}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></label>
      </article>;
    }) : <p className="py-12 text-muted-foreground">Заявок по этим условиям нет.</p>}
  </div>;
}

function ProductsPanel({ products, reload, notify }: { products: Product[]; reload: () => Promise<void>; notify: (text: string) => void }) {
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const visible = products.filter((product) => {
    const query = search.trim().toLowerCase();
    return (!query || product.name.toLowerCase().includes(query) || product.slug.includes(query)) && (category === "all" || product.category === category);
  });

  async function togglePublished(product: Product) {
    const { error } = await supabase.from("products").update({ published: !product.published }).eq("id", product.id);
    notify(error ? "Не удалось изменить публикацию." : "Публикация обновлена.");
    if (!error) await reload();
  }

  async function remove(product: Product) {
    if (!window.confirm(`Удалить «${product.name}» без возможности восстановления?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (error) { notify("Не удалось удалить товар."); return; }
    await Promise.all((product.image_urls ?? []).map((url) => removeProductImage(url)));
    notify("Товар удалён.");
    await reload();
  }

  return <div>
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={() => { setEditing(null); setOpen(true); }}><PackagePlus /> Добавить товар</Button>
      <Input placeholder="Поиск по названию" value={search} onChange={(event) => setSearch(event.target.value)} className="max-w-xs" />
      <Select value={category} onValueChange={setCategory}><SelectTrigger className="w-52"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Все категории</SelectItem>{Object.entries(categories).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
    </div>
    {open ? <ProductForm product={editing} onDone={async () => { setOpen(false); setEditing(null); notify("Товар сохранён."); await reload(); }} onCancel={() => { setOpen(false); setEditing(null); }} /> : null}
    <div className="mt-6 grid gap-3">{visible.map((product) => <article key={product.id} className="flex flex-wrap items-center gap-4 border-b border-border py-4">
      <img src={product.image_urls?.[0] ?? productImages[product.image_key] ?? productImages["florarium"]} alt="" className="size-16 object-cover" />
      <div className="min-w-48 flex-1"><h2 className="font-display text-2xl">{product.name}</h2><p className="mt-1 text-sm text-muted-foreground">{categories[product.category] ?? product.category} · {formatPrice(product.price)} · порядок {product.sort_order}</p></div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => { setEditing(product); setOpen(true); }}>Редактировать</Button>
        <Button variant={product.published ? "secondary" : "outline"} onClick={() => void togglePublished(product)}>{product.published ? "На сайте" : "Скрыт"}</Button>
        <Button variant="ghost" size="icon" aria-label="Удалить товар" onClick={() => void remove(product)}><Trash2 /></Button>
      </div>
    </article>)}{visible.length ? null : <p className="py-12 text-muted-foreground">Товаров по этим условиям нет.</p>}</div>
  </div>;
}
