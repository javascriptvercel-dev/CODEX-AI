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
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
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
    await api.logout();
    setUser(null);
    router.push("/plugins");
  };
  const deleteAccount = async () => {
    await api.deleteAccount();
    setUser(null);
    router.push("/");
  };
  const hasFreshSession = () =>
    Boolean(user?.authenticatedAt) &&
    Date.now() - user.authenticatedAt < CREATE_SESSION_MAX_AGE_MS;
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
      
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
