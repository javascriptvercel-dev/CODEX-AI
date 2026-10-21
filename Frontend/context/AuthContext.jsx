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
const LOGOUT_RETURN_PATH_KEY = "codex-logout-return-path";

function getSafeReturnPath(value) {
  if (
    typeof value === "string" &&
    /^\/[a-zA-Z0-9\-._~!$&'()*+,;=:@%/?]*$/.test(value) &&
    !value.startsWith("//")
  ) {
    return value;
  }
  return "/";
}

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
  const goToConsoleIfAdmin = (signedInUser, nextPath) => {
    if (
      signedInUser?.role === "admin" &&
      !nextPath &&
      pathname !== "/console"
    ) {
      router.replace("/console");
    }
  };
  const setLogoutReturnPath = (path) => {
    window.sessionStorage.setItem(
      LOGOUT_RETURN_PATH_KEY,
      getSafeReturnPath(path),
    );
  };
  const login = async (credentials) => {
    const { nextPath, returnPath, ...loginCredentials } = credentials;
    const { user: signedIn } = await api.login(loginCredentials);
    setLogoutReturnPath(returnPath);
    setUser(signedIn);
    robot.say("Hey! Welcome.");
    robot.mood("happy");
    goToConsoleIfAdmin(signedIn, nextPath);
    return signedIn;
  };
  const signup = async (credentials) => {
    const { nextPath, returnPath, ...signupCredentials } = credentials;
    const { user: created } = await api.signup(signupCredentials);
    setLogoutReturnPath(returnPath);
    setUser(created);
    robot.say("Hey! Welcome.");
    robot.mood("happy");
    goToConsoleIfAdmin(created, nextPath);
    return created;
  };
  const logout = async () => {
    const returnPath = getSafeReturnPath(
      window.sessionStorage.getItem(LOGOUT_RETURN_PATH_KEY),
    );
    window.sessionStorage.removeItem(LOGOUT_RETURN_PATH_KEY);
    try {
      await api.logout();
    } finally {
      setUser(null);
      router.replace(returnPath);
    }
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
        setLogoutReturnPath,
        logout,
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
