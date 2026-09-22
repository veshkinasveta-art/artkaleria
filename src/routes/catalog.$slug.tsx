import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatPrice, productGallery, productImage } from "@/lib/store-data";
import { listPublicProducts } from "@/lib/products.functions";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/catalog/$slug")({
  loader: async ({ params }) => {
    const products = await listPublicProducts();
    const product = products.find((p) => p.slug === params.slug);
    if (!product) throw notFound();
    return product;
  },
  errorComponent: () => <main className="page py-24"><h1 className="font-display text-5xl">Не удалось открыть работу</h1><p className="mt-4 text-muted-foreground">Обновите страницу чуть позже.</p></main>,
  notFoundComponent: () => <main className="page py-24"><h1 className="font-display text-5xl">Работа не найдена</h1><Link to="/catalog" className="mt-6 inline-block text-sm">← Вернуться в каталог</Link></main>,
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.name ?? "Работа"} — Калерия` }, { name: "description", content: loaderData?.description ?? "Авторская ботаническая композиция." }, { property: "og:title", content: `${loaderData?.name ?? "Работа"} — Калерия` }, { property: "og:description", content: loaderData?.description ?? "Авторская композиция." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: ProductPage,
});

function ProductPage() {
  const product = Route.useLoaderData();
  const gallery = productGallery(product);
  const [active, setActive] = useState(0);
  const [size, setSize] = useState(product.sizes[0] ?? "Стандарт");
  const [added, setAdded] = useState(false);
  const cart = useCart();
  const navigate = useNavigate();
  const item = { slug: product.slug, name: product.name, price: product.price, imageKey: product.image_key, imageUrl: productImage(product), size };

  return <main className="page py-8">
    <Link to="/catalog" className="text-sm text-muted-foreground">← Вернуться в каталог</Link>
    <div className="grid gap-10 py-8 lg:grid-cols-[1.15fr_.85fr]">
      <div>
        <div className="aspect-[4/5] overflow-hidden bg-muted"><img src={gallery[active] ?? gallery[0]} alt={product.name} width={1200} height={1504} className="h-full w-full object-cover" /></div>
        {gallery.length > 1 ? <div className="mt-3 flex flex-wrap gap-3">{gallery.map((url, index) => <button key={url} onClick={() => setActive(index)} className={`size-20 overflow-hidden border ${index === active ? "border-primary" : "border-border"}`}><img src={url} alt="" className="h-full w-full object-cover" /></button>)}</div> : null}
      </div>
      <div className="lg:sticky lg:top-28 lg:self-start">
        <p className="eyebrow">Ручная работа</p>
        <h1 className="mt-4 font-display text-5xl md:text-7xl">{product.name}</h1>
        <p className="mt-5 text-lg text-muted-foreground">{product.description}</p>
        <p className="mt-8 font-display text-4xl">от {formatPrice(product.price)}</p>
        <div className="mt-8"><p className="mb-3 text-sm font-semibold">Размер</p><div className="flex flex-wrap gap-2">{product.sizes.map((entry) => <button key={entry} onClick={() => setSize(entry)} className={`border px-4 py-3 text-sm ${size === entry ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{entry}</button>)}</div></div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Button size="lg" variant="outline" onClick={() => { cart.addItem(item); setAdded(true); toast.success(`«${product.name}» в корзине`, { description: `Размер: ${size}` }); }}><ShoppingBag />{added ? "Добавлено" : "В корзину"}</Button>
          <Button size="lg" onClick={() => { cart.addItem(item); void navigate({ to: "/cart" }); }}>Заказать</Button>
        </div>
        <div className="mt-10 grid gap-6 border-t border-border pt-8 text-sm">
          <div><h2 className="font-semibold">О работе</h2><p className="mt-2 text-muted-foreground">{product.details}</p></div>
          <div><h2 className="font-semibold">Уход</h2><p className="mt-2 text-muted-foreground">{product.care}</p></div>
        </div>
      </div>
    </div>
  </main>;
}
