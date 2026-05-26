import { useState } from "react";
import type { FormEvent } from "react";
import { Mail } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

type AuthScreenProps = {
  onGuestMode: () => void;
};

export function AuthScreen({ onGuestMode }: AuthScreenProps) {
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
    <main className="flex min-h-svh items-center justify-center bg-stone-50 p-5 text-stone-950">
      <form
        className="w-full max-w-sm rounded-lg border border-stone-200 bg-white p-6 shadow-sm shadow-stone-950/[0.03]"
        onSubmit={handleSubmit}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
          <Mail size={22} aria-hidden />
        </div>
        <h1 className="mt-5 text-[26px] font-bold leading-tight">
          Life Tracker
        </h1>
        <p className="mt-2 text-[15px] leading-6 text-stone-600">
          이메일로 로그인 링크를 받아 시작하세요.
        </p>
        <label className="mt-7 block text-[14px] font-semibold text-stone-700">
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
        {error ? <p className="mt-3 text-sm leading-6 text-red-600">{error}</p> : null}
        {status === "sent" ? (
          <p className="mt-3 text-sm leading-6 text-emerald-700">
            로그인 링크를 보냈습니다. 메일함을 확인하세요.
          </p>
        ) : null}
        <Button className="mt-7 w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "보내는 중..." : "로그인 링크 받기"}
        </Button>
        <div className="my-[22px] flex items-center gap-3">
          <div className="h-px flex-1 bg-stone-200" />
          <span className="text-xs font-medium text-stone-400">또는</span>
          <div className="h-px flex-1 bg-stone-200" />
        </div>
        <Button
          className="w-full"
          type="button"
          variant="secondary"
          onClick={onGuestMode}
        >
          게스트 모드로 시작하기
        </Button>
      </form>
    </main>
  );
}
