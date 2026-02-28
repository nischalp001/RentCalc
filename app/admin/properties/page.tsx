"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Search,
  MoreHorizontal,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Building2,
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
  fetchAllProperties,
  fetchAllProfiles,
  deleteProperty,
  type AdminProperty,
  type AdminProfile,
} from "@/lib/admin-data";

const propertyTypes = ["all", "flat", "house", "bnb", "office", "shop", "land", "warehouse"];

interface UserGroup {
  profile: AdminProfile | null;
  ownerKey: string;
  label: string;
  email: string;
  properties: AdminProperty[];
}

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<AdminProperty | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAllProperties(), fetchAllProfiles()])
      .then(([props, profs]) => {
        setProperties(props);
        setProfiles(profs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Group properties by owner, applying filters
  const userGroups = useMemo(() => {
    let filtered = properties;
    if (typeFilter !== "all") {
      filtered = filtered.filter(
        (p) => p.property_type.toLowerCase() === typeFilter
      );
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.property_name.toLowerCase().includes(q) ||
          p.property_code.toLowerCase().includes(q) ||
          (p.location && p.location.toLowerCase().includes(q)) ||
          (p.owner_name && p.owner_name.toLowerCase().includes(q))
      );
    }

    const profileMap = new Map(profiles.map((p) => [p.id, p]));
    const groupMap = new Map<string, AdminProperty[]>();

    for (const prop of filtered) {
      const key = prop.owner_profile_id ?? "unassigned";
      const existing = groupMap.get(key) ?? [];
      existing.push(prop);
      groupMap.set(key, existing);
    }

    const groups: UserGroup[] = [];
    for (const [key, props] of groupMap) {
      const profile = key === "unassigned" ? null : profileMap.get(key) ?? null;
      groups.push({
        profile,
        ownerKey: key,
        label: profile?.name ?? "Unassigned",
        email: profile?.email ?? "",
        properties: props,
      });
    }

    groups.sort((a, b) => {
      if (a.ownerKey === "unassigned") return 1;
      if (b.ownerKey === "unassigned") return -1;
      return a.label.localeCompare(b.label);
    });

    return groups;
  }, [properties, profiles, search, typeFilter]);

  const totalFiltered = userGroups.reduce((s, g) => s + g.properties.length, 0);

  const toggleUser = (key: string) => {
    setExpandedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => setExpandedUsers(new Set(userGroups.map((g) => g.ownerKey)));
  const collapseAll = () => setExpandedUsers(new Set());

  const handleDelete = async () => {
    if (!selectedProperty) return;
    setActionLoading(true);
    try {
      await deleteProperty(selectedProperty.property_code);
      setProperties((prev) =>
        prev.filter((p) => p.property_code !== selectedProperty.property_code)
      );
      setToast({
        type: "success",
        message: `Property "${selectedProperty.property_name}" deleted.`,
      });
    } catch (err: any) {
      setToast({ type: "error", message: err.message ?? "Failed to delete property." });
    } finally {
      setActionLoading(false);
      setDeleteDialogOpen(false);
      setSelectedProperty(null);
    }
  };

  const formatCurrency = (amount: number, currency: string) =>
    `${currency} ${amount.toLocaleString()}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Properties</h2>
          <p className="text-muted-foreground">
            Properties grouped by owner. Click a user to expand.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit">
          {properties.length} total properties
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

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Properties</CardTitle>
              <CardDescription>
                {totalFiltered} of {properties.length} properties across{" "}
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
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search name, code, location, owner..."
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
              {search || typeFilter !== "all"
                ? "No properties match your filters."
                : "No properties found."}
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
                      <Badge variant="outline" className="shrink-0">
                        <Building2 className="mr-1 h-3 w-3" />
                        {group.properties.length}
                      </Badge>
                    </button>

                    {/* Expanded property table */}
                    {isExpanded && (
                      <div className="border-t px-2 pb-2">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Property</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="hidden md:table-cell">Code</TableHead>
                                <TableHead className="hidden lg:table-cell">Location</TableHead>
                                <TableHead className="text-right">Rent</TableHead>
                                <TableHead className="w-10" />
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.properties.map((property) => (
                                <TableRow key={property.property_code}>
                                  <TableCell>
                                    <div>
                                      <span className="font-medium">{property.property_name}</span>
                                      {property.bedrooms > 0 && (
                                        <span className="ml-1 text-xs text-muted-foreground">
                                          ({property.bedrooms} BHK)
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="capitalize text-xs">
                                      {property.property_type}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell">
                                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                                      {property.property_code}
                                    </code>
                                  </TableCell>
                                  <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                                    {property.location || "—"}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {formatCurrency(property.desired_rent, property.currency)}
                                  </TableCell>
                                  <TableCell>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onClick={() => window.open(`/properties/${property.id}`, "_blank")}
                                        >
                                          <ExternalLink className="mr-2 h-4 w-4" />
                                          View in App
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-red-600"
                                          onClick={() => {
                                            setSelectedProperty(property);
                                            setDeleteDialogOpen(true);
                                          }}
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete Property
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
            <DialogTitle>Delete Property</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{selectedProperty?.property_name}</strong> (
              {selectedProperty?.property_code})? This will also delete all
              associated tenants, bills, images, and documents.
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
              {actionLoading ? "Deleting..." : "Delete Property"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
