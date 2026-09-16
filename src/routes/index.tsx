import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadForm } from "@/components/lead-form";
import { fallbackProducts, formatPrice, productImages } from "@/lib/store-data";
import founderPhoto from "@/assets/kaleria-founder-retouched.jpg";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Арт-студия Калерия — флорариумы и панно из мха" },
    { name: "description", content: "Живые композиции в стекле, панно из мха и бонсай ручной работы в Москве." },
    { property: "og:title", content: "Арт-студия Калерия" },
    { property: "og:description", content: "Природные объекты, которые становятся частью интерьера." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: Index,
});

const types: { value: string; base: number }[] = [
  { value: "Флорариум", base: 4500 }, { value: "Моссариум", base: 3900 },
  { value: "Панно", base: 8500 }, { value: "Круг", base: 12000 }, { value: "Бонсай", base: 6500 },
];
const sizes: { value: string; factor: number }[] = [{ value: "Маленький", factor: 1 }, { value: "Средний", factor: 1.6 }, { value: "Крупный", factor: 2.5 }];
const labels: Record<string, string> = { florarium: "Флорариумы", mossarium: "Моссариумы", panel: "Панно из мха", circle: "Круги с подсветкой", bonsai: "Бонсай" };

function Index() {
  const [kind, setKind] = useState({ value: "Флорариум", base: 4500 });
  const [size, setSize] = useState({ value: "Средний", factor: 1.6 });
  const [transfer, setTransfer] = useState(0);
  const estimate = useMemo(() => Math.round(kind.base * size.factor / 100) * 100, [kind, size]);
  return <main>
    <section className="hero-grid">
      <div className="hero-photo"><img src={founderPhoto} alt="Основательница арт-студии Калерия с двумя композициями из мха" /></div>
      <div className="hero-copy">
        <p className="eyebrow">Ботаническая арт-студия · Москва</p>
        <h1>Арт-студия<br /><em>Калерия</em></h1>
        <p className="hero-lead">Живые композиции в стекле, панно из мха и бонсай. Создаём природные объекты, которые становятся частью интерьера.</p>
        <div className="flex flex-wrap gap-3"><Button asChild size="lg"><a href="#estimate">Оценить композицию <ArrowDownRight /></a></Button><Button asChild variant="outline" size="lg"><Link to="/workshops">Записаться на мастер-класс</Link></Button></div>
        <p className="hero-categories">Флорариумы <span>·</span> Моссариумы <span>·</span> Панно <span>·</span> Бонсай</p>
      </div>
    </section>

    <section className="page py-20 md:py-28">
      <div className="section-intro"><p className="eyebrow">Коллекция</p><h2>Не декор.<br />Живые объекты.</h2><p>В каждой работе — естественная фактура, ручная сборка и характер конкретного пространства.</p></div>
      <div className="gallery-grid">{fallbackProducts.map((product, index) => <Link key={product.id} to="/catalog/$slug" params={{ slug: product.slug }} className={`gallery-item gallery-item-${index + 1}`}><div><img src={productImages[product.image_key]} alt={labels[product.category]} loading={index > 1 ? "lazy" : "eager"} /></div><p className="eyebrow">{labels[product.category]}</p><h3>{index === 0 ? "Живой миниатюрный мир в стекле" : product.description}</h3><p className="gallery-price">от {formatPrice(product.price)} <ArrowRight /></p></Link>)}</div>
      <Button asChild variant="outline" size="lg" className="mt-12"><Link to="/catalog">Смотреть всю коллекцию <ArrowRight /></Link></Button>
    </section>

    <section id="estimate" className="estimate-band"><div className="page estimate-grid"><div><p className="eyebrow light">Предварительный расчёт</p><h2>Сколько будет стоить ваша композиция?</h2><p>Выберите формат и размер — покажем ориентир до обсуждения деталей.</p></div><div className="estimate-panel"><fieldset><legend>Что создаём?</legend><div className="choice-row">{types.map((item) => <Button key={item.value} type="button" variant={kind.value === item.value ? "secondary" : "ghost"} onClick={() => setKind(item)}>{item.value}</Button>)}</div></fieldset><fieldset><legend>Размер</legend><div className="choice-row">{sizes.map((item) => <Button key={item.value} type="button" variant={size.value === item.value ? "secondary" : "ghost"} onClick={() => setSize(item)}>{item.value}</Button>)}</div></fieldset><div className="estimate-total"><span>Ориентировочная стоимость</span><strong>{formatPrice(estimate)}</strong></div><Button size="lg" variant="secondary" onClick={() => { setTransfer((value) => value + 1); document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" }); }}>Перенести в заявку <ArrowDownRight /></Button><small>Финальная стоимость зависит от растений, материалов и сложности композиции.</small></div></div></section>

    <section className="story-grid"><div className="story-photo"><img src={productImages["mossarium"]} alt="Моссариум ручной работы" loading="lazy" /></div><div className="story-copy"><p className="eyebrow">О Калерии</p><h2>Природа,<br />собранная вручную</h2><p>Мы создаём композиции из растений, мха, камня, стекла и дерева — от маленьких живых миров до масштабных интерьерных панно.</p><p>Каждая работа собирается вручную и создаётся под конкретное пространство.</p><div className="story-facts"><div><strong>8 лет</strong><span>в фитодизайне</span></div><div><strong>120+</strong><span>созданных композиций и панно</span></div><div><strong>до 8</strong><span>человек в группе мастер-класса</span></div></div></div></section>

    <section id="contact" className="contact-band"><div className="page contact-grid"><div><p className="eyebrow">Связаться со студией</p><h2>Хотите создать<br />что-то живое?</h2><p>Расскажите, что вам нужно — предложим подходящий формат, размер и ориентировочную стоимость.</p><div className="contact-list"><a href="tel:+79266045274">+7 926 604-52-74</a><a href="mailto:hello@kaleria.studio">hello@kaleria.studio</a><span>Москва, Большая Никитская, 12</span></div></div><LeadForm key={transfer} kind={transfer ? "estimate" : "callback"} preset={transfer ? `${kind.value}, размер: ${size.value}. Ориентир: ${formatPrice(estimate)}.` : ""} total={transfer ? estimate : null} /></div></section>
  </main>;
}
