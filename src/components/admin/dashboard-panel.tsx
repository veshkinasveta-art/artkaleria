import { useMemo } from "react";
import { AlertTriangle, ImageOff, TrendingDown, TrendingUp } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { formatPrice } from "@/lib/store-data";

type Lead = Tables<"leads">;
type Product = Tables<"products">;

const kindLabels: Record<Lead["kind"], string> = { order: "Заказ", estimate: "Расчёт", workshop: "Мастер-класс", certificate: "Сертификат", callback: "Обратный звонок" };
const statusLabels: Record<Lead["status"], string> = { new: "Новая", in_progress: "В работе", completed: "Завершена" };

const DAY = 86_400_000;

function Metric({ label, value, hint, trend }: { label: string; value: string; hint?: string; trend?: number | null }) {
  return <div className="border border-border bg-card p-5">
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="mt-2 font-display text-4xl font-medium">{value}</p>
    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
      {typeof trend === "number" && trend !== 0 ? <span className="inline-flex items-center gap-1 text-foreground">{trend > 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}{trend > 0 ? "+" : ""}{trend}%</span> : null}
      {hint ? <span>{hint}</span> : null}
    </div>
  </div>;
}

export function DashboardPanel({ leads, products, onOpenLeads }: { leads: Lead[]; products: Product[]; onOpenLeads: (status: string) => void }) {
  const stats = useMemo(() => {
    const now = Date.now();
    const at = (lead: Lead) => new Date(lead.created_at).getTime();
    const last7 = leads.filter((lead) => now - at(lead) <= 7 * DAY);
    const prev7 = leads.filter((lead) => now - at(lead) > 7 * DAY && now - at(lead) <= 14 * DAY);
    const last30 = leads.filter((lead) => now - at(lead) <= 30 * DAY);
    const prev30 = leads.filter((lead) => now - at(lead) > 30 * DAY && now - at(lead) <= 60 * DAY);
    const trend = (current: number, previous: number) => previous === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - previous) / previous) * 100);

    const days = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(now - (29 - index) * DAY);
      date.setHours(0, 0, 0, 0);
      const next = date.getTime() + DAY;
      return { date, count: leads.filter((lead) => at(lead) >= date.getTime() && at(lead) < next).length };
    });

    const byKind = (Object.keys(kindLabels) as Lead["kind"][]).map((kind) => ({ kind, count: leads.filter((lead) => lead.kind === kind).length })).sort((a, b) => b.count - a.count);

    return {
      newCount: leads.filter((lead) => lead.status === "new").length,
      inProgress: leads.filter((lead) => lead.status === "in_progress").length,
      completed: leads.filter((lead) => lead.status === "completed").length,
      last7: last7.length,
      trend7: trend(last7.length, prev7.length),
      last30: last30.length,
      trend30: trend(last30.length, prev30.length),
      sum30: last30.reduce((total, lead) => total + (lead.total ?? 0), 0),
      days,
      maxDay: Math.max(1, ...days.map((day) => day.count)),
      byKind,
      recent: [...leads].sort((a, b) => at(b) - at(a)).slice(0, 5),
      stale: leads.filter((lead) => lead.status === "new" && now - at(lead) > 2 * DAY),
      firstProducts: [...products].sort((a, b) => a.sort_order - b.sort_order).slice(0, 5),
      noPhoto: products.filter((product) => !(product.image_urls ?? []).length),
      published: products.filter((product) => product.published).length,
      featured: products.filter((product) => product.featured).length,
    };
  }, [leads, products]);

  return <div className="grid gap-8">
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Новые заявки" value={String(stats.newCount)} hint="ждут ответа" />
      <Metric label="В работе" value={String(stats.inProgress)} hint={`завершено: ${stats.completed}`} />
      <Metric label="Заявок за 7 дней" value={String(stats.last7)} trend={stats.trend7} hint="к прошлой неделе" />
      <Metric label="Заявок за 30 дней" value={String(stats.last30)} trend={stats.trend30} hint="к прошлому месяцу" />
      <Metric label="Сумма заказов за 30 дней" value={stats.sum30 ? formatPrice(stats.sum30) : "—"} hint="ориентировочно" />
      <Metric label="Товары" value={String(products.length)} hint={`на сайте: ${stats.published} · на главной: ${stats.featured}`} />
      <Metric label="Без фотографий" value={String(stats.noPhoto.length)} hint="нужно добавить снимки" />
      <Metric label="Всего заявок" value={String(leads.length)} hint="за всё время" />
    </section>

    <section className="border border-border bg-card p-5">
      <h2 className="font-display text-3xl">Активность за 30 дней</h2>
      <div className="mt-6 flex h-40 items-end gap-1">
        {stats.days.map((day) => <div key={day.date.toISOString()} className="flex flex-1 items-end justify-center" title={`${day.date.toLocaleDateString("ru-RU")}: ${day.count}`}>
          <div className="w-full bg-accent" style={{ height: `${Math.max(day.count ? 6 : 2, (day.count / stats.maxDay) * 100)}%`, opacity: day.count ? 1 : 0.25 }} />
        </div>)}
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{stats.days[0]?.date.toLocaleDateString("ru-RU")}</span>
        <span>сегодня</span>
      </div>
    </section>

    <div className="grid gap-8 lg:grid-cols-2">
      <section className="border border-border bg-card p-5">
        <h2 className="font-display text-3xl">Заявки по типам</h2>
        <div className="mt-5 grid gap-3">
          {stats.byKind.map((item) => <div key={item.kind}>
            <div className="flex justify-between text-sm"><span>{kindLabels[item.kind]}</span><span className="text-muted-foreground">{item.count}</span></div>
            <div className="mt-1 h-1.5 bg-muted"><div className="h-full bg-accent" style={{ width: `${leads.length ? (item.count / leads.length) * 100 : 0}%` }} /></div>
          </div>)}
          {leads.length ? null : <p className="text-sm text-muted-foreground">Заявок пока нет.</p>}
        </div>
      </section>

      <section className="border border-border bg-card p-5">
        <h2 className="font-display text-3xl">Последние заявки</h2>
        <div className="mt-5 grid gap-3">
          {stats.recent.map((lead) => <button key={lead.id} type="button" onClick={() => onOpenLeads(lead.status)} className="grid gap-1 border-b border-border pb-3 text-left last:border-0">
            <span className="flex flex-wrap items-baseline justify-between gap-2"><span className="font-display text-2xl">{lead.customer_name}</span><span className="text-xs uppercase text-muted-foreground">{statusLabels[lead.status]}</span></span>
            <span className="text-xs text-muted-foreground">{kindLabels[lead.kind]} · {new Date(lead.created_at).toLocaleString("ru-RU")} · {lead.phone}</span>
          </button>)}
          {stats.recent.length ? null : <p className="text-sm text-muted-foreground">Заявок пока нет.</p>}
        </div>
      </section>
    </div>

    <div className="grid gap-8 lg:grid-cols-2">
      <section className="border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 font-display text-3xl"><AlertTriangle className="size-5" /> Требуют внимания</h2>
        <div className="mt-5 grid gap-3">
          {stats.stale.length ? stats.stale.map((lead) => <button key={lead.id} type="button" onClick={() => onOpenLeads("new")} className="grid gap-1 border-b border-border pb-3 text-left last:border-0">
            <span className="font-display text-2xl">{lead.customer_name}</span>
            <span className="text-xs text-muted-foreground">{kindLabels[lead.kind]} · без ответа с {new Date(lead.created_at).toLocaleDateString("ru-RU")}</span>
          </button>) : <p className="text-sm text-muted-foreground">Все новые заявки обработаны вовремя.</p>}
        </div>
      </section>

      <section className="border border-border bg-card p-5">
        <h2 className="font-display text-3xl">Первыми в каталоге</h2>
        <ol className="mt-5 grid gap-2 text-sm">
          {stats.firstProducts.map((product) => <li key={product.id} className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0">
            <span className="flex items-center gap-2">{(product.image_urls ?? []).length ? null : <ImageOff className="size-4 text-muted-foreground" />}{product.name}</span>
            <span className="text-muted-foreground">{product.published ? formatPrice(product.price) : "скрыт"}</span>
          </li>)}
          {stats.firstProducts.length ? null : <li className="text-muted-foreground">Товаров пока нет.</li>}
        </ol>
        {stats.noPhoto.length ? <p className="mt-4 text-xs text-muted-foreground">Без фотографий: {stats.noPhoto.map((product) => product.name).join(", ")}</p> : null}
      </section>
    </div>
  </div>;
}
