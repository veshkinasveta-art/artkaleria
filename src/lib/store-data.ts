import florarium from "@/assets/florarium.jpg";
import mossarium from "@/assets/mossarium.jpg";
import panel from "@/assets/moss-panel-interior.jpg";
import circle from "@/assets/moss-circle.jpg";
import bonsai from "@/assets/bonsai.jpg";

export const productImages: Record<string, string> = { florarium, mossarium, panel, circle, bonsai };

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  details: string;
  care: string;
  price: number;
  image_key: string;
  sizes: string[];
  published: boolean;
  featured: boolean;
};

export const fallbackProducts: Product[] = [
  { id: "1", slug: "florarium-les-v-stekle", name: "Лес в стекле", category: "florarium", description: "Закрытый флорариум с папоротниками, мхом и природным камнем.", details: "Каждая композиция собирается вручную. Рисунок камней и растений уникален.", care: "Рассеянный свет, полив 1–2 раза в месяц.", price: 4500, image_key: "florarium", sizes: ["Маленький", "Средний", "Крупный"], published: true, featured: true },
  { id: "2", slug: "mossarium-tihaya-roshcha", name: "Тихая роща", category: "mossarium", description: "Влажный мини-лес из живого мха и папоротников.", details: "Закрытая экосистема в стекле с естественным микроклиматом.", care: "Не ставить под прямые лучи. Проветривать раз в неделю.", price: 3900, image_key: "mossarium", sizes: ["Маленький", "Средний"], published: true, featured: true },
  { id: "3", slug: "moss-panel-relief", name: "Панно «Рельеф»", category: "panel", description: "Интерьерное панно из стабилизированного мха и древесины.", details: "Размер и рисунок создаются под конкретную стену и интерьер.", care: "Не поливать. Беречь от прямого солнца.", price: 8500, image_key: "panel", sizes: ["60 × 90 см", "Индивидуальный размер"], published: true, featured: true },
  { id: "4", slug: "moss-circle-light", name: "Круг «Мягкий свет»", category: "circle", description: "Круг из мха в тонком металлическом ободе с тёплой подсветкой.", details: "Подсветка превращает панно в самостоятельный арт-объект.", care: "Не поливать. Сухая чистка мягкой кистью.", price: 12000, image_key: "circle", sizes: ["60 см", "80 см", "100 см"], published: true, featured: true },
  { id: "5", slug: "bonsai-sosna", name: "Бонсай «Сосна»", category: "bonsai", description: "Живое дерево с вручную сформированной кроной.", details: "Подбор кашпо, посадка и консультация по уходу включены.", care: "Светлое место, регулярный полив.", price: 6500, image_key: "bonsai", sizes: ["Компактный", "Средний"], published: true, featured: true },
];

export const formatPrice = (value: number) => `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;