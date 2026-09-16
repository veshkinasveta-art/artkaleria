import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LockKeyhole } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Вход для владельца — Калерия" },
    { name: "description", content: "Закрытый вход в управление арт-студией Калерия." },
    { property: "og:title", content: "Вход для владельца — Калерия" },
    { property: "og:description", content: "Закрытый вход в управление арт-студией Калерия." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError("Не удалось войти. Проверьте почту и пароль.");
      setBusy(false);
      return;
    }
    await navigate({ to: "/admin" });
  }

  return <main className="min-h-[72vh] px-5 py-20">
    <div className="mx-auto max-w-md border border-border bg-card p-8 sm:p-12">
      <LockKeyhole className="mb-8 size-7 text-muted-foreground" aria-hidden="true" />
      <p className="eyebrow">Закрытый раздел</p>
      <h1 className="mt-4 font-display text-5xl font-medium leading-none">Вход владельца</h1>
      <p className="mt-5 text-sm leading-6 text-muted-foreground">Заявки и товары доступны только владельцу студии.</p>
      <form className="mt-8 grid gap-5" onSubmit={signIn}>
        <label className="grid gap-2 text-sm">Почта<Input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label className="grid gap-2 text-sm">Пароль<Input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <Button size="lg" disabled={busy}>{busy ? "Входим…" : "Войти"}</Button>
      </form>
    </div>
  </main>;
}