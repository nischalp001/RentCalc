"use client";

import { useState, useEffect } from "react";
import {
  KeyRound,
  Send,
  Search,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchAllProfiles,
  sendPasswordResetEmail,
  type AdminProfile,
} from "@/lib/admin-data";

export default function AdminPasswordResetPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [users, setUsers] = useState<AdminProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [recentResets, setRecentResets] = useState<{ email: string; time: string }[]>([]);

  useEffect(() => {
    fetchAllProfiles()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleSendReset = async (targetEmail?: string) => {
    const addr = targetEmail ?? email.trim();
    if (!addr) {
      setToast({ type: "error", message: "Please enter an email address." });
      return;
    }
    setSending(true);
    try {
      await sendPasswordResetEmail(addr);
      setToast({
        type: "success",
        message: `Password reset email sent to ${addr}.`,
      });
      setRecentResets((prev) => [
        { email: addr, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 9),
      ]);
      if (!targetEmail) setEmail("");
    } catch (err: any) {
      setToast({
        type: "error",
        message: err.message ?? "Failed to send reset email.",
      });
    } finally {
      setSending(false);
    }
  };

  const filteredUsers = search
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Password Reset</h2>
        <p className="text-muted-foreground">
          Send password reset emails to users.
        </p>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            toast.type === "success"
              ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      {/* Quick reset by email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Quick Reset
          </CardTitle>
          <CardDescription>
            Enter any user&apos;s email address to send a password reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="reset-email">Email Address</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendReset();
                }}
              />
            </div>
            <Button onClick={() => handleSendReset()} disabled={sending}>
              <Send className="mr-2 h-4 w-4" />
              {sending ? "Sending..." : "Send Reset Email"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent resets */}
      {recentResets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Resets</CardTitle>
            <CardDescription>
              Password reset emails sent during this session.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentResets.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"
                >
                  <span>{r.email}</span>
                  <Badge variant="outline" className="text-xs">
                    {r.time}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User list for quick selection */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Select User</CardTitle>
              <CardDescription>
                Click &quot;Reset&quot; to send a password reset email.
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">
              No users found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-28" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendReset(user.email)}
                          disabled={sending}
                        >
                          <KeyRound className="mr-1.5 h-3 w-3" />
                          Reset
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
