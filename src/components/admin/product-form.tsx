import { useState, type FormEvent } from "react";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploader } from "@/components/admin/image-uploader";

type Product = Tables<"products">;

export const categories: Record<string, string> = { florarium: "Флорариумы", mossarium: "Моссариумы", panel: "Панно из мха", circle: "Круги с подсветкой", bonsai: "Бонсай" };

const translit: Record<string, string> = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" };
export const slugify = (value: string) => value.toLowerCase().split("").map((char) => translit[char] ?? char).join("").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function ProductForm({ product, onDone, onCancel }: { product: Product | null; onDone: () => Promise<void>; onCancel: () => void }) {
  const [images, setImages] = useState<string[]>(product?.image_urls ?? []);
  const [category, setCategory] = useState(product?.category ?? "florarium");
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const finalSlug = (slug || slugify(name)).trim();
    const price = Number(data.get("price") ?? 0);
    if (!name.trim() || !finalSlug || !Number.isFinite(price) || price <= 0) { setError("Заполните название, адрес страницы и цену."); return; }
    setSaving(true); setError("");
    const payload = {
      name: name.trim(), slug: finalSlug, category,
      description: String(data.get("description") ?? ""), details: String(data.get("details") ?? ""), care: String(data.get("care") ?? ""),
      price, image_key: category, image_urls: images, sort_order: Number(data.get("sort_order") ?? 0) || 0,
      sizes: String(data.get("sizes") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
      published: data.get("published") === "on", featured: data.get("featured") === "on",
    };
    const { error: saveError } = product
      ? await supabase.from("products").update(payload).eq("id", product.id)
      : await supabase.from("products").insert(payload);
    setSaving(false);
    if (saveError) { setError(saveError.message.includes("duplicate") ? "Такой адрес страницы уже занят." : "Не удалось сохранить товар."); return; }
    await onDone();
  }

  return <form onSubmit={save} className="my-6 grid gap-4 border border-border bg-card p-6 md:grid-cols-2">
    <div className="md:col-span-2"><p className="mb-3 text-sm font-semibold">Фотографии товара</p><ImageUploader urls={images} onChange={setImages} /></div>
    <label className="grid gap-2 text-sm">Название<Input value={name} onChange={(event) => { setName(event.target.value); if (!product) setSlug(slugify(event.target.value)); }} required /></label>
    <label className="grid gap-2 text-sm">Адрес страницы<Input value={slug} onChange={(event) => setSlug(event.target.value)} required /></label>
    <label className="grid gap-2 text-sm">Категория<Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(categories).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></label>
    <label className="grid gap-2 text-sm">Цена, ₽<Input name="price" type="number" min="1" required defaultValue={product?.price ?? ""} /></label>
    <label className="grid gap-2 text-sm md:col-span-2">Короткое описание<Textarea name="description" required defaultValue={product?.description ?? ""} /></label>
    <label className="grid gap-2 text-sm md:col-span-2">Подробности<Textarea name="details" defaultValue={product?.details ?? ""} /></label>
    <label className="grid gap-2 text-sm">Уход<Input name="care" defaultValue={product?.care ?? ""} /></label>
    <label className="grid gap-2 text-sm">Порядок показа<Input name="sort_order" type="number" defaultValue={product?.sort_order ?? 0} /></label>
    <label className="grid gap-2 text-sm md:col-span-2">Размеры через запятую<Input name="sizes" defaultValue={product?.sizes.join(", ") ?? "Маленький, Средний, Крупный"} /></label>
    <label className="flex items-center gap-2 text-sm"><Checkbox name="published" defaultChecked={product?.published ?? true} /> Показывать на сайте</label>
    <label className="flex items-center gap-2 text-sm"><Checkbox name="featured" defaultChecked={product?.featured ?? false} /> Показывать на главной</label>
    {error ? <p className="text-sm text-destructive md:col-span-2" role="alert">{error}</p> : null}
    <div className="flex gap-2 md:col-span-2"><Button disabled={saving}>{saving ? <><Loader2 className="animate-spin" /> Сохраняем…</> : <><Check /> Сохранить</>}</Button><Button type="button" variant="outline" onClick={onCancel}>Отмена</Button></div>
  </form>;
}
