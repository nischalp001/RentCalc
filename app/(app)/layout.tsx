"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserProvider } from "@/lib/user-context";
import { AppShell } from "@/components/app-shell";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();

    const verify = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      if (data.session?.user) {
        setAuthenticated(true);
        setSessionReady(true);
        return;
      }

      setAuthenticated(false);
      setSessionReady(true);
      router.replace("/login");
    };

    void verify();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;

      if (session?.user) {
        setAuthenticated(true);
        setSessionReady(true);
      } else {
        setAuthenticated(false);
        setSessionReady(true);
        router.replace("/login");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (!sessionReady || !authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-sm text-muted-foreground">
        Checking account...
      </div>
    );
  }

  return (
    <UserProvider>
      <AppShell>{children}</AppShell>
    </UserProvider>
  );
}
