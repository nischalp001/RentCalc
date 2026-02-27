"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NepaliDateInput } from "@/components/ui/nepali-date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/lib/user-context";
import {
  createBill,
  fetchBills,
  fetchProperties,
  fetchPropertyTenants,
  getEffectivePropertyRent,
  getBillPaymentSummary,
  getBillSectionSummary,
  submitBillPaymentClaim,
  uploadBillPaymentEvidence,
  verifyBillPaymentClaim,
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

const normalizeText = (value: string | null | undefined) => value?.trim().toLowerCase() || "";
const formatNpr = (value: number) => `NPR ${value.toFixed(2)}`;
type BillPreviewMode = "view" | "pay" | "verify";

export default function TransactionsPage() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [propertyTenants, setPropertyTenants] = useState<PropertyTenantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [noPropertyDialogOpen, setNoPropertyDialogOpen] = useState(false);
  const [noTenantDialogOpen, setNoTenantDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkingTenantEligibility, setCheckingTenantEligibility] = useState(false);
  const [hasAppliedPropertyPreset, setHasAppliedPropertyPreset] = useState(false);
  const [expandedPropertyId, setExpandedPropertyId] = useState<number | null>(null);
  const [selectedBillPreview, setSelectedBillPreview] = useState<BillRecord | null>(null);
  const [billPreviewMode, setBillPreviewMode] = useState<BillPreviewMode>("view");
  const [billPayAmount, setBillPayAmount] = useState("");
  const [billPayRemarks, setBillPayRemarks] = useState("");
  const [billPayEvidenceFile, setBillPayEvidenceFile] = useState<File | null>(null);
  const [billPaySubmitting, setBillPaySubmitting] = useState(false);
  const [billPayError, setBillPayError] = useState<string | null>(null);
  const [billVerifyingClaimId, setBillVerifyingClaimId] = useState<string | null>(null);
  const [billVerifyError, setBillVerifyError] = useState<string | null>(null);

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
  const initializedPropertyIdRef = useRef<number | null>(null);
  const usageAutofillKeyRef = useRef("");
  const rentAutofillKeyRef = useRef("");

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

  const ownedProperties = useMemo(
    () => properties.filter((property) => property.owner_profile_id === user.profileId),
    [properties, user.profileId]
  );
  const rentedProperties = useMemo(
    () => properties.filter((property) => property.owner_profile_id !== user.profileId),
    [properties, user.profileId]
  );

  const selectedProperty = useMemo(
    () => ownedProperties.find((property) => property.id === Number(propertyId)),
    [ownedProperties, propertyId]
  );
  const selectedPropertyId = selectedProperty?.id ?? null;

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
    initializedPropertyIdRef.current = null;
    usageAutofillKeyRef.current = "";
    rentAutofillKeyRef.current = "";
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
    if (hasAppliedPropertyPreset || ownedProperties.length === 0) {
      return;
    }

    const presetPropertyId = searchParams.get("propertyId");
    if (!presetPropertyId) {
      setHasAppliedPropertyPreset(true);
      return;
    }

    if (!ownedProperties.some((property) => String(property.id) === presetPropertyId)) {
      setHasAppliedPropertyPreset(true);
      return;
    }

    setPropertyId(presetPropertyId);
    setCreateOpen(true);
    setHasAppliedPropertyPreset(true);
  }, [hasAppliedPropertyPreset, ownedProperties, searchParams]);

  useEffect(() => {
    if (!selectedProperty || !selectedPropertyId) {
      setPropertyTenants([]);
      initializedPropertyIdRef.current = null;
      usageAutofillKeyRef.current = "";
      rentAutofillKeyRef.current = "";
      return;
    }

    let cancelled = false;

    const loadTenants = async () => {
      try {
        const tenantData = await fetchPropertyTenants(selectedPropertyId);
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

    if (initializedPropertyIdRef.current !== selectedPropertyId) {
      initializedPropertyIdRef.current = selectedPropertyId;
      usageAutofillKeyRef.current = "";
      rentAutofillKeyRef.current = "";
      setBaseRent(String(getEffectivePropertyRent(selectedProperty)));
      setDue("");
      setElectricityPreviousUnit("");
      setElectricityCurrentUnit("");
      setElectricityRate("");
      setWaterPreviousUnit("");
      setWaterCurrentUnit("");
      setWaterRate("");
      setWifiCharge("");
      setOtherCharges([]);
    }

    loadTenants();

    return () => {
      cancelled = true;
    };
  }, [selectedPropertyId]);

  const previousBillForTenant = useMemo(() => {
    if (!selectedPropertyId) {
      return null;
    }

    const normalizedTenantEmail = normalizeText(tenantEmail);
    const normalizedTenantName = normalizeText(tenantName);
    if (!normalizedTenantEmail && !normalizedTenantName) {
      return null;
    }

    return bills.find((bill) => {
      if (bill.property_id !== selectedPropertyId) {
        return false;
      }

      const billEmail = normalizeText(bill.tenant_email);
      const billName = normalizeText(bill.tenant_name);

      if (normalizedTenantEmail) {
        if (billEmail) {
          return billEmail === normalizedTenantEmail;
        }
        return Boolean(normalizedTenantName) && billName === normalizedTenantName;
      }

      return billName === normalizedTenantName;
    }) || null;
  }, [bills, selectedPropertyId, tenantEmail, tenantName]);

  const selectedTenantRecord = useMemo(() => {
    const normalizedTenantEmail = normalizeText(tenantEmail);
    const normalizedTenantName = normalizeText(tenantName);
    if (!normalizedTenantEmail && !normalizedTenantName) {
      return null;
    }

    return propertyTenants.find((tenant) => {
      const tenantRecordEmail = normalizeText(tenant.tenant_email);
      const tenantRecordName = normalizeText(tenant.tenant_name);

      if (normalizedTenantEmail) {
        if (tenantRecordEmail) {
          return tenantRecordEmail === normalizedTenantEmail;
        }
        return Boolean(normalizedTenantName) && tenantRecordName === normalizedTenantName;
      }

      return tenantRecordName === normalizedTenantName;
    }) || null;
  }, [propertyTenants, tenantEmail, tenantName]);

  useEffect(() => {
    if (!selectedPropertyId) {
      return;
    }

    const tenantKey = normalizeText(tenantEmail) || normalizeText(tenantName);
    if (!tenantKey) {
      return;
    }

    const autofillKey = `${selectedPropertyId}:${tenantKey}`;
    if (usageAutofillKeyRef.current === autofillKey) {
      return;
    }
    usageAutofillKeyRef.current = autofillKey;
    if (rentAutofillKeyRef.current !== autofillKey) {
      rentAutofillKeyRef.current = autofillKey;

      if (selectedTenantRecord?.monthly_rent != null) {
        setBaseRent(String(selectedTenantRecord.monthly_rent));
      } else if (previousBillForTenant) {
        const previousSections = getBillSectionSummary(previousBillForTenant);
        setBaseRent(String(previousSections.rentPerMonth));
      } else if (selectedProperty) {
        setBaseRent(String(getEffectivePropertyRent(selectedProperty)));
      }
    }

    if (!previousBillForTenant) {
      setElectricityPreviousUnit("");
      setWaterPreviousUnit("");
      return;
    }

    const previousSections = getBillSectionSummary(previousBillForTenant);
    setElectricityPreviousUnit(String(previousSections.electricity.currentUnit));
    setWaterPreviousUnit(String(previousSections.water.currentUnit));
  }, [selectedPropertyId, tenantEmail, tenantName, previousBillForTenant, selectedTenantRecord, selectedProperty]);

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
    if (propertyTenants.length === 0) {
      throw new Error("Cannot create bill because this property has no tenant. Add a tenant first.");
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
    initializedPropertyIdRef.current = null;
    usageAutofillKeyRef.current = "";
    rentAutofillKeyRef.current = "";
    setPropertyId(value);
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

  const hasOwnedProperties = ownedProperties.length > 0;
  const selectedPropertyHasTenants = propertyTenants.length > 0;

  const mapPropertyTrackers = (entries: PropertyRecord[]) => {
    return entries.map((property) => {
      const propertyBills = bills
        .filter((bill) => bill.property_id === property.id)
        .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
      const latestBill = propertyBills[0] || null;
      const latestSections = latestBill ? getBillSectionSummary(latestBill) : null;

      return {
        property,
        propertyBills,
        latestBill,
        latestSections,
        tenantName: latestBill?.tenant_name || "No tenant assigned",
        rentPerMonth: latestSections?.rentPerMonth ?? getEffectivePropertyRent(property),
      };
    });
  };

  const ownedPropertyTrackers = useMemo(
    () => mapPropertyTrackers(ownedProperties),
    [ownedProperties, bills]
  );
  const rentedPropertyTrackers = useMemo(
    () => mapPropertyTrackers(rentedProperties),
    [rentedProperties, bills]
  );

  const selectedBillPreviewSections = useMemo(
    () => (selectedBillPreview ? getBillSectionSummary(selectedBillPreview) : null),
    [selectedBillPreview]
  );

  const selectedBillPreviewPayments = useMemo(
    () => (selectedBillPreview ? getBillPaymentSummary(selectedBillPreview) : null),
    [selectedBillPreview]
  );
  const selectedBillPreviewCanVerifyPaid = useMemo(
    () => Boolean(selectedBillPreviewPayments && selectedBillPreviewPayments.remainingAmount > 0),
    [selectedBillPreviewPayments]
  );

  const selectedBillPreviewProperty = useMemo(
    () => (selectedBillPreview ? properties.find((property) => property.id === selectedBillPreview.property_id) || null : null),
    [selectedBillPreview, properties]
  );

  const selectedBillPreviewIsTenantSide = useMemo(
    () => Boolean(selectedBillPreviewProperty && selectedBillPreviewProperty.owner_profile_id !== user.profileId),
    [selectedBillPreviewProperty, user.profileId]
  );

  const resetBillPreviewState = () => {
    setSelectedBillPreview(null);
    setBillPreviewMode("view");
    setBillPayAmount("");
    setBillPayRemarks("");
    setBillPayEvidenceFile(null);
    setBillPayError(null);
    setBillVerifyError(null);
    setBillVerifyingClaimId(null);
  };

  const applyUpdatedBill = (updatedBill: BillRecord) => {
    setBills((prev) => prev.map((bill) => (bill.id === updatedBill.id ? updatedBill : bill)));
    setSelectedBillPreview((prev) => {
      if (!prev || prev.id !== updatedBill.id) {
        return prev;
      }
      return updatedBill;
    });
  };

  const openBillPreview = (bill: BillRecord, mode: BillPreviewMode = "view") => {
    const paymentSummary = getBillPaymentSummary(bill);
    const nextMode = mode === "pay" && paymentSummary.remainingAmount <= 0 ? "view" : mode;
    setSelectedBillPreview(bill);
    setBillPreviewMode(nextMode);
    setBillPayRemarks("");
    setBillPayEvidenceFile(null);
    setBillPayError(null);
    setBillVerifyError(null);
    setBillVerifyingClaimId(null);

    if (nextMode === "pay") {
      setBillPayAmount(paymentSummary.remainingAmount.toFixed(2));
      return;
    }
    setBillPayAmount("");
  };

  const handleBillEvidenceChange = (file: File | null) => {
    setBillPayError(null);
    if (!file) {
      setBillPayEvidenceFile(null);
      return;
    }

    const supported = file.type === "application/pdf" || file.type.startsWith("image/");
    if (!supported) {
      setBillPayError("Only PDF and image evidence files are supported.");
      setBillPayEvidenceFile(null);
      return;
    }

    setBillPayEvidenceFile(file);
  };

  const handleSubmitBillPaymentClaim = async () => {
    if (!selectedBillPreview || !selectedBillPreviewPayments || !selectedBillPreviewIsTenantSide) {
      return;
    }

    setBillPayError(null);
    setBillPaySubmitting(true);

    try {
      if (selectedBillPreviewPayments.remainingAmount <= 0) {
        throw new Error("No remaining balance to verify.");
      }
      const parsedAmount = Number(billPayAmount.trim());
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Paid amount must be greater than 0.");
      }

      let evidencePayload: {
        url: string;
        mimeType: string | null;
        name: string | null;
      } | null = null;

      if (billPayEvidenceFile) {
        const uploaded = await uploadBillPaymentEvidence(selectedBillPreview.id, billPayEvidenceFile);
        evidencePayload = {
          url: uploaded.url,
          mimeType: uploaded.mimeType,
          name: uploaded.name,
        };
      }

      const updated = await submitBillPaymentClaim({
        billId: selectedBillPreview.id,
        amountPaid: parsedAmount,
        remarks: billPayRemarks.trim(),
        payer: "tenant",
        proofUrl: evidencePayload?.url,
        proofMimeType: evidencePayload?.mimeType || undefined,
        proofName: evidencePayload?.name || undefined,
      });

      applyUpdatedBill(updated);
      setBillPreviewMode("view");
      setBillPayAmount("");
      setBillPayRemarks("");
      setBillPayEvidenceFile(null);
    } catch (caughtError) {
      setBillPayError(caughtError instanceof Error ? caughtError.message : "Failed to submit paid verification");
    } finally {
      setBillPaySubmitting(false);
    }
  };

  const handleVerifyBillPaymentClaim = async (claimId: string, approve = true) => {
    if (!selectedBillPreview || selectedBillPreviewIsTenantSide) {
      return;
    }

    setBillVerifyError(null);
    setBillVerifyingClaimId(claimId);
    try {
      const updated = await verifyBillPaymentClaim({
        billId: selectedBillPreview.id,
        claimId,
        verifier: "owner",
        approve,
      });
      applyUpdatedBill(updated);
    } catch (caughtError) {
      setBillVerifyError(caughtError instanceof Error ? caughtError.message : "Failed to process payment claim");
    } finally {
      setBillVerifyingClaimId(null);
    }
  };

  const handleOpenCreateBill = async () => {
    if (!hasOwnedProperties) {
      setNoPropertyDialogOpen(true);
      return;
    }

    setCheckingTenantEligibility(true);
    try {
      let foundPropertyWithTenant = false;
      for (const property of ownedProperties) {
        const tenantData = await fetchPropertyTenants(property.id);
        if (tenantData.length > 0) {
          foundPropertyWithTenant = true;
          break;
        }
      }

      if (!foundPropertyWithTenant) {
        setNoTenantDialogOpen(true);
        return;
      }

      setCreateOpen(true);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to verify tenant eligibility for bill creation");
    } finally {
      setCheckingTenantEligibility(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold lg:text-2xl">Rent & Transactions</h1>
          <p className="text-sm text-muted-foreground">Live rent data from Supabase</p>
        </div>
        <Button onClick={() => void handleOpenCreateBill()} disabled={checkingTenantEligibility}>
          <Plus className="mr-2 h-4 w-4" />
          {checkingTenantEligibility ? "Checking..." : "Create Bill"}
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {!loading && !hasOwnedProperties && (
        <Card className="border-amber-300/60 bg-amber-50/30">
          <CardContent className="pt-6 text-sm text-amber-700">
            You do not have any owned property yet. Add a property you own to create bills.
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">Loading bills...</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bills For Your Property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ownedPropertyTrackers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No owned properties found for tracking.</p>
              ) : (
                <div className="space-y-2">
                  {ownedPropertyTrackers.map((tracker) => (
                    <div key={`owner-tracker-${tracker.property.id}`} className="rounded-md border p-3">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between text-left"
                        onClick={() => setExpandedPropertyId((prev) => (prev === tracker.property.id ? null : tracker.property.id))}
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{tracker.property.property_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {tracker.property.location || "-"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Tenant: {tracker.tenantName} | Rent: {formatNpr(tracker.rentPerMonth)}
                          </p>
                        </div>
                        {expandedPropertyId === tracker.property.id ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>

                      {expandedPropertyId === tracker.property.id ? (
                        <div className="mt-3 space-y-2 border-t pt-3">
                          {tracker.propertyBills.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No bills created yet for this property.</p>
                          ) : (
                            tracker.propertyBills.map((bill) => (
                              <div key={`owner-tracker-bill-${bill.id}`} className="rounded-md border p-3 text-sm">
                                {(() => {
                                  const paymentSummary = getBillPaymentSummary(bill);
                                  return (
                                    <>
                                      <div className="flex items-center justify-between">
                                        <div className="font-medium">{bill.tenant_name}</div>
                                        <span className="capitalize">{bill.status}</span>
                                      </div>
                                      <div className="text-xs text-muted-foreground">Bill Date (to be paid): {bill.current_month}</div>
                                      <div className="text-xs text-muted-foreground">Bill Created: {formatNepaliDateTimeFromAd(bill.created_at)}</div>
                                      <div className="text-xs text-muted-foreground">
                                        Paid Date: {bill.paid_date ? formatNepaliDateTimeFromAd(bill.paid_date) : "Not paid yet"}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {paymentSummary.surplusAmount > 0
                                          ? `Surplus: ${formatNpr(paymentSummary.surplusAmount)}`
                                          : `Remaining: ${formatNpr(paymentSummary.remainingAmount)}`}
                                      </div>
                                      <div className="flex flex-wrap gap-2 pt-2">
                                        <Button type="button" size="sm" variant="outline" onClick={() => openBillPreview(bill, "view")}>
                                          View Bill Popup
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          onClick={() => openBillPreview(bill, "verify")}
                                          disabled={paymentSummary.remainingAmount <= 0}
                                        >
                                          Verify Payment
                                        </Button>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            ))
                          )}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bills For Rent You Stay In</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rentedPropertyTrackers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No rental properties found for tracking.</p>
              ) : (
                <div className="space-y-2">
                  {rentedPropertyTrackers.map((tracker) => (
                    <div key={`renter-tracker-${tracker.property.id}`} className="rounded-md border p-3">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between text-left"
                        onClick={() => setExpandedPropertyId((prev) => (prev === tracker.property.id ? null : tracker.property.id))}
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{tracker.property.property_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {tracker.property.location || "-"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Tenant: {tracker.tenantName} | Rent: {formatNpr(tracker.rentPerMonth)}
                          </p>
                        </div>
                        {expandedPropertyId === tracker.property.id ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>

                      {expandedPropertyId === tracker.property.id ? (
                        <div className="mt-3 space-y-2 border-t pt-3">
                          {tracker.propertyBills.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No bills found for this rental property.</p>
                          ) : (
                            tracker.propertyBills.map((bill) => (
                              <div key={`renter-tracker-bill-${bill.id}`} className="rounded-md border p-3 text-sm">
                                {(() => {
                                  const paymentSummary = getBillPaymentSummary(bill);
                                  return (
                                    <>
                                      <div className="flex items-center justify-between">
                                        <div className="font-medium">{bill.tenant_name}</div>
                                        <span className="capitalize">{bill.status}</span>
                                      </div>
                                      <div className="text-xs text-muted-foreground">Bill Date (to be paid): {bill.current_month}</div>
                                      <div className="text-xs text-muted-foreground">Bill Created: {formatNepaliDateTimeFromAd(bill.created_at)}</div>
                                      <div className="text-xs text-muted-foreground">
                                        Paid Date: {bill.paid_date ? formatNepaliDateTimeFromAd(bill.paid_date) : "Not paid yet"}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {paymentSummary.surplusAmount > 0
                                          ? `Surplus: ${formatNpr(paymentSummary.surplusAmount)}`
                                          : `Remaining: ${formatNpr(paymentSummary.remainingAmount)}`}
                                      </div>
                                      <div className="flex flex-wrap gap-2 pt-2">
                                        <Button type="button" size="sm" variant="outline" onClick={() => openBillPreview(bill, "view")}>
                                          View Bill Popup
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          onClick={() => openBillPreview(bill, "pay")}
                                          disabled={paymentSummary.remainingAmount <= 0}
                                        >
                                          Verify Paid
                                        </Button>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            ))
                          )}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {bills.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">No bills yet. Create the first rent bill.</CardContent>
            </Card>
          ) : null}
        </div>
      )}

      <Dialog
        open={Boolean(selectedBillPreview)}
        onOpenChange={(open) => {
          if (!open) {
            resetBillPreviewState();
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bill Details Popup</DialogTitle>
            <DialogDescription>
              {selectedBillPreview ? `${selectedBillPreview.tenant_name} | ${selectedBillPreview.property_name}` : "Bill details"}
            </DialogDescription>
          </DialogHeader>

          {selectedBillPreview && selectedBillPreviewSections ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span>Status</span><span className="capitalize">{selectedBillPreview.status}</span></div>
              <div className="flex justify-between"><span>Bill Date (to be paid)</span><span>{selectedBillPreview.current_month}</span></div>
              <div className="flex justify-between"><span>Bill Created</span><span>{formatNepaliDateTimeFromAd(selectedBillPreview.created_at)}</span></div>
              <div className="flex justify-between"><span>Paid Date</span><span>{selectedBillPreview.paid_date ? formatNepaliDateTimeFromAd(selectedBillPreview.paid_date) : "Not paid yet"}</span></div>

              <div className="flex justify-between"><span>Rent (per month)</span><span>{formatNpr(selectedBillPreviewSections.rentPerMonth)}</span></div>
              <div className="flex justify-between"><span>Due</span><span>{formatNpr(selectedBillPreviewSections.due)}</span></div>
              <div className="flex justify-between"><span>Penalty</span><span>{formatNpr(selectedBillPreviewSections.penalty)}</span></div>

              <div className="rounded-md border px-2 py-1 text-xs">
                <div className="flex justify-between"><span>Electricity bill</span><span>{formatNpr(selectedBillPreviewSections.electricity.amount)}</span></div>
                <div className="text-muted-foreground">
                  Prev: {selectedBillPreviewSections.electricity.previousUnit} | Current: {selectedBillPreviewSections.electricity.currentUnit} | Rate: {selectedBillPreviewSections.electricity.rate}
                </div>
              </div>

              <div className="rounded-md border px-2 py-1 text-xs">
                <div className="flex justify-between"><span>Water bill</span><span>{formatNpr(selectedBillPreviewSections.water.amount)}</span></div>
                <div className="text-muted-foreground">
                  Prev: {selectedBillPreviewSections.water.previousUnit} | Current: {selectedBillPreviewSections.water.currentUnit} | Rate: {selectedBillPreviewSections.water.rate}
                </div>
              </div>

              <div className="flex justify-between"><span>Wifi</span><span>{formatNpr(selectedBillPreviewSections.wifi)}</span></div>
              <div className="rounded-md border px-2 py-1 text-xs">
                <div className="flex justify-between"><span>Others</span><span>{formatNpr(selectedBillPreviewSections.othersTotal)}</span></div>
                {selectedBillPreviewSections.others.length > 0 ? (
                  selectedBillPreviewSections.others.map((charge, index) => (
                    <div key={`${selectedBillPreview.id}-${charge.name}-${index}`} className="flex justify-between text-muted-foreground">
                      <span>{charge.name}</span>
                      <span>{formatNpr(charge.amount)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground">No additional charges</div>
                )}
              </div>

              <div className="flex justify-between font-semibold"><span>Total</span><span>{formatNpr(selectedBillPreviewSections.total)}</span></div>
              {selectedBillPreviewPayments ? (
                <>
                  <div className="space-y-2 rounded-md border px-2 py-2 text-xs">
                    {selectedBillPreviewIsTenantSide ? (
                      billPreviewMode === "pay" ? (
                        <>
                          <div className="flex justify-between"><span>Total Paid</span><span>{formatNpr(selectedBillPreviewPayments.totalPaid)}</span></div>
                          <div className="flex justify-between">
                            <span>{selectedBillPreviewPayments.surplusAmount > 0 ? "Surplus" : "Remaining"}</span>
                            <span>
                              {formatNpr(
                                selectedBillPreviewPayments.surplusAmount > 0
                                  ? selectedBillPreviewPayments.surplusAmount
                                  : selectedBillPreviewPayments.remainingAmount
                              )}
                            </span>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setBillPreviewMode("view");
                              setBillPayError(null);
                            }}
                          >
                            Hide
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          disabled={!selectedBillPreviewCanVerifyPaid}
                          onClick={() => {
                            setBillPreviewMode("pay");
                            if (!billPayAmount.trim()) {
                              setBillPayAmount(selectedBillPreviewPayments.remainingAmount.toFixed(2));
                            }
                          }}
                        >
                          Verify Paid
                        </Button>
                      )
                    ) : (
                      <>
                        <div className="flex justify-between"><span>Total Paid</span><span>{formatNpr(selectedBillPreviewPayments.totalPaid)}</span></div>
                        <div className="flex justify-between">
                          <span>{selectedBillPreviewPayments.surplusAmount > 0 ? "Surplus" : "Remaining"}</span>
                          <span>
                            {formatNpr(
                              selectedBillPreviewPayments.surplusAmount > 0
                                ? selectedBillPreviewPayments.surplusAmount
                                : selectedBillPreviewPayments.remainingAmount
                            )}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {selectedBillPreviewIsTenantSide && billPreviewMode === "pay" ? (
                    <div className="space-y-2 rounded-md border px-2 py-2 text-xs">
                      <p className="text-muted-foreground">
                        Suggested amount is the current remaining balance. You can edit it before submitting.
                      </p>
                      <div className="space-y-1">
                        <Label className="text-xs">Amount Paid (NPR)</Label>
                        <Input
                          min={0}
                          type="number"
                          value={billPayAmount}
                          onChange={(event) => setBillPayAmount(event.target.value)}
                          placeholder="e.g. 5000"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Remarks</Label>
                        <Textarea
                          value={billPayRemarks}
                          onChange={(event) => setBillPayRemarks(event.target.value)}
                          placeholder="Optional notes about this payment"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Evidence (optional)</Label>
                        <Input
                          type="file"
                          accept="application/pdf,image/*"
                          onChange={(event) => handleBillEvidenceChange(event.target.files?.[0] || null)}
                        />
                      </div>
                      {billPayError ? <p className="text-sm text-destructive">{billPayError}</p> : null}
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSubmitBillPaymentClaim}
                        disabled={billPaySubmitting || !selectedBillPreviewCanVerifyPaid}
                      >
                        {billPaySubmitting ? "Saving..." : "Verify Paid"}
                      </Button>
                    </div>
                  ) : null}

                  <div className="space-y-2 rounded-md border px-2 py-2 text-xs">
                    <p className="font-medium">Pending Payment Claims</p>
                    {selectedBillPreviewPayments.pendingClaims.length === 0 ? (
                      <p className="text-muted-foreground">No pending payment claims.</p>
                    ) : (
                      selectedBillPreviewPayments.pendingClaims.map((claim) => (
                        <div key={claim.id} className="rounded-md border px-2 py-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{formatNpr(claim.amount)}</span>
                            <span className="capitalize">{claim.payer}</span>
                          </div>
                          <div className="text-muted-foreground">Claimed: {formatNepaliDateTimeFromAd(claim.claimedAt)}</div>
                          {claim.remarks ? <div className="text-muted-foreground">Remarks: {claim.remarks}</div> : null}
                          {claim.proofUrl ? (
                            <a href={claim.proofUrl} target="_blank" rel="noreferrer" className="underline">
                              View Evidence
                            </a>
                          ) : null}
                          {!selectedBillPreviewIsTenantSide ? (
                            <div className="flex gap-2 pt-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleVerifyBillPaymentClaim(claim.id, true)}
                                disabled={billVerifyingClaimId === claim.id || selectedBillPreviewPayments.remainingAmount <= 0}
                              >
                                {billVerifyingClaimId === claim.id ? "Processing..." : "Verify Payment"}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleVerifyBillPaymentClaim(claim.id, false)}
                                disabled={billVerifyingClaimId === claim.id || selectedBillPreviewPayments.remainingAmount <= 0}
                              >
                                {billVerifyingClaimId === claim.id ? "Processing..." : "Not Received"}
                              </Button>
                            </div>
                          ) : (
                            <div className="pt-2 text-muted-foreground">Waiting for owner verification.</div>
                          )}
                        </div>
                      ))
                    )}
                    {billVerifyError ? <p className="text-sm text-destructive">{billVerifyError}</p> : null}
                  </div>

                  <div className="space-y-2 rounded-md border px-2 py-2 text-xs">
                    <p className="font-medium">Payment History</p>
                    {selectedBillPreviewPayments.history.length === 0 ? (
                      <p className="text-muted-foreground">No payment history yet.</p>
                    ) : (
                      selectedBillPreviewPayments.history.map((entry, index) => (
                        <div key={`history-${selectedBillPreview.id}-${index}`} className="rounded-md border px-2 py-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{formatNpr(entry.amount)}</span>
                            <span className="capitalize">{entry.payer}</span>
                          </div>
                          <div className="text-muted-foreground">Paid: {formatNepaliDateTimeFromAd(entry.paidAt)}</div>
                          <div className="text-muted-foreground">
                            {entry.surplusAmount > 0
                              ? `Surplus: ${formatNpr(entry.surplusAmount)}`
                              : `Remaining: ${formatNpr(entry.remainingAmount)}`}
                          </div>
                          {entry.remarks ? <div className="text-muted-foreground">Remarks: {entry.remarks}</div> : null}
                          {entry.proofUrl ? (
                            <a href={entry.proofUrl} target="_blank" rel="noreferrer" className="underline">
                              View Evidence
                            </a>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            {selectedBillPreview ? (
              <Button asChild variant="outline">
                <Link href={`/transactions/${selectedBillPreview.id}`}>Open Full Details Page</Link>
              </Button>
            ) : null}
            <Button variant="outline" onClick={resetBillPreviewState}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  {ownedProperties.map((property) => (
                    <SelectItem key={property.id} value={String(property.id)}>
                      {property.property_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProperty && !selectedPropertyHasTenants && (
              <Card className="border-amber-300/60 bg-amber-50/30">
                <CardContent className="pt-6 text-sm text-amber-700">
                  Bill creation is disabled for this property because it has no tenant yet. Add a tenant first.
                </CardContent>
              </Card>
            )}

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
                Electricity Total: {formatNpr(electricityAmount)}
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
                Water Total: {formatNpr(waterAmount)}
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
                Total: <span className="font-semibold">{formatNpr(total)}</span>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateBill} disabled={submitting || !selectedProperty || !selectedPropertyHasTenants}>
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
              You do not have any owned property yet. Please add a property you own before creating a bill.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoPropertyDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={noTenantDialogOpen} onOpenChange={setNoTenantDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cannot Create Bill</DialogTitle>
            <DialogDescription>
              None of your owned properties has a tenant yet. Add a tenant to a property before creating bills.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoTenantDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
