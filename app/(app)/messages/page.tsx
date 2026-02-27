"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  MessageCircle,
  Send,
  FileText,
  Receipt,
  ChevronLeft,
  MoreVertical,
  Building2,
  Phone,
  Mail,
  Search,
  Users,
  Loader2,
  CheckCheck,
  Check,
} from "lucide-react";
import { useUser, type Connection, type ConnectionRole } from "@/lib/user-context";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NepaliDateInput } from "@/components/ui/nepali-date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getTodayBsDate } from "@/lib/date-utils";
import {
  approveOwnerPendingRequest,
  fetchMessages,
  fetchOwnerPendingApprovalRequests,
  fetchProperties,
  fetchTenantPendingConnectionRequests,
  markMessagesAsRead,
  rejectOwnerPendingRequest,
  respondToTenantInviteRequest,
  sendMessage,
  type ChatMessageRecord,
  type OwnerApprovalRequest,
  type TenantInviteRequest,
} from "@/lib/rental-data";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function groupMessagesByDate(
  messages: ChatMessageRecord[]
): { label: string; messages: ChatMessageRecord[] }[] {
  const groups: { label: string; messages: ChatMessageRecord[] }[] = [];
  let currentLabel = "";

  for (const msg of messages) {
    const date = new Date(msg.sentAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let label: string;
    if (diffDays === 0) label = "Today";
    else if (diffDays === 1) label = "Yesterday";
    else label = date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });

    if (label !== currentLabel) {
      groups.push({ label, messages: [msg] });
      currentLabel = label;
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }

  return groups;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MessagesPage() {
  const { user, connections, connectionsLoading, refreshConnections, updateConnectionStatus } =
    useUser();

  // --- Connections state ---
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // --- Messages state ---
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Profile dialog ---
  const [viewProfileOpen, setViewProfileOpen] = useState(false);

  // --- Pending requests state ---
  const [tenantInviteRequests, setTenantInviteRequests] = useState<TenantInviteRequest[]>([]);
  const [ownerApprovalRequests, setOwnerApprovalRequests] = useState<OwnerApprovalRequest[]>([]);
  const [pendingRequestsLoading, setPendingRequestsLoading] = useState(false);
  const [pendingRequestsError, setPendingRequestsError] = useState<string | null>(null);
  const [requestActionSubmitting, setRequestActionSubmitting] = useState<string | null>(null);
  const [ownerApprovalOpen, setOwnerApprovalOpen] = useState(false);
  const [selectedOwnerRequest, setSelectedOwnerRequest] = useState<OwnerApprovalRequest | null>(
    null
  );
  const [ownerApprovalRent, setOwnerApprovalRent] = useState("");
  const [ownerApprovalDateJoined, setOwnerApprovalDateJoined] = useState("");
  const [ownerApprovalError, setOwnerApprovalError] = useState<string | null>(null);

  // --- Derived lists ---
  const activeConnections = connections.filter((c) => c.status === "active");
  const pendingConnections = connections.filter((c) => c.status === "pending");
  const totalPendingRequestCount =
    pendingConnections.length + tenantInviteRequests.length + ownerApprovalRequests.length;

  const landlords = activeConnections.filter((c) => c.role === "landlord");
  const tenants = activeConnections.filter((c) => c.role === "tenant");

  const filteredConnections = activeConnections.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.propertyName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Auto-scroll to bottom on new messages ---
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // --- Load messages when connection is selected ---
  const loadMessages = useCallback(async (connectionIds: string[]) => {
    setMessagesLoading(true);
    try {
      const data = await fetchMessages(connectionIds);
      setMessages(data);
      await markMessagesAsRead(connectionIds);
    } catch {
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedConnection) {
      setMessages([]);
      return;
    }
    void loadMessages(selectedConnection.allConnectionIds);
  }, [selectedConnection, loadMessages]);

  // --- Real-time subscription for new messages ---
  useEffect(() => {
    if (!selectedConnection) return;

    const supabase = getSupabaseBrowserClient();
    const channels: ReturnType<typeof supabase.channel>[] = [];

    const handleInsert = (payload: any) => {
      const row = payload.new as any;
      const newMsg: ChatMessageRecord = {
        id: row.id,
        connectionId: row.connection_id,
        senderProfileId: row.sender_profile_id,
        message: row.message,
        sentAt: row.sent_at,
        readAt: row.read_at || null,
      };
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      if (row.sender_profile_id !== user.profileId) {
        void markMessagesAsRead(selectedConnection.allConnectionIds);
      }
    };

    // Subscribe to ALL connection IDs for this pair so we see messages from both sides
    for (const connId of selectedConnection.allConnectionIds) {
      const channel = supabase
        .channel(`messages-${connId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `connection_id=eq.${connId}`,
          },
          handleInsert
        )
        .subscribe();
      channels.push(channel);
    }

    return () => {
      for (const ch of channels) {
        void supabase.removeChannel(ch);
      }
    };
  }, [selectedConnection, user.profileId]);

  // --- Global listener for unread badge updates ---
  useEffect(() => {
    if (!user.profileId) return;

    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel("messages-global")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          void refreshConnections();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user.profileId, refreshConnections]);

  // --- Send message ---
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConnection || sending) return;
    const text = messageInput.trim();
    setMessageInput("");
    setSending(true);
    try {
      const sent = await sendMessage(selectedConnection.id, text);
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
    } catch {
      setMessageInput(text);
    } finally {
      setSending(false);
    }
  };

  // --- Select connection ---
  const handleSelectConnection = (connection: Connection) => {
    setSelectedConnection(connection);
  };

  // --- Pending requests ---
  const loadPendingRequests = useCallback(async () => {
    setPendingRequestsLoading(true);
    setPendingRequestsError(null);
    try {
      const tenantRequests = await fetchTenantPendingConnectionRequests();
      const properties = await fetchProperties();
      const ownedProperties = properties.filter(
        (property) => property.owner_profile_id === user.profileId
      );
      const ownerRequestsPerProperty = await Promise.all(
        ownedProperties.map((property) => fetchOwnerPendingApprovalRequests(property.id))
      );
      setTenantInviteRequests(tenantRequests);
      setOwnerApprovalRequests(ownerRequestsPerProperty.flat());
    } catch (caughtError) {
      setPendingRequestsError(
        caughtError instanceof Error ? caughtError.message : "Failed to load pending requests"
      );
    } finally {
      setPendingRequestsLoading(false);
    }
  }, [user.profileId]);

  useEffect(() => {
    if (!user.profileId) {
      setTenantInviteRequests([]);
      setOwnerApprovalRequests([]);
      return;
    }
    void loadPendingRequests();
  }, [loadPendingRequests, user.profileId]);

  const handleRespondTenantInvite = async (requestId: number, approve: boolean) => {
    const key = `tenant-${requestId}-${approve ? "approve" : "reject"}`;
    setRequestActionSubmitting(key);
    setPendingRequestsError(null);
    try {
      await respondToTenantInviteRequest(requestId, approve);
      await loadPendingRequests();
      await refreshConnections();
    } catch (caughtError) {
      setPendingRequestsError(
        caughtError instanceof Error ? caughtError.message : "Failed to submit request response"
      );
    } finally {
      setRequestActionSubmitting(null);
    }
  };

  const openOwnerApprovalDialog = (request: OwnerApprovalRequest) => {
    setSelectedOwnerRequest(request);
    setOwnerApprovalRent("");
    setOwnerApprovalDateJoined(getTodayBsDate());
    setOwnerApprovalError(null);
    setOwnerApprovalOpen(true);
  };

  const closeOwnerApprovalDialog = () => {
    setOwnerApprovalOpen(false);
    setSelectedOwnerRequest(null);
    setOwnerApprovalRent("");
    setOwnerApprovalDateJoined("");
    setOwnerApprovalError(null);
  };

  const handleApproveOwnerRequest = async () => {
    if (!selectedOwnerRequest) {
      setOwnerApprovalError("Request not found.");
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
    setOwnerApprovalError(null);
    try {
      await approveOwnerPendingRequest({
        tenantRowId: selectedOwnerRequest.id,
        monthlyRent: parsedRent,
        dateJoined: ownerApprovalDateJoined.trim(),
      });
      closeOwnerApprovalDialog();
      await loadPendingRequests();
      await refreshConnections();
    } catch (caughtError) {
      setOwnerApprovalError(
        caughtError instanceof Error ? caughtError.message : "Failed to approve request"
      );
    } finally {
      setRequestActionSubmitting(null);
    }
  };

  const handleRejectOwnerRequest = async (requestId: number) => {
    const key = `owner-${requestId}-reject`;
    setRequestActionSubmitting(key);
    setPendingRequestsError(null);
    try {
      await rejectOwnerPendingRequest(requestId);
      await loadPendingRequests();
    } catch (caughtError) {
      setPendingRequestsError(
        caughtError instanceof Error ? caughtError.message : "Failed to reject request"
      );
    } finally {
      setRequestActionSubmitting(null);
    }
  };

  const messageGroups = groupMessagesByDate(messages);

  // ---------------------------------------------------------------------------
  // Render: Connection list item
  // ---------------------------------------------------------------------------
  const renderConnectionItem = (connection: Connection) => (
    <button
      key={connection.id}
      onClick={() => handleSelectConnection(connection)}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/50",
        selectedConnection?.id === connection.id && "bg-muted"
      )}
    >
      <div className="relative">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold",
            connection.role === "landlord"
              ? "bg-primary/10 text-primary"
              : "bg-emerald-500/10 text-emerald-600"
          )}
        >
          {connection.avatar ? (
            <img
              src={connection.avatar}
              alt={connection.name}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            connection.name.charAt(0).toUpperCase()
          )}
        </div>
        {connection.unreadMessages > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
            {connection.unreadMessages > 9 ? "9+" : connection.unreadMessages}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-medium text-foreground">{connection.name}</p>
          {connection.lastMessageAt && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatMessageTime(connection.lastMessageAt)}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <Badge
            variant="secondary"
            className={cn(
              "shrink-0 text-[10px] px-1.5 py-0",
              connection.role === "landlord"
                ? "bg-primary/10 text-primary"
                : "bg-emerald-500/10 text-emerald-600"
            )}
          >
            {connection.role === "landlord" ? "Landlord" : "Tenant"}
          </Badge>
          {connection.propertyName && (
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{connection.propertyName}</span>
            </p>
          )}
        </div>
        {connection.lastMessage && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {connection.lastMessage}
          </p>
        )}
      </div>
    </button>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground lg:text-2xl">Messages</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Chat with your landlords and tenants
          </p>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="grid h-[calc(100vh-220px)] gap-4 lg:grid-cols-3">
        {/* ==================== Connections List ==================== */}
        <Card className={cn("lg:col-span-1 flex flex-col", selectedConnection && "hidden lg:flex")}>
          <CardHeader className="pb-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col min-h-0">
            <Tabs defaultValue="all" className="flex flex-col flex-1 min-h-0">
              <TabsList className="mx-4 grid w-[calc(100%-32px)] grid-cols-3 shrink-0">
                <TabsTrigger value="all">
                  All ({activeConnections.length})
                </TabsTrigger>
                <TabsTrigger value="landlords">
                  Landlords ({landlords.length})
                </TabsTrigger>
                <TabsTrigger value="tenants">
                  Tenants ({tenants.length})
                </TabsTrigger>
              </TabsList>

              {/* All */}
              <TabsContent value="all" className="mt-0 flex-1 min-h-0">
                <ScrollArea className="h-full">
                  <div className="space-y-1 p-2">
                    {connectionsLoading && activeConnections.length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredConnections.length > 0 ? (
                      filteredConnections.map(renderConnectionItem)
                    ) : (
                      <div className="py-8 text-center">
                        <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground/40" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          {searchQuery ? "No conversations match your search" : "No conversations yet"}
                        </p>
                        {!searchQuery && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Connect with a property to start chatting
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Landlords */}
              <TabsContent value="landlords" className="mt-0 flex-1 min-h-0">
                <ScrollArea className="h-full">
                  <div className="space-y-1 p-2">
                    {landlords.length > 0 ? (
                      landlords.map(renderConnectionItem)
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-sm text-muted-foreground">No landlords yet</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Tenants */}
              <TabsContent value="tenants" className="mt-0 flex-1 min-h-0">
                <ScrollArea className="h-full">
                  <div className="space-y-1 p-2">
                    {tenants.length > 0 ? (
                      tenants.map(renderConnectionItem)
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-sm text-muted-foreground">No tenants yet</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            {/* Pending Requests */}
            {totalPendingRequestCount > 0 && (
              <div className="border-t border-border p-4 shrink-0">
                <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
                  Pending Requests ({totalPendingRequestCount})
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {pendingConnections.map((conn) => (
                    <div
                      key={conn.id}
                      className="flex items-center justify-between rounded-lg bg-warning/10 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/20 text-xs font-semibold">
                          {conn.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{conn.name}</p>
                          <p className="text-xs text-muted-foreground">
                            wants to connect as {conn.role}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => updateConnectionStatus(conn.id, "active")}
                      >
                        Accept
                      </Button>
                    </div>
                  ))}
                  {tenantInviteRequests.map((request) => (
                    <div
                      key={`tenant-invite-${request.id}`}
                      className="space-y-2 rounded-lg bg-warning/10 p-3"
                    >
                      <p className="text-sm font-medium text-foreground">
                        {request.ownerName} wants to add you to {request.propertyName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Do you wish to continue as tenant?
                      </p>
                      <div className="text-xs text-muted-foreground">
                        Monthly Rent:{" "}
                        {request.monthlyRent != null
                          ? `NPR ${request.monthlyRent.toLocaleString()}`
                          : "Not set"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Date Joined: {request.dateJoined || "Not set"}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => void handleRespondTenantInvite(request.id, true)}
                          disabled={
                            requestActionSubmitting === `tenant-${request.id}-approve`
                          }
                        >
                          {requestActionSubmitting === `tenant-${request.id}-approve`
                            ? "Submitting..."
                            : "Accept"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void handleRespondTenantInvite(request.id, false)}
                          disabled={
                            requestActionSubmitting === `tenant-${request.id}-reject`
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                  {ownerApprovalRequests.map((request) => (
                    <div
                      key={`owner-approval-${request.id}`}
                      className="space-y-2 rounded-lg bg-primary/10 p-3"
                    >
                      <p className="text-sm font-medium text-foreground">
                        {request.tenantName} wants to be your tenant for {request.propertyName}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        This request needs your confirmation with rent and joined date.
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => openOwnerApprovalDialog(request)}>
                          Review
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void handleRejectOwnerRequest(request.id)}
                          disabled={
                            requestActionSubmitting === `owner-${request.id}-reject`
                          }
                        >
                          Reject
                        </Button>
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/properties/${request.propertyId}`}>Open Property</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                  {pendingRequestsLoading && (
                    <p className="text-xs text-muted-foreground">Loading pending requests...</p>
                  )}
                  {pendingRequestsError && (
                    <p className="text-xs text-destructive">{pendingRequestsError}</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ==================== Chat Area ==================== */}
        <Card
          className={cn(
            "lg:col-span-2",
            !selectedConnection && "hidden lg:flex lg:items-center lg:justify-center"
          )}
        >
          {selectedConnection ? (
            <div className="flex h-full flex-col">
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-border p-4 shrink-0">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={() => setSelectedConnection(null)}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold",
                      selectedConnection.role === "landlord"
                        ? "bg-primary/10 text-primary"
                        : "bg-emerald-500/10 text-emerald-600"
                    )}
                  >
                    {selectedConnection.avatar ? (
                      <img
                        src={selectedConnection.avatar}
                        alt={selectedConnection.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      selectedConnection.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">
                        {selectedConnection.name}
                      </p>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          selectedConnection.role === "landlord"
                            ? "bg-primary/10 text-primary"
                            : "bg-emerald-500/10 text-emerald-600"
                        )}
                      >
                        {selectedConnection.role === "landlord"
                          ? "Your Landlord"
                          : "Your Tenant"}
                      </Badge>
                    </div>
                    {selectedConnection.propertyName && (
                      <p className="text-xs text-muted-foreground">
                        {selectedConnection.propertyName}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setViewProfileOpen(true)}>
                      <Users className="mr-2 h-4 w-4" />
                      View Profile
                    </DropdownMenuItem>
                    {selectedConnection.propertyId && (
                      <DropdownMenuItem asChild>
                        <Link href={`/properties/${selectedConnection.propertyId}`}>
                          <Building2 className="mr-2 h-4 w-4" />
                          View Property
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/documents">
                        <FileText className="mr-2 h-4 w-4" />
                        View Documents
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/transactions">
                        <Receipt className="mr-2 h-4 w-4" />
                        View Transactions
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : messageGroups.length > 0 ? (
                    messageGroups.map((group) => (
                      <div key={group.label}>
                        {/* Date separator */}
                        <div className="flex items-center gap-3 my-4">
                          <div className="flex-1 border-t border-border" />
                          <span className="text-xs text-muted-foreground bg-card px-2">
                            {group.label}
                          </span>
                          <div className="flex-1 border-t border-border" />
                        </div>

                        {/* Messages in group */}
                        <div className="space-y-3">
                          {group.messages.map((msg) => {
                            const isMe = msg.senderProfileId === user.profileId;
                            return (
                              <div
                                key={msg.id}
                                className={cn(
                                  "flex",
                                  isMe ? "justify-end" : "justify-start"
                                )}
                              >
                                <div
                                  className={cn(
                                    "max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm",
                                    isMe
                                      ? "bg-primary text-primary-foreground rounded-br-md"
                                      : "bg-muted text-foreground rounded-bl-md"
                                  )}
                                >
                                  <p className="text-sm whitespace-pre-wrap break-words">
                                    {msg.message}
                                  </p>
                                  <div
                                    className={cn(
                                      "mt-1 flex items-center justify-end gap-1 text-[10px]",
                                      isMe
                                        ? "text-primary-foreground/60"
                                        : "text-muted-foreground"
                                    )}
                                  >
                                    <span>
                                      {new Date(msg.sentAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                    {isMe && (
                                      msg.readAt ? (
                                        <CheckCheck className="h-3 w-3 text-blue-300" />
                                      ) : (
                                        <Check className="h-3 w-3" />
                                      )
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center">
                      <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground/30" />
                      <p className="mt-3 text-sm font-medium text-foreground">
                        No messages yet
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Send a message to start the conversation
                      </p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t border-border p-4 shrink-0">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void handleSendMessage();
                      }
                    }}
                    className="flex-1"
                    disabled={sending}
                  />
                  <Button
                    onClick={() => void handleSendMessage()}
                    disabled={!messageInput.trim() || sending}
                    size="icon"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <MessageCircle className="mx-auto h-16 w-16 text-muted-foreground/30" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                Select a conversation
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose a landlord or tenant from the list to start messaging
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* ==================== Owner Approval Dialog ==================== */}
      <Dialog
        open={ownerApprovalOpen}
        onOpenChange={(open) =>
          open ? setOwnerApprovalOpen(true) : closeOwnerApprovalDialog()
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Tenant Request</DialogTitle>
            <DialogDescription>
              {selectedOwnerRequest
                ? `${selectedOwnerRequest.tenantName} wants to be your tenant for ${selectedOwnerRequest.propertyName}.`
                : "Review this request."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
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
              <NepaliDateInput
                value={ownerApprovalDateJoined}
                onChange={setOwnerApprovalDateJoined}
              />
            </div>
          </div>

          {ownerApprovalError && (
            <p className="text-sm text-destructive">{ownerApprovalError}</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeOwnerApprovalDialog}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleApproveOwnerRequest()}
              disabled={
                requestActionSubmitting ===
                  `owner-${selectedOwnerRequest?.id ?? 0}-approve` ||
                !ownerApprovalRent.trim() ||
                !ownerApprovalDateJoined.trim()
              }
            >
              {requestActionSubmitting ===
              `owner-${selectedOwnerRequest?.id ?? 0}-approve`
                ? "Confirming..."
                : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== View Profile Dialog ==================== */}
      <Dialog open={viewProfileOpen} onOpenChange={setViewProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
          </DialogHeader>
          {selectedConnection && (
            <div className="space-y-6 py-4">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-20 w-20 items-center justify-center rounded-full text-2xl font-semibold",
                    selectedConnection.role === "landlord"
                      ? "bg-primary/10 text-primary"
                      : "bg-emerald-500/10 text-emerald-600"
                  )}
                >
                  {selectedConnection.avatar ? (
                    <img
                      src={selectedConnection.avatar}
                      alt={selectedConnection.name}
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    selectedConnection.name.charAt(0).toUpperCase()
                  )}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-foreground">
                  {selectedConnection.name}
                </h3>
                <Badge
                  variant="secondary"
                  className={cn(
                    "mt-1",
                    selectedConnection.role === "landlord"
                      ? "bg-primary/10 text-primary"
                      : "bg-emerald-500/10 text-emerald-600"
                  )}
                >
                  {selectedConnection.role === "landlord" ? "Your Landlord" : "Your Tenant"}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium text-foreground">{selectedConnection.email}</p>
                  </div>
                </div>
                {selectedConnection.phone && (
                  <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium text-foreground">{selectedConnection.phone}</p>
                    </div>
                  </div>
                )}
                {selectedConnection.propertyName && (
                  <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Property</p>
                      <p className="font-medium text-foreground">
                        {selectedConnection.propertyName}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="bg-transparent" asChild>
                  <Link href="/documents">
                    <FileText className="mr-2 h-4 w-4" />
                    Documents
                  </Link>
                </Button>
                <Button variant="outline" className="bg-transparent" asChild>
                  <Link href="/transactions">
                    <Receipt className="mr-2 h-4 w-4" />
                    Transactions
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
