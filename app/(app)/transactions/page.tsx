"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Receipt, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NepaliDateInput } from "@/components/ui/nepali-date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  createBill,
  fetchBills,
  fetchProperties,
  fetchPropertyTenants,
  getBillSectionSummary,
  type BillRecord,
  type PropertyRecord,
  type PropertyTenantRecord,
} from "@/lib/rental-data";
import { buildMonthlyBillingDateFromJoinDate, formatNepaliDateTimeFromAd, getTodayBsDate } from "@/lib/date-utils";

const refreshMs = 5000;

type OtherCharge = {
  id: string;
  label: string;
  amount: string;
};

const createOtherCharge = (): OtherCharge => ({
  id: `charge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  label: "",
  amount: "",
});

const toNonNegativeNumber = (value: string, label: string, required = false) => {
  const trimmed = value.trim();
  if (!trimmed) {
    if (required) {
      throw new Error(`${label} is required.`);
    }
    return 0;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a non-negative number.`);
  }
  return parsed;
};

const asNonNegative = (value: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
};

export default function TransactionsPage() {
  const searchParams = useSearchParams();
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [propertyTenants, setPropertyTenants] = useState<PropertyTenantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [noPropertyDialogOpen, setNoPropertyDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasAppliedPropertyPreset, setHasAppliedPropertyPreset] = useState(false);

  const [propertyId, setPropertyId] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [tenantEmail, setTenantEmail] = useState("");
  const [currentMonth, setCurrentMonth] = useState("");
  const [baseRent, setBaseRent] = useState("");
  const [due, setDue] = useState("");

  const [electricityPreviousUnit, setElectricityPreviousUnit] = useState("");
  const [electricityCurrentUnit, setElectricityCurrentUnit] = useState("");
  const [electricityRate, setElectricityRate] = useState("");

  const [waterPreviousUnit, setWaterPreviousUnit] = useState("");
  const [waterCurrentUnit, setWaterCurrentUnit] = useState("");
  const [waterRate, setWaterRate] = useState("");

  const [wifiCharge, setWifiCharge] = useState("");
  const [otherCharges, setOtherCharges] = useState<OtherCharge[]>([]);

  const preventWheelChange = (event: React.WheelEvent<HTMLInputElement>) => {
    event.currentTarget.blur();
  };

  const loadData = async () => {
    try {
      const [propertyData, billData] = await Promise.all([
        fetchProperties(),
        fetchBills(),
      ]);

      setProperties(propertyData);
      setBills(billData);
      setError(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to load rent data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, refreshMs);
    return () => clearInterval(id);
  }, []);

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === Number(propertyId)),
    [properties, propertyId]
  );

  const primaryTenant = useMemo(
    () => propertyTenants.find((tenant) => tenant.status === "active") || propertyTenants[0] || null,
    [propertyTenants]
  );

  const electricityAmount = useMemo(() => {
    const previous = asNonNegative(electricityPreviousUnit);
    const current = asNonNegative(electricityCurrentUnit);
    const rate = asNonNegative(electricityRate);
    return Math.max(current - previous, 0) * Math.max(rate, 0);
  }, [electricityPreviousUnit, electricityCurrentUnit, electricityRate]);

  const waterAmount = useMemo(() => {
    const previous = asNonNegative(waterPreviousUnit);
    const current = asNonNegative(waterCurrentUnit);
    const rate = asNonNegative(waterRate);
    return Math.max(current - previous, 0) * Math.max(rate, 0);
  }, [waterPreviousUnit, waterCurrentUnit, waterRate]);

  const otherChargesTotal = useMemo(
    () => otherCharges.reduce((sum, charge) => sum + asNonNegative(charge.amount), 0),
    [otherCharges]
  );

  const penalty = useMemo(() => asNonNegative(due) * 0.1, [due]);

  const total = useMemo(() => {
    return (
      asNonNegative(baseRent) +
      asNonNegative(due) +
      penalty +
      electricityAmount +
      waterAmount +
      asNonNegative(wifiCharge) +
      otherChargesTotal
    );
  }, [baseRent, due, penalty, electricityAmount, waterAmount, wifiCharge, otherChargesTotal]);

  const resetForm = () => {
    setPropertyId("");
    setPropertyTenants([]);
    setTenantName("");
    setTenantEmail("");
    setCurrentMonth("");
    setBaseRent("");
    setDue("");
    setElectricityPreviousUnit("");
    setElectricityCurrentUnit("");
    setElectricityRate("");
    setWaterPreviousUnit("");
    setWaterCurrentUnit("");
    setWaterRate("");
    setWifiCharge("");
    setOtherCharges([]);
  };

  useEffect(() => {
    if (hasAppliedPropertyPreset || properties.length === 0) {
      return;
    }

    const presetPropertyId = searchParams.get("propertyId");
    if (!presetPropertyId) {
      setHasAppliedPropertyPreset(true);
      return;
    }

    if (!properties.some((property) => String(property.id) === presetPropertyId)) {
      setHasAppliedPropertyPreset(true);
      return;
    }

    setPropertyId(presetPropertyId);
    setCreateOpen(true);
    setHasAppliedPropertyPreset(true);
  }, [hasAppliedPropertyPreset, properties, searchParams]);

  useEffect(() => {
    if (!selectedProperty) {
      setPropertyTenants([]);
      return;
    }

    let cancelled = false;

    const loadTenants = async () => {
      try {
        const tenantData = await fetchPropertyTenants(selectedProperty.id);
        if (cancelled) {
          return;
        }

        setPropertyTenants(tenantData);

        const activeTenant = tenantData.find((tenant) => tenant.status === "active") || tenantData[0] || null;
        setTenantName(activeTenant?.tenant_name || "");
        setTenantEmail(activeTenant?.tenant_email || "");

        const monthlyDate = buildMonthlyBillingDateFromJoinDate(activeTenant?.date_joined);
        setCurrentMonth(monthlyDate || getTodayBsDate());
      } catch (caughtError) {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Failed to load tenants for billing");
          setPropertyTenants([]);
          setCurrentMonth(getTodayBsDate());
        }
      }
    };

    setBaseRent(String(selectedProperty.price ?? ""));
    loadTenants();

    return () => {
      cancelled = true;
    };
  }, [selectedProperty]);

  const updateOtherCharge = (id: string, patch: Partial<OtherCharge>) => {
    setOtherCharges((prev) => prev.map((charge) => (charge.id === id ? { ...charge, ...patch } : charge)));
  };

  const removeOtherCharge = (id: string) => {
    setOtherCharges((prev) => prev.filter((charge) => charge.id !== id));
  };

  const validateAndBuildBillPayload = () => {
    if (!selectedProperty) {
      throw new Error("Property is required.");
    }
    if (!tenantName.trim()) {
      throw new Error("Tenant name is required.");
    }
    const effectiveCurrentMonth =
      currentMonth.trim() ||
      buildMonthlyBillingDateFromJoinDate(primaryTenant?.date_joined) ||
      getTodayBsDate();

    if (!effectiveCurrentMonth.trim()) {
      throw new Error("Nepali billing date is required.");
    }

    const parsedBaseRent = toNonNegativeNumber(baseRent, "Base rent", true);
    const parsedDue = toNonNegativeNumber(due, "Due");
    const parsedPenalty = parsedDue * 0.1;
    const parsedWifi = toNonNegativeNumber(wifiCharge, "Wifi");

    const parsedElectricityPrevious = toNonNegativeNumber(electricityPreviousUnit, "Electricity previous unit", true);
    const parsedElectricityCurrent = toNonNegativeNumber(electricityCurrentUnit, "Electricity current unit", true);
    const parsedElectricityRate = toNonNegativeNumber(electricityRate, "Electricity unit rate", true);

    if (parsedElectricityCurrent < parsedElectricityPrevious) {
      throw new Error("Electricity current unit must be greater than or equal to previous unit.");
    }

    const parsedWaterPrevious = toNonNegativeNumber(waterPreviousUnit, "Water previous unit", true);
    const parsedWaterCurrent = toNonNegativeNumber(waterCurrentUnit, "Water current unit", true);
    const parsedWaterRate = toNonNegativeNumber(waterRate, "Water unit rate", true);

    if (parsedWaterCurrent < parsedWaterPrevious) {
      throw new Error("Water current unit must be greater than or equal to previous unit.");
    }

    const parsedOtherCharges = otherCharges.map((charge, index) => {
      if (!charge.label.trim()) {
        throw new Error(`Other charge label is required for row ${index + 1}.`);
      }
      return {
        name: charge.label.trim(),
        amount: toNonNegativeNumber(charge.amount, `Other charge amount for ${charge.label || `row ${index + 1}`}`, true),
      };
    });

    const extraChargesMap = Object.fromEntries(parsedOtherCharges.map((charge) => [charge.name, charge.amount]));

    const calculatedElectricityAmount = (parsedElectricityCurrent - parsedElectricityPrevious) * parsedElectricityRate;
    const calculatedWaterAmount = (parsedWaterCurrent - parsedWaterPrevious) * parsedWaterRate;
    const computedTotal = parsedBaseRent + parsedDue + parsedPenalty + parsedWifi + calculatedElectricityAmount +
      calculatedWaterAmount + parsedOtherCharges.reduce((sum, charge) => sum + charge.amount, 0);

    return {
      propertyId: selectedProperty.id,
      propertyName: selectedProperty.property_name,
      tenantName: tenantName.trim(),
      tenantEmail: tenantEmail.trim(),
      currentMonth: effectiveCurrentMonth.trim(),
      billingInterval: selectedProperty.interval?.trim() || "monthly",
      rentPerMonth: parsedBaseRent,
      baseRent: parsedBaseRent,
      confirmedRent: parsedBaseRent,
      due: parsedDue,
      penalty: parsedPenalty,
      electricity: {
        amount: calculatedElectricityAmount,
        previousUnit: parsedElectricityPrevious,
        currentUnit: parsedElectricityCurrent,
        rate: parsedElectricityRate,
      },
      water: {
        amount: calculatedWaterAmount,
        previousUnit: parsedWaterPrevious,
        currentUnit: parsedWaterCurrent,
        rate: parsedWaterRate,
      },
      wifi: parsedWifi,
      internet: parsedWifi,
      others: extraChargesMap,
      otherCharges: extraChargesMap,
      customFields: parsedOtherCharges,
      total: computedTotal,
    };
  };

  const handleCreateBill = async () => {
    setError(null);
    setSubmitting(true);

    try {
      const payload = validateAndBuildBillPayload();
      await createBill(payload);

      setCreateOpen(false);
      resetForm();
      await loadData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to create bill");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePropertyChange = (value: string) => {
    setPropertyId(value);
    setPropertyTenants([]);
    setTenantName("");
    setTenantEmail("");
    setCurrentMonth("");
    setBaseRent("");
    setDue("");
    setWifiCharge("");
  };

  const hasProperties = properties.length > 0;

  const handleOpenCreateBill = () => {
    if (!hasProperties) {
      setNoPropertyDialogOpen(true);
      return;
    }
    setCreateOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold lg:text-2xl">Rent & Transactions</h1>
          <p className="text-sm text-muted-foreground">Live rent data from Supabase</p>
        </div>
        <Button onClick={handleOpenCreateBill}>
          <Plus className="mr-2 h-4 w-4" />
          Create Bill
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {!loading && !hasProperties && (
        <Card className="border-amber-300/60 bg-amber-50/30">
          <CardContent className="pt-6 text-sm text-amber-700">
            You have not added a property yet. Add a property first to create bills.
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">Loading bills...</CardContent>
        </Card>
      ) : bills.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">No bills yet. Create the first rent bill.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {bills.map((bill) => {
            const sections = getBillSectionSummary(bill);
            return (
              <Card key={bill.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Receipt className="h-4 w-4" />
                    {bill.tenant_name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{bill.property_name}</p>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Date</span><span>{bill.current_month}</span></div>
                  <div className="flex justify-between"><span>Status</span><span className="capitalize">{bill.status}</span></div>
                  <div className="flex justify-between"><span>Rent (per month)</span><span>${sections.rentPerMonth.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Due</span><span>${sections.due.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Penalty (10% of due)</span><span>${sections.penalty.toFixed(2)}</span></div>
                  <div className="rounded-md border px-2 py-1 text-xs">
                    <div className="flex justify-between"><span>Electricity bill</span><span>${sections.electricity.amount.toFixed(2)}</span></div>
                    <div className="text-muted-foreground">
                      Prev: {sections.electricity.previousUnit} | Current: {sections.electricity.currentUnit} | Rate: {sections.electricity.rate}
                    </div>
                  </div>
                  <div className="rounded-md border px-2 py-1 text-xs">
                    <div className="flex justify-between"><span>Water bill</span><span>${sections.water.amount.toFixed(2)}</span></div>
                    <div className="text-muted-foreground">
                      Prev: {sections.water.previousUnit} | Current: {sections.water.currentUnit} | Rate: {sections.water.rate}
                    </div>
                  </div>
                  <div className="flex justify-between"><span>Wifi</span><span>${sections.wifi.toFixed(2)}</span></div>
                  <div className="rounded-md border px-2 py-1 text-xs">
                    <div className="flex justify-between"><span>Others</span><span>${sections.othersTotal.toFixed(2)}</span></div>
                    {sections.others.length > 0 ? (
                      sections.others.map((charge, index) => (
                        <div key={`${bill.id}-${charge.name}-${index}`} className="flex justify-between text-muted-foreground">
                          <span>{charge.name}</span>
                          <span>${charge.amount.toFixed(2)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-muted-foreground">No additional charges</div>
                    )}
                  </div>
                  <div className="flex justify-between"><span>Total</span><span className="font-semibold">${sections.total.toFixed(2)}</span></div>
                  <div className="text-xs text-muted-foreground">Created: {formatNepaliDateTimeFromAd(bill.created_at)}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Rent Bill</DialogTitle>
            <DialogDescription>Save rent info directly to Supabase.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-2">
            <div className="space-y-2">
              <Label>Property</Label>
              <Select value={propertyId} onValueChange={handlePropertyChange}>
                <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={String(property.id)}>
                      {property.property_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tenant Name</Label>
                <Input value={tenantName} onChange={(event) => setTenantName(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tenant Email</Label>
                <Input value={tenantEmail} onChange={(event) => setTenantEmail(event.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Nepali Billing Date</Label>
                <NepaliDateInput value={currentMonth} onChange={setCurrentMonth} />
              </div>
              <div className="space-y-2">
                <Label>Rent (per month)</Label>
                <Input min={0} type="number" value={baseRent} onWheel={preventWheelChange} onChange={(event) => setBaseRent(event.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Due</Label>
                <Input min={0} type="number" value={due} onWheel={preventWheelChange} onChange={(event) => setDue(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Penalty (10% of due)</Label>
                <Input value={penalty.toFixed(2)} readOnly />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Electricity Bill</Label>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  min={0}
                  type="number"
                  placeholder="Previous Unit"
                  value={electricityPreviousUnit}
                  onWheel={preventWheelChange}
                  onChange={(event) => setElectricityPreviousUnit(event.target.value)}
                />
                <Input
                  min={0}
                  type="number"
                  placeholder="Current Unit"
                  value={electricityCurrentUnit}
                  onWheel={preventWheelChange}
                  onChange={(event) => setElectricityCurrentUnit(event.target.value)}
                />
                <Input
                  min={0}
                  type="number"
                  placeholder="Unit Rate"
                  value={electricityRate}
                  onWheel={preventWheelChange}
                  onChange={(event) => setElectricityRate(event.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Electricity Total: ${electricityAmount.toFixed(2)}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Water Bill</Label>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  min={0}
                  type="number"
                  placeholder="Previous Unit"
                  value={waterPreviousUnit}
                  onWheel={preventWheelChange}
                  onChange={(event) => setWaterPreviousUnit(event.target.value)}
                />
                <Input
                  min={0}
                  type="number"
                  placeholder="Current Unit"
                  value={waterCurrentUnit}
                  onWheel={preventWheelChange}
                  onChange={(event) => setWaterCurrentUnit(event.target.value)}
                />
                <Input
                  min={0}
                  type="number"
                  placeholder="Unit Rate"
                  value={waterRate}
                  onWheel={preventWheelChange}
                  onChange={(event) => setWaterRate(event.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Water Total: ${waterAmount.toFixed(2)}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Wifi</Label>
              <Input min={0} type="number" value={wifiCharge} onWheel={preventWheelChange} onChange={(event) => setWifiCharge(event.target.value)} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Other Charges</Label>
                <Button type="button" size="sm" variant="outline" onClick={() => setOtherCharges((prev) => [...prev, createOtherCharge()])}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Charge
                </Button>
              </div>

              {otherCharges.length === 0 ? (
                <p className="text-xs text-muted-foreground">No additional charges added.</p>
              ) : (
                <div className="space-y-2">
                  {otherCharges.map((charge) => (
                    <div key={charge.id} className="grid grid-cols-[1fr_140px_auto] gap-2">
                      <Input
                        placeholder="Charge label"
                        value={charge.label}
                        onChange={(event) => updateOtherCharge(charge.id, { label: event.target.value })}
                      />
                      <Input
                        min={0}
                        type="number"
                        placeholder="Amount"
                        value={charge.amount}
                        onWheel={preventWheelChange}
                        onChange={(event) => updateOtherCharge(charge.id, { amount: event.target.value })}
                      />
                      <Button type="button" size="icon" variant="outline" onClick={() => removeOtherCharge(charge.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Card className="bg-muted/40">
              <CardContent className="pt-6 text-sm">
                Total: <span className="font-semibold">${total.toFixed(2)}</span>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateBill} disabled={submitting}>
              {submitting ? "Saving..." : "Save Bill"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={noPropertyDialogOpen} onOpenChange={setNoPropertyDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cannot Create Bill</DialogTitle>
            <DialogDescription>
              You have not added a property yet. Please add a property before creating a bill.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoPropertyDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
