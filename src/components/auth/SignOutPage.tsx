"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { authApi } from "@/lib/api";

export function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    void authApi.logout().finally(() => {
      router.replace("/dashboard");
    });
  }, [router]);

  return (
    <PlaceholderPage
      eyebrow="Account"
      title="Sign out"
      description="Signing you out…"
    />
  );
}
