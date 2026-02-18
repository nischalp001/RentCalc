"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Building2,
  Bell,
  Globe,
  HelpCircle,
  FileText,
  Shield,
  ChevronRight,
  LogOut,
  Camera,
  Copy,
  Check,
  Users,
  Home,
} from "lucide-react";
import { useUser } from "@/lib/user-context";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const router = useRouter();
  const { user, connections } = useUser();
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notifications, setNotifications] = useState({
    paymentReminders: true,
    leaseAlerts: true,
    marketingEmails: false,
    pushNotifications: true,
  });

  const tenantsCount = connections.filter((c) => c.role === "tenant" && c.status === "active").length;
  const landlordsCount = connections.filter((c) => c.role === "landlord" && c.status === "active").length;

  const copyUserId = () => {
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground lg:text-2xl">
          Profile & Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account information and preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-semibold">
              Personal Details
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditProfileOpen(true)}
            >
              Edit Profile
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6 sm:flex-row">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-3xl font-semibold text-primary-foreground">
                    {user.name.charAt(0)}
                  </div>
                  <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-md hover:bg-accent">
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Full Name
                    </Label>
                    <p className="flex items-center gap-2 font-medium text-foreground">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {user.name}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Email Address
                    </Label>
                    <p className="flex items-center gap-2 font-medium text-foreground">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {user.email}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Phone Number
                    </Label>
                    <p className="flex items-center gap-2 font-medium text-foreground">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {user.phone || "+1 (555) 123-4567"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Member Since
                    </Label>
                    <p className="flex items-center gap-2 font-medium text-foreground">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      January 2025
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User ID Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Your User ID</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share this ID with landlords or tenants to connect with them.
            </p>
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
              <code className="flex-1 text-sm font-mono font-semibold text-foreground">
                {user.id}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={copyUserId}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-success/10 p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Users className="h-4 w-4 text-success" />
                  <span className="text-2xl font-bold text-success">
                    {tenantsCount}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Tenants</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Home className="h-4 w-4 text-primary" />
                  <span className="text-2xl font-bold text-primary">
                    {landlordsCount}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Landlords</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connections Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Users className="h-5 w-5" />
            Your Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {connections
              .filter((c) => c.status === "active")
              .slice(0, 4)
              .map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                      connection.role === "landlord"
                        ? "bg-primary/10 text-primary"
                        : "bg-success/10 text-success"
                    }`}
                  >
                    {connection.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {connection.name}
                    </p>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        connection.role === "landlord"
                          ? "bg-primary/10 text-primary"
                          : "bg-success/10 text-success"
                      }`}
                    >
                      {connection.role === "landlord" ? "Landlord" : "Tenant"}
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
          {connections.length > 4 && (
            <p className="mt-3 text-center text-sm text-muted-foreground">
              +{connections.length - 4} more connections
            </p>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <p className="font-medium text-foreground">Payment Reminders</p>
              <p className="text-sm text-muted-foreground">
                Get notified about upcoming and overdue payments
              </p>
            </div>
            <Switch
              checked={notifications.paymentReminders}
              onCheckedChange={(checked) =>
                setNotifications((prev) => ({
                  ...prev,
                  paymentReminders: checked,
                }))
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <p className="font-medium text-foreground">Lease Alerts</p>
              <p className="text-sm text-muted-foreground">
                Notifications about lease renewals and expirations
              </p>
            </div>
            <Switch
              checked={notifications.leaseAlerts}
              onCheckedChange={(checked) =>
                setNotifications((prev) => ({ ...prev, leaseAlerts: checked }))
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <p className="font-medium text-foreground">Push Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive push notifications on your device
              </p>
            </div>
            <Switch
              checked={notifications.pushNotifications}
              onCheckedChange={(checked) =>
                setNotifications((prev) => ({
                  ...prev,
                  pushNotifications: checked,
                }))
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <p className="font-medium text-foreground">Marketing Emails</p>
              <p className="text-sm text-muted-foreground">
                Receive tips, updates, and promotional content
              </p>
            </div>
            <Switch
              checked={notifications.marketingEmails}
              onCheckedChange={(checked) =>
                setNotifications((prev) => ({
                  ...prev,
                  marketingEmails: checked,
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Language & Region */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Globe className="h-5 w-5" />
            Language & Region
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select defaultValue="en">
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select defaultValue="usd">
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD ($)</SelectItem>
                  <SelectItem value="eur">EUR</SelectItem>
                  <SelectItem value="gbp">GBP</SelectItem>
                  <SelectItem value="inr">INR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support & Legal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Help & Support
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 p-0">
          <button className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <HelpCircle className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-foreground">Help Center</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
          <button className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-foreground">
                Terms of Service
              </span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
          <button className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-foreground">Privacy Policy</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Button
        variant="outline"
        className="w-full bg-transparent text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={handleSignOut}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your personal information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input id="edit-name" defaultValue={user.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email Address</Label>
              <Input id="edit-email" type="email" defaultValue={user.email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                type="tel"
                defaultValue={user.phone || "+1 (555) 123-4567"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProfileOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setEditProfileOpen(false)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
