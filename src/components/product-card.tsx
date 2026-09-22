import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { type Product, formatPrice, productImage } from "@/lib/store-data";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const cart = useCart();
  const size = product.sizes[0] ?? "Стандарт";

  const addToCart = () => {
    cart.addItem({ slug: product.slug, name: product.name, price: product.price, imageKey: product.image_key, imageUrl: productImage(product), size });
    toast.success(`«${product.name}» в корзине`, {
      description: `Размер: ${size}`,
      action: { label: "Перейти", onClick: () => { window.location.href = "/cart"; } },
    });
  };

  return <article className="group flex flex-col">
    <Link to="/catalog/$slug" params={{ slug: product.slug }} className="block">
      <div className="aspect-[4/5] overflow-hidden bg-muted"><img src={productImage(product)} alt={product.name} width={1200} height={1504} loading={priority ? "eager" : "lazy"} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]" /></div>
      <div className="flex items-start justify-between gap-4 py-5"><div><p className="font-display text-2xl">{product.name}</p><p className="mt-1 text-sm text-muted-foreground">{product.description}</p><p className="mt-3 text-sm font-semibold">от {formatPrice(product.price)}</p></div><ArrowUpRight className="mt-1 size-5 shrink-0 text-primary" /></div>
    </Link>
    <Button variant="outline" className="mt-auto w-full" onClick={addToCart}><ShoppingBag />В корзину</Button>
  </article>;
}
