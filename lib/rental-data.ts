import { getSupabaseBrowserClient, getSupabaseStorageBucket } from "@/lib/supabase-client";
import { adToBs, bsToAd } from "@/lib/date-utils";

export type PropertyImageRecord = {
  id: number;
  property_id: number;
  label?: string | null;
  path?: string | null;
  url: string;
  mime_type?: string | null;
  created_at?: string;
};

export type PropertyRecord = {
  id: number;
  property_code?: string | null;
  owner_profile_id?: string | null;
  property_name: string;
  property_type: string;
  currency: string;
  price: number;
  desired_rent?: number | null;
  interval: string;
  location?: string | null;
  bedrooms?: number | null;
  sqft?: number | null;
  description?: string | null;
  property_images?: PropertyImageRecord[];
  property_tenants?: Array<{
    monthly_rent?: number | null;
    status?: string | null;
  }>;
};

export type PropertyTenantRecord = {
  id: number;
  property_id: number;
  tenant_profile_id?: string | null;
  tenant_name: string;
  tenant_email?: string | null;
  tenant_phone?: string | null;
  monthly_rent?: number | null;
  date_joined?: string | null;
  date_end?: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
};

export type BillCustomFieldRecord = {
  id: number;
  bill_id: number;
  name: string;
  amount: number;
  created_at?: string;
};

export type BillRecord = {
  id: number;
  property_id: number;
  property_name: string;
  tenant_name: string;
  tenant_email?: string | null;
  current_month: string;
  base_rent: number;
  confirmed_rent: number;
  paid_date?: string | null;
  payment_method?: string | null;
  proof_url?: string | null;
  breakdown: {
    rentPerMonth?: number;
    baseRent?: number;
    due?: number;
    penalty?: number;
    electricity?: { amount?: number; previousUnit?: number; currentUnit?: number; rate?: number } | number;
    water?: { amount?: number; previousUnit?: number; currentUnit?: number; rate?: number } | number;
    wifi?: number;
    internet?: number;
    others?: Record<string, number>;
    [key: string]: unknown;
  };
  total: number;
  status: string;
  created_at: string;
  updated_at?: string;
  bill_custom_fields?: BillCustomFieldRecord[];
};

export type CreatePropertyInput = {
  propertyName: string;
  propertyType: string;
  currency: string;
  price: number;
  desiredRent: number;
  interval: string;
  location: string;
  bedrooms: number;
  sqft?: number | null;
  description: string;
  ownerProfileId?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerAppUserId?: string;
  ownerAuthUserId?: string;
  images: Array<{
    file: File;
    label: string;
  }>;
};

type CreateBillInput = {
  propertyId: number;
  propertyName: string;
  tenantName: string;
  tenantEmail?: string;
  currentMonth: string;
  billingInterval?: string;
  rentPerMonth?: number;
  baseRent?: number;
  confirmedRent?: number;
  due?: number;
  penalty?: number;
  electricity?: { amount?: number; previousUnit?: number; currentUnit?: number; rate?: number };
  water?: { amount?: number; previousUnit?: number; currentUnit?: number; rate?: number };
  wifi?: number;
  internet?: number;
  others?: Record<string, unknown>;
  otherCharges?: Record<string, unknown>;
  customFields?: Array<{ name: string; amount: number }>;
  total?: number;
  status?: "pending" | "paid" | "overdue" | "verified";
};

export type BillUsageBreakdown = {
  amount: number;
  previousUnit: number;
  currentUnit: number;
  rate: number;
};

export type BillSectionSummary = {
  rentPerMonth: number;
  due: number;
  penalty: number;
  electricity: BillUsageBreakdown;
  water: BillUsageBreakdown;
  wifi: number;
  others: Array<{ name: string; amount: number }>;
  othersTotal: number;
  computedTotal: number;
  total: number;
};

export type CreatePropertyTenantInput = {
  propertyId: number;
  tenantName: string;
  tenantEmail?: string;
  tenantPhone?: string;
  monthlyRent?: number;
  dateJoined: string;
};

export type CreatePropertyTenantByUserIdInput = {
  propertyId: number;
  tenantAppUserId: string;
  monthlyRent?: number;
  dateJoined: string;
};

export type TenantInviteRequest = {
  id: number;
  propertyId: number;
  propertyCode: string | null;
  propertyName: string;
  propertyLocation: string;
  propertyRent: number | null;
  propertyImageUrl: string | null;
  ownerName: string;
  ownerEmail: string;
  tenantName: string;
  tenantEmail: string;
  monthlyRent: number | null;
  dateJoined: string | null;
  createdAt: string;
};

export type OwnerApprovalRequest = {
  id: number;
  propertyId: number;
  propertyCode: string | null;
  propertyName: string;
  propertyLocation: string;
  propertyRent: number | null;
  propertyImageUrl: string | null;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  createdAt: string;
};

export type BillPaymentEntry = {
  claimId?: string | null;
  amount: number;
  remarks: string;
  paidAt: string;
  payer: "tenant" | "owner";
  remainingAmount: number;
  surplusAmount: number;
  proofUrl?: string | null;
  proofMimeType?: string | null;
  proofName?: string | null;
};

export type BillPaymentClaimStatus = "pending" | "verified" | "rejected";

export type BillPaymentClaim = {
  id: string;
  amount: number;
  remarks: string;
  claimedAt: string;
  payer: "tenant" | "owner";
  status: BillPaymentClaimStatus;
  verifiedAt?: string | null;
  verifiedBy?: "tenant" | "owner" | null;
  proofUrl?: string | null;
  proofMimeType?: string | null;
  proofName?: string | null;
};

export type BillPaymentSummary = {
  totalPaid: number;
  remainingAmount: number;
  surplusAmount: number;
  history: BillPaymentEntry[];
  pendingClaims: BillPaymentClaim[];
};

export type SubmitBillPaymentClaimInput = {
  billId: number;
  amountPaid: number;
  remarks?: string;
  payer: "tenant" | "owner";
  proofUrl?: string;
  proofMimeType?: string;
  proofName?: string;
};

export type VerifyBillPaymentClaimInput = {
  billId: number;
  claimId: string;
  verifier: "tenant" | "owner";
  approve?: boolean;
};

export type NotificationRecord = {
  id: number;
  profile_id: string;
  type: "bill_created" | "payment_verified_by_owner" | "payment_verified_by_tenant";
  title: string;
  message: string;
  related_bill_id: number | null;
  related_property_id: number | null;
  read: boolean;
  created_at: string;
};

export type ConnectTenantToPropertyByCodeInput = {
  propertyCode: string;
  tenantName: string;
  tenantEmail?: string;
  tenantPhone?: string;
  tenantProfileId?: string;
};

export type ConnectTenantToPropertyByCodeResult = {
  property: Pick<PropertyRecord, "id" | "property_name" | "property_code">;
  tenant: PropertyTenantRecord;
};

type CreatePropertyResult = {
  property: PropertyRecord;
};

const descriptionMaxWords = 150;

function toNumber(value: unknown, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function toNonNegativeNumber(value: unknown, fallback = 0) {
  const num = toNumber(value, fallback);
  if (!Number.isFinite(num) || num < 0) {
    return Math.max(0, fallback);
  }
  return num;
}

function toCurrencyAmount(value: unknown) {
  return Math.round(toNonNegativeNumber(value) * 100) / 100;
}

async function compressImageFileForUpload(file: File) {
  if (!file.type.startsWith("image/")) {
    return file;
  }
  if (typeof document === "undefined" || typeof URL === "undefined" || typeof File === "undefined") {
    return file;
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Failed to load image."));
      element.src = objectUrl;
    });

    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    if (!width || !height) {
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      return file;
    }
    context.drawImage(image, 0, 0, width, height);

    const compressedBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", 0.82);
    });

    if (!compressedBlob || compressedBlob.size >= file.size) {
      return file;
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "evidence";
    return new File([compressedBlob], `${baseName}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function prepareFileForUpload(file: File) {
  return compressImageFileForUpload(file);
}

export function getEffectivePropertyRent(property: Pick<PropertyRecord, "desired_rent" | "price" | "property_tenants"> | null | undefined) {
  if (!property) {
    return 0;
  }

  const tenants = property.property_tenants || [];
  const activeTenant = tenants.find((tenant) => tenant.status === "active" && tenant.monthly_rent != null);
  const pendingOwnerInvite = tenants.find(
    (tenant) => tenant.status === "pending_tenant_confirmation" && tenant.monthly_rent != null
  );
  const firstAvailableTenantRent = tenants.find((tenant) => tenant.monthly_rent != null);

  return toNonNegativeNumber(
    activeTenant?.monthly_rent ??
      pendingOwnerInvite?.monthly_rent ??
      firstAvailableTenantRent?.monthly_rent ??
      property.desired_rent ??
      property.price ??
      0
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function toBalancePair(remainingValue: unknown, surplusValue: unknown, fallbackDiff = 0) {
  const rawRemaining = Number(remainingValue);
  const rawSurplus = Number(surplusValue);

  if (Number.isFinite(rawRemaining) || Number.isFinite(rawSurplus)) {
    const normalizedRemaining = Number.isFinite(rawRemaining) ? rawRemaining : 0;
    const normalizedSurplus = Number.isFinite(rawSurplus) ? rawSurplus : 0;

    if (normalizedRemaining < 0) {
      return {
        remainingAmount: 0,
        surplusAmount: Math.max(Math.abs(normalizedRemaining), normalizedSurplus, 0),
      };
    }

    return {
      remainingAmount: Math.max(normalizedRemaining, 0),
      surplusAmount: Math.max(normalizedSurplus, 0),
    };
  }

  if (fallbackDiff >= 0) {
    return {
      remainingAmount: fallbackDiff,
      surplusAmount: 0,
    };
  }

  return {
    remainingAmount: 0,
    surplusAmount: Math.abs(fallbackDiff),
  };
}

function toBillPaymentEntry(value: unknown): BillPaymentEntry | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const amount = toNonNegativeNumber(record.amount);
  if (amount <= 0) {
    return null;
  }

  const paidAt = asString(record.paidAt, "");
  const payer = record.payer === "owner" ? "owner" : "tenant";
  const balance = toBalancePair(record.remainingAmount, record.surplusAmount);

  return {
    claimId: asString(record.claimId, "") || null,
    amount,
    remarks: asString(record.remarks, "").trim(),
    paidAt,
    payer,
    remainingAmount: balance.remainingAmount,
    surplusAmount: balance.surplusAmount,
    proofUrl: asString(record.proofUrl, "") || null,
    proofMimeType: asString(record.proofMimeType, "") || null,
    proofName: asString(record.proofName, "") || null,
  };
}

function toBillPaymentClaim(value: unknown): BillPaymentClaim | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const id = asString(record.id, "").trim();
  const amount = toNonNegativeNumber(record.amount);
  if (!id || amount <= 0) {
    return null;
  }

  const payer = record.payer === "owner" ? "owner" : "tenant";
  const status: BillPaymentClaimStatus =
    record.status === "verified" || record.status === "rejected" ? record.status : "pending";

  return {
    id,
    amount,
    remarks: asString(record.remarks, "").trim(),
    claimedAt: asString(record.claimedAt, "") || asString(record.paidAt, ""),
    payer,
    status,
    verifiedAt: asString(record.verifiedAt, "") || null,
    verifiedBy: record.verifiedBy === "owner" || record.verifiedBy === "tenant" ? record.verifiedBy : null,
    proofUrl: asString(record.proofUrl, "") || null,
    proofMimeType: asString(record.proofMimeType, "") || null,
    proofName: asString(record.proofName, "") || null,
  };
}

function toUsageBreakdown(value: unknown): BillUsageBreakdown {
  if (typeof value === "number") {
    return {
      amount: toNonNegativeNumber(value),
      previousUnit: 0,
      currentUnit: 0,
      rate: 0,
    };
  }

  const record = asRecord(value);
  if (!record) {
    return {
      amount: 0,
      previousUnit: 0,
      currentUnit: 0,
      rate: 0,
    };
  }

  const previousUnit = toNonNegativeNumber(record.previousUnit);
  const currentUnit = toNonNegativeNumber(record.currentUnit);
  const rate = toNonNegativeNumber(record.rate);
  const computedAmount = Math.max(currentUnit - previousUnit, 0) * rate;

  return {
    amount: toNonNegativeNumber(record.amount, computedAmount),
    previousUnit,
    currentUnit,
    rate,
  };
}

function extractOtherCharges(bill: BillRecord, breakdown: Record<string, unknown>) {
  const othersMap = new Map<string, number>();

  const addCharge = (name: string, amount: unknown) => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      return;
    }
    othersMap.set(normalizedName, toNonNegativeNumber(amount));
  };

  const explicitOthers = asRecord(breakdown.others);
  if (explicitOthers) {
    Object.entries(explicitOthers).forEach(([name, amount]) => addCharge(name, amount));
  }

  const knownKeys = new Set([
    "rentPerMonth",
    "baseRent",
    "due",
    "penalty",
    "billingInterval",
    "electricity",
    "water",
    "wifi",
    "internet",
    "others",
  ]);

  Object.entries(breakdown)
    .filter(([key, value]) => !knownKeys.has(key) && typeof value === "number")
    .forEach(([name, amount]) => addCharge(name, amount));

  (bill.bill_custom_fields || []).forEach((field) => {
    addCharge(field.name, field.amount);
  });

  const others = Array.from(othersMap.entries()).map(([name, amount]) => ({ name, amount }));
  const othersTotal = others.reduce((sum, charge) => sum + charge.amount, 0);

  return { others, othersTotal };
}

export function getBillSectionSummary(bill: BillRecord): BillSectionSummary {
  const breakdown = asRecord(bill.breakdown) || {};
  const rentPerMonth = toNonNegativeNumber(
    breakdown.rentPerMonth,
    toNonNegativeNumber(breakdown.baseRent, toNonNegativeNumber(bill.confirmed_rent, toNonNegativeNumber(bill.base_rent)))
  );
  const due = toNonNegativeNumber(breakdown.due);
  const penalty = toNonNegativeNumber(breakdown.penalty, due * 0.1);
  const electricity = toUsageBreakdown(breakdown.electricity);
  const water = toUsageBreakdown(breakdown.water);
  const wifi = toNonNegativeNumber(breakdown.wifi, toNonNegativeNumber(breakdown.internet));
  const { others, othersTotal } = extractOtherCharges(bill, breakdown);

  const computedTotal = rentPerMonth + due + penalty + electricity.amount + water.amount + wifi + othersTotal;
  const total = toNonNegativeNumber(bill.total, computedTotal);

  return {
    rentPerMonth,
    due,
    penalty,
    electricity,
    water,
    wifi,
    others,
    othersTotal,
    computedTotal,
    total,
  };
}

export function getBillPaymentSummary(bill: BillRecord): BillPaymentSummary {
  const breakdown = asRecord(bill.breakdown) || {};
  const legacyHistory = Array.isArray(breakdown.paymentHistory)
    ? breakdown.paymentHistory.map((entry) => toBillPaymentEntry(entry)).filter(Boolean) as BillPaymentEntry[]
    : [];
  const claims = Array.isArray(breakdown.paymentClaims)
    ? breakdown.paymentClaims.map((claim) => toBillPaymentClaim(claim)).filter(Boolean) as BillPaymentClaim[]
    : [];
  const pendingClaims = claims
    .filter((claim) => claim.status === "pending")
    .sort((a, b) => +new Date(b.claimedAt || 0) - +new Date(a.claimedAt || 0));

  const claimHistory = claims
    .filter((claim) => claim.status === "verified")
    .map((claim) => ({
      claimId: claim.id,
      amount: claim.amount,
      remarks: claim.remarks,
      paidAt: claim.verifiedAt || claim.claimedAt,
      payer: claim.payer,
      remainingAmount: 0,
      surplusAmount: 0,
      proofUrl: claim.proofUrl || null,
      proofMimeType: claim.proofMimeType || null,
      proofName: claim.proofName || null,
    })) as BillPaymentEntry[];

  const history = [...legacyHistory, ...claimHistory]
    .sort((a, b) => +new Date(b.paidAt || 0) - +new Date(a.paidAt || 0));

  const fallbackTotalPaid = history.reduce((sum, entry) => sum + entry.amount, 0);
  const totalPaid = toNonNegativeNumber(breakdown.totalPaid, fallbackTotalPaid);
  const balanceDiff = toNumber(bill.total) - totalPaid;
  const normalizedBalance = toBalancePair(breakdown.remainingAmount, breakdown.surplusAmount, balanceDiff);

  const normalizedHistory = history.map((entry) => ({
    ...entry,
    ...toBalancePair(entry.remainingAmount, entry.surplusAmount, balanceDiff),
  }));

  return {
    totalPaid,
    remainingAmount: normalizedBalance.remainingAmount,
    surplusAmount: normalizedBalance.surplusAmount,
    history: normalizedHistory,
    pendingClaims,
  };
}

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function assertNonNegativeNumber(value: number, name: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a non-negative number.`);
  }
}

function validateCreateBillInput(input: CreateBillInput) {
  if (!Number.isFinite(input.propertyId) || input.propertyId <= 0) {
    throw new Error("Valid property is required.");
  }
  if (!input.propertyName.trim()) {
    throw new Error("Property name is required.");
  }
  if (!input.tenantName.trim()) {
    throw new Error("Tenant name is required.");
  }
  if (!input.currentMonth.trim()) {
    throw new Error("Billing date is required.");
  }

  assertNonNegativeNumber(toNumber(input.baseRent), "Base rent");
  assertNonNegativeNumber(toNumber(input.confirmedRent ?? input.baseRent), "Confirmed rent");
  assertNonNegativeNumber(toNumber(input.due), "Due");
  assertNonNegativeNumber(toNumber(input.penalty), "Penalty");
  assertNonNegativeNumber(toNumber(input.wifi ?? input.internet), "Wifi");
  assertNonNegativeNumber(toNumber(input.internet), "Internet");
  assertNonNegativeNumber(toNumber(input.total), "Total");

  if (input.electricity) {
    assertNonNegativeNumber(toNumber(input.electricity.amount), "Electricity amount");
    assertNonNegativeNumber(toNumber(input.electricity.previousUnit), "Electricity previous unit");
    assertNonNegativeNumber(toNumber(input.electricity.currentUnit), "Electricity current unit");
    assertNonNegativeNumber(toNumber(input.electricity.rate), "Electricity rate");

    if (toNumber(input.electricity.currentUnit) < toNumber(input.electricity.previousUnit)) {
      throw new Error("Electricity current unit must be greater than or equal to previous unit.");
    }
  }

  if (input.water) {
    assertNonNegativeNumber(toNumber(input.water.amount), "Water amount");
    assertNonNegativeNumber(toNumber(input.water.previousUnit), "Water previous unit");
    assertNonNegativeNumber(toNumber(input.water.currentUnit), "Water current unit");
    assertNonNegativeNumber(toNumber(input.water.rate), "Water rate");

    if (toNumber(input.water.currentUnit) < toNumber(input.water.previousUnit)) {
      throw new Error("Water current unit must be greater than or equal to previous unit.");
    }
  }

  (input.customFields || []).forEach((field, index) => {
    if (!field.name.trim()) {
      throw new Error(`Other charge label is required at row ${index + 1}.`);
    }
    assertNonNegativeNumber(toNumber(field.amount), `Other charge amount for ${field.name}`);
  });
}

function validateCreatePropertyInput(input: CreatePropertyInput) {
  if (!input.propertyName.trim()) throw new Error("Property name is required.");
  if (!input.propertyType.trim()) throw new Error("Property type is required.");
  if (!input.currency.trim()) throw new Error("Currency is required.");
  if (!input.interval.trim()) throw new Error("Interval is required.");
  if (!input.location.trim()) throw new Error("Location is required.");
  if (!input.description.trim()) throw new Error("Description is required.");

  if (countWords(input.description) > descriptionMaxWords) {
    throw new Error(`Description must be ${descriptionMaxWords} words or fewer.`);
  }

  assertNonNegativeNumber(input.price, "Price");
  assertNonNegativeNumber(input.desiredRent, "Monthly rent");
  assertNonNegativeNumber(input.bedrooms, "Bedrooms");

  const normalizedPropertyType = input.propertyType.trim().toLowerCase();
  if (["flat", "house", "bnb"].includes(normalizedPropertyType)) {
    if (!Number.isInteger(input.bedrooms) || input.bedrooms < 1 || input.bedrooms > 8) {
      throw new Error("BHK type must be between 1BHK and 8BHK for flat, house, and BNB properties.");
    }
  }

  if (typeof input.sqft === "number") {
    assertNonNegativeNumber(input.sqft, "Square feet");
  }

  if (!Array.isArray(input.images) || input.images.length === 0) {
    throw new Error("At least one image is required.");
  }

  input.images.forEach((image, index) => {
    if (!image.file) {
      throw new Error(`Image ${index + 1} file is required.`);
    }
    if (!image.label.trim()) {
      throw new Error(`Image ${index + 1} description is required.`);
    }
  });
}

async function resolveOwnerProfileId(input: CreatePropertyInput) {
  const supabase = getSupabaseBrowserClient();
  const ownerEmail = input.ownerEmail?.trim();
  if (!ownerEmail) {
    return null;
  }

  const payload: Record<string, string> = {
    email: ownerEmail,
    name: input.ownerName?.trim() || ownerEmail.split("@")[0],
  };
  const ownerAppUserId = input.ownerAppUserId?.trim();
  const ownerAuthUserId = input.ownerAuthUserId?.trim();
  if (ownerAppUserId) {
    payload.app_user_id = ownerAppUserId;
  }
  if (ownerAuthUserId) {
    payload.auth_user_id = ownerAuthUserId;
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "email" })
    .select("id")
    .single();

  if (error) {
    console.warn("Failed to link owner profile:", error.message);
    return null;
  }

  return data?.id || null;
}

async function resolveCurrentProfileId() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("current_profile_id");
  if (!error && typeof data === "string" && data.trim()) {
    return data;
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError) {
    throw new Error(sessionError.message || "Failed to read session");
  }

  const authUserId = session?.user?.id;
  if (!authUserId) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message || "Failed to resolve current profile");
  }

  return profile?.id || null;
}

async function fetchAccessiblePropertyIds(profileId: string) {
  const supabase = getSupabaseBrowserClient();
  const [ownedResult, tenantResult] = await Promise.all([
    supabase.from("properties").select("id").eq("owner_profile_id", profileId),
    supabase
      .from("property_tenants")
      .select("property_id")
      .eq("tenant_profile_id", profileId)
      .eq("status", "active"),
  ]);

  if (ownedResult.error) {
    throw new Error(ownedResult.error.message || "Failed to load owned properties");
  }
  if (tenantResult.error) {
    throw new Error(tenantResult.error.message || "Failed to load tenant properties");
  }

  const ids = new Set<number>();
  (ownedResult.data || []).forEach((row) => {
    const id = Number(row.id);
    if (Number.isFinite(id) && id > 0) {
      ids.add(id);
    }
  });
  (tenantResult.data || []).forEach((row) => {
    const id = Number(row.property_id);
    if (Number.isFinite(id) && id > 0) {
      ids.add(id);
    }
  });

  return Array.from(ids);
}

export async function fetchProperties() {
  const supabase = getSupabaseBrowserClient();
  const profileId = await resolveCurrentProfileId();
  if (!profileId) {
    return [];
  }

  const accessiblePropertyIds = await fetchAccessiblePropertyIds(profileId);
  if (accessiblePropertyIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("properties")
    .select("*, property_images(*), property_tenants(monthly_rent, status)")
    .in("id", accessiblePropertyIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to fetch properties");
  }

  return (data || []) as PropertyRecord[];
}

export async function createProperty(input: CreatePropertyInput): Promise<CreatePropertyResult> {
  validateCreatePropertyInput(input);

  const supabase = getSupabaseBrowserClient();
  const currentProfileId = await resolveCurrentProfileId();
  const ownerProfileId =
    currentProfileId ||
    input.ownerProfileId?.trim() ||
    await resolveOwnerProfileId(input);
  if (!ownerProfileId) {
    throw new Error("Your account profile is not ready yet. Please close this window and try again.");
  }

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .insert({
      owner_profile_id: ownerProfileId,
      property_name: input.propertyName,
      property_type: input.propertyType,
      currency: input.currency,
      price: input.price,
      desired_rent: input.desiredRent,
      interval: input.interval,
      location: input.location,
      bedrooms: input.bedrooms,
      sqft: input.sqft,
      description: input.description,
    })
    .select("*")
    .single();

  if (propertyError || !property) {
    throw new Error(propertyError?.message || "Failed to create property");
  }

  try {
    const bucket = getSupabaseStorageBucket();
    const uploadedRows: Array<{
      property_id: number;
      label: string;
      path: string;
      url: string;
      mime_type: string;
    }> = [];

    for (let index = 0; index < input.images.length; index += 1) {
      const image = input.images[index];
      const uploadFile = await prepareFileForUpload(image.file);
      const safeName = uploadFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `properties/${property.id}/${Date.now()}-${index}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, uploadFile, {
          contentType: uploadFile.type || "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message || "Storage upload failed");
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(path);

      uploadedRows.push({
        property_id: property.id,
        label: image.label.trim(),
        path,
        url: publicUrl,
        mime_type: uploadFile.type || "image/jpeg",
      });
    }

    const { error: imageInsertError } = await supabase.from("property_images").insert(uploadedRows);
    if (imageInsertError) {
      throw new Error(imageInsertError.message || "Failed to save image metadata");
    }
  } catch (imageError) {
    const { error: cleanupError } = await supabase.from("properties").delete().eq("id", property.id);
    if (cleanupError) {
      throw new Error(
        `Image upload failed and cleanup failed. Property may exist without images. ${String(imageError)}`
      );
    }
    throw new Error(`Image upload failed. Property was not saved. ${String(imageError)}`);
  }

  const { data: fullProperty } = await supabase
    .from("properties")
    .select("*, property_images(*)")
    .eq("id", property.id)
    .single();

  return {
    property: (fullProperty || property) as PropertyRecord,
  };
}

type BillFilter = {
  propertyId?: number;
  status?: string;
  month?: string;
};

export async function fetchBills(filter: BillFilter = {}) {
  const supabase = getSupabaseBrowserClient();
  const profileId = await resolveCurrentProfileId();
  if (!profileId) {
    return [];
  }

  const accessiblePropertyIds = await fetchAccessiblePropertyIds(profileId);
  if (accessiblePropertyIds.length === 0) {
    return [];
  }

  const filteredPropertyIds =
    typeof filter.propertyId === "number"
      ? accessiblePropertyIds.includes(filter.propertyId)
        ? [filter.propertyId]
        : []
      : accessiblePropertyIds;

  if (filteredPropertyIds.length === 0) {
    return [];
  }

  let query = supabase
    .from("bills")
    .select("*, bill_custom_fields(*)")
    .in("property_id", filteredPropertyIds)
    .order("created_at", { ascending: false });

  if (filter.status) {
    query = query.eq("status", filter.status);
  }

  if (filter.month) {
    query = query.eq("current_month", filter.month);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || "Failed to fetch bills");
  }

  return (data || []) as BillRecord[];
}

export async function fetchBillById(billId: number) {
  if (!Number.isFinite(billId) || billId <= 0) {
    throw new Error("Valid bill ID is required.");
  }

  const supabase = getSupabaseBrowserClient();
  const profileId = await resolveCurrentProfileId();
  if (!profileId) {
    throw new Error("You must be logged in to view this bill.");
  }

  const accessiblePropertyIds = await fetchAccessiblePropertyIds(profileId);
  if (accessiblePropertyIds.length === 0) {
    throw new Error("You do not have access to this bill.");
  }

  const { data, error } = await supabase
    .from("bills")
    .select("*, bill_custom_fields(*)")
    .eq("id", billId)
    .in("property_id", accessiblePropertyIds)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to fetch bill");
  }
  if (!data) {
    throw new Error("Bill not found.");
  }

  return data as BillRecord;
}

export async function uploadBillPaymentEvidence(billId: number, file: File) {
  if (!Number.isFinite(billId) || billId <= 0) {
    throw new Error("Valid bill ID is required.");
  }
  if (!file) {
    throw new Error("Evidence file is required.");
  }
  const type = file.type || "";
  if (!(type === "application/pdf" || type.startsWith("image/"))) {
    throw new Error("Only PDF and image files are supported.");
  }
  const uploadFile = await prepareFileForUpload(file);
  const uploadType = uploadFile.type || type || "application/octet-stream";

  const supabase = getSupabaseBrowserClient();
  const bucket = getSupabaseStorageBucket();
  const safeName = uploadFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `bills/${billId}/payments/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, uploadFile, {
      contentType: uploadType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message || "Failed to upload payment evidence");
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return {
    url: publicUrl,
    path,
    mimeType: uploadType || null,
    name: uploadFile.name || file.name || null,
  };
}

export async function submitBillPaymentClaim(input: SubmitBillPaymentClaimInput) {
  if (!Number.isFinite(input.billId) || input.billId <= 0) {
    throw new Error("Valid bill ID is required.");
  }
  const claimAmount = toCurrencyAmount(input.amountPaid);
  if (!Number.isFinite(claimAmount) || claimAmount <= 0) {
    throw new Error("Paid amount must be greater than 0.");
  }

  const bill = await fetchBillById(input.billId);
  const breakdown = asRecord(bill.breakdown) || {};
  const existingClaims = Array.isArray(breakdown.paymentClaims)
    ? breakdown.paymentClaims.map((claim) => toBillPaymentClaim(claim)).filter(Boolean) as BillPaymentClaim[]
    : [];
  if (input.payer === "tenant") {
    const duplicatePendingAmount = existingClaims.some(
      (claim) =>
        claim.status === "pending" &&
        claim.payer === "tenant" &&
        toCurrencyAmount(claim.amount) === claimAmount
    );
    if (duplicatePendingAmount) {
      throw new Error("A pending claim with this amount already exists for this bill. Change the amount to submit again.");
    }
  }

  const claimedAt = new Date().toISOString();
  const nextClaim: BillPaymentClaim = {
    id: `claim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    amount: claimAmount,
    remarks: input.remarks?.trim() || "",
    claimedAt,
    payer: input.payer,
    status: "pending",
    verifiedAt: null,
    verifiedBy: null,
    proofUrl: input.proofUrl || null,
    proofMimeType: input.proofMimeType || null,
    proofName: input.proofName || null,
  };

  const updatedBreakdown = {
    ...breakdown,
    paymentClaims: [...existingClaims, nextClaim],
  };

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("bills")
    .update({
      breakdown: updatedBreakdown,
      payment_method: input.payer,
      proof_url: input.proofUrl || bill.proof_url || null,
    })
    .eq("id", input.billId)
    .select("*, bill_custom_fields(*)")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to submit payment claim");
  }

  return data as BillRecord;
}

export async function verifyBillPaymentClaim(input: VerifyBillPaymentClaimInput) {
  if (!Number.isFinite(input.billId) || input.billId <= 0) {
    throw new Error("Valid bill ID is required.");
  }
  if (!input.claimId.trim()) {
    throw new Error("Payment claim ID is required.");
  }

  const approve = input.approve !== false;
  const bill = await fetchBillById(input.billId);
  const breakdown = asRecord(bill.breakdown) || {};
  const paymentSummary = getBillPaymentSummary(bill);

  const existingClaims = Array.isArray(breakdown.paymentClaims)
    ? breakdown.paymentClaims.map((claim) => toBillPaymentClaim(claim)).filter(Boolean) as BillPaymentClaim[]
    : [];

  const claimIndex = existingClaims.findIndex((claim) => claim.id === input.claimId.trim());
  if (claimIndex < 0) {
    throw new Error("Payment claim not found.");
  }

  const claim = existingClaims[claimIndex];
  if (claim.status !== "pending") {
    throw new Error("This payment claim has already been processed.");
  }

  const processedAt = new Date().toISOString();
  const nextClaims = [...existingClaims];
  nextClaims[claimIndex] = {
    ...claim,
    status: approve ? "verified" : "rejected",
    verifiedAt: processedAt,
    verifiedBy: input.verifier,
  };

  let totalPaid = paymentSummary.totalPaid;
  let remainingAmount = paymentSummary.remainingAmount;
  let surplusAmount = paymentSummary.surplusAmount;
  let nextStatus = bill.status;
  let paidDate = bill.paid_date || null;

  if (approve) {
    totalPaid = paymentSummary.totalPaid + claim.amount;
    const normalizedBalance = toBalancePair(null, null, toNumber(bill.total) - totalPaid);
    remainingAmount = normalizedBalance.remainingAmount;
    surplusAmount = normalizedBalance.surplusAmount;
    nextStatus =
      remainingAmount > 0
        ? bill.status === "overdue"
          ? "overdue"
          : "pending"
        : "paid";
    paidDate = nextStatus === "paid" ? processedAt : null;
  }

  const updatedBreakdown = {
    ...breakdown,
    paymentClaims: nextClaims,
    totalPaid,
    remainingAmount,
    surplusAmount,
    lastPaymentDate: approve ? processedAt : breakdown.lastPaymentDate,
  };

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("bills")
    .update({
      breakdown: updatedBreakdown,
      status: nextStatus,
      paid_date: paidDate,
      payment_method: approve ? claim.payer : bill.payment_method || null,
      proof_url: approve ? claim.proofUrl || bill.proof_url || null : bill.proof_url || null,
    })
    .eq("id", input.billId)
    .select("*, bill_custom_fields(*)")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to verify payment claim");
  }

  const verifiedBill = data as BillRecord;

  // Create notification based on who verified
  try {
    const { data: property } = await supabase
      .from("properties")
      .select("owner_profile_id, property_name")
      .eq("id", verifiedBill.property_id)
      .single();

    if (property) {
      if (input.verifier === "owner" && approve) {
        // Owner verified payment - notify tenant(s)
        const { data: tenants } = await supabase
          .from("property_tenants")
          .select("tenant_profile_id")
          .eq("property_id", verifiedBill.property_id)
          .eq("status", "active")
          .not("tenant_profile_id", "is", null);

        if (tenants && tenants.length > 0) {
          const notifications = tenants.map((tenant) =>
            createNotification({
              profileId: tenant.tenant_profile_id!,
              type: "payment_verified_by_owner",
              title: "Payment Verified",
              message: `Your payment for ${property.property_name} has been verified by the owner`,
              relatedBillId: verifiedBill.id,
              relatedPropertyId: verifiedBill.property_id,
            })
          );
          await Promise.allSettled(notifications);
        }
      } else if (input.verifier === "tenant" && approve && property.owner_profile_id) {
        // Tenant verified payment - notify owner
        await createNotification({
          profileId: property.owner_profile_id,
          type: "payment_verified_by_tenant",
          title: "Payment Verified by Tenant",
          message: `Tenant has verified payment for ${property.property_name}`,
          relatedBillId: verifiedBill.id,
          relatedPropertyId: verifiedBill.property_id,
        });
      }
    }
  } catch (notificationError) {
    // Silently fail notifications - don't block verification
    console.error("Failed to create verification notification:", notificationError);
  }

  return verifiedBill;
}

export async function fetchPropertyTenants(propertyId: number) {
  if (!Number.isFinite(propertyId) || propertyId <= 0) {
    throw new Error("Valid property ID is required.");
  }

  const profileId = await resolveCurrentProfileId();
  if (!profileId) {
    throw new Error("You must be logged in to view tenants.");
  }

  const accessiblePropertyIds = await fetchAccessiblePropertyIds(profileId);
  if (!accessiblePropertyIds.includes(propertyId)) {
    throw new Error("You do not have access to this property.");
  }

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("property_tenants")
    .select("*")
    .eq("property_id", propertyId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to fetch property tenants");
  }

  return (data || []).map((row) => ({
    ...(row as PropertyTenantRecord),
    monthly_rent: row.monthly_rent == null ? null : toNonNegativeNumber(row.monthly_rent),
    date_joined: row.date_joined ? adToBs(row.date_joined) : null,
    date_end: row.date_end ? adToBs(row.date_end) : null,
  })) as PropertyTenantRecord[];
}

export async function createPropertyTenant(input: CreatePropertyTenantInput) {
  if (!Number.isFinite(input.propertyId) || input.propertyId <= 0) {
    throw new Error("Valid property ID is required.");
  }
  if (!input.tenantName.trim()) {
    throw new Error("Tenant name is required.");
  }

  if (input.tenantEmail?.trim()) {
    const email = input.tenantEmail.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid) {
      throw new Error("Tenant email format is invalid.");
    }
  }
  if (typeof input.monthlyRent === "number") {
    assertNonNegativeNumber(input.monthlyRent, "Monthly rent");
  }

  const dateJoined = input.dateJoined?.trim();
  if (!dateJoined) {
    throw new Error("Date joined is required.");
  }
  const joinedDate = bsToAd(dateJoined);

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("property_tenants")
    .insert({
      property_id: input.propertyId,
      tenant_name: input.tenantName.trim(),
      tenant_email: input.tenantEmail?.trim() || null,
      tenant_phone: input.tenantPhone?.trim() || null,
      monthly_rent: typeof input.monthlyRent === "number" ? input.monthlyRent : null,
      date_joined: joinedDate,
      status: "active",
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to add tenant");
  }

  return {
    ...(data as PropertyTenantRecord),
    monthly_rent: data.monthly_rent == null ? null : toNonNegativeNumber(data.monthly_rent),
    date_joined: data.date_joined ? adToBs(data.date_joined) : null,
    date_end: data.date_end ? adToBs(data.date_end) : null,
  } as PropertyTenantRecord;
}

export async function createPropertyTenantByUserId(input: CreatePropertyTenantByUserIdInput) {
  if (!Number.isFinite(input.propertyId) || input.propertyId <= 0) {
    throw new Error("Valid property ID is required.");
  }
  if (typeof input.monthlyRent === "number") {
    assertNonNegativeNumber(input.monthlyRent, "Monthly rent");
  }

  const tenantAppUserId = input.tenantAppUserId.trim();
  if (!tenantAppUserId) {
    throw new Error("Tenant unique ID is required.");
  }
  const dateJoined = input.dateJoined?.trim();
  if (!dateJoined) {
    throw new Error("Date joined is required.");
  }
  const joinedDate = bsToAd(dateJoined);

  const supabase = getSupabaseBrowserClient();
  const currentProfileId = await resolveCurrentProfileId();
  if (!currentProfileId) {
    throw new Error("Your profile is not ready yet. Please sign in again.");
  }

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id, owner_profile_id")
    .eq("id", input.propertyId)
    .maybeSingle();

  if (propertyError) {
    throw new Error(propertyError.message || "Failed to resolve property");
  }
  if (!property) {
    throw new Error("Property not found.");
  }
  if (property.owner_profile_id !== currentProfileId) {
    throw new Error("Only the property owner can send this request.");
  }

  const { data: tenantProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id, name, email, phone")
    .eq("app_user_id", tenantAppUserId)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message || "Failed to find tenant profile");
  }
  if (!tenantProfile) {
    throw new Error("No user found with this unique ID.");
  }

  const { data: existingTenant, error: existingError } = await supabase
    .from("property_tenants")
    .select("id")
    .eq("property_id", input.propertyId)
    .eq("tenant_profile_id", tenantProfile.id)
    .eq("status", "active")
    .limit(1);

  if (existingError) {
    throw new Error(existingError.message || "Failed to check existing tenant");
  }
  if ((existingTenant || []).length > 0) {
    throw new Error("This user is already connected as tenant for this property.");
  }

  const { data: existingPendingInvite, error: pendingInviteError } = await supabase
    .from("property_tenants")
    .select("id")
    .eq("property_id", input.propertyId)
    .eq("tenant_profile_id", tenantProfile.id)
    .eq("status", "pending_tenant_confirmation")
    .limit(1);

  if (pendingInviteError) {
    throw new Error(pendingInviteError.message || "Failed to check pending tenant request");
  }
  if ((existingPendingInvite || []).length > 0) {
    throw new Error("A pending request has already been sent to this tenant.");
  }

  const { data: insertedTenant, error: insertError } = await supabase
    .from("property_tenants")
    .insert({
      property_id: input.propertyId,
      tenant_profile_id: tenantProfile.id,
      tenant_name: tenantProfile.name || "Tenant",
      tenant_email: tenantProfile.email || null,
      tenant_phone: tenantProfile.phone || null,
      monthly_rent: typeof input.monthlyRent === "number" ? input.monthlyRent : null,
      date_joined: joinedDate,
      status: "pending_tenant_confirmation",
    })
    .select("*")
    .single();

  if (insertError || !insertedTenant) {
    throw new Error(insertError?.message || "Failed to send tenant request");
  }

  return {
    ...(insertedTenant as PropertyTenantRecord),
    monthly_rent: insertedTenant.monthly_rent == null ? null : toNonNegativeNumber(insertedTenant.monthly_rent),
    date_joined: insertedTenant.date_joined ? adToBs(insertedTenant.date_joined) : null,
    date_end: insertedTenant.date_end ? adToBs(insertedTenant.date_end) : null,
  } as PropertyTenantRecord;
}

export async function connectTenantToPropertyByCode(
  input: ConnectTenantToPropertyByCodeInput
): Promise<ConnectTenantToPropertyByCodeResult> {
  const propertyCode = input.propertyCode.trim();
  if (!/^\d{10}$/.test(propertyCode)) {
    throw new Error("Property code must be a 10-digit number.");
  }

  const tenantName = input.tenantName.trim();
  if (!tenantName) {
    throw new Error("Tenant name is required.");
  }

  const tenantEmail = input.tenantEmail?.trim() || "";
  if (tenantEmail) {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tenantEmail);
    if (!valid) {
      throw new Error("Tenant email format is invalid.");
    }
  }

  const supabase = getSupabaseBrowserClient();
  const currentProfileId = await resolveCurrentProfileId();
  const tenantProfileId = input.tenantProfileId || currentProfileId;
  if (!tenantProfileId) {
    throw new Error("Your profile is not ready yet. Please sign in again.");
  }

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id, property_name, property_code, owner_profile_id")
    .eq("property_code", propertyCode)
    .maybeSingle();

  if (propertyError) {
    throw new Error(propertyError.message || "Failed to verify property code");
  }
  if (!property) {
    throw new Error("No property found for this code.");
  }
  if (property.owner_profile_id === tenantProfileId) {
    throw new Error("You already own this property.");
  }

  let duplicateQuery = supabase
    .from("property_tenants")
    .select("id")
    .eq("property_id", property.id)
    .eq("status", "active")
    .limit(1);

  if (tenantEmail) {
    duplicateQuery = duplicateQuery.eq("tenant_email", tenantEmail);
  } else {
    duplicateQuery = duplicateQuery.eq("tenant_name", tenantName);
  }

  const { data: duplicateRows, error: duplicateError } = await duplicateQuery;
  if (duplicateError) {
    throw new Error(duplicateError.message || "Failed to check existing connection");
  }
  if ((duplicateRows || []).length > 0) {
    throw new Error("You are already connected to this property.");
  }

  const { data: existingPendingRequest, error: pendingRequestError } = await supabase
    .from("property_tenants")
    .select("id")
    .eq("property_id", property.id)
    .eq("tenant_profile_id", tenantProfileId)
    .eq("status", "pending_owner_approval")
    .limit(1);

  if (pendingRequestError) {
    throw new Error(pendingRequestError.message || "Failed to check pending request");
  }
  if ((existingPendingRequest || []).length > 0) {
    throw new Error("Your request is already pending owner confirmation.");
  }

  const { data: tenantProfile } = await supabase
    .from("profiles")
    .select("name, email, phone")
    .eq("id", tenantProfileId)
    .maybeSingle();

  const { data: tenant, error: tenantError } = await supabase
    .from("property_tenants")
    .insert({
      property_id: property.id,
      tenant_profile_id: tenantProfileId,
      tenant_name: tenantProfile?.name || tenantName,
      tenant_email: tenantProfile?.email || tenantEmail || null,
      tenant_phone: tenantProfile?.phone || input.tenantPhone?.trim() || null,
      date_joined: null,
      monthly_rent: null,
      status: "pending_owner_approval",
    })
    .select("*")
    .single();

  if (tenantError || !tenant) {
    throw new Error(tenantError?.message || "Failed to send property connection request");
  }

  return {
    property: property as Pick<PropertyRecord, "id" | "property_name" | "property_code">,
    tenant: {
      ...(tenant as PropertyTenantRecord),
      monthly_rent: tenant.monthly_rent == null ? null : toNonNegativeNumber(tenant.monthly_rent),
      date_joined: tenant.date_joined ? adToBs(tenant.date_joined) : null,
      date_end: tenant.date_end ? adToBs(tenant.date_end) : null,
    },
  };
}

export async function fetchTenantPendingConnectionRequests(): Promise<TenantInviteRequest[]> {
  const profileId = await resolveCurrentProfileId();
  if (!profileId) {
    return [];
  }

  const supabase = getSupabaseBrowserClient();
  const { data: requestRows, error: requestError } = await supabase
    .from("property_tenants")
    .select("id, property_id, tenant_name, tenant_email, monthly_rent, date_joined, created_at")
    .eq("tenant_profile_id", profileId)
    .eq("status", "pending_tenant_confirmation")
    .order("created_at", { ascending: false });

  if (requestError) {
    throw new Error(requestError.message || "Failed to fetch tenant requests");
  }

  const rows = requestRows || [];
  if (rows.length === 0) {
    return [];
  }

  const propertyIds = Array.from(new Set(rows.map((row) => Number(row.property_id)).filter((id) => Number.isFinite(id))));
  const { data: properties, error: propertiesError } = await supabase
    .from("properties")
    .select("id, property_name, property_code, owner_profile_id, location, desired_rent, price, property_images(url, created_at)")
    .in("id", propertyIds);

  if (propertiesError) {
    throw new Error(propertiesError.message || "Failed to resolve request properties");
  }

  const ownerProfileIds = Array.from(
    new Set((properties || []).map((property) => property.owner_profile_id).filter((id): id is string => typeof id === "string" && id.length > 0))
  );
  const { data: owners, error: ownersError } = await supabase
    .from("profiles")
    .select("id, name, email")
    .in("id", ownerProfileIds);

  if (ownersError) {
    throw new Error(ownersError.message || "Failed to resolve owners");
  }

  const propertyById = new Map((properties || []).map((property) => [Number(property.id), property]));
  const ownerById = new Map((owners || []).map((owner) => [owner.id, owner]));

  return rows.map((row) => {
    const property = propertyById.get(Number(row.property_id));
    const owner = property?.owner_profile_id ? ownerById.get(property.owner_profile_id) : null;
    const propertyImages = Array.isArray(property?.property_images) ? property.property_images : [];
    const propertyImageUrl = propertyImages[0]?.url || null;
    const propertyRent =
      property?.desired_rent == null && property?.price == null
        ? null
        : toNonNegativeNumber(property?.desired_rent ?? property?.price ?? 0);
    return {
      id: Number(row.id),
      propertyId: Number(row.property_id),
      propertyCode: property?.property_code || null,
      propertyName: property?.property_name || "Property",
      propertyLocation: property?.location || "-",
      propertyRent,
      propertyImageUrl,
      ownerName: owner?.name || "Owner",
      ownerEmail: owner?.email || "",
      tenantName: row.tenant_name || "Tenant",
      tenantEmail: row.tenant_email || "",
      monthlyRent: row.monthly_rent == null ? null : toNonNegativeNumber(row.monthly_rent),
      dateJoined: row.date_joined ? adToBs(row.date_joined) : null,
      createdAt: row.created_at || "",
    };
  });
}

export async function respondToTenantInviteRequest(tenantRowId: number, approve: boolean) {
  if (!Number.isFinite(tenantRowId) || tenantRowId <= 0) {
    throw new Error("Valid request is required.");
  }

  const profileId = await resolveCurrentProfileId();
  if (!profileId) {
    throw new Error("Your profile is not ready yet. Please sign in again.");
  }

  const supabase = getSupabaseBrowserClient();
  const { data: row, error: rowError } = await supabase
    .from("property_tenants")
    .select("id, tenant_profile_id, status")
    .eq("id", tenantRowId)
    .maybeSingle();

  if (rowError) {
    throw new Error(rowError.message || "Failed to resolve request");
  }
  if (!row) {
    throw new Error("Request not found.");
  }
  if (row.tenant_profile_id !== profileId) {
    throw new Error("You cannot respond to this request.");
  }
  if (row.status !== "pending_tenant_confirmation") {
    throw new Error("This request is no longer pending.");
  }

  const nextStatus = approve ? "active" : "rejected";
  const { error: updateError } = await supabase
    .from("property_tenants")
    .update({ status: nextStatus })
    .eq("id", tenantRowId);

  if (updateError) {
    throw new Error(updateError.message || "Failed to update request status");
  }
}

export async function fetchOwnerPendingApprovalRequests(propertyId: number): Promise<OwnerApprovalRequest[]> {
  if (!Number.isFinite(propertyId) || propertyId <= 0) {
    throw new Error("Valid property ID is required.");
  }

  const profileId = await resolveCurrentProfileId();
  if (!profileId) {
    return [];
  }

  const supabase = getSupabaseBrowserClient();
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id, property_name, property_code, owner_profile_id, location, desired_rent, price, property_images(url, created_at)")
    .eq("id", propertyId)
    .maybeSingle();

  if (propertyError) {
    throw new Error(propertyError.message || "Failed to resolve property");
  }
  if (!property || property.owner_profile_id !== profileId) {
    return [];
  }

  const { data: requestRows, error: requestError } = await supabase
    .from("property_tenants")
    .select("id, property_id, tenant_name, tenant_email, tenant_phone, created_at")
    .eq("property_id", propertyId)
    .eq("status", "pending_owner_approval")
    .order("created_at", { ascending: false });

  if (requestError) {
    throw new Error(requestError.message || "Failed to fetch pending owner approvals");
  }

  const propertyImages = Array.isArray(property.property_images) ? property.property_images : [];
  const propertyImageUrl = propertyImages[0]?.url || null;
  const propertyRent =
    property.desired_rent == null && property.price == null
      ? null
      : toNonNegativeNumber(property.desired_rent ?? property.price ?? 0);

  return (requestRows || []).map((row) => ({
    id: Number(row.id),
    propertyId: Number(row.property_id),
    propertyCode: property.property_code || null,
    propertyName: property.property_name || "Property",
    propertyLocation: property.location || "-",
    propertyRent,
    propertyImageUrl,
    tenantName: row.tenant_name || "Tenant",
    tenantEmail: row.tenant_email || "",
    tenantPhone: row.tenant_phone || "",
    createdAt: row.created_at || "",
  }));
}

export async function approveOwnerPendingRequest(input: { tenantRowId: number; monthlyRent: number; dateJoined: string }) {
  if (!Number.isFinite(input.tenantRowId) || input.tenantRowId <= 0) {
    throw new Error("Valid request is required.");
  }
  assertNonNegativeNumber(input.monthlyRent, "Monthly rent");
  const dateJoined = input.dateJoined.trim();
  if (!dateJoined) {
    throw new Error("Date joined is required.");
  }
  const joinedDate = bsToAd(dateJoined);

  const profileId = await resolveCurrentProfileId();
  if (!profileId) {
    throw new Error("Your profile is not ready yet. Please sign in again.");
  }

  const supabase = getSupabaseBrowserClient();
  const { data: row, error: rowError } = await supabase
    .from("property_tenants")
    .select("id, property_id, status")
    .eq("id", input.tenantRowId)
    .maybeSingle();

  if (rowError) {
    throw new Error(rowError.message || "Failed to resolve request");
  }
  if (!row) {
    throw new Error("Request not found.");
  }
  if (row.status !== "pending_owner_approval") {
    throw new Error("This request is no longer pending.");
  }

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id, owner_profile_id")
    .eq("id", row.property_id)
    .maybeSingle();

  if (propertyError) {
    throw new Error(propertyError.message || "Failed to resolve property owner");
  }
  if (!property || property.owner_profile_id !== profileId) {
    throw new Error("Only the property owner can approve this request.");
  }

  const { error: updateError } = await supabase
    .from("property_tenants")
    .update({
      monthly_rent: input.monthlyRent,
      date_joined: joinedDate,
      status: "active",
    })
    .eq("id", input.tenantRowId);

  if (updateError) {
    throw new Error(updateError.message || "Failed to approve tenant request");
  }
}

export async function rejectOwnerPendingRequest(tenantRowId: number) {
  if (!Number.isFinite(tenantRowId) || tenantRowId <= 0) {
    throw new Error("Valid request is required.");
  }

  const profileId = await resolveCurrentProfileId();
  if (!profileId) {
    throw new Error("Your profile is not ready yet. Please sign in again.");
  }

  const supabase = getSupabaseBrowserClient();
  const { data: row, error: rowError } = await supabase
    .from("property_tenants")
    .select("id, property_id, status")
    .eq("id", tenantRowId)
    .maybeSingle();

  if (rowError) {
    throw new Error(rowError.message || "Failed to resolve request");
  }
  if (!row) {
    throw new Error("Request not found.");
  }
  if (row.status !== "pending_owner_approval") {
    throw new Error("This request is no longer pending.");
  }

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id, owner_profile_id")
    .eq("id", row.property_id)
    .maybeSingle();

  if (propertyError) {
    throw new Error(propertyError.message || "Failed to resolve property owner");
  }
  if (!property || property.owner_profile_id !== profileId) {
    throw new Error("Only the property owner can reject this request.");
  }

  const { error: updateError } = await supabase
    .from("property_tenants")
    .update({ status: "rejected" })
    .eq("id", tenantRowId);

  if (updateError) {
    throw new Error(updateError.message || "Failed to reject tenant request");
  }
}

export async function deleteProperty(propertyId: number) {
  if (!Number.isFinite(propertyId) || propertyId <= 0) {
    throw new Error("Valid property ID is required.");
  }

  const supabase = getSupabaseBrowserClient();
  const profileId = await resolveCurrentProfileId();
  if (!profileId) {
    throw new Error("Your profile is not ready yet. Please sign in again.");
  }

  const { data: property, error: propertyLookupError } = await supabase
    .from("properties")
    .select("id, owner_profile_id")
    .eq("id", propertyId)
    .maybeSingle();

  if (propertyLookupError) {
    throw new Error(propertyLookupError.message || "Failed to resolve property");
  }
  if (!property) {
    throw new Error("Property not found.");
  }
  if (property.owner_profile_id !== profileId) {
    throw new Error("Only the property owner can delete this property.");
  }

  const { data: propertyImages } = await supabase
    .from("property_images")
    .select("path")
    .eq("property_id", propertyId);
  const imagePaths = (propertyImages || [])
    .map((image) => image.path)
    .filter((path): path is string => typeof path === "string" && path.trim().length > 0);

  if (imagePaths.length > 0) {
    const bucket = getSupabaseStorageBucket();
    await supabase.storage.from(bucket).remove(imagePaths);
  }

  const { error } = await supabase
    .from("properties")
    .delete()
    .eq("id", propertyId)
    .eq("owner_profile_id", profileId);

  if (error) {
    throw new Error(error.message || "Failed to delete property");
  }
}

export async function deletePropertyTenant(tenantId: number) {
  if (!Number.isFinite(tenantId) || tenantId <= 0) {
    throw new Error("Valid tenant ID is required.");
  }

  const supabase = getSupabaseBrowserClient();
  const { data: tenant, error: tenantLookupError } = await supabase
    .from("property_tenants")
    .select("id, property_id")
    .eq("id", tenantId)
    .maybeSingle();

  if (tenantLookupError) {
    throw new Error(tenantLookupError.message || "Failed to resolve tenant");
  }
  if (!tenant) {
    throw new Error("Tenant not found.");
  }

  const { error: billsDeleteError } = await supabase
    .from("bills")
    .delete()
    .eq("property_id", tenant.property_id);

  if (billsDeleteError) {
    throw new Error(billsDeleteError.message || "Failed to reset property bills");
  }

  const { error } = await supabase.from("property_tenants").delete().eq("id", tenantId);

  if (error) {
    throw new Error(error.message || "Failed to delete tenant");
  }
}

export async function createBill(input: CreateBillInput) {
  validateCreateBillInput(input);

  const supabase = getSupabaseBrowserClient();
  const { data: tenantRows, error: tenantCheckError } = await supabase
    .from("property_tenants")
    .select("id")
    .eq("property_id", input.propertyId)
    .eq("status", "active")
    .limit(1);

  if (tenantCheckError) {
    throw new Error(tenantCheckError.message || "Failed to verify tenant before creating bill");
  }

  if (!tenantRows || tenantRows.length === 0) {
    throw new Error("Cannot create bill because this property has no tenant. Add a tenant first.");
  }

  const rentPerMonth = toNumber(input.rentPerMonth ?? input.confirmedRent ?? input.baseRent);
  const due = toNumber(input.due);
  const penalty = toNumber(input.penalty, due * 0.1);
  const wifi = toNumber(input.wifi ?? input.internet);
  const electricity = input.electricity || { amount: 0, previousUnit: 0, currentUnit: 0, rate: 0 };
  const water = input.water || { amount: 0, previousUnit: 0, currentUnit: 0, rate: 0 };

  const normalizedOthers = Object.fromEntries(
    Object.entries({ ...(input.otherCharges || {}), ...(input.others || {}) }).map(([name, amount]) => [name, toNumber(amount)])
  );
  (input.customFields || []).forEach((field) => {
    normalizedOthers[field.name.trim()] = toNumber(field.amount);
  });

  const breakdown = {
    rentPerMonth,
    baseRent: rentPerMonth,
    due,
    penalty,
    billingInterval: input.billingInterval?.trim() || "monthly",
    electricity,
    water,
    wifi,
    internet: wifi,
    others: normalizedOthers,
    paymentClaims: [] as BillPaymentClaim[],
    totalPaid: 0,
    remainingAmount: 0,
    surplusAmount: 0,
    paymentHistory: [] as BillPaymentEntry[],
  };

  const total = toNumber(
    input.total,
    rentPerMonth +
      due +
      penalty +
      toNumber(electricity.amount) +
      toNumber(water.amount) +
      wifi +
      Object.values(normalizedOthers).reduce((sum, amount) => sum + toNumber(amount), 0)
  );
  breakdown.remainingAmount = total;

  const { data: bill, error } = await supabase
    .from("bills")
    .insert({
      property_id: input.propertyId,
      property_name: input.propertyName,
      tenant_name: input.tenantName,
      tenant_email: input.tenantEmail?.trim() || "",
      current_month: input.currentMonth,
      base_rent: rentPerMonth,
      confirmed_rent: rentPerMonth,
      breakdown,
      total,
      status: input.status || "pending",
    })
    .select("*")
    .single();

  if (error || !bill) {
    throw new Error(error?.message || "Failed to create bill");
  }

  const customFields = input.customFields || [];
  if (customFields.length > 0) {
    const { error: customFieldError } = await supabase.from("bill_custom_fields").insert(
      customFields.map((field) => ({
        bill_id: bill.id,
        name: field.name,
        amount: toNumber(field.amount),
      }))
    );

    if (customFieldError) {
      throw new Error(customFieldError.message || "Failed to save custom bill fields");
    }
  }

  const { data: fullBill } = await supabase
    .from("bills")
    .select("*, bill_custom_fields(*)")
    .eq("id", bill.id)
    .single();

  const createdBill = (fullBill || bill) as BillRecord;

  // Create notification for tenant(s) about the new bill
  try {
    const { data: tenants } = await supabase
      .from("property_tenants")
      .select("tenant_profile_id")
      .eq("property_id", input.propertyId)
      .eq("status", "active")
      .not("tenant_profile_id", "is", null);

    if (tenants && tenants.length > 0) {
      const notifications = tenants.map((tenant) =>
        createNotification({
          profileId: tenant.tenant_profile_id!,
          type: "bill_created",
          title: "New Bill Created",
          message: `A new bill has been created for ${input.propertyName} for ${input.currentMonth}`,
          relatedBillId: createdBill.id,
          relatedPropertyId: input.propertyId,
        })
      );
      await Promise.allSettled(notifications);
    }
  } catch (notificationError) {
    // Silently fail notifications - don't block bill creation
    console.error("Failed to create bill notification:", notificationError);
  }

  return createdBill;
}

// ---------------------------------------------------------------------------
// Messaging & Connections
// ---------------------------------------------------------------------------

export type ChatConnectionRecord = {
  id: string; // connections.id (uuid) – primary row
  allConnectionIds: string[]; // all connection IDs for this pair (handles mirror rows)
  otherProfileId: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: "landlord" | "tenant"; // the OTHER person's role relative to current user
  propertyId: number | null;
  propertyName: string | null;
  status: "pending" | "active";
  unreadMessages: number;
  lastMessage: string | null;
  lastMessageAt: string | null;
};

export type ChatMessageRecord = {
  id: number;
  connectionId: string;
  senderProfileId: string;
  message: string;
  sentAt: string;
  readAt: string | null;
};

/**
 * Synchronise the `connections` table with active property_tenants,
 * then return all chat connections for the current user.
 */
export async function fetchChatConnections(): Promise<ChatConnectionRecord[]> {
  const supabase = getSupabaseBrowserClient();
  const profileId = await resolveCurrentProfileId();
  if (!profileId) return [];

  // ----- 1. Ensure connections rows exist for active tenant-landlord pairs -----
  // Properties I own ➜ tenants who have profiles
  const { data: ownedRows } = await supabase
    .from("properties")
    .select("id, property_name, owner_profile_id, property_tenants!inner(tenant_profile_id, tenant_name, status)")
    .eq("owner_profile_id", profileId);

  for (const prop of ownedRows || []) {
    const tenants = (prop as any).property_tenants as any[] || [];
    for (const t of tenants) {
      if (t.status !== "active" || !t.tenant_profile_id) continue;
      await supabase.from("connections").upsert(
        {
          from_profile_id: profileId,
          to_profile_id: t.tenant_profile_id,
          role: "tenant",
          property_id: prop.id,
          property_name: prop.property_name,
          status: "active",
        },
        { onConflict: "from_profile_id,to_profile_id,role,property_id" }
      );
    }
  }

  // Properties I'm a tenant of ➜ landlord connection
  const { data: tenantRows } = await supabase
    .from("property_tenants")
    .select("property_id, tenant_profile_id, status")
    .eq("tenant_profile_id", profileId)
    .eq("status", "active");

  if (tenantRows && tenantRows.length > 0) {
    const propIds = tenantRows.map((r) => Number(r.property_id));
    const { data: props } = await supabase
      .from("properties")
      .select("id, property_name, owner_profile_id")
      .in("id", propIds);

    for (const prop of props || []) {
      if (!prop.owner_profile_id) continue;
      await supabase.from("connections").upsert(
        {
          from_profile_id: profileId,
          to_profile_id: prop.owner_profile_id,
          role: "landlord",
          property_id: prop.id,
          property_name: prop.property_name,
          status: "active",
        },
        { onConflict: "from_profile_id,to_profile_id,role,property_id" }
      );
    }
  }

  // ----- 2. Fetch connections where I am either side -----
  const { data: connRows, error } = await supabase
    .from("connections")
    .select("*")
    .or(`from_profile_id.eq.${profileId},to_profile_id.eq.${profileId}`)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message || "Failed to fetch connections");
  if (!connRows || connRows.length === 0) return [];

  // Collect the "other" profile ids
  const otherIds = new Set<string>();
  for (const c of connRows) {
    otherIds.add(c.from_profile_id === profileId ? c.to_profile_id : c.from_profile_id);
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, email, phone, avatar_url")
    .in("id", Array.from(otherIds));
  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  // Fetch last message per connection
  const connectionIds = connRows.map((c) => c.id);
  const { data: lastMessages } = await supabase
    .from("messages")
    .select("connection_id, message, sent_at")
    .in("connection_id", connectionIds)
    .order("sent_at", { ascending: false });

  const lastMsgMap = new Map<string, { message: string; sent_at: string }>();
  for (const m of lastMessages || []) {
    if (!lastMsgMap.has(m.connection_id)) {
      lastMsgMap.set(m.connection_id, { message: m.message, sent_at: m.sent_at });
    }
  }

  // Fetch unread counts
  const { data: unreadRows } = await supabase
    .from("messages")
    .select("connection_id")
    .in("connection_id", connectionIds)
    .neq("sender_profile_id", profileId)
    .is("read_at", null);

  const unreadMap = new Map<string, number>();
  for (const u of unreadRows || []) {
    unreadMap.set(u.connection_id, (unreadMap.get(u.connection_id) || 0) + 1);
  }

  // Deduplicate connection pairs – collect ALL connection IDs per pair so we
  // can fetch messages from both the user-initiated and mirror rows.
  const seen = new Map<string, { primary: typeof connRows[0]; allIds: string[] }>();
  for (const c of connRows) {
    const otherId = c.from_profile_id === profileId ? c.to_profile_id : c.from_profile_id;
    const pairKey = `${otherId}_${c.property_id ?? "none"}`;
    if (!seen.has(pairKey)) {
      seen.set(pairKey, { primary: c, allIds: [c.id] });
    } else {
      const entry = seen.get(pairKey)!;
      entry.allIds.push(c.id);
      // Prefer the connection row initiated by the current user
      if (c.from_profile_id === profileId && entry.primary.from_profile_id !== profileId) {
        entry.primary = c;
      }
    }
  }

  const results: ChatConnectionRecord[] = [];
  for (const { primary: c, allIds } of seen.values()) {
    const isFromMe = c.from_profile_id === profileId;
    const otherId = isFromMe ? c.to_profile_id : c.from_profile_id;
    const profile = profileMap.get(otherId);
    // Role: if I initiated the connection, the role field tells the other person's role.
    // If the other person initiated it, their role field is about ME, so I flip it.
    const role: "landlord" | "tenant" = isFromMe
      ? c.role
      : c.role === "landlord"
        ? "tenant"
        : "landlord";
    // Merge last message across all sibling connection IDs
    let bestLast: { message: string; sent_at: string } | null = null;
    for (const cid of allIds) {
      const candidate = lastMsgMap.get(cid);
      if (candidate && (!bestLast || candidate.sent_at > bestLast.sent_at)) {
        bestLast = candidate;
      }
    }
    // Merge unread counts across all sibling connection IDs
    let totalUnread = 0;
    for (const cid of allIds) {
      totalUnread += unreadMap.get(cid) || 0;
    }
    results.push({
      id: c.id,
      allConnectionIds: allIds,
      otherProfileId: otherId,
      name: profile?.name || "Unknown",
      email: profile?.email || "",
      phone: profile?.phone || null,
      avatar: profile?.avatar_url || null,
      role,
      propertyId: c.property_id ? Number(c.property_id) : null,
      propertyName: c.property_name || null,
      status: c.status,
      unreadMessages: totalUnread,
      lastMessage: bestLast?.message || null,
      lastMessageAt: bestLast?.sent_at || null,
    });
  }

  // Sort: unread first, then most recent message
  results.sort((a, b) => {
    if (a.unreadMessages > 0 && b.unreadMessages === 0) return -1;
    if (b.unreadMessages > 0 && a.unreadMessages === 0) return 1;
    const aTime = a.lastMessageAt ? +new Date(a.lastMessageAt) : 0;
    const bTime = b.lastMessageAt ? +new Date(b.lastMessageAt) : 0;
    return bTime - aTime;
  });

  return results;
}

/**
 * Fetch messages for a given connection, ordered oldest-first.
 */
export async function fetchMessages(connectionIds: string | string[]): Promise<ChatMessageRecord[]> {
  const ids = Array.isArray(connectionIds) ? connectionIds : [connectionIds];
  if (ids.length === 0) return [];

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .in("connection_id", ids)
    .order("sent_at", { ascending: true });

  if (error) throw new Error(error.message || "Failed to fetch messages");

  return (data || []).map((m) => ({
    id: m.id,
    connectionId: m.connection_id,
    senderProfileId: m.sender_profile_id,
    message: m.message,
    sentAt: m.sent_at,
    readAt: m.read_at || null,
  }));
}

/**
 * Send a message in a connection.
 */
export async function sendMessage(connectionId: string, text: string): Promise<ChatMessageRecord> {
  if (!connectionId) throw new Error("Connection is required.");
  if (!text.trim()) throw new Error("Message cannot be empty.");

  const supabase = getSupabaseBrowserClient();
  const profileId = await resolveCurrentProfileId();
  if (!profileId) throw new Error("You must be logged in to send messages.");

  const { data, error } = await supabase
    .from("messages")
    .insert({
      connection_id: connectionId,
      sender_profile_id: profileId,
      message: text.trim(),
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message || "Failed to send message");

  // Update the connection's updated_at so it bubbles to top
  await supabase.from("connections").update({ updated_at: new Date().toISOString() }).eq("id", connectionId);

  return {
    id: data.id,
    connectionId: data.connection_id,
    senderProfileId: data.sender_profile_id,
    message: data.message,
    sentAt: data.sent_at,
    readAt: data.read_at || null,
  };
}

/**
 * Mark all unread messages in a connection as read (messages from the other person).
 */
export async function markMessagesAsRead(connectionIds: string | string[]): Promise<void> {
  const ids = Array.isArray(connectionIds) ? connectionIds : [connectionIds];
  if (ids.length === 0) return;

  const supabase = getSupabaseBrowserClient();
  const profileId = await resolveCurrentProfileId();
  if (!profileId) return;

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .in("connection_id", ids)
    .neq("sender_profile_id", profileId)
    .is("read_at", null);
}

// ---------------------------------------------------------------------------
// Property Documents
// ---------------------------------------------------------------------------

export type PropertyDocumentRecord = {
  id: number;
  property_id: number;
  uploaded_by_profile_id: string | null;
  name: string;
  doc_type: string | null;
  url: string;
  mime_type: string | null;
  description: string | null;
  uploaded_at: string;
  // joined fields
  property_name?: string;
  uploader_name?: string;
};

/**
 * Fetch all documents for the current user's accessible properties.
 */
export async function fetchPropertyDocuments(): Promise<PropertyDocumentRecord[]> {
  const supabase = getSupabaseBrowserClient();
  const profileId = await resolveCurrentProfileId();
  if (!profileId) return [];

  const accessibleIds = await fetchAccessiblePropertyIds(profileId);
  if (accessibleIds.length === 0) return [];

  const { data, error } = await supabase
    .from("property_documents")
    .select("*, properties!inner(property_name), profiles(name)")
    .in("property_id", accessibleIds)
    .order("uploaded_at", { ascending: false });

  if (error) throw new Error(error.message || "Failed to fetch documents");

  return (data || []).map((d: any) => ({
    id: d.id,
    property_id: d.property_id,
    uploaded_by_profile_id: d.uploaded_by_profile_id,
    name: d.name,
    doc_type: d.doc_type,
    url: d.url,
    mime_type: d.mime_type,
    description: d.description,
    uploaded_at: d.uploaded_at,
    property_name: d.properties?.property_name || undefined,
    uploader_name: d.profiles?.name || undefined,
  }));
}

/**
 * Upload a document file to storage and insert a row into property_documents.
 */
export async function uploadPropertyDocument(input: {
  propertyId: number;
  file: File;
  docType?: string;
  description?: string;
}): Promise<PropertyDocumentRecord> {
  const supabase = getSupabaseBrowserClient();
  const profileId = await resolveCurrentProfileId();
  if (!profileId) throw new Error("You must be logged in to upload documents.");

  const bucket = getSupabaseStorageBucket();
  const uploadFile = await prepareFileForUpload(input.file);
  const safeName = uploadFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `documents/${input.propertyId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, uploadFile, {
      contentType: uploadFile.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) throw new Error(uploadError.message || "Storage upload failed");

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  const { data, error } = await supabase
    .from("property_documents")
    .insert({
      property_id: input.propertyId,
      uploaded_by_profile_id: profileId,
      name: input.file.name,
      doc_type: input.docType || null,
      url: publicUrl,
      mime_type: uploadFile.type || null,
      description: input.description || null,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message || "Failed to save document");

  return {
    id: data.id,
    property_id: data.property_id,
    uploaded_by_profile_id: data.uploaded_by_profile_id,
    name: data.name,
    doc_type: data.doc_type,
    url: data.url,
    mime_type: data.mime_type,
    description: data.description,
    uploaded_at: data.uploaded_at,
  };
}

/**
 * Delete a property document (row + storage file).
 */
export async function deletePropertyDocument(docId: number, url: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const bucket = getSupabaseStorageBucket();

  // Extract path from public URL
  const bucketUrlPart = `/storage/v1/object/public/${bucket}/`;
  const pathIdx = url.indexOf(bucketUrlPart);
  if (pathIdx !== -1) {
    const storagePath = decodeURIComponent(url.substring(pathIdx + bucketUrlPart.length));
    await supabase.storage.from(bucket).remove([storagePath]);
  }

  const { error } = await supabase.from("property_documents").delete().eq("id", docId);
  if (error) throw new Error(error.message || "Failed to delete document");
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

/**
 * Create a notification for a user
 */
export async function createNotification(input: {
  profileId: string;
  type: "bill_created" | "payment_verified_by_owner" | "payment_verified_by_tenant";
  title: string;
  message: string;
  relatedBillId?: number;
  relatedPropertyId?: number;
}): Promise<NotificationRecord> {
  const supabase = getSupabaseBrowserClient();
  
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      profile_id: input.profileId,
      type: input.type,
      title: input.title,
      message: input.message,
      related_bill_id: input.relatedBillId || null,
      related_property_id: input.relatedPropertyId || null,
      read: false,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create notification");
  }

  return data as NotificationRecord;
}

/**
 * Fetch unread notifications for the current user
 */
export async function fetchUnreadNotifications(): Promise<NotificationRecord[]> {
  const supabase = getSupabaseBrowserClient();
  const profileId = await resolveCurrentProfileId();
  
  if (!profileId) {
    return [];
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("profile_id", profileId)
    .eq("read", false)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to fetch notifications");
  }

  return (data || []) as NotificationRecord[];
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: number): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);

  if (error) {
    throw new Error(error.message || "Failed to mark notification as read");
  }
}

/**
 * Mark all notifications as read for the current user
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const profileId = await resolveCurrentProfileId();
  
  if (!profileId) {
    return;
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("profile_id", profileId)
    .eq("read", false);

  if (error) {
    throw new Error(error.message || "Failed to mark all notifications as read");
  }
}
