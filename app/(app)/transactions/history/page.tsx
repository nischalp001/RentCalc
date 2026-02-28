"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Building2, Calendar, ChevronDown, Filter, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/lib/user-context";
import {
  fetchBills,
  fetchProperties,
  fetchPropertyTenants,
  getBillPaymentSummary,
  type BillRecord,
  type PropertyRecord,
  type PropertyTenantRecord,
} from "@/lib/rental-data";
import { formatNepaliDateTimeFromAd } from "@/lib/date-utils";

const formatNpr = (value: number) => `NPR ${value.toFixed(2)}`;

export default function TransactionHistoryPage() {
  const { user } = useUser();
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [propertyTenants, setPropertyTenants] = useState<Map<number, PropertyTenantRecord[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
  const [selectedTenantId, setSelectedTenantId] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedPropertyId, setExpandedPropertyId] = useState<number | null>(null);

  const loadData = async () => {
    try {
      const [propertyData, billData] = await Promise.all([
        fetchProperties(),
        fetchBills(),
      ]);

      setProperties(propertyData);
      setBills(billData);

      // Load tenants for each property
      const tenantsMap = new Map<number, PropertyTenantRecord[]>();
      for (const property of propertyData) {
        try {
          const tenants = await fetchPropertyTenants(property.id);
          tenantsMap.set(property.id, tenants);
        } catch {
          tenantsMap.set(property.id, []);
        }
      }
      setPropertyTenants(tenantsMap);

      setError(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to load transaction history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const ownedProperties = useMemo(
    () => properties.filter((property) => property.owner_profile_id === user.profileId),
    [properties, user.profileId]
  );

  const rentedProperties = useMemo(
    () => properties.filter((property) => property.owner_profile_id !== user.profileId),
    [properties, user.profileId]
  );

  const allProperties = useMemo(() => [...ownedProperties, ...rentedProperties], [ownedProperties, rentedProperties]);

  const ownedPropertyIds = useMemo(
    () => new Set(ownedProperties.map((property) => property.id)),
    [ownedProperties]
  );

  const relevantBills = useMemo(() => {
    const propertyIds = new Set([...ownedPropertyIds, ...rentedProperties.map((p) => p.id)]);
    return bills.filter((bill) => propertyIds.has(bill.property_id));
  }, [bills, ownedPropertyIds, rentedProperties]);

  const filteredBills = useMemo(() => {
    return relevantBills.filter((bill) => {
      // Property filter
      if (selectedPropertyId !== "all" && bill.property_id !== Number(selectedPropertyId)) {
        return false;
      }

      // Tenant filter
      if (selectedTenantId !== "all") {
        const tenants = propertyTenants.get(bill.property_id) || [];
        const tenantIds = tenants.map((t) => t.id.toString());
        if (!tenantIds.includes(selectedTenantId)) {
          return false;
        }
      }

      // Date filter
      const billDate = new Date(bill.created_at);
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        if (billDate < fromDate) return false;
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (billDate > toDate) return false;
      }

      return true;
    });
  }, [relevantBills, selectedPropertyId, selectedTenantId, dateFrom, dateTo, propertyTenants]);

  // Group bills by property
  const billsByProperty = useMemo(() => {
    const grouped = new Map<number, BillRecord[]>();
    filteredBills.forEach((bill) => {
      if (!grouped.has(bill.property_id)) {
        grouped.set(bill.property_id, []);
      }
      grouped.get(bill.property_id)!.push(bill);
    });

    // Sort bills within each property by created_at desc
    grouped.forEach((propertyBills) => {
      propertyBills.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    });

    return grouped;
  }, [filteredBills]);

  // Get all available tenants for the filter
  const allTenants = useMemo(() => {
    const tenantMap = new Map<number, PropertyTenantRecord>();
    propertyTenants.forEach((tenants) => {
      tenants.forEach((tenant) => {
        if (!tenantMap.has(tenant.id)) {
          tenantMap.set(tenant.id, tenant);
        }
      });
    });
    return Array.from(tenantMap.values());
  }, [propertyTenants]);

  const resetFilters = () => {
    setSelectedPropertyId("all");
    setSelectedTenantId("all");
    setDateFrom("");
    setDateTo("");
  };

  const renderBill = (bill: BillRecord) => {
    const paymentSummary = getBillPaymentSummary(bill);
    const isOwned = ownedPropertyIds.has(bill.property_id);
    const totalAmount = paymentSummary.remainingAmount;

    return (
      <div
        key={bill.id}
        className="rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted/30"
      >
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="font-medium text-foreground">Bill for {bill.current_month}</p>
            <p className="text-xs text-muted-foreground">
              Created on {formatNepaliDateTimeFromAd(bill.created_at)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{formatNpr(totalAmount)}</p>
            <p className="text-xs text-muted-foreground">
              Remaining: {formatNpr(paymentSummary.remainingAmount)}
            </p>
          </div>
        </div>

        <div className="mb-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <span className="text-muted-foreground">Status:</span>{" "}
            <span
              className={
                bill.status === "paid"
                  ? "font-medium text-emerald-600"
                  : bill.status === "overdue"
                  ? "font-medium text-destructive"
                  : "font-medium text-amber-600"
              }
            >
              {bill.status === "paid" ? "Paid" : bill.status === "overdue" ? "Overdue" : "Pending"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Paid Date:</span>{" "}
            {bill.paid_date ? formatNepaliDateTimeFromAd(bill.paid_date) : "Not paid yet"}
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href={`/transactions/${bill.id}`}>View Details</Link>
          </Button>
          {!isOwned && paymentSummary.remainingAmount > 0 && (
            <Button size="sm" asChild>
              <Link href={`/transactions/${bill.id}?action=pay`}>Pay Now</Link>
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/transactions">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-foreground lg:text-2xl">Transaction History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View all bill history organized by property with filters
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="property-filter">Property</Label>
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger id="property-filter">
                  <SelectValue placeholder="All Properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  {allProperties.map((property) => (
                    <SelectItem key={property.id} value={property.id.toString()}>
                      {property.property_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenant-filter">Tenant</Label>
              <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                <SelectTrigger id="tenant-filter">
                  <SelectValue placeholder="All Tenants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tenants</SelectItem>
                  {allTenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id.toString()}>
                      {tenant.tenant_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-from">Date From</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-to">Date To</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bills by Property */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Loading transaction history...
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-destructive/50">
          <CardContent className="py-6 text-center text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : filteredBills.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No bills found matching your filters.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {allProperties
            .filter((property) => billsByProperty.has(property.id))
            .map((property) => {
              const propertyBills = billsByProperty.get(property.id) || [];
              const isExpanded = expandedPropertyId === property.id;
              const isOwned = ownedPropertyIds.has(property.id);

              return (
                <Card key={property.id}>
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() => setExpandedPropertyId(isExpanded ? null : property.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          isOwned ? "bg-primary/10" : "bg-emerald-500/10"
                        }`}>
                          <Building2 className={`h-5 w-5 ${
                            isOwned ? "text-primary" : "text-emerald-600"
                          }`} />
                        </div>
                        <div>
                          <CardTitle className="text-base">{property.property_name}</CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {property.location} • {propertyBills.length} bill{propertyBills.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 text-muted-foreground transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent>
                      <div className="space-y-3">{propertyBills.map(renderBill)}</div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}
