"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Search,
  MoreHorizontal,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Receipt,
  DollarSign,
  ChevronDown,
  ChevronRight,
  User,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchAllBillsWithOwner,
  fetchAllProfiles,
  updateBillStatus,
  deleteBill,
  type AdminBill,
  type AdminProfile,
} from "@/lib/admin-data";

type BillWithOwner = AdminBill & { owner_profile_id: string | null };

interface UserBillGroup {
  ownerKey: string;
  label: string;
  email: string | null;
  bills: BillWithOwner[];
  total: number;
  paid: number;
  pending: number;
}

const statusOptions = ["all", "pending", "paid", "overdue", "cancelled"];

function statusBadgeVariant(status: string) {
  switch (status) {
    case "paid":
      return "default" as const;
    case "pending":
      return "secondary" as const;
    case "overdue":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "paid":
      return <CheckCircle className="h-3.5 w-3.5 text-green-600" />;
    case "pending":
      return <Clock className="h-3.5 w-3.5 text-yellow-600" />;
    case "overdue":
      return <XCircle className="h-3.5 w-3.5 text-red-600" />;
    default:
      return null;
  }
}

export default function AdminTransactionsPage() {
  const [bills, setBills] = useState<BillWithOwner[]>([]);
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<BillWithOwner | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [b, p] = await Promise.all([fetchAllBillsWithOwner(), fetchAllProfiles()]);
        setBills(b);
        setProfiles(p);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Build a profile lookup
  const profileMap = useMemo(() => {
    const m: Record<string, AdminProfile> = {};
    profiles.forEach((p) => { m[p.id] = p; });
    return m;
  }, [profiles]);

  // Group bills by owner
  const userGroups = useMemo(() => {
    // First apply filters to bills
    let filtered = bills;
    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((b) => {
        const ownerProfile = b.owner_profile_id ? profileMap[b.owner_profile_id] : null;
        return (
          b.property_name.toLowerCase().includes(q) ||
          b.tenant_name.toLowerCase().includes(q) ||
          (b.tenant_email && b.tenant_email.toLowerCase().includes(q)) ||
          b.current_month.toLowerCase().includes(q) ||
          (ownerProfile?.name && ownerProfile.name.toLowerCase().includes(q)) ||
          (ownerProfile?.email && ownerProfile.email.toLowerCase().includes(q))
        );
      });
    }

    // Group by owner
    const map = new Map<string, BillWithOwner[]>();
    filtered.forEach((b) => {
      const key = b.owner_profile_id ?? "__unassigned__";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    });

    const groups: UserBillGroup[] = [];
    map.forEach((ownerBills, key) => {
      const profile = key !== "__unassigned__" ? profileMap[key] : null;
      groups.push({
        ownerKey: key,
        label: profile?.name ?? "Unassigned Owner",
        email: profile?.email ?? null,
        bills: ownerBills,
        total: ownerBills.reduce((s, b) => s + (Number(b.total) || 0), 0),
        paid: ownerBills.filter((b) => b.status === "paid").reduce((s, b) => s + (Number(b.total) || 0), 0),
        pending: ownerBills.filter((b) => b.status === "pending").reduce((s, b) => s + (Number(b.total) || 0), 0),
      });
    });

    groups.sort((a, b) => a.label.localeCompare(b.label));
    return groups;
  }, [bills, profiles, profileMap, search, statusFilter]);

  const totalFiltered = userGroups.reduce((s, g) => s + g.bills.length, 0);

  const toggleUser = (key: string) =>
    setExpandedUsers((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const expandAll = () =>
    setExpandedUsers(new Set(userGroups.map((g) => g.ownerKey)));
  const collapseAll = () => setExpandedUsers(new Set());

  // Summary stats (unfiltered)
  const totalAmount = bills.reduce((s, b) => s + (Number(b.total) || 0), 0);
  const paidAmount = bills
    .filter((b) => b.status === "paid")
    .reduce((s, b) => s + (Number(b.total) || 0), 0);
  const pendingAmount = bills
    .filter((b) => b.status === "pending")
    .reduce((s, b) => s + (Number(b.total) || 0), 0);

  const handleStatusChange = async (billId: number, newStatus: string) => {
    try {
      await updateBillStatus(billId, newStatus);
      setBills((prev) =>
        prev.map((b) =>
          b.id === billId
            ? {
                ...b,
                status: newStatus,
                paid_date:
                  newStatus === "paid" ? new Date().toISOString() : b.paid_date,
              }
            : b
        )
      );
      setToast({
        type: "success",
        message: `Bill #${billId} marked as ${newStatus}.`,
      });
    } catch (err: any) {
      setToast({ type: "error", message: err.message ?? "Failed to update status." });
    }
  };

  const handleDelete = async () => {
    if (!selectedBill) return;
    setActionLoading(true);
    try {
      await deleteBill(selectedBill.id);
      setBills((prev) => prev.filter((b) => b.id !== selectedBill.id));
      setToast({
        type: "success",
        message: `Bill #${selectedBill.id} deleted.`,
      });
    } catch (err: any) {
      setToast({ type: "error", message: err.message ?? "Failed to delete bill." });
    } finally {
      setActionLoading(false);
      setDeleteDialogOpen(false);
      setSelectedBill(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Transactions</h2>
          <p className="text-muted-foreground">
            Bills grouped by property owner. Click a user to expand.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit">
          {bills.length} total bills
        </Badge>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            toast.type === "success"
              ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-950">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Billed</p>
                <p className="text-xl font-bold">
                  NPR {totalAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2 dark:bg-green-950">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Collected</p>
                <p className="text-xl font-bold">
                  NPR {paidAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-100 p-2 dark:bg-yellow-950">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-bold">
                  NPR {pendingAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bills grouped by user */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Bills</CardTitle>
              <CardDescription>
                {totalFiltered} of {bills.length} bills across{" "}
                {userGroups.length} users
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={expandAll}>
                  Expand All
                </Button>
                <Button variant="ghost" size="sm" onClick={collapseAll}>
                  Collapse All
                </Button>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === "all"
                        ? "All Status"
                        : s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search property, tenant, owner, month..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : userGroups.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              {search || statusFilter !== "all"
                ? "No bills match your filters."
                : "No bills found."}
            </div>
          ) : (
            <div className="space-y-2">
              {userGroups.map((group) => {
                const isExpanded = expandedUsers.has(group.ownerKey);
                return (
                  <div key={group.ownerKey} className="rounded-lg border bg-background">
                    {/* User row — clickable */}
                    <button
                      onClick={() => toggleUser(group.ownerKey)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors rounded-lg"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{group.label}</span>
                          {group.email && (
                            <span className="hidden sm:inline text-xs text-muted-foreground truncate">
                              {group.email}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline">
                          <Receipt className="mr-1 h-3 w-3" />
                          {group.bills.length}
                        </Badge>
                        <span className="text-sm font-medium hidden sm:inline">
                          NPR {group.total.toLocaleString()}
                        </span>
                      </div>
                    </button>

                    {/* Expanded bills table */}
                    {isExpanded && (
                      <div className="border-t px-2 pb-2">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-16">ID</TableHead>
                                <TableHead>Property</TableHead>
                                <TableHead>Tenant</TableHead>
                                <TableHead className="hidden md:table-cell">Month</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-10" />
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.bills.map((bill) => (
                                <TableRow key={bill.id}>
                                  <TableCell className="text-muted-foreground">
                                    #{bill.id}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {bill.property_name}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {bill.tenant_name}
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell text-muted-foreground">
                                    {bill.current_month}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    NPR {Number(bill.total).toLocaleString()}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={statusBadgeVariant(bill.status)}
                                      className="gap-1 capitalize"
                                    >
                                      <StatusIcon status={bill.status} />
                                      {bill.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        {bill.status !== "paid" && (
                                          <DropdownMenuItem
                                            onClick={() => handleStatusChange(bill.id, "paid")}
                                          >
                                            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                            Mark as Paid
                                          </DropdownMenuItem>
                                        )}
                                        {bill.status !== "pending" && (
                                          <DropdownMenuItem
                                            onClick={() => handleStatusChange(bill.id, "pending")}
                                          >
                                            <Clock className="mr-2 h-4 w-4 text-yellow-600" />
                                            Mark as Pending
                                          </DropdownMenuItem>
                                        )}
                                        {bill.status !== "overdue" && (
                                          <DropdownMenuItem
                                            onClick={() => handleStatusChange(bill.id, "overdue")}
                                          >
                                            <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                            Mark as Overdue
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-red-600"
                                          onClick={() => {
                                            setSelectedBill(bill);
                                            setDeleteDialogOpen(true);
                                          }}
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete Bill
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bill</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete Bill #{selectedBill?.id} for{" "}
              <strong>{selectedBill?.property_name}</strong>? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              {actionLoading ? "Deleting..." : "Delete Bill"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
