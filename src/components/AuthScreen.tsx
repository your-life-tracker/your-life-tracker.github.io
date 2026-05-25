import { useState } from "react";
import type { FormEvent } from "react";
import { Mail } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

export function AuthScreen() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent">("idle");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    setIsSubmitting(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    setStatus("sent");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-stone-50 p-5 text-stone-950">
      <form
        className="w-full max-w-sm rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
        onSubmit={handleSubmit}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
          <Mail size={22} aria-hidden />
        </div>
        <h1 className="mt-5 text-2xl font-semibold">Life Tracker</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          이메일로 로그인 링크를 받아 시작하세요.
        </p>
        <label className="mt-6 block text-sm font-medium text-stone-700">
          이메일
          <Input
            className="mt-2"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {status === "sent" ? (
          <p className="mt-3 text-sm text-emerald-700">
            로그인 링크를 보냈습니다. 메일함을 확인하세요.
          </p>
        ) : null}
        <Button className="mt-6 w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "보내는 중..." : "로그인 링크 받기"}
        </Button>
      </form>
    </main>
  );
}
