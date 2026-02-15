"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Receipt, DollarSign, Plus } from "lucide-react";
import { PropertyFormDialog } from "@/components/properties/property-form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchBills, fetchProperties, type BillRecord, type PropertyRecord } from "@/lib/rental-data";

export default function DashboardPage() {
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addPropertyOpen, setAddPropertyOpen] = useState(false);

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

  const totals = useMemo(() => {
    const totalBills = bills.length;
    const pendingBills = bills.filter((bill) => bill.status === "pending").length;
    const overdueBills = bills.filter((bill) => bill.status === "overdue").length;
    const receivable = bills.reduce((sum, bill) => sum + Number(bill.total || 0), 0);
    return { totalBills, pendingBills, overdueBills, receivable };
  }, [bills]);

  const recentBills = useMemo(
    () => [...bills].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 5),
    [bills]
  );

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
          <Button variant="outline" asChild>
            <Link href="/transactions">Create Bill</Link>
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Properties</p>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-semibold">{loading ? "..." : properties.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total Bills</p>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-semibold">{loading ? "..." : totals.totalBills}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Pending/Overdue</p>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-semibold">{loading ? "..." : `${totals.pendingBills}/${totals.overdueBills}`}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Receivable</p>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-semibold">{loading ? "..." : `$${totals.receivable.toFixed(2)}`}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Bills</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : recentBills.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rent records yet.</p>
          ) : (
            <div className="space-y-2">
              {recentBills.map((bill) => (
                <div key={bill.id} className="rounded-md border p-3 text-sm">
                  <div className="font-medium">{bill.property_name}</div>
                  <div className="text-muted-foreground">
                    {bill.tenant_name} | {bill.current_month} | ${Number(bill.total || 0).toFixed(2)} | {bill.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PropertyFormDialog
        open={addPropertyOpen}
        onOpenChange={setAddPropertyOpen}
        onSuccess={loadDashboardData}
      />
    </div>
  );
}
