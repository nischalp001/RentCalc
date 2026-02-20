"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Receipt, DollarSign, Plus, Link2 } from "lucide-react";
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
  connectTenantToPropertyByCode,
  fetchBills,
  fetchProperties,
  type BillRecord,
  type PropertyRecord,
} from "@/lib/rental-data";

const formatNpr = (value: number) => `NPR ${value.toFixed(2)}`;

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

  const loadDashboardData = useCallback(async () => {
    try {
      const [propertyData, billData] = await Promise.all([
        fetchProperties(),
        fetchBills(),
      ]);

      setProperties(propertyData);
      setBills(billData);
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
    () => [...ownedBills].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 5),
    [ownedBills]
  );

  const recentRentalBills = useMemo(
    () => [...rentalBills].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 5),
    [rentalBills]
  );

  const ownerTotals = useMemo(() => {
    const totalBills = ownedBills.length;
    const pendingBills = ownedBills.filter((bill) => bill.status === "pending").length;
    const overdueBills = ownedBills.filter((bill) => bill.status === "overdue").length;
    const receivable = ownedBills.reduce((sum, bill) => sum + Number(bill.total || 0), 0);
    return { totalBills, pendingBills, overdueBills, receivable };
  }, [ownedBills]);

  const tenantTotals = useMemo(() => {
    const totalBills = rentalBills.length;
    const pendingBills = rentalBills.filter((bill) => bill.status === "pending").length;
    const overdueBills = rentalBills.filter((bill) => bill.status === "overdue").length;
    const rentToPay = rentalBills
      .filter((bill) => bill.status === "pending" || bill.status === "overdue")
      .reduce((sum, bill) => sum + Number(bill.total || 0), 0);
    return { totalBills, pendingBills, overdueBills, rentToPay };
  }, [rentalBills]);

  const hasOwnerSection = ownedProperties.length > 0;
  const hasTenantSection = rentalProperties.length > 0;

  const resetConnectDialog = () => {
    setConnectPropertyCode("");
    setConnectSubmitting(false);
    setConnectError(null);
  };

  const handleConnectToProperty = async () => {
    setConnectError(null);
    setConnectSubmitting(true);
    try {
      await connectTenantToPropertyByCode({
        propertyCode: connectPropertyCode,
        tenantName: user.name,
        tenantEmail: user.email,
        tenantPhone: user.phone,
        tenantProfileId: user.profileId,
      });
      setConnectDialogOpen(false);
      resetConnectDialog();
      await loadDashboardData();
    } catch (caughtError) {
      setConnectError(caughtError instanceof Error ? caughtError.message : "Failed to connect property");
    } finally {
      setConnectSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold lg:text-2xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Live overview from Supabase</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAddPropertyOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setConnectDialogOpen(true);
              setConnectError(null);
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

      {!loading && !hasOwnerSection && !hasTenantSection && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No property context found yet. Add a property you own, or connect to a property as a tenant.
          </CardContent>
        </Card>
      )}

      {hasOwnerSection && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Owned Portfolio</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Owned Properties</p>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-2xl font-semibold">{loading ? "..." : ownedProperties.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Bills Issued</p>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-2xl font-semibold">{loading ? "..." : ownerTotals.totalBills}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Pending/Overdue</p>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-2xl font-semibold">
                  {loading ? "..." : `${ownerTotals.pendingBills}/${ownerTotals.overdueBills}`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Receivable</p>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-2xl font-semibold">{loading ? "..." : formatNpr(ownerTotals.receivable)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Bills (Owned Properties)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : recentOwnedBills.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bills created for your owned properties yet.</p>
              ) : (
                <div className="space-y-2">
                  {recentOwnedBills.map((bill) => (
                    <div key={bill.id} className="rounded-md border p-3 text-sm">
                      <div className="font-medium">{bill.property_name}</div>
                      <div className="text-muted-foreground">
                        {bill.tenant_name} | {bill.current_month} | {formatNpr(Number(bill.total || 0))} | {bill.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {hasTenantSection && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Rental Portfolio</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Rental Properties</p>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-2xl font-semibold">{loading ? "..." : rentalProperties.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Total Bills</p>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-2xl font-semibold">{loading ? "..." : tenantTotals.totalBills}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Pending/Overdue</p>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-2xl font-semibold">
                  {loading ? "..." : `${tenantTotals.pendingBills}/${tenantTotals.overdueBills}`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Rent to Pay</p>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-2xl font-semibold">{loading ? "..." : formatNpr(tenantTotals.rentToPay)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Bills (Rental Properties)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : recentRentalBills.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bills found for your rental properties yet.</p>
              ) : (
                <div className="space-y-2">
                  {recentRentalBills.map((bill) => (
                    <div key={bill.id} className="rounded-md border p-3 text-sm">
                      <div className="font-medium">{bill.property_name}</div>
                      <div className="text-muted-foreground">
                        {bill.tenant_name} | {bill.current_month} | {formatNpr(Number(bill.total || 0))} | {bill.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
              Enter the 10-digit unique property number shared by your landlord.
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConnectToProperty} disabled={connectSubmitting || !connectPropertyCode.trim()}>
              {connectSubmitting ? "Connecting..." : "Connect Property"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
