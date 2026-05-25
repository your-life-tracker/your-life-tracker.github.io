import { AuthScreen } from "./components/AuthScreen";
import { HomeScreen } from "./components/HomeScreen";
import { useSession } from "./hooks/useSession";
import { isSupabaseConfigured } from "./lib/supabase";

export default function App() {
  const { session, isLoading } = useSession();

  if (!isSupabaseConfigured) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-stone-50 p-6 text-stone-950">
        <section className="w-full max-w-sm rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h1 className="text-xl font-semibold">Supabase 설정 필요</h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            `.env`에 `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`를 입력한 뒤
            개발 서버를 다시 시작하세요.
          </p>
        </section>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-stone-50 text-sm text-stone-500">
        세션을 확인하는 중...
      </main>
    );
  }

  return session ? <HomeScreen session={session} /> : <AuthScreen />;
}
