import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, X, Headset } from "lucide-react";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { getChatState, sendChatMessage, startChatSession } from "@/lib/chat.functions";
import type { ChatMessageView, ChatState } from "@/lib/chat-types";
import { productImages } from "@/lib/store-data";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

const TOKEN_KEY = "kaleria-chat-token";

function ensureToken() {
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = `v_${crypto.randomUUID().replaceAll("-", "")}`;
    localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

const money = (value: number) => `${value.toLocaleString("ru-RU")} ₽`;

function MessageCards({ message }: { message: ChatMessageView }) {
  if (!message.products.length) return null;
  return (
    <div className="mt-3 space-y-2">
      {message.products.map((product, index) => (
        <div key={`${product.slug}-${index}`} className="flex items-center gap-3 rounded-lg border border-border/70 bg-background/70 p-2">
          <img
            src={product.imageUrl || productImages[product.imageKey] || productImages["florarium"]}
            alt={product.name}
            className="h-12 w-12 rounded-md object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{product.name}</p>
            <p className="text-xs text-muted-foreground">{product.size} · {money(product.price)}</p>
          </div>
        </div>
      ))}
      {message.total !== null && (
        <p className="text-sm font-medium">Итого ориентировочно: {money(message.total)}</p>
      )}
    </div>
  );
}

export function ChatWidget() {
  const { addItem } = useCart();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ChatState | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (!saved) return;
    setToken(saved);
    void getChatState({ data: { token: saved } }).then((result) => {
      if (result) setState(result);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!open || !token || !state) return;
    const timer = setInterval(() => {
      void getChatState({ data: { token } })
        .then((result) => { if (result) setState(result); })
        .catch(() => undefined);
    }, 5000);
    return () => clearInterval(timer);
  }, [open, token, state]);

  useEffect(() => {
    if (open && state) textareaRef.current?.focus();
  }, [open, state]);

  const register = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!consent) { setError("Нужно согласие с политикой конфиденциальности."); return; }
    setBusy(true);
    setError(null);
    try {
      const newToken = ensureToken();
      const result = await startChatSession({ data: { token: newToken, name: name.trim(), phone: phone.trim(), consent: true } });
      setToken(newToken);
      setState(result);
    } catch {
      setError("Не удалось начать чат. Проверьте имя и телефон.");
    } finally {
      setBusy(false);
    }
  }, [consent, name, phone]);

  const send = useCallback(async (text: string) => {
    if (!token || !text.trim()) return;
    setBusy(true);
    const optimistic: ChatMessageView = {
      id: `local-${Date.now()}`, role: "visitor", content: text.trim(), products: [], total: null, createdAt: new Date().toISOString(),
    };
    setState((current) => (current ? { ...current, messages: [...current.messages, optimistic] } : current));
    try {
      const result = await sendChatMessage({ data: { token, text: text.trim() } });
      setState(result.state);
      if (result.cartItems.length) {
        for (const item of result.cartItems) {
          addItem({ slug: item.slug, name: item.name, price: item.price, imageKey: item.imageKey, imageUrl: item.imageUrl || null, size: item.size });
        }
        toast.success("Заявка отправлена, позиции добавлены в корзину");
      }
    } catch {
      toast.error("Сообщение не отправлено, попробуйте ещё раз");
    } finally {
      setBusy(false);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [addItem, token]);

  const waitingOperator = state?.status === "needs_operator";

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Закрыть чат" : "Открыть чат с помощником"}
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full shadow-lg"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </Button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[560px] max-h-[75vh] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="border-b border-border px-4 py-3">
            <p className="font-serif text-lg leading-tight">Помощник студии</p>
            <p className="text-xs text-muted-foreground">
              {waitingOperator ? "Подключаем специалиста…" : state?.status === "operator" ? "С вами специалист студии" : "Подберём композицию и посчитаем стоимость"}
            </p>
          </div>

          {!state ? (
            <form onSubmit={register} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
              <p className="text-sm text-muted-foreground">Оставьте контакты — и начнём подбор композиции.</p>
              <div className="space-y-1.5">
                <Label htmlFor="chat-name">Имя</Label>
                <Input id="chat-name" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="chat-phone">Телефон</Label>
                <Input id="chat-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required minLength={7} />
              </div>
              <div className="flex items-start gap-2">
                <Checkbox id="chat-consent" checked={consent} onCheckedChange={(value) => setConsent(value === true)} />
                <Label htmlFor="chat-consent" className="text-xs font-normal leading-snug text-muted-foreground">
                  Согласен с <a href="/privacy" className="underline">политикой конфиденциальности</a> и обработкой персональных данных.
                </Label>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={busy}>Начать чат</Button>
            </form>
          ) : (
            <>
              <Conversation className="flex-1">
                <ConversationContent className="gap-3 p-4">
                  {state.messages.map((message) => (
                    message.role === "system" ? (
                      <p key={message.id} className="text-center text-xs text-muted-foreground">{message.content}</p>
                    ) : (
                      <Message key={message.id} from={message.role === "visitor" ? "user" : "assistant"}>
                        <MessageContent>
                          {message.role === "operator" && (
                            <p className="mb-1 flex items-center gap-1 text-xs text-muted-foreground"><Headset className="size-3" /> Специалист студии</p>
                          )}
                          <MessageResponse>{message.content}</MessageResponse>
                          <MessageCards message={message} />
                        </MessageContent>
                      </Message>
                    )
                  ))}
                  {busy && <Shimmer>Думаю…</Shimmer>}
                </ConversationContent>
                <ConversationScrollButton />
              </Conversation>

              <PromptInput
                className="m-3"
                onSubmit={(message) => {
                  void send(message.text);
                }}
              >
                <PromptInputTextarea ref={textareaRef} name="message" placeholder="Напишите сообщение…" />
                <PromptInputFooter className="justify-end">
                  <PromptInputSubmit status={busy ? "submitted" : "ready"} disabled={busy} />
                </PromptInputFooter>
              </PromptInput>
            </>
          )}
        </div>
      )}
    </>
  );
}
