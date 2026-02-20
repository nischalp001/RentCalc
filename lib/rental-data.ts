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
  address?: string | null;
  location?: string | null;
  city?: string | null;
  rooms?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  kitchens?: number | null;
  dinings?: number | null;
  livings?: number | null;
  sqft?: number | null;
  bike_parking?: string | null;
  car_parking?: string | null;
  services?: string[] | null;
  description?: string | null;
  status?: string | null;
  car_parking_spaces?: number | null;
  water_supply?: boolean | null;
  wifi?: boolean | null;
  furnished_level?: "none" | "semi" | "full" | null;
  property_images?: PropertyImageRecord[];
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
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  kitchens: number;
  dinings: number;
  livings: number;
  sqft?: number | null;
  description: string;
  bikeParking: boolean;
  carParking: boolean;
  carParkingSpaces: number;
  waterSupply: boolean;
  wifi: boolean;
  furnishedLevel: "none" | "semi" | "full";
  otherServices: string[];
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
  dateJoined?: string;
};

export type CreatePropertyTenantByUserIdInput = {
  propertyId: number;
  tenantAppUserId: string;
  monthlyRent?: number;
};

export type BillPaymentEntry = {
  claimId?: string | null;
  amount: number;
  remarks: string;
  paidAt: string;
  payer: "tenant" | "owner";
  remainingAmount: number;
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

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
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

  return {
    claimId: asString(record.claimId, "") || null,
    amount,
    remarks: asString(record.remarks, "").trim(),
    paidAt,
    payer,
    remainingAmount: toNonNegativeNumber(record.remainingAmount),
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
      proofUrl: claim.proofUrl || null,
      proofMimeType: claim.proofMimeType || null,
      proofName: claim.proofName || null,
    })) as BillPaymentEntry[];

  const history = [...legacyHistory, ...claimHistory]
    .sort((a, b) => +new Date(b.paidAt || 0) - +new Date(a.paidAt || 0));

  const fallbackTotalPaid = history.reduce((sum, entry) => sum + entry.amount, 0);
  const totalPaid = toNonNegativeNumber(breakdown.totalPaid, fallbackTotalPaid);
  const remainingAmount = Math.max(toNonNegativeNumber(breakdown.remainingAmount, toNonNegativeNumber(bill.total) - totalPaid), 0);

  const normalizedHistory = history.map((entry) => ({
    ...entry,
    remainingAmount: toNonNegativeNumber(entry.remainingAmount, Math.max(toNonNegativeNumber(bill.total) - totalPaid, 0)),
  }));

  return {
    totalPaid,
    remainingAmount,
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
  assertNonNegativeNumber(input.desiredRent, "Desired monthly rent");
  assertNonNegativeNumber(input.rooms, "Rooms");
  assertNonNegativeNumber(input.bedrooms, "Bedrooms");
  assertNonNegativeNumber(input.bathrooms, "Bathrooms");
  assertNonNegativeNumber(input.kitchens, "Kitchens");
  assertNonNegativeNumber(input.dinings, "Dinings");
  assertNonNegativeNumber(input.livings, "Livings");

  if (typeof input.sqft === "number") {
    assertNonNegativeNumber(input.sqft, "Square feet");
  }

  if (input.carParking) {
    assertNonNegativeNumber(input.carParkingSpaces, "Car parking spaces");
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
    .select("*, property_images(*)")
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
  const normalizedCarParkingSpaces = input.carParking ? input.carParkingSpaces : 0;

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .insert({
      owner_profile_id: ownerProfileId,
      name: input.propertyName,
      property_name: input.propertyName,
      property_type: input.propertyType,
      currency: input.currency,
      price: input.price,
      desired_rent: input.desiredRent,
      interval: input.interval,
      address: input.location,
      location: input.location,
      city: input.location,
      rooms: input.rooms,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      kitchens: input.kitchens,
      dinings: input.dinings,
      livings: input.livings,
      sqft: input.sqft,
      bike_parking: input.bikeParking ? "yes" : "no",
      car_parking: input.carParking ? "yes" : "no",
      car_parking_spaces: normalizedCarParkingSpaces,
      water_supply: input.waterSupply,
      wifi: input.wifi,
      furnished_level: input.furnishedLevel,
      services: input.otherServices,
      description: input.description,
      status: "active",
      rent: `${input.currency} ${input.price}`,
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
      const safeName = image.file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `properties/${property.id}/${Date.now()}-${index}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, image.file, {
          contentType: image.file.type || "image/jpeg",
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
        mime_type: image.file.type || "image/jpeg",
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

  const supabase = getSupabaseBrowserClient();
  const bucket = getSupabaseStorageBucket();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `bills/${billId}/payments/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: type || "application/octet-stream",
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
    mimeType: type || null,
    name: file.name || null,
  };
}

export async function submitBillPaymentClaim(input: SubmitBillPaymentClaimInput) {
  if (!Number.isFinite(input.billId) || input.billId <= 0) {
    throw new Error("Valid bill ID is required.");
  }
  if (!Number.isFinite(input.amountPaid) || input.amountPaid <= 0) {
    throw new Error("Paid amount must be greater than 0.");
  }

  const bill = await fetchBillById(input.billId);
  const breakdown = asRecord(bill.breakdown) || {};
  const existingClaims = Array.isArray(breakdown.paymentClaims)
    ? breakdown.paymentClaims.map((claim) => toBillPaymentClaim(claim)).filter(Boolean) as BillPaymentClaim[]
    : [];

  const claimedAt = new Date().toISOString();
  const nextClaim: BillPaymentClaim = {
    id: `claim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    amount: input.amountPaid,
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
  let nextStatus = bill.status;
  let paidDate = bill.paid_date || null;

  if (approve) {
    totalPaid = paymentSummary.totalPaid + claim.amount;
    remainingAmount = Math.max(toNonNegativeNumber(bill.total) - totalPaid, 0);
    nextStatus =
      remainingAmount <= 0
        ? "paid"
        : bill.status === "overdue"
          ? "overdue"
          : "pending";
    paidDate = nextStatus === "paid" ? processedAt : null;
  }

  const updatedBreakdown = {
    ...breakdown,
    paymentClaims: nextClaims,
    totalPaid,
    remainingAmount,
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

  return data as BillRecord;
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

  const joinedDate = input.dateJoined?.trim() ? bsToAd(input.dateJoined.trim()) : null;

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

  const supabase = getSupabaseBrowserClient();
  const { data: rpcTenant, error: rpcError } = await supabase.rpc("connect_tenant_by_app_user_id", {
    p_property_id: input.propertyId,
    p_tenant_app_user_id: tenantAppUserId,
  });

  if (!rpcError) {
    const row = (Array.isArray(rpcTenant) ? rpcTenant[0] : rpcTenant) as PropertyTenantRecord | null;
    if (row) {
      let normalizedRow = row;
      if (typeof input.monthlyRent === "number" && Number.isFinite(row.id)) {
        const { data: updatedTenant, error: updateError } = await supabase
          .from("property_tenants")
          .update({ monthly_rent: input.monthlyRent })
          .eq("id", row.id)
          .select("*")
          .maybeSingle();
        if (updateError) {
          throw new Error(updateError.message || "Failed to save tenant monthly rent");
        }
        if (updatedTenant) {
          normalizedRow = updatedTenant as PropertyTenantRecord;
        }
      }

      return {
        ...normalizedRow,
        monthly_rent: normalizedRow.monthly_rent == null ? null : toNonNegativeNumber(normalizedRow.monthly_rent),
        date_joined: normalizedRow.date_joined ? adToBs(normalizedRow.date_joined) : null,
        date_end: normalizedRow.date_end ? adToBs(normalizedRow.date_end) : null,
      } as PropertyTenantRecord;
    }
  } else if (!/connect_tenant_by_app_user_id/i.test(rpcError.message || "")) {
    throw new Error(rpcError.message || "Failed to connect tenant");
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

  const { data: insertedTenant, error: insertError } = await supabase
    .from("property_tenants")
    .insert({
      property_id: input.propertyId,
      tenant_profile_id: tenantProfile.id,
      tenant_name: tenantProfile.name || "Tenant",
      tenant_email: tenantProfile.email || null,
      tenant_phone: tenantProfile.phone || null,
      monthly_rent: typeof input.monthlyRent === "number" ? input.monthlyRent : null,
      date_joined: new Date().toISOString().slice(0, 10),
      status: "active",
    })
    .select("*")
    .single();

  if (insertError || !insertedTenant) {
    throw new Error(insertError?.message || "Failed to connect tenant");
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
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id, property_name, property_code")
    .eq("property_code", propertyCode)
    .maybeSingle();

  if (propertyError) {
    throw new Error(propertyError.message || "Failed to verify property code");
  }
  if (!property) {
    throw new Error("No property found for this code.");
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

  const { data: tenant, error: tenantError } = await supabase
    .from("property_tenants")
    .insert({
      property_id: property.id,
      tenant_profile_id: input.tenantProfileId || null,
      tenant_name: tenantName,
      tenant_email: tenantEmail || null,
      tenant_phone: input.tenantPhone?.trim() || null,
      date_joined: new Date().toISOString().slice(0, 10),
      status: "active",
    })
    .select("*")
    .single();

  if (tenantError || !tenant) {
    throw new Error(tenantError?.message || "Failed to connect to property");
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

export async function deletePropertyTenant(tenantId: number) {
  if (!Number.isFinite(tenantId) || tenantId <= 0) {
    throw new Error("Valid tenant ID is required.");
  }

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("property_tenants").delete().eq("id", tenantId);

  if (error) {
    throw new Error(error.message || "Failed to delete tenant");
  }
}

export async function createBill(input: CreateBillInput) {
  validateCreateBillInput(input);

  const supabase = getSupabaseBrowserClient();
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

  return (fullBill || bill) as BillRecord;
}
