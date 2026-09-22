import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice } from "@/lib/store-data";

type Session = Tables<"chat_sessions">;
type Message = Tables<"chat_messages">;

const statusLabels: Record<Session["status"], string> = {
  bot: "Ведёт помощник",
  needs_operator: "Ждёт оператора",
  operator: "Отвечает оператор",
  closed: "Закрыт",
};

const roleLabels: Record<Message["role"], string> = {
  visitor: "Клиент",
  assistant: "Помощник",
  operator: "Оператор",
  system: "Система",
};

export function ChatsPanel({ notify }: { notify: (text: string) => void }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState("all");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const loadSessions = useCallback(async () => {
    const { data } = await supabase.from("chat_sessions").select("*").order("last_message_at", { ascending: false });
    setSessions(data ?? []);
    setActiveId((current) => current ?? data?.[0]?.id ?? null);
  }, []);

  const loadMessages = useCallback(async (sessionId: string) => {
    const { data } = await supabase.from("chat_messages").select("*").eq("session_id", sessionId).order("created_at");
    setMessages(data ?? []);
  }, []);

  useEffect(() => { void loadSessions(); }, [loadSessions]);

  useEffect(() => {
    if (!activeId) return;
    void loadMessages(activeId);
    const timer = setInterval(() => { void loadMessages(activeId); void loadSessions(); }, 7000);
    return () => clearInterval(timer);
  }, [activeId, loadMessages, loadSessions]);

  const visible = useMemo(
    () => (filter === "all" ? sessions : sessions.filter((session) => session.status === filter)),
    [filter, sessions],
  );
  const active = sessions.find((session) => session.id === activeId) ?? null;

  const setStatus = async (status: Session["status"]) => {
    if (!active) return;
    const { error } = await supabase.from("chat_sessions").update({ status }).eq("id", active.id);
    if (error) { notify("Не удалось изменить статус чата"); return; }
    setSessions((current) => current.map((session) => (session.id === active.id ? { ...session, status } : session)));
    notify(`Статус чата: ${statusLabels[status]}`);
  };

  const sendReply = async () => {
    if (!active || !reply.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("chat_messages").insert({ session_id: active.id, role: "operator", content: reply.trim() });
    if (error) { notify("Сообщение не отправлено"); setBusy(false); return; }
    await supabase.from("chat_sessions").update({ status: "operator", last_message_at: new Date().toISOString(), unread_for_admin: false }).eq("id", active.id);
    setReply("");
    await loadMessages(active.id);
    await loadSessions();
    setBusy(false);
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <div className="space-y-3">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все чаты</SelectItem>
            <SelectItem value="needs_operator">Ждут оператора</SelectItem>
            <SelectItem value="operator">С оператором</SelectItem>
            <SelectItem value="bot">С помощником</SelectItem>
            <SelectItem value="closed">Закрытые</SelectItem>
          </SelectContent>
        </Select>
        <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
          {visible.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => setActiveId(session.id)}
              className={`w-full rounded-lg border p-3 text-left transition ${session.id === activeId ? "border-primary bg-accent/40" : "border-border hover:bg-accent/20"}`}
            >
              <p className="text-sm font-medium">{session.customer_name}</p>
              <p className="text-xs text-muted-foreground">{session.phone}</p>
              <p className="mt-1 text-xs">{statusLabels[session.status]} · {new Date(session.last_message_at).toLocaleString("ru-RU")}</p>
            </button>
          ))}
          {!visible.length && <p className="text-sm text-muted-foreground">Чатов пока нет.</p>}
        </div>
      </div>

      {active ? (
        <div className="flex flex-col rounded-lg border border-border">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
            <div>
              <p className="font-medium">{active.customer_name} · {active.phone}</p>
              <p className="text-xs text-muted-foreground">Начат {new Date(active.created_at).toLocaleString("ru-RU")}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => void setStatus("bot")}>Вернуть помощнику</Button>
              <Button variant="outline" size="sm" onClick={() => void setStatus("closed")}>Закрыть</Button>
            </div>
          </header>
          <div className="max-h-[420px] flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message) => {
              const payload = (message.payload ?? {}) as { products?: { name: string; size: string; price: number }[]; total?: number };
              return (
                <div key={message.id} className={message.role === "visitor" ? "" : "pl-6"}>
                  <p className="text-xs text-muted-foreground">{roleLabels[message.role]} · {new Date(message.created_at).toLocaleTimeString("ru-RU")}</p>
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                  {payload.products?.length ? (
                    <ul className="mt-1 text-xs text-muted-foreground">
                      {payload.products.map((product, index) => (
                        <li key={index}>{product.name} · {product.size} · {formatPrice(product.price)}</li>
                      ))}
                      {typeof payload.total === "number" ? <li className="font-medium text-foreground">Итого: {formatPrice(payload.total)}</li> : null}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div className="space-y-2 border-t border-border p-4">
            <Textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Ответ клиенту от студии…" rows={3} />
            <Button onClick={() => void sendReply()} disabled={busy || !reply.trim()}>Отправить клиенту</Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Выберите чат слева.</p>
      )}
    </section>
  );
}
