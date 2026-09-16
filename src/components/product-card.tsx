import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { type Product, formatPrice, productImages } from "@/lib/store-data";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  return <Link to="/catalog/$slug" params={{ slug: product.slug }} className="group block">
    <div className="aspect-[4/5] overflow-hidden bg-muted"><img src={productImages[product.image_key] ?? productImages.florarium} alt={product.name} width={1200} height={1504} loading={priority ? "eager" : "lazy"} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]" /></div>
    <div className="flex items-start justify-between gap-4 border-b border-border py-5"><div><p className="font-display text-2xl">{product.name}</p><p className="mt-1 text-sm text-muted-foreground">{product.description}</p><p className="mt-3 text-sm font-semibold">от {formatPrice(product.price)}</p></div><ArrowUpRight className="mt-1 size-5 shrink-0 text-primary" /></div>
  </Link>;
}