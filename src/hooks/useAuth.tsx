import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getCompletedTasks, getUser, type User as DbUser } from "@/lib/supabase";

interface AuthContextValue {
  session: Session | null;
  user: DbUser | null;
  loading: boolean;
  completedTasks: string[];
  setCompletedTasks: (tasks: string[]) => void;
  refreshUser: () => Promise<void>;
  signInWithTwitter: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]               = useState<Session | null>(null);
  const [user, setUser]                     = useState<DbUser | null>(null);
  const [loading, setLoading]               = useState(true);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  // Load DB user + completed tasks whenever auth session changes
  const loadUser = async (authUser: User | null) => {
    if (!authUser) {
      setUser(null);
      setCompletedTasks([]);
      return;
    }
    const [dbUser, tasks] = await Promise.all([
      getUser(authUser.id),
      getCompletedTasks(authUser.id),
    ]);
    setUser(dbUser);
    setCompletedTasks(tasks);
  };

  const refreshUser = async () => {
    if (session?.user) await loadUser(session.user);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      loadUser(data.session?.user ?? null).finally(() => setLoading(false));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        await loadUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithTwitter = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "x",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) console.error("Twitter sign-in error:", error.message);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      session, user, loading,
      completedTasks, setCompletedTasks,
      refreshUser, signInWithTwitter, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
