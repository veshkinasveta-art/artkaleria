import { Link } from "@tanstack/react-router";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { AdminLoginDialog } from "@/components/admin-login-dialog";

const links = [
  ["/catalog", "Каталог"], ["/workshops", "Мастер-классы"], ["/certificates", "Сертификаты"], ["/delivery", "Доставка"],
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  return <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur">
    <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 lg:px-10">
      <Link to="/" className="font-display text-3xl text-primary">Калерия</Link>
      <nav className="hidden items-center gap-7 lg:flex">{links.map(([to, label]) => <Link key={to} to={to} className="text-sm text-foreground/75 transition-colors hover:text-primary" activeProps={{ className: "text-primary" }}>{label}</Link>)}</nav>
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="relative" aria-label="Корзина"><Link to="/cart"><ShoppingBag />{count > 0 && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-accent text-[10px] text-accent-foreground">{count}</span>}</Link></Button>
        <Button asChild className="hidden sm:inline-flex"><Link to="/" hash="contact">Оставить заявку</Link></Button>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen((value) => !value)} aria-label={open ? "Закрыть меню" : "Открыть меню"}>{open ? <X /> : <Menu />}</Button>
      </div>
    </div>
    {open && <nav className="grid border-t border-border bg-background px-5 py-5 lg:hidden">{links.map(([to, label]) => <Link key={to} to={to} onClick={() => setOpen(false)} className="border-b border-border py-4 text-lg">{label}</Link>)}</nav>}
  </header>;
}

export function SiteFooter() {
  return <footer className="bg-primary text-primary-foreground">
    <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr] lg:px-10">
      <div><p className="font-display text-4xl">Калерия</p><p className="mt-4 max-w-sm text-sm text-primary-foreground/70">Живые композиции и природные арт-объекты, собранные вручную в Москве.</p></div>
      <div className="grid gap-2 text-sm"><Link to="/catalog">Каталог</Link><Link to="/workshops">Мастер-классы</Link><Link to="/certificates">Сертификаты</Link><Link to="/delivery">Доставка</Link></div>
      <div className="grid gap-2 text-sm"><a href="tel:+79266045274">+7 926 604-52-74</a><a href="mailto:hello@kaleria.studio">hello@kaleria.studio</a><p>Москва, Большая Никитская, 12</p><p>Пн–Сб, 10:00–19:00</p></div>
    </div>
    <div className="mx-auto flex max-w-[1440px] flex-wrap justify-between gap-4 border-t border-primary-foreground/20 px-5 py-5 text-xs text-primary-foreground/60 lg:px-10"><p>© 2026 Арт-студия Калерия</p><div className="flex gap-5"><Link to="/privacy">Конфиденциальность</Link><Link to="/offer">Оферта</Link><AdminLoginDialog className="underline-offset-4 hover:underline" /></div></div>
  </footer>;
}