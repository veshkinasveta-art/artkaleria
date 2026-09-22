import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ChatMessageView, ChatProductCard, ChatState } from "@/lib/chat-types";

const tokenSchema = z.string().trim().min(10).max(80);

const startSchema = z.object({
  token: tokenSchema,
  name: z.string().trim().min(2, "Укажите имя").max(100),
  phone: z.string().trim().min(7, "Укажите телефон").max(30),
  consent: z.literal(true),
});

type Row = {
  id: string;
  role: ChatMessageView["role"];
  content: string;
  payload: unknown;
  created_at: string;
};

function toView(rows: Row[]): ChatMessageView[] {
  return rows.map((row) => {
    const payload = (row.payload ?? {}) as { products?: ChatProductCard[]; total?: number | null };
    return {
      id: row.id,
      role: row.role,
      content: row.content,
      products: Array.isArray(payload.products) ? payload.products : [],
      total: typeof payload.total === "number" ? payload.total : null,
      createdAt: row.created_at,
    };
  });
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const startChatSession = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => startSchema.parse(input))
  .handler(async ({ data }): Promise<ChatState> => {
    const supabase = await admin();
    const existing = await supabase.from("chat_sessions").select("id, status, customer_name").eq("visitor_token", data.token).maybeSingle();
    let sessionId = existing.data?.id;
    if (!sessionId) {
      const created = await supabase
        .from("chat_sessions")
        .insert({ visitor_token: data.token, customer_name: data.name, phone: data.phone, consent: true })
        .select("id")
        .single();
      if (created.error) throw new Error("Не удалось начать чат");
      sessionId = created.data.id;
      await supabase.from("chat_messages").insert({
        session_id: sessionId,
        role: "assistant",
        content: `Здравствуйте, ${data.name}! Я помощник студии «Калерия». Расскажите, для какого пространства или повода подбираем композицию — предложу подходящие варианты и посчитаю стоимость.`,
      });
    } else {
      await supabase.from("chat_sessions").update({ customer_name: data.name, phone: data.phone }).eq("id", sessionId);
    }
    const messages = await supabase.from("chat_messages").select("id, role, content, payload, created_at").eq("session_id", sessionId).order("created_at");
    const session = await supabase.from("chat_sessions").select("status, customer_name").eq("id", sessionId).single();
    return {
      status: session.data?.status ?? "bot",
      customerName: session.data?.customer_name ?? data.name,
      messages: toView((messages.data ?? []) as Row[]),
    };
  });

export const getChatState = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ token: tokenSchema }).parse(input))
  .handler(async ({ data }): Promise<ChatState | null> => {
    const supabase = await admin();
    const session = await supabase.from("chat_sessions").select("id, status, customer_name").eq("visitor_token", data.token).maybeSingle();
    if (!session.data) return null;
    const messages = await supabase.from("chat_messages").select("id, role, content, payload, created_at").eq("session_id", session.data.id).order("created_at");
    return {
      status: session.data.status,
      customerName: session.data.customer_name,
      messages: toView((messages.data ?? []) as Row[]),
    };
  });

export const sendChatMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ token: tokenSchema, text: z.string().trim().min(1).max(2000) }).parse(input))
  .handler(async ({ data }): Promise<{ state: ChatState; cartItems: ChatProductCard[] }> => {
    const supabase = await admin();
    const session = await supabase
      .from("chat_sessions")
      .select("id, status, customer_name, phone")
      .eq("visitor_token", data.token)
      .maybeSingle();
    if (!session.data) throw new Error("Чат не найден");
    const sessionRow = session.data;
    const sessionId = sessionRow.id;

    await supabase.from("chat_messages").insert({ session_id: sessionId, role: "visitor", content: data.text });
    await supabase.from("chat_sessions").update({ last_message_at: new Date().toISOString(), unread_for_admin: true }).eq("id", sessionId);

    let cartItems: ChatProductCard[] = [];
    const botActive = session.data.status === "bot";

    if (botActive) {
      const apiKey = process.env["LOVABLE_API_KEY"];
      if (!apiKey) throw new Error("Помощник временно недоступен");

      const [{ data: history }, { data: products }] = await Promise.all([
        supabase.from("chat_messages").select("role, content").eq("session_id", sessionId).order("created_at").limit(40),
        supabase
          .from("products")
          .select("slug, name, category, description, details, care, price, sizes, image_key, image_urls")
          .eq("published", true)
          .order("sort_order"),
      ]);

      const { runAssistant } = await import("@/lib/chat-ai.server");
      const result = await runAssistant({
        apiKey,
        catalog: products ?? [],
        customerName: session.data.customer_name,
        history: (history ?? [])
          .filter((row) => row.role !== "system")
          .map((row) => ({ role: row.role === "visitor" ? ("user" as const) : ("assistant" as const), content: row.content }))
          .filter((row) => row.content.length > 0),
        onOrder: async (items, total, comment) => {
          await supabase.from("leads").insert({
            kind: "order",
            customer_name: sessionRow.customer_name,
            phone: sessionRow.phone,
            message: comment || "Заявка оформлена через чат-помощника.",
            total,
            details: {
              source: "Чат-помощник",
              состав: items.map((item) => `${item.name} (${item.size}) — ${item.price} ₽`).join("; "),
            },
          });
        },
        onOperator: async () => {
          await supabase.from("chat_sessions").update({ status: "needs_operator" }).eq("id", sessionId);
        },
      });

      const payload: Record<string, unknown> = {};
      if (result.effects.products.length) payload["products"] = result.effects.products;
      if (result.effects.total !== null) payload["total"] = result.effects.total;
      await supabase.from("chat_messages").insert({
        session_id: sessionId,
        role: "assistant",
        content: result.text || "Записал. Уточните, пожалуйста, детали — подберу варианты.",
        payload: payload as never,
      });
      if (result.effects.orderCreated) cartItems = result.effects.orderCreated.items;
      if (result.effects.operatorRequested) {
        await supabase.from("chat_messages").insert({
          session_id: sessionId,
          role: "system",
          content: "Подключаем специалиста студии. Он ответит здесь же.",
        });
      }
    }

    const state = await supabase.from("chat_sessions").select("status, customer_name").eq("id", sessionId).single();
    const messages = await supabase.from("chat_messages").select("id, role, content, payload, created_at").eq("session_id", sessionId).order("created_at");
    return {
      state: {
        status: state.data?.status ?? "bot",
        customerName: state.data?.customer_name ?? "",
        messages: toView((messages.data ?? []) as Row[]),
      },
      cartItems,
    };
  });
