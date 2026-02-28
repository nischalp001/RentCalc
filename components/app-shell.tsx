"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Receipt,
  Building2,
  FileText,
  User,
  Bell,
  MessageCircle,
  Menu,
  X,
  Share,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUser, type ConnectionRole, type Connection } from "@/lib/user-context";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NepaliDateInput } from "@/components/ui/nepali-date-picker";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QRCode from "react-qr-code";
import {
  approveOwnerPendingRequest,
  fetchOwnerPendingApprovalRequests,
  fetchProperties,
  fetchTenantPendingConnectionRequests,
  fetchUnreadNotifications,
  markNotificationAsRead,
  rejectOwnerPendingRequest,
  respondToTenantInviteRequest,
  type NotificationRecord,
  type OwnerApprovalRequest,
  type TenantInviteRequest,
} from "@/lib/rental-data";
import { getTodayBsDate } from "@/lib/date-utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Rent & Transactions", href: "/transactions", icon: Receipt },
  { name: "Properties", href: "/properties", icon: Building2 },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Profile", href: "/profile", icon: User },
];

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user, connections, addConnection } = useUser();
  const [shareProfileOpen, setShareProfileOpen] = useState(false);
  const [addPersonOpen, setAddPersonOpen] = useState(false);
  const [newPersonId, setNewPersonId] = useState("");
  const [newPersonRole, setNewPersonRole] = useState<ConnectionRole>("tenant");
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [tenantInviteRequests, setTenantInviteRequests] = useState<TenantInviteRequest[]>([]);
  const [ownerApprovalRequests, setOwnerApprovalRequests] = useState<OwnerApprovalRequest[]>([]);
  const [billNotifications, setBillNotifications] = useState<NotificationRecord[]>([]);
  const [requestActionSubmitting, setRequestActionSubmitting] = useState<string | null>(null);
  const [tenantConfirmDialogOpen, setTenantConfirmDialogOpen] = useState(false);
  const [selectedTenantInvite, setSelectedTenantInvite] = useState<TenantInviteRequest | null>(null);
  const [ownerApprovalDialogOpen, setOwnerApprovalDialogOpen] = useState(false);
  const [selectedOwnerRequest, setSelectedOwnerRequest] = useState<OwnerApprovalRequest | null>(null);
  const [ownerApprovalRent, setOwnerApprovalRent] = useState("");
  const [ownerApprovalDateJoined, setOwnerApprovalDateJoined] = useState("");
  const [ownerApprovalError, setOwnerApprovalError] = useState<string | null>(null);

  const totalUnreadMessages = connections.reduce(
    (acc, c) => acc + c.unreadMessages,
    0
  );

  const loadNotificationData = useCallback(async () => {
    if (!user.profileId) {
      setNotificationCount(0);
      setTenantInviteRequests([]);
      setOwnerApprovalRequests([]);
      setBillNotifications([]);
      return;
    }
    setNotificationLoading(true);
    try {
      const tenantRequests = await fetchTenantPendingConnectionRequests();
      const properties = await fetchProperties();
      const ownedProperties = properties.filter((property) => property.owner_profile_id === user.profileId);
      const ownerRequests = await Promise.all(
        ownedProperties.map((property) => fetchOwnerPendingApprovalRequests(property.id))
      );
      const flattenedOwnerRequests = ownerRequests.flat();
      const billNotifs = await fetchUnreadNotifications();
      
      setTenantInviteRequests(tenantRequests);
      setOwnerApprovalRequests(flattenedOwnerRequests);
      setBillNotifications(billNotifs);
      setNotificationCount(tenantRequests.length + flattenedOwnerRequests.length + billNotifs.length);
      setNotificationError(null);
    } catch (caughtError) {
      setNotificationError(caughtError instanceof Error ? caughtError.message : "Failed to load notifications");
    } finally {
      setNotificationLoading(false);
    }
  }, [user.profileId]);

  useEffect(() => {
    void loadNotificationData();
  }, [loadNotificationData, pathname]);

  const handleAddPerson = () => {
    if (!newPersonId.trim()) return;
    const newConnection: Connection = {
      id: `conn_${Date.now()}`,
      name: `User #${newPersonId}`,
      email: `user${newPersonId}@example.com`,
      role: newPersonRole,
      status: "pending",
      unreadMessages: 0,
    };
    addConnection(newConnection);
    setNewPersonId("");
    setAddPersonOpen(false);
  };

  const handleOpenNotifications = () => {
    setNotificationOpen(true);
    void loadNotificationData();
  };

  const openTenantConfirmDialog = (request: TenantInviteRequest) => {
    setSelectedTenantInvite(request);
    setTenantConfirmDialogOpen(true);
  };

  const closeTenantConfirmDialog = () => {
    setTenantConfirmDialogOpen(false);
    setSelectedTenantInvite(null);
  };

  const handleRespondTenantInvite = async (approve: boolean) => {
    if (!selectedTenantInvite) {
      return;
    }
    const key = `tenant-${selectedTenantInvite.id}-${approve ? "approve" : "reject"}`;
    setRequestActionSubmitting(key);
    try {
      await respondToTenantInviteRequest(selectedTenantInvite.id, approve);
      closeTenantConfirmDialog();
      await loadNotificationData();
    } finally {
      setRequestActionSubmitting(null);
    }
  };

  const openOwnerApprovalDialog = (request: OwnerApprovalRequest) => {
    setSelectedOwnerRequest(request);
    setOwnerApprovalRent(
      request.propertyRent != null && Number.isFinite(request.propertyRent)
        ? String(request.propertyRent)
        : ""
    );
    setOwnerApprovalDateJoined(getTodayBsDate());
    setOwnerApprovalError(null);
    setOwnerApprovalDialogOpen(true);
  };

  const closeOwnerApprovalDialog = () => {
    setOwnerApprovalDialogOpen(false);
    setSelectedOwnerRequest(null);
    setOwnerApprovalRent("");
    setOwnerApprovalDateJoined("");
    setOwnerApprovalError(null);
  };

  const handleApproveOwnerRequest = async () => {
    if (!selectedOwnerRequest) {
      return;
    }

    const parsedRent = Number(ownerApprovalRent.trim());
    if (!Number.isFinite(parsedRent) || parsedRent < 0) {
      setOwnerApprovalError("Monthly rent must be a non-negative number.");
      return;
    }
    if (!ownerApprovalDateJoined.trim()) {
      setOwnerApprovalError("Date joined is required.");
      return;
    }

    const key = `owner-${selectedOwnerRequest.id}-approve`;
    setRequestActionSubmitting(key);
    try {
      await approveOwnerPendingRequest({
        tenantRowId: selectedOwnerRequest.id,
        monthlyRent: parsedRent,
        dateJoined: ownerApprovalDateJoined.trim(),
      });
      closeOwnerApprovalDialog();
      await loadNotificationData();
    } catch (caughtError) {
      setOwnerApprovalError(caughtError instanceof Error ? caughtError.message : "Failed to approve request");
    } finally {
      setRequestActionSubmitting(null);
    }
  };

  const handleRejectOwnerRequest = async (requestId: number) => {
    const key = `owner-${requestId}-reject`;
    setRequestActionSubmitting(key);
    try {
      await rejectOwnerPendingRequest(requestId);
      await loadNotificationData();
    } finally {
      setRequestActionSubmitting(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">RentFlow</span>
        </Link>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Messages"
            asChild
          >
            <Link href="/messages">
              <MessageCircle className="h-5 w-5" />
              {totalUnreadMessages > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-primary p-0 text-xs text-primary-foreground">
                  {totalUnreadMessages}
                </Badge>
              )}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notifications"
            onClick={handleOpenNotifications}
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-destructive p-0 text-xs text-destructive-foreground">
                {notificationCount}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform bg-sidebar transition-transform duration-300 ease-in-out lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
              <Building2 className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
            <span className="font-semibold text-sidebar-foreground">
              RentFlow
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex flex-col gap-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        {/* User info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-primary text-sm font-medium text-sidebar-primary-foreground">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {user.name}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/70">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
        <div className="flex h-16 items-center gap-2 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <Building2 className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">
            RentFlow
          </span>
        </div>
        <nav className="flex flex-col gap-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        {/* User info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-primary text-sm font-medium text-sidebar-primary-foreground">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {user.name}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/70">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Desktop header */}
      <header className="fixed left-64 right-0 top-0 z-30 hidden h-16 items-center justify-between border-b border-border bg-card px-6 lg:flex">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            {navigation.find((item) => pathname.startsWith(item.href))?.name ||
              "Dashboard"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Messages"
            asChild
          >
            <Link href="/messages">
              <MessageCircle className="h-5 w-5" />
              {totalUnreadMessages > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-primary p-0 text-xs text-primary-foreground">
                  {totalUnreadMessages}
                </Badge>
              )}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notifications"
            onClick={handleOpenNotifications}
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-destructive p-0 text-xs text-destructive-foreground">
                {notificationCount}
              </Badge>
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Share className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShareProfileOpen(true)}>
                Share Your Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAddPersonOpen(true)}>
                Add Person
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main content */}
      <main className="min-h-screen pb-20 pt-16 lg:ml-64 lg:pb-0 lg:pt-16">
        <div className="p-4 lg:p-6">{children}</div>
      </main>

      <Sheet open={notificationOpen} onOpenChange={setNotificationOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Notifications</SheetTitle>
            <SheetDescription>
              Review property connection requests and confirmations.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {notificationLoading && (
              <p className="text-sm text-muted-foreground">Loading notifications...</p>
            )}
            {!notificationLoading && notificationError && (
              <p className="text-sm text-destructive">{notificationError}</p>
            )}
            {!notificationLoading && !notificationError && notificationCount === 0 && (
              <p className="text-sm text-muted-foreground">No pending notifications.</p>
            )}
            <div className="space-y-3">
              {tenantInviteRequests.map((request) => (
                <button
                  key={`tenant-invite-${request.id}`}
                  type="button"
                  className="w-full rounded-md border p-3 text-left transition-colors hover:bg-muted/40"
                  onClick={() => openTenantConfirmDialog(request)}
                >
                  <p className="text-sm font-medium">
                    {request.ownerName} wants to add you to {request.propertyName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Tap to review and confirm this request.
                  </p>
                </button>
              ))}
              {ownerApprovalRequests.map((request) => (
                <button
                  key={`owner-approval-${request.id}`}
                  type="button"
                  className="w-full rounded-md border p-3 text-left transition-colors hover:bg-muted/40"
                  onClick={() => openOwnerApprovalDialog(request)}
                >
                  <p className="text-sm font-medium">
                    {request.tenantName} requested to join {request.propertyName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Tap to approve with monthly rent and joined date.
                  </p>
                </button>
              ))}
              {billNotifications.map((notification) => (
                <Link
                  key={`bill-notif-${notification.id}`}
                  href={`/transactions/${notification.related_bill_id}`}
                  className="block w-full rounded-md border p-3 text-left transition-colors hover:bg-muted/40"
                  onClick={async () => {
                    try {
                      await markNotificationAsRead(notification.id);
                      await loadNotificationData();
                      setNotificationOpen(false);
                    } catch (error) {
                      console.error("Failed to mark notification as read:", error);
                    }
                  }}
                >
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {notification.message}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={tenantConfirmDialogOpen} onOpenChange={(open) => (open ? setTenantConfirmDialogOpen(true) : closeTenantConfirmDialog())}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Connection Confirmation</DialogTitle>
            <DialogDescription>
              {selectedTenantInvite
                ? `${selectedTenantInvite.ownerName} wants to add you to ${selectedTenantInvite.propertyName}. Do you wish to continue?`
                : "Review this request."}
            </DialogDescription>
          </DialogHeader>
          {selectedTenantInvite && (
            <div className="space-y-3">
              <div className="flex gap-3 rounded-md border p-3">
                <img
                  src={selectedTenantInvite.propertyImageUrl || "/placeholder.svg"}
                  alt={selectedTenantInvite.propertyName}
                  className="h-16 w-16 rounded-md object-cover"
                />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate font-medium">{selectedTenantInvite.propertyName}</p>
                  <p className="truncate text-xs text-muted-foreground">{selectedTenantInvite.propertyLocation || "-"}</p>
                  <p className="text-xs text-muted-foreground">
                    Property ID: {selectedTenantInvite.propertyCode || selectedTenantInvite.propertyId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Rent: NPR {Number(selectedTenantInvite.monthlyRent ?? selectedTenantInvite.propertyRent ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div>Date Joined: {selectedTenantInvite.dateJoined || "Not set"}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => void handleRespondTenantInvite(false)}
              disabled={requestActionSubmitting === `tenant-${selectedTenantInvite?.id ?? 0}-reject`}
            >
              Reject
            </Button>
            <Button
              onClick={() => void handleRespondTenantInvite(true)}
              disabled={requestActionSubmitting === `tenant-${selectedTenantInvite?.id ?? 0}-approve`}
            >
              {requestActionSubmitting === `tenant-${selectedTenantInvite?.id ?? 0}-approve` ? "Submitting..." : "Accept"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={ownerApprovalDialogOpen} onOpenChange={(open) => (open ? setOwnerApprovalDialogOpen(true) : closeOwnerApprovalDialog())}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tenant Approval</DialogTitle>
            <DialogDescription>
              {selectedOwnerRequest
                ? `${selectedOwnerRequest.tenantName} wants to be your tenant for ${selectedOwnerRequest.propertyName}.`
                : "Review this request."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {selectedOwnerRequest && (
              <div className="flex gap-3 rounded-md border p-3">
                <img
                  src={selectedOwnerRequest.propertyImageUrl || "/placeholder.svg"}
                  alt={selectedOwnerRequest.propertyName}
                  className="h-16 w-16 rounded-md object-cover"
                />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate font-medium">{selectedOwnerRequest.propertyName}</p>
                  <p className="truncate text-xs text-muted-foreground">{selectedOwnerRequest.propertyLocation || "-"}</p>
                  <p className="text-xs text-muted-foreground">
                    Property ID: {selectedOwnerRequest.propertyCode || selectedOwnerRequest.propertyId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Rent: NPR {Number(selectedOwnerRequest.propertyRent ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Monthly Rent (NPR)</Label>
              <Input
                min={0}
                type="number"
                value={ownerApprovalRent}
                onChange={(event) => setOwnerApprovalRent(event.target.value)}
                placeholder="e.g. 25000"
              />
            </div>
            <div className="space-y-2">
              <Label>Date Joined (Nepali)</Label>
              <NepaliDateInput value={ownerApprovalDateJoined} onChange={setOwnerApprovalDateJoined} />
            </div>
            {ownerApprovalError && <p className="text-sm text-destructive">{ownerApprovalError}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => void handleRejectOwnerRequest(selectedOwnerRequest?.id || 0)}
              disabled={!selectedOwnerRequest || requestActionSubmitting === `owner-${selectedOwnerRequest?.id ?? 0}-reject`}
            >
              Reject
            </Button>
            <Button
              onClick={() => void handleApproveOwnerRequest()}
              disabled={
                !selectedOwnerRequest ||
                !ownerApprovalRent.trim() ||
                !ownerApprovalDateJoined.trim() ||
                requestActionSubmitting === `owner-${selectedOwnerRequest?.id ?? 0}-approve`
              }
            >
              {requestActionSubmitting === `owner-${selectedOwnerRequest?.id ?? 0}-approve` ? "Confirming..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card lg:hidden">
        <div className="flex items-center justify-around">
          {navigation.slice(0, 4).map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-3 text-xs",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="truncate">{item.name.split(" ")[0]}</span>
              </Link>
            );
          })}
          <Link
            href="/messages"
            className={cn(
              "relative flex flex-1 flex-col items-center gap-1 py-3 text-xs",
              pathname.startsWith("/messages")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageCircle className="h-5 w-5" />
            {totalUnreadMessages > 0 && (
              <span className="absolute right-4 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {totalUnreadMessages}
              </span>
            )}
            <span className="truncate">Messages</span>
          </Link>
        </div>
      </nav>

      {/* Share Profile Dialog */}
      <Dialog open={shareProfileOpen} onOpenChange={setShareProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your Profile</DialogTitle>
            <DialogDescription>
              Share this QR code or your user ID to connect with others.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            <QRCode value={user.id} size={200} />
          </div>
          <p className="text-center text-sm text-muted-foreground">
            User ID: {user.id}
          </p>
        </DialogContent>
      </Dialog>

      {/* Add Person Dialog */}
      <Dialog open={addPersonOpen} onOpenChange={setAddPersonOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Person</DialogTitle>
            <DialogDescription>
              Connect with a landlord or tenant using their user ID.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user-id">User ID</Label>
              <Input
                id="user-id"
                placeholder="Enter user ID (e.g., USR12345)"
                value={newPersonId}
                onChange={(e) => setNewPersonId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="connection-role">Connect as</Label>
              <Select
                value={newPersonRole}
                onValueChange={(v) => setNewPersonRole(v as ConnectionRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="landlord">Landlord</SelectItem>
                  <SelectItem value="tenant">Tenant</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose the role this person has in relation to you.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPersonOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPerson} disabled={!newPersonId.trim()}>
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
