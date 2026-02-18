"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ensureProfileForAuthUser } from "@/lib/profile-auth";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

type AuthMode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();

    supabase.auth.getSession()
      .then(({ data }) => {
        if (!active) return;
        if (data.session?.user) {
          router.replace("/dashboard");
          return;
        }
        setCheckingSession(false);
      })
      .catch(() => {
        if (!active) return;
        setCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    const supabase = getSupabaseBrowserClient();

    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) {
        throw new Error("Email is required.");
      }
      if (!password.trim()) {
        throw new Error("Password is required.");
      }
      if (mode === "signup" && !name.trim()) {
        throw new Error("Name is required for sign up.");
      }

      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              name: name.trim(),
            },
          },
        });

        if (signUpError) {
          throw new Error(signUpError.message || "Sign up failed");
        }

        if (!data.user) {
          throw new Error("Unable to create account.");
        }

        if (data.session?.user) {
          await ensureProfileForAuthUser(data.session.user);
          router.replace("/dashboard");
          return;
        }

        setMode("signin");
        setMessage("Account created. Check your email for verification, then sign in.");
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (signInError || !data.user) {
          throw new Error(signInError?.message || "Invalid email or password");
        }

        await ensureProfileForAuthUser(data.user);
        router.replace("/dashboard");
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-sm text-muted-foreground">
        Checking session...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-background to-muted/40 p-4">
      <Card className="w-full max-w-md border-border/70 shadow-xl">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold">RentFlow</span>
          </div>
          <CardTitle>{mode === "signin" ? "Login" : "Create Account"}</CardTitle>
          <CardDescription>
            {mode === "signin"
              ? "Access your landlord and tenant workspace."
              : "One profile can act as both landlord and tenant."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 rounded-md bg-muted p-1">
            <Button
              type="button"
              variant={mode === "signin" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setMode("signin");
                setError(null);
                setMessage(null);
              }}
            >
              Login
            </Button>
            <Button
              type="button"
              variant={mode === "signup" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setMode("signup");
                setError(null);
                setMessage(null);
              }}
            >
              Sign up
            </Button>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {message && <p className="text-sm text-muted-foreground">{message}</p>}

            <Button className="w-full" type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Login" : "Create Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
