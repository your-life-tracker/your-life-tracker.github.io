import { useEffect, useState } from "react";
import { AuthScreen } from "./components/AuthScreen";
import { HomeScreen } from "./components/HomeScreen";
import { useSession } from "./hooks/useSession";
import {
  GUEST_MODE_STORAGE_KEY,
  GUEST_USER_ID,
  type HomeUser,
} from "./lib/authMode";
import { isSupabaseConfigured } from "./lib/supabase";

export default function App() {
  const { session, isLoading } = useSession();
  const [isGuestMode, setIsGuestMode] = useState(() => {
    return window.localStorage.getItem(GUEST_MODE_STORAGE_KEY) === "true";
  });

  useEffect(() => {
    if (session && isGuestMode) {
      window.localStorage.removeItem(GUEST_MODE_STORAGE_KEY);
      setIsGuestMode(false);
    }
  }, [isGuestMode, session]);

  function enterGuestMode() {
    window.localStorage.setItem(GUEST_MODE_STORAGE_KEY, "true");
    setIsGuestMode(true);
  }

  function leaveGuestMode() {
    window.localStorage.removeItem(GUEST_MODE_STORAGE_KEY);
    setIsGuestMode(false);
  }

  if (!isSupabaseConfigured && !isGuestMode) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-stone-50 p-6 text-stone-950">
        <section className="w-full max-w-sm rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h1 className="text-xl font-semibold">Supabase 설정 필요</h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            `.env`에 `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`를 입력한 뒤
            개발 서버를 다시 시작하세요.
          </p>
          <button
            className="mt-4 h-10 rounded-md border border-stone-200 px-3 text-sm font-medium"
            type="button"
            onClick={enterGuestMode}
          >
            게스트 모드로 시작
          </button>
        </section>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-stone-50 text-sm text-stone-500">
        세션을 확인하는 중...
      </main>
    );
  }

  if (isGuestMode) {
    const guestUser: HomeUser = {
      id: GUEST_USER_ID,
      email: "게스트 모드",
      isGuest: true,
    };

    return <HomeScreen user={guestUser} onSignOut={leaveGuestMode} />;
  }

  if (session) {
    return (
      <HomeScreen
        user={{
          id: session.user.id,
          email: session.user.email ?? "로그인 사용자",
          isGuest: false,
        }}
        onSignOut={() => undefined}
      />
    );
  }

  return <AuthScreen onGuestMode={enterGuestMode} />;
}
