import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase, upsertUser, getCompletedTasks, getUser, type User } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

type AuthCtx = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  completedTasks: string[];
  refreshUser: () => Promise<void>;
  setCompletedTasks: (tasks: string[]) => void;
};

const AuthContext = createContext<AuthCtx>({
  session: null,
  user: null,
  loading: true,
  completedTasks: [],
  refreshUser: async () => {},
  setCompletedTasks: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  const refreshUser = async () => {
    if (!session?.user) return;
    const fresh = await getUser(session.user.id);
    setUser(fresh);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const dbUser = await upsertUser(session.user as any);
        setUser(dbUser);
        const tasks = await getCompletedTasks(session.user.id);
        setCompletedTasks(tasks);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        const dbUser = await upsertUser(session.user as any);
        setUser(dbUser);
        const tasks = await getCompletedTasks(session.user.id);
        setCompletedTasks(tasks);
      } else {
        setUser(null);
        setCompletedTasks([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, loading, completedTasks, refreshUser, setCompletedTasks }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
