"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { api, CREATE_SESSION_MAX_AGE_MS } from "@/lib/api";
import { robot } from "@/lib/robot";
import { requiresAuth } from "@/lib/authGuard";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const hasFreshSession = useCallback(
    () =>
      Boolean(user?.authenticatedAt) &&
      Date.now() - user.authenticatedAt < CREATE_SESSION_MAX_AGE_MS,
    [user],
  );
  const refresh = useCallback(async () => {
    try {
      const { user: current } = await api.me();
      setUser(current);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  useEffect(() => {
    if (!loading && requiresAuth(pathname) && (!user || !hasFreshSession())) {
      router.replace("/plugins");
    }
  }, [hasFreshSession, loading, pathname, router, user]);
  const goToConsoleIfAdmin = (signedInUser) => {
    if (signedInUser.role === "admin" && pathname !== "/console")
      router.push("/console");
  };
  const login = async (credentials) => {
    const { user: signedIn } = await api.login(credentials);
    setUser(signedIn);
    robot.say("Hey! Welcome.");
    robot.mood("happy");
    goToConsoleIfAdmin(signedIn);
    return signedIn;
  };
  const signup = async (credentials) => {
    const { user: created } = await api.signup(credentials);
    setUser(created);
    robot.say("Hey! Welcome.");
    robot.mood("happy");
    goToConsoleIfAdmin(created);
    return created;
  };
  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      router.replace("/plugins");
    }
  };
  const deleteAccount = async () => {
    await api.deleteAccount();
    setUser(null);
    router.push("/");
  };
  const isProtectedRoute = requiresAuth(pathname);
  const shouldBlockRoute =
    isProtectedRoute && (loading || !user || !hasFreshSession());
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        deleteAccount,
        refresh,
        isAdmin: user?.role === "admin",
        hasFreshSession,
      }}
    >

      {shouldBlockRoute ? (
        <div className="flex min-h-dvh items-center justify-center bg-bg">
          <div className="h-8 w-8 animate-pulse rounded-full bg-azure-500/30" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
