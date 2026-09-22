import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { createLovableAiGatewayRunIdFetch } from "@/lib/ai-gateway.server";
import type { ChatProductCard } from "@/lib/chat-types";

export type CatalogProduct = {
  slug: string;
  name: string;
  category: string;
  description: string;
  details: string;
  care: string;
  price: number;
  sizes: string[];
  image_key: string;
  image_urls: string[] | null;
};

export type AssistantEffects = {
  products: ChatProductCard[];
  total: number | null;
  orderCreated: { items: ChatProductCard[]; total: number } | null;
  operatorRequested: string | null;
};

const sizeFactor: Record<string, number> = { "Маленький": 0.8, "Средний": 1, "Крупный": 1.45 };

function priceFor(product: CatalogProduct, size: string) {
  return Math.round((product.price * (sizeFactor[size] ?? 1)) / 100) * 100;
}

function card(product: CatalogProduct, size: string, note: string): ChatProductCard {
  return {
    slug: product.slug,
    name: product.name,
    price: priceFor(product, size),
    size: size || product.sizes[0] || "Средний",
    imageUrl: product.image_urls?.[0] ?? "",
    imageKey: product.image_key,
    note,
  };
}

export async function runAssistant(options: {
  apiKey: string;
  catalog: CatalogProduct[];
  history: { role: "user" | "assistant"; content: string }[];
  customerName: string;
  onOrder: (items: ChatProductCard[], total: number, comment: string) => Promise<void>;
  onOperator: (reason: string) => Promise<void>;
}): Promise<{ text: string; effects: AssistantEffects }> {
  const { apiKey, catalog, history, customerName } = options;
  const effects: AssistantEffects = { products: [], total: null, orderCreated: null, operatorRequested: null };
  const bySlug = new Map(catalog.map((product) => [product.slug, product]));

  const resolve = (items: { slug: string; size: string | null; quantity: number | null; note: string | null }[]) =>
    items.flatMap((item) => {
      const product = bySlug.get(item.slug);
      if (!product) return [];
      const entry = card(product, item.size ?? product.sizes[0] ?? "Средний", item.note ?? "");
      return Array.from({ length: Math.min(Math.max(item.quantity ?? 1, 1), 10) }, () => entry);
    });

  const itemSchema = z.object({
    slug: z.string(),
    size: z.string().nullable(),
    quantity: z.number().nullable(),
    note: z.string().nullable(),
  });

  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const lovable = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  const catalogText = catalog
    .map((product) => `- ${product.name} (slug: ${product.slug}; категория: ${product.category}; базовая цена: ${product.price} ₽; размеры: ${product.sizes.join(", ")}) — ${product.description}${product.details ? ` Детали: ${product.details}` : ""}${product.care ? ` Уход: ${product.care}` : ""}`)
    .join("\n");

  const system = `Ты — консультант московской арт-студии «Калерия». Студия делает флорариумы, моссариумы, панно из мха, круги с подсветкой и бонсай.
Собеседника зовут ${customerName}. Общайся по-русски, тепло и по делу, короткими сообщениями (2–5 предложений), без markdown-заголовков и без выдуманных фактов.

Ассортимент студии:
${catalogText}

Правила:
- Сначала уточни повод, пространство, бюджет и предпочтения, затем предлагай.
- Предлагая композиции, обязательно вызывай suggest_products со slug из списка выше — карточки с фото и ценой покажутся клиенту.
- Цена зависит от размера: маленький ×0.8, средний ×1, крупный ×1.45 от базовой цены. Для подсчёта комплекта вызывай quote_composition.
- Когда клиент явно согласился на состав, вызови create_order. После этого сообщи, что заявка передана студии и позиции добавлены в корзину.
- Если клиент просит человека, задаёт вопрос вне твоей компетенции (сроки монтажа, сложная логистика, претензия, индивидуальный проект под смету), вызови request_operator и предупреди, что подключаешь специалиста.
- Не обещай точных сроков и скидок; финальную стоимость подтверждает студия.`;

  const result = streamText({
    model: lovable.responses("openai/gpt-6-astra"),
    system,
    messages: history,
    stopWhen: stepCountIs(50),
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
    tools: {
      suggest_products: tool({
        description: "Показать клиенту карточки подходящих композиций из каталога студии.",
        inputSchema: z.object({ items: z.array(itemSchema) }),
        execute: async ({ items }) => {
          const cards = resolve(items);
          effects.products = cards;
          return cards.map((item) => ({ name: item.name, size: item.size, price: item.price }));
        },
      }),
      quote_composition: tool({
        description: "Посчитать стоимость комплекта из нескольких позиций каталога.",
        inputSchema: z.object({ items: z.array(itemSchema) }),
        execute: async ({ items }) => {
          const cards = resolve(items);
          const total = cards.reduce((sum, item) => sum + item.price, 0);
          effects.products = cards;
          effects.total = total;
          return { items: cards.map((item) => ({ name: item.name, size: item.size, price: item.price })), total };
        },
      }),
      create_order: tool({
        description: "Оформить заявку в студию по согласованному с клиентом составу.",
        inputSchema: z.object({ items: z.array(itemSchema), comment: z.string().nullable() }),
        execute: async ({ items, comment }) => {
          const cards = resolve(items);
          if (!cards.length) return { ok: false, reason: "Не найдены позиции каталога" };
          const total = cards.reduce((sum, item) => sum + item.price, 0);
          await options.onOrder(cards, total, comment ?? "");
          effects.products = cards;
          effects.total = total;
          effects.orderCreated = { items: cards, total };
          return { ok: true, total };
        },
      }),
      request_operator: tool({
        description: "Подключить живого сотрудника студии к диалогу.",
        inputSchema: z.object({ reason: z.string() }),
        execute: async ({ reason }) => {
          await options.onOperator(reason);
          effects.operatorRequested = reason;
          return { ok: true };
        },
      }),
    },
  });

  const text = await result.text;
  return { text: text.trim(), effects };
}
