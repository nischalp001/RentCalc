"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageCircle,
  Send,
  FileText,
  Receipt,
  Upload,
  CheckCircle2,
  ChevronLeft,
  MoreVertical,
  UserPlus,
  Building2,
  Phone,
  Mail,
  Search,
  X,
  Home,
  Users,
} from "lucide-react";
import { useUser, type Connection, type ConnectionRole } from "@/lib/user-context";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getTodayBsDate } from "@/lib/date-utils";
import {
  approveOwnerPendingRequest,
  fetchOwnerPendingApprovalRequests,
  fetchProperties,
  fetchTenantPendingConnectionRequests,
  rejectOwnerPendingRequest,
  respondToTenantInviteRequest,
  type OwnerApprovalRequest,
  type TenantInviteRequest,
} from "@/lib/rental-data";

// Mock messages data
const mockMessages: Record<
  string,
  { id: string; text: string; sender: "me" | "them"; timestamp: string }[]
> = {
  conn_001: [
    {
      id: "1",
      text: "Hi! I've transferred the rent for this month.",
      sender: "them",
      timestamp: "10:30 AM",
    },
    {
      id: "2",
      text: "Great, I'll verify the payment shortly. Thanks!",
      sender: "me",
      timestamp: "10:32 AM",
    },
    {
      id: "3",
      text: "Also, the kitchen faucet has been leaking. Can we schedule a repair?",
      sender: "them",
      timestamp: "10:35 AM",
    },
  ],
  conn_002: [
    {
      id: "1",
      text: "Rent will be slightly delayed this month, is that okay?",
      sender: "them",
      timestamp: "Yesterday",
    },
    {
      id: "2",
      text: "Sure, just let me know when you can make the payment.",
      sender: "me",
      timestamp: "Yesterday",
    },
  ],
  conn_003: [
    {
      id: "1",
      text: "Your rent for January has been processed. Please check your account.",
      sender: "them",
      timestamp: "Jan 5",
    },
    {
      id: "2",
      text: "Thank you! I'll upload the receipt shortly.",
      sender: "me",
      timestamp: "Jan 5",
    },
    {
      id: "3",
      text: "Also, there's a maintenance inspection scheduled for next week.",
      sender: "them",
      timestamp: "2 hours ago",
    },
  ],
};

export default function MessagesPage() {
  const { user, connections, addConnection, updateConnectionStatus } = useUser();
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [addPersonOpen, setAddPersonOpen] = useState(false);
  const [viewProfileOpen, setViewProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newPersonId, setNewPersonId] = useState("");
  const [newPersonRole, setNewPersonRole] = useState<ConnectionRole>("tenant");
  const [tenantInviteRequests, setTenantInviteRequests] = useState<TenantInviteRequest[]>([]);
  const [ownerApprovalRequests, setOwnerApprovalRequests] = useState<OwnerApprovalRequest[]>([]);
  const [pendingRequestsLoading, setPendingRequestsLoading] = useState(false);
  const [pendingRequestsError, setPendingRequestsError] = useState<string | null>(null);
  const [requestActionSubmitting, setRequestActionSubmitting] = useState<string | null>(null);
  const [ownerApprovalOpen, setOwnerApprovalOpen] = useState(false);
  const [selectedOwnerRequest, setSelectedOwnerRequest] = useState<OwnerApprovalRequest | null>(null);
  const [ownerApprovalRent, setOwnerApprovalRent] = useState("");
  const [ownerApprovalDateJoined, setOwnerApprovalDateJoined] = useState("");
  const [ownerApprovalError, setOwnerApprovalError] = useState<string | null>(null);

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

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConnection) return;
    // In a real app, this would send the message to the backend
    setMessageInput("");
  };

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

  const handleAcceptRequest = (id: string) => {
    updateConnectionStatus(id, "active");
  };

  const loadPendingRequests = useCallback(async () => {
    setPendingRequestsLoading(true);
    setPendingRequestsError(null);
    try {
      const tenantRequests = await fetchTenantPendingConnectionRequests();
      const properties = await fetchProperties();
      const ownedProperties = properties.filter((property) => property.owner_profile_id === user.profileId);
      const ownerRequestsPerProperty = await Promise.all(
        ownedProperties.map((property) => fetchOwnerPendingApprovalRequests(property.id))
      );
      setTenantInviteRequests(tenantRequests);
      setOwnerApprovalRequests(ownerRequestsPerProperty.flat());
    } catch (caughtError) {
      setPendingRequestsError(caughtError instanceof Error ? caughtError.message : "Failed to load pending requests");
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
    } catch (caughtError) {
      setPendingRequestsError(caughtError instanceof Error ? caughtError.message : "Failed to submit request response");
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
    } catch (caughtError) {
      setOwnerApprovalError(caughtError instanceof Error ? caughtError.message : "Failed to approve request");
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
      setPendingRequestsError(caughtError instanceof Error ? caughtError.message : "Failed to reject request");
    } finally {
      setRequestActionSubmitting(null);
    }
  };

  const messages = selectedConnection
    ? mockMessages[selectedConnection.id] || []
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground lg:text-2xl">
            Messages
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Chat with your landlords and tenants
          </p>
        </div>
        <Button onClick={() => setAddPersonOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Person
        </Button>
      </div>

      {/* Main Content - Split View */}
      <div className="grid h-[calc(100vh-220px)] gap-4 lg:grid-cols-3">
        {/* Connections List */}
        <Card className={cn("lg:col-span-1", selectedConnection && "hidden lg:block")}>
          <CardHeader className="pb-3">
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
          <CardContent className="p-0">
            <Tabs defaultValue="all">
              <TabsList className="mx-4 grid w-[calc(100%-32px)] grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="landlords">
                  Landlords ({landlords.length})
                </TabsTrigger>
                <TabsTrigger value="tenants">
                  Tenants ({tenants.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-0">
                <ScrollArea className="h-[calc(100vh-400px)]">
                  <div className="space-y-1 p-2">
                    {filteredConnections.length > 0 ? (
                      filteredConnections.map((connection) => (
                        <button
                          key={connection.id}
                          onClick={() => setSelectedConnection(connection)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/50",
                            selectedConnection?.id === connection.id &&
                              "bg-muted"
                          )}
                        >
                          <div className="relative">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                              {connection.name.charAt(0)}
                            </div>
                            {connection.unreadMessages > 0 && (
                              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                {connection.unreadMessages}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate font-medium text-foreground">
                                {connection.name}
                              </p>
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "shrink-0 text-xs",
                                  connection.role === "landlord"
                                    ? "bg-primary/10 text-primary"
                                    : "bg-success/10 text-success"
                                )}
                              >
                                {connection.role === "landlord"
                                  ? "Landlord"
                                  : "Tenant"}
                              </Badge>
                            </div>
                            {connection.propertyName && (
                              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                                <Building2 className="h-3 w-3" />
                                {connection.propertyName}
                              </p>
                            )}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-sm text-muted-foreground">
                          No conversations found
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="landlords" className="mt-0">
                <ScrollArea className="h-[calc(100vh-400px)]">
                  <div className="space-y-1 p-2">
                    {landlords.length > 0 ? (
                      landlords.map((connection) => (
                        <button
                          key={connection.id}
                          onClick={() => setSelectedConnection(connection)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/50",
                            selectedConnection?.id === connection.id &&
                              "bg-muted"
                          )}
                        >
                          <div className="relative">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                              {connection.name.charAt(0)}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-foreground">
                              {connection.name}
                            </p>
                            {connection.propertyName && (
                              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                                <Building2 className="h-3 w-3" />
                                {connection.propertyName}
                              </p>
                            )}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-sm text-muted-foreground">
                          No landlords yet
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="tenants" className="mt-0">
                <ScrollArea className="h-[calc(100vh-400px)]">
                  <div className="space-y-1 p-2">
                    {tenants.length > 0 ? (
                      tenants.map((connection) => (
                        <button
                          key={connection.id}
                          onClick={() => setSelectedConnection(connection)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/50",
                            selectedConnection?.id === connection.id &&
                              "bg-muted"
                          )}
                        >
                          <div className="relative">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-sm font-semibold text-success">
                              {connection.name.charAt(0)}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-foreground">
                              {connection.name}
                            </p>
                            {connection.propertyName && (
                              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                                <Building2 className="h-3 w-3" />
                                {connection.propertyName}
                              </p>
                            )}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-sm text-muted-foreground">
                          No tenants yet
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            {/* Pending Requests */}
            {totalPendingRequestCount > 0 && (
              <div className="border-t border-border p-4">
                <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
                  Pending Requests ({totalPendingRequestCount})
                </p>
                <div className="space-y-2">
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
                          <p className="text-sm font-medium text-foreground">
                            {conn.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            wants to connect as {conn.role}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(conn.id)}
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
                        Monthly Rent: {request.monthlyRent != null ? `NPR ${request.monthlyRent.toLocaleString()}` : "Not set"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Date Joined: {request.dateJoined || "Not set"}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => void handleRespondTenantInvite(request.id, true)}
                          disabled={requestActionSubmitting === `tenant-${request.id}-approve`}
                        >
                          {requestActionSubmitting === `tenant-${request.id}-approve` ? "Submitting..." : "Accept"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void handleRespondTenantInvite(request.id, false)}
                          disabled={requestActionSubmitting === `tenant-${request.id}-reject`}
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
                        <Button
                          size="sm"
                          onClick={() => openOwnerApprovalDialog(request)}
                        >
                          Review
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void handleRejectOwnerRequest(request.id)}
                          disabled={requestActionSubmitting === `owner-${request.id}-reject`}
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

        {/* Chat Area */}
        <Card
          className={cn(
            "lg:col-span-2",
            !selectedConnection && "hidden lg:flex lg:items-center lg:justify-center"
          )}
        >
          {selectedConnection ? (
            <div className="flex h-full flex-col">
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-border p-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={() => setSelectedConnection(null)}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {selectedConnection.name.charAt(0)}
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
                            : "bg-success/10 text-success"
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
                    <DropdownMenuItem
                      onClick={() => setViewProfileOpen(true)}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <FileText className="mr-2 h-4 w-4" />
                      View Documents
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Receipt className="mr-2 h-4 w-4" />
                      Verify Transactions
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Documents
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 border-b border-border p-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent text-xs"
                >
                  <FileText className="mr-1.5 h-3.5 w-3.5" />
                  Documents
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent text-xs"
                >
                  <Receipt className="mr-1.5 h-3.5 w-3.5" />
                  Transactions
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent text-xs"
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Verify Payment
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent text-xs"
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Upload
                </Button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length > 0 ? (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex",
                          msg.sender === "me" ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl px-4 py-2",
                            msg.sender === "me"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          )}
                        >
                          <p className="text-sm">{msg.text}</p>
                          <p
                            className={cn(
                              "mt-1 text-right text-xs",
                              msg.sender === "me"
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            )}
                          >
                            {msg.timestamp}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center">
                      <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-3 text-sm text-muted-foreground">
                        No messages yet. Start a conversation!
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t border-border p-4">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
                    <Send className="h-4 w-4" />
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

      <Dialog
        open={ownerApprovalOpen}
        onOpenChange={(open) => (open ? setOwnerApprovalOpen(true) : closeOwnerApprovalDialog())}
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
              <NepaliDateInput value={ownerApprovalDateJoined} onChange={setOwnerApprovalDateJoined} />
            </div>
          </div>

          {ownerApprovalError && <p className="text-sm text-destructive">{ownerApprovalError}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={closeOwnerApprovalDialog}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleApproveOwnerRequest()}
              disabled={
                requestActionSubmitting === `owner-${selectedOwnerRequest?.id ?? 0}-approve` ||
                !ownerApprovalRent.trim() ||
                !ownerApprovalDateJoined.trim()
              }
            >
              {requestActionSubmitting === `owner-${selectedOwnerRequest?.id ?? 0}-approve`
                ? "Confirming..."
                : "Confirm"}
            </Button>
          </DialogFooter>
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
                <SelectTrigger id="connection-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="landlord">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      <span>My Landlord</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="tenant">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>My Tenant</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {newPersonRole === "landlord"
                  ? "Add someone who owns a property you're renting"
                  : "Add someone who's renting your property"}
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

      {/* View Profile Dialog */}
      <Dialog open={viewProfileOpen} onOpenChange={setViewProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
          </DialogHeader>
          {selectedConnection && (
            <div className="space-y-6 py-4">
              <div className="flex flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
                  {selectedConnection.name.charAt(0)}
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
                      : "bg-success/10 text-success"
                  )}
                >
                  {selectedConnection.role === "landlord"
                    ? "Your Landlord"
                    : "Your Tenant"}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium text-foreground">
                      {selectedConnection.email}
                    </p>
                  </div>
                </div>
                {selectedConnection.phone && (
                  <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium text-foreground">
                        {selectedConnection.phone}
                      </p>
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
                <Button variant="outline" className="bg-transparent">
                  <FileText className="mr-2 h-4 w-4" />
                  Documents
                </Button>
                <Button variant="outline" className="bg-transparent">
                  <Receipt className="mr-2 h-4 w-4" />
                  Transactions
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
