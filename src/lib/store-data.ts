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

export const categoryLabels: Record<string, string> = {
  florarium: "Флорариумы",
  mossarium: "Моссариумы",
  panel: "Панно из мха",
  circle: "Круги с подсветкой",
  bonsai: "Бонсай",
};

export const fallbackProducts: Product[] = [
  // Флорариумы
  { id: "1", slug: "florarium-les-v-stekle", name: "Лес в стекле", category: "florarium", description: "Закрытый флорариум с папоротниками, мхом и природным камнем.", details: "Каждая композиция собирается вручную. Рисунок камней и растений уникален.", care: "Рассеянный свет, полив 1–2 раза в месяц.", price: 4500, image_key: "florarium", sizes: ["Маленький", "Средний", "Крупный"], published: true, featured: true },
  { id: "2", slug: "florarium-sfera", name: "Сфера", category: "florarium", description: "Стеклянный шар с мхом, суккулентами и белым песком.", details: "Прозрачная сфера на деревянной подставке из дуба.", care: "Рассеянный свет, лёгкое опрыскивание раз в две недели.", price: 5200, image_key: "florarium", sizes: ["15 см", "20 см", "25 см"], published: true, featured: false },
  { id: "3", slug: "florarium-kub", name: "Куб", category: "florarium", description: "Геометрический флорариум в чёрной металлической оправе.", details: "Строгая форма для рабочего стола и переговорной.", care: "Полив раз в две недели, без прямого солнца.", price: 6400, image_key: "florarium", sizes: ["Средний", "Крупный"], published: true, featured: false },
  { id: "4", slug: "florarium-kaplya", name: "Капля", category: "florarium", description: "Подвесной флорариум-капля с мхом и миниатюрным папоротником.", details: "Подвешивается на кожаном шнуре, идёт в комплекте.", care: "Опрыскивание раз в неделю.", price: 4900, image_key: "florarium", sizes: ["Маленький", "Средний"], published: true, featured: false },
  { id: "5", slug: "florarium-pustynya", name: "Пустыня", category: "florarium", description: "Открытый флорариум с суккулентами, песком и минералами.", details: "Композиция в широкой стеклянной чаше.", care: "Яркий свет, полив раз в три недели.", price: 5800, image_key: "florarium", sizes: ["Средний", "Крупный"], published: true, featured: false },

  // Моссариумы
  { id: "6", slug: "mossarium-tihaya-roshcha", name: "Тихая роща", category: "mossarium", description: "Влажный мини-лес из живого мха и папоротников.", details: "Закрытая экосистема в стекле с естественным микроклиматом.", care: "Не ставить под прямые лучи. Проветривать раз в неделю.", price: 3900, image_key: "mossarium", sizes: ["Маленький", "Средний"], published: true, featured: true },
  { id: "7", slug: "mossarium-severnyy-sklon", name: "Северный склон", category: "mossarium", description: "Рельефная композиция из нескольких видов мха и камня.", details: "Перепад высот создаёт эффект настоящего склона.", care: "Опрыскивание раз в неделю, рассеянный свет.", price: 5400, image_key: "mossarium", sizes: ["Средний", "Крупный"], published: true, featured: false },
  { id: "8", slug: "mossarium-nastolnyy", name: "Настольный", category: "mossarium", description: "Компактный моссариум для рабочего стола.", details: "Помещается рядом с ноутбуком, не требует ухода каждый день.", care: "Опрыскивание раз в 10 дней.", price: 4200, image_key: "mossarium", sizes: ["Маленький"], published: true, featured: false },
  { id: "9", slug: "mossarium-podvesnoy", name: "Подвесной лес", category: "mossarium", description: "Стеклянная колба с мхом, подвешенная на тонком шнуре.", details: "Смотрится как парящий в воздухе фрагмент леса.", care: "Опрыскивание раз в неделю.", price: 4700, image_key: "mossarium", sizes: ["Маленький", "Средний"], published: true, featured: false },
  { id: "10", slug: "mossarium-korni", name: "Корни", category: "mossarium", description: "Мох, коряга и лишайник в широком стеклянном сосуде.", details: "Основа композиции — вымоченная и обработанная коряга.", care: "Опрыскивание раз в неделю, без прямого солнца.", price: 6900, image_key: "mossarium", sizes: ["Средний", "Крупный"], published: true, featured: false },

  // Панно из мха
  { id: "11", slug: "moss-panel-relief", name: "Панно «Рельеф»", category: "panel", description: "Интерьерное панно из стабилизированного мха и древесины.", details: "Размер и рисунок создаются под конкретную стену и интерьер.", care: "Не поливать. Беречь от прямого солнца.", price: 8500, image_key: "panel", sizes: ["60 × 90 см", "Индивидуальный размер"], published: true, featured: true },
  { id: "12", slug: "moss-panel-gladkoe", name: "Панно «Ровный мох»", category: "panel", description: "Плотное однородное панно из ягеля глубокого зелёного тона.", details: "Спокойная фактура для минималистичных интерьеров.", care: "Не поливать. Сухая чистка мягкой кистью.", price: 8500, image_key: "panel", sizes: ["60 × 90 см", "90 × 120 см", "Индивидуальный размер"], published: true, featured: false },
  { id: "13", slug: "moss-panel-kora-kamen", name: "Панно «Кора и камень»", category: "panel", description: "Панно с включением коры, камня и сухоцветов.", details: "Многослойная фактура с природными материалами.", care: "Не поливать. Беречь от влаги и прямого солнца.", price: 12500, image_key: "panel", sizes: ["80 × 120 см", "Индивидуальный размер"], published: true, featured: false },
  { id: "14", slug: "moss-panel-logotip", name: "Панно с логотипом", category: "panel", description: "Логотип компании из мха для офиса и ресепшена.", details: "Выполняем по вашему макету, согласуем эскиз до сборки.", care: "Не поливать. Сухая чистка раз в полгода.", price: 16000, image_key: "panel", sizes: ["До 1 м²", "Индивидуальный размер"], published: true, featured: false },
  { id: "15", slug: "moss-panel-karta", name: "Панно «Карта»", category: "panel", description: "Крупноформатное панно с рисунком материков из разных мхов.", details: "Собирается под размер стены, монтаж входит в стоимость.", care: "Не поливать. Беречь от прямого солнца.", price: 21000, image_key: "panel", sizes: ["120 × 180 см", "Индивидуальный размер"], published: true, featured: false },

  // Круги с подсветкой
  { id: "16", slug: "moss-circle-light", name: "Круг «Мягкий свет»", category: "circle", description: "Круг из мха в тонком металлическом ободе с тёплой подсветкой.", details: "Подсветка превращает панно в самостоятельный арт-объект.", care: "Не поливать. Сухая чистка мягкой кистью.", price: 12000, image_key: "circle", sizes: ["60 см", "80 см", "100 см"], published: true, featured: true },
  { id: "17", slug: "moss-circle-latun", name: "Круг «Латунь»", category: "circle", description: "Обод из латуни и плотный ягель с тёплой подсветкой.", details: "Золотистый металл в сочетании с глубокой зеленью.", care: "Не поливать. Сухая чистка.", price: 15500, image_key: "circle", sizes: ["60 см", "80 см"], published: true, featured: false },
  { id: "18", slug: "moss-circle-mini", name: "Круг «Мини»", category: "circle", description: "Небольшой круг диаметром 40 см — точечный акцент.", details: "Подходит для прихожей, ванной и небольших стен.", care: "Не поливать. Сухая чистка.", price: 12000, image_key: "circle", sizes: ["40 см"], published: true, featured: false },
  { id: "19", slug: "moss-circle-dva-kruga", name: "Композиция из двух кругов", category: "circle", description: "Два круга разного диаметра с общей подсветкой.", details: "Смещённая композиция создаёт объём на стене.", care: "Не поливать. Сухая чистка.", price: 24000, image_key: "circle", sizes: ["60 + 40 см", "80 + 60 см"], published: true, featured: false },
  { id: "20", slug: "moss-circle-temnyy-obod", name: "Круг «Тёмный обод»", category: "circle", description: "Графитовый обод, глубокий мох и холодная подсветка.", details: "Строгий вариант для тёмных интерьеров и офисов.", care: "Не поливать. Сухая чистка.", price: 14500, image_key: "circle", sizes: ["60 см", "80 см", "100 см"], published: true, featured: false },

  // Бонсай
  { id: "21", slug: "bonsai-sosna", name: "Бонсай «Сосна»", category: "bonsai", description: "Живое дерево с вручную сформированной кроной.", details: "Подбор кашпо, посадка и консультация по уходу включены.", care: "Светлое место, регулярный полив.", price: 6500, image_key: "bonsai", sizes: ["Компактный", "Средний"], published: true, featured: true },
  { id: "22", slug: "bonsai-mozhzhevelnik", name: "Бонсай «Можжевельник»", category: "bonsai", description: "Плотная хвоя и выразительный изгиб ствола.", details: "Форма создаётся вручную в течение нескольких сезонов.", care: "Прохлада, яркий рассеянный свет, умеренный полив.", price: 8900, image_key: "bonsai", sizes: ["Компактный", "Средний", "Крупный"], published: true, featured: false },
  { id: "23", slug: "bonsai-fikus", name: "Бонсай «Фикус»", category: "bonsai", description: "Неприхотливое дерево с крупными воздушными корнями.", details: "Хороший выбор для первого бонсая и для офиса.", care: "Тепло, рассеянный свет, полив по мере просыхания.", price: 7400, image_key: "bonsai", sizes: ["Компактный", "Средний"], published: true, featured: false },
  { id: "24", slug: "bonsai-klen", name: "Бонсай «Клён»", category: "bonsai", description: "Листопадное дерево, меняющее цвет по сезонам.", details: "Осенью крона становится тёплой красно-оранжевой.", care: "Прохладная зимовка, регулярный полив.", price: 11500, image_key: "bonsai", sizes: ["Средний", "Крупный"], published: true, featured: false },
  { id: "25", slug: "bonsai-na-kamne", name: "Бонсай на камне", category: "bonsai", description: "Дерево, посаженное на природный камень с мхом.", details: "Корни оплетают камень — композиция в японской традиции.", care: "Светлое место, частый полив, опрыскивание мха.", price: 14000, image_key: "bonsai", sizes: ["Средний"], published: true, featured: false },
];

export const featuredProducts = fallbackProducts.filter((product) => product.featured);

export const formatPrice = (value: number) => `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
