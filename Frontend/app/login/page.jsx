"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import AuthModal from "@/components/auth/AuthModal";

function getSafeNextPath(value) {
  if (typeof value !== "string") return "/";
  if (!/^\/[a-zA-Z0-9\-_/?=&]*$/.test(value) || value.startsWith("//")) return "/";
  return value;
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeNextPath(searchParams.get("next"));

  return (
    <div className="min-h-dvh bg-bg">
      <AuthModal
        message="Sign in to continue."
        nextPath={nextPath}
        onClose={() => router.replace(nextPath)}
        onSuccess={() => router.replace(nextPath)}
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
