"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import AuthModal from "@/components/auth/AuthModal";

function getSafeNextPath(value, fallback = "/") {
  if (typeof value !== "string") return fallback;
  if (!/^\/[a-zA-Z0-9\-_/?=&]*$/.test(value) || value.startsWith("//")) return fallback;
  return value;
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeNextPath(searchParams.get("next"), "/dashboard");
  const cancelPath = getSafeNextPath(searchParams.get("cancel"));

  return (
    <div className="min-h-dvh bg-bg">
      <AuthModal
        message={
          searchParams.get("auth") === "google_error"
            ? "Google sign-in couldn’t be completed. Please try again."
            : "Sign in to continue."
        }
        nextPath={nextPath}
        returnPath={cancelPath}
        onClose={() => router.replace(cancelPath)}
        onSuccess={({ isNewAccount }) => {
          if (
            nextPath === "/create" ||
            nextPath === "/tools" ||
            nextPath.startsWith("/tools/")
          ) {
            window.sessionStorage.setItem(
              "codex-account-welcome",
              isNewAccount ? "created" : "back",
            );
          }
          router.replace(nextPath);
        }}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-bg" />}>
      <LoginPageInner />
    </Suspense>
  );
}
