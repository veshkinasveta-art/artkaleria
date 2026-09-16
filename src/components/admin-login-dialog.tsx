import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LockKeyhole } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function AdminLoginDialog({ className }: { className?: string }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (authError) {
      setError("Не удалось войти. Проверьте почту и пароль.");
      return;
    }
    setOpen(false);
    await navigate({ to: "/admin" });
  }

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger className={className}>Вход в админку</DialogTrigger>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <LockKeyhole className="mb-2 size-6 text-muted-foreground" aria-hidden="true" />
        <DialogTitle className="font-display text-3xl font-medium">Вход в админку</DialogTitle>
        <DialogDescription>Заявки и товары доступны только владельцу студии. Введите почту и пароль администратора.</DialogDescription>
      </DialogHeader>
      <form className="grid gap-5" onSubmit={signIn}>
        <label className="grid gap-2 text-sm">Почта<Input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label className="grid gap-2 text-sm">Пароль<Input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <Button size="lg" disabled={busy}>{busy ? "Входим…" : "Войти"}</Button>
        <p className="text-xs text-muted-foreground">После входа открывается раздел «Заявки и товары» по адресу /admin.</p>
      </form>
    </DialogContent>
  </Dialog>;
}
