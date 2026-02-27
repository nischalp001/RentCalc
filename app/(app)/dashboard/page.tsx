"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, DollarSign, Plus, Link2, MapPin } from "lucide-react";
import { PropertyFormDialog } from "@/components/properties/property-form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/lib/user-context";
import {
  fetchTenantPendingConnectionRequests,
  connectTenantToPropertyByCode,
  fetchBills,
  fetchProperties,
  getEffectivePropertyRent,
  getBillPaymentSummary,
  respondToTenantInviteRequest,
  type BillRecord,
  type PropertyRecord,
  type TenantInviteRequest,
} from "@/lib/rental-data";

const formatNpr = (value: number) => `NPR ${value.toFixed(2)}`;
const maxShortcutCards = 4;
const maxRecentBills = 4;
export default function DashboardPage() {
  const { user } = useUser();
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addPropertyOpen, setAddPropertyOpen] = useState(false);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [connectPropertyCode, setConnectPropertyCode] = useState("");
  const [connectSubmitting, setConnectSubmitting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectSuccess, setConnectSuccess] = useState<string | null>(null);
  const [pendingInviteRequests, setPendingInviteRequests] = useState<TenantInviteRequest[]>([]);
  const [inviteActionSubmittingId, setInviteActionSubmittingId] = useState<number | null>(null);
  const [inviteActionError, setInviteActionError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      const [propertyData, billData, pendingRequests] = await Promise.all([
        fetchProperties(),
        fetchBills(),
        fetchTenantPendingConnectionRequests(),
      ]);

      setProperties(propertyData);
      setBills(billData);
      setPendingInviteRequests(pendingRequests);
      setInviteActionError(null);
      setError(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const ownedProperties = useMemo(
    () => properties.filter((property) => property.owner_profile_id === user.profileId),
    [properties, user.profileId]
  );

  const rentalProperties = useMemo(
    () => properties.filter((property) => property.owner_profile_id !== user.profileId),
    [properties, user.profileId]
  );

  const ownedPropertyIds = useMemo(
    () => new Set(ownedProperties.map((property) => property.id)),
    [ownedProperties]
  );

  const rentalPropertyIds = useMemo(
    () => new Set(rentalProperties.map((property) => property.id)),
    [rentalProperties]
  );

  const ownedBills = useMemo(
    () => bills.filter((bill) => ownedPropertyIds.has(bill.property_id)),
    [bills, ownedPropertyIds]
  );

  const rentalBills = useMemo(
    () => bills.filter((bill) => rentalPropertyIds.has(bill.property_id)),
    [bills, rentalPropertyIds]
  );

  const recentOwnedBills = useMemo(
    () => [...ownedBills].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, maxRecentBills),
    [ownedBills]
  );

  const recentRentalBills = useMemo(
    () => [...rentalBills].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, maxRecentBills),
    [rentalBills]
  );

  const ownerTotals = useMemo(() => {
    const receivable = ownedBills.reduce((sum, bill) => {
      const paymentSummary = getBillPaymentSummary(bill);
      return sum + paymentSummary.remainingAmount - paymentSummary.surplusAmount;
    }, 0);
    return { receivable };
  }, [ownedBills]);

  const tenantTotals = useMemo(() => {
    const rentToPay = rentalBills
      .filter((bill) => bill.status === "pending" || bill.status === "overdue")
      .reduce((sum, bill) => {
        const paymentSummary = getBillPaymentSummary(bill);
        return sum + paymentSummary.remainingAmount - paymentSummary.surplusAmount;
      }, 0);
    return { rentToPay };
  }, [rentalBills]);

  const hasOwnerSection = ownedProperties.length > 0;
  const hasTenantSection = rentalProperties.length > 0;

  const sortedOwnedProperties = useMemo(
    () => [...ownedProperties].sort((a, b) => b.id - a.id),
    [ownedProperties]
  );

  const sortedRentalProperties = useMemo(
    () => [...rentalProperties].sort((a, b) => b.id - a.id),
    [rentalProperties]
  );

  const resetConnectDialog = () => {
    setConnectPropertyCode("");
    setConnectSubmitting(false);
    setConnectError(null);
    setConnectSuccess(null);
  };

  const handleConnectToProperty = async () => {
    setConnectError(null);
    setConnectSuccess(null);
    setConnectSubmitting(true);
    try {
      await connectTenantToPropertyByCode({
        propertyCode: connectPropertyCode,
        tenantName: user.name,
        tenantEmail: user.email,
        tenantPhone: user.phone,
        tenantProfileId: user.profileId,
      });
      setConnectSuccess("Connection request sent to the property owner. Wait for approval.");
      setConnectPropertyCode("");
      await loadDashboardData();
    } catch (caughtError) {
      setConnectError(caughtError instanceof Error ? caughtError.message : "Failed to connect property");
    } finally {
      setConnectSubmitting(false);
    }
  };

  const handleRespondInvite = async (requestId: number, approve: boolean) => {
    setInviteActionError(null);
    setInviteActionSubmittingId(requestId);
    try {
      await respondToTenantInviteRequest(requestId, approve);
      await loadDashboardData();
    } catch (caughtError) {
      setInviteActionError(caughtError instanceof Error ? caughtError.message : "Failed to respond to request");
    } finally {
      setInviteActionSubmittingId(null);
    }
  };

  const renderShortcutCards = (entries: PropertyRecord[], emptyMessage: string) => {
    if (entries.length === 0) {
      return (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">{emptyMessage}</CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {entries.slice(0, maxShortcutCards).map((property) => {
            const image = property.property_images?.[0]?.url || "/placeholder.svg";
            return (
              <Link key={property.id} href={`/properties/${property.id}`} className="group">
                <Card className="h-full overflow-hidden transition-all hover:border-primary/30 hover:shadow-md">
                  <div className="h-28 w-full overflow-hidden">
                    <img src={image} alt={property.property_name} className="h-full w-full object-cover" />
                  </div>
                  <CardHeader className="space-y-1 pb-2">
                    <CardTitle className="line-clamp-1 text-sm">{property.property_name}</CardTitle>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {property.location || "-"}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm font-semibold">
                      NPR {getEffectivePropertyRent(property).toLocaleString()}
                      <span className="text-xs font-normal text-muted-foreground">/{property.interval}</span>
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
        {entries.length > maxShortcutCards && (
          <Button asChild variant="ghost" className="px-0 text-sm">
            <Link href="/properties">View all properties</Link>
          </Button>
        )}
      </div>
    );
  };

  const renderRecentBills = (entries: BillRecord[], emptyMessage: string) => {
    if (entries.length === 0) {
      return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
    }

    return (
      <div className="space-y-2">
        {entries.map((bill) => {
          const paymentSummary = getBillPaymentSummary(bill);
          return (
            <Link
              key={bill.id}
              href={`/transactions/${bill.id}`}
              className="block rounded-md border p-3 text-sm transition-colors hover:bg-muted/30"
            >
              <div className="font-medium">{bill.property_name}</div>
              <div className="text-muted-foreground">
                {bill.current_month} | {bill.status}
              </div>
              <div className="text-muted-foreground">
                {paymentSummary.surplusAmount > 0
                  ? `Surplus: ${formatNpr(paymentSummary.surplusAmount)}`
                  : `Remaining: ${formatNpr(paymentSummary.remainingAmount)}`}
              </div>
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold lg:text-2xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Live overview from Supabase</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setAddPropertyOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setConnectDialogOpen(true);
              setConnectError(null);
              setConnectSuccess(null);
            }}
          >
            <Link2 className="mr-2 h-4 w-4" />
            Connect to a Property
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {pendingInviteRequests.length > 0 && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">Pending Connection Confirmation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingInviteRequests.map((request) => (
              <div key={request.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">
                  {request.ownerName} wants to add you to {request.propertyName}
                </p>
                <p className="mt-1 text-muted-foreground">
                  Do you wish to continue as tenant for this property?
                </p>
                <div className="mt-2 text-xs text-muted-foreground">
                  Monthly Rent: {request.monthlyRent != null ? formatNpr(request.monthlyRent) : "Not set"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Date Joined: {request.dateJoined || "Not set"}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => void handleRespondInvite(request.id, true)}
                    disabled={inviteActionSubmittingId === request.id}
                  >
                    {inviteActionSubmittingId === request.id ? "Submitting..." : "Accept"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleRespondInvite(request.id, false)}
                    disabled={inviteActionSubmittingId === request.id}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
            {inviteActionError && <p className="text-sm text-destructive">{inviteActionError}</p>}
          </CardContent>
        </Card>
      )}

      {!loading && !hasOwnerSection && !hasTenantSection && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No property context found yet. Add a property you own, or connect to a property as a tenant.
          </CardContent>
        </Card>
      )}

      {!loading && (hasOwnerSection || hasTenantSection) && (
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Portfolio Overview</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Owned Properties</p>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="mt-2 text-2xl font-semibold">{ownedProperties.length}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Rented Properties</p>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="mt-2 text-2xl font-semibold">{rentalProperties.length}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Receivable</p>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="mt-2 text-2xl font-semibold">{formatNpr(ownerTotals.receivable)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Rent to Pay</p>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="mt-2 text-2xl font-semibold">{formatNpr(tenantTotals.rentToPay)}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Owned Property Shortcuts</h2>
            {renderShortcutCards(sortedOwnedProperties, "No owned properties found.")}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Rented Property Shortcuts</h2>
            {renderShortcutCards(sortedRentalProperties, "No rented properties found.")}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <div className="grid gap-4 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Bills (Owned)</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderRecentBills(recentOwnedBills, "No bills created for your owned properties yet.")}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Bills (Rented)</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderRecentBills(recentRentalBills, "No bills found for your rental properties yet.")}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      <PropertyFormDialog
        open={addPropertyOpen}
        onOpenChange={setAddPropertyOpen}
        onSuccess={loadDashboardData}
      />

      <Dialog
        open={connectDialogOpen}
        onOpenChange={(open) => {
          setConnectDialogOpen(open);
          if (!open) {
            resetConnectDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect to a Property</DialogTitle>
            <DialogDescription>
              Enter the 10-digit unique property number shared by your landlord. A request will be sent for owner confirmation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="connect-property-code">Unique Property Number</Label>
            <Input
              id="connect-property-code"
              placeholder="Enter 10-digit code"
              className="font-mono"
              value={connectPropertyCode}
              onChange={(event) => setConnectPropertyCode(event.target.value.replace(/\D/g, "").slice(0, 10))}
              maxLength={10}
            />
          </div>

          {connectError && <p className="text-sm text-destructive">{connectError}</p>}
          {connectSuccess && <p className="text-sm text-emerald-600">{connectSuccess}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConnectToProperty} disabled={connectSubmitting || !connectPropertyCode.trim()}>
              {connectSubmitting ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
