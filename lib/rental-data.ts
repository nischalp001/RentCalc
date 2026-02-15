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
  breakdown: {
    baseRent?: number;
    electricity?: { amount?: number; previousUnit?: number; currentUnit?: number; rate?: number } | number;
    water?: { amount?: number; previousUnit?: number; currentUnit?: number; rate?: number } | number;
    internet?: number;
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
  baseRent?: number;
  confirmedRent?: number;
  electricity?: { amount?: number; previousUnit?: number; currentUnit?: number; rate?: number };
  water?: { amount?: number; previousUnit?: number; currentUnit?: number; rate?: number };
  internet?: number;
  otherCharges?: Record<string, unknown>;
  customFields?: Array<{ name: string; amount: number }>;
  total?: number;
  status?: "pending" | "paid" | "overdue" | "verified";
};

export type CreatePropertyTenantInput = {
  propertyId: number;
  tenantName: string;
  tenantEmail?: string;
  tenantPhone?: string;
  dateJoined?: string;
};

type CreatePropertyResult = {
  property: PropertyRecord;
};

const descriptionMaxWords = 150;

function toNumber(value: unknown, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
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

  const payload = {
    email: ownerEmail,
    name: input.ownerName?.trim() || ownerEmail.split("@")[0],
    app_user_id: input.ownerAppUserId?.trim() || null,
    auth_user_id: input.ownerAuthUserId?.trim() || null,
  };

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

export async function fetchProperties() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("properties")
    .select("*, property_images(*)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to fetch properties");
  }

  return (data || []) as PropertyRecord[];
}

export async function createProperty(input: CreatePropertyInput): Promise<CreatePropertyResult> {
  validateCreatePropertyInput(input);

  const supabase = getSupabaseBrowserClient();
  const ownerProfileId = await resolveOwnerProfileId(input);
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
  let query = supabase
    .from("bills")
    .select("*, bill_custom_fields(*)")
    .order("created_at", { ascending: false });

  if (typeof filter.propertyId === "number") {
    query = query.eq("property_id", filter.propertyId);
  }

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

export async function fetchPropertyTenants(propertyId: number) {
  if (!Number.isFinite(propertyId) || propertyId <= 0) {
    throw new Error("Valid property ID is required.");
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

  const joinedDate = input.dateJoined?.trim() ? bsToAd(input.dateJoined.trim()) : null;

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("property_tenants")
    .insert({
      property_id: input.propertyId,
      tenant_name: input.tenantName.trim(),
      tenant_email: input.tenantEmail?.trim() || null,
      tenant_phone: input.tenantPhone?.trim() || null,
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
    date_joined: data.date_joined ? adToBs(data.date_joined) : null,
    date_end: data.date_end ? adToBs(data.date_end) : null,
  } as PropertyTenantRecord;
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
  const breakdown = {
    baseRent: toNumber(input.confirmedRent ?? input.baseRent),
    billingInterval: input.billingInterval?.trim() || "monthly",
    electricity: input.electricity || { amount: 0, previousUnit: 0, currentUnit: 0, rate: 0 },
    water: input.water || { amount: 0, previousUnit: 0, currentUnit: 0, rate: 0 },
    internet: toNumber(input.internet),
    ...(input.otherCharges || {}),
  };

  const total = toNumber(input.total, toNumber((breakdown as { baseRent?: number }).baseRent));

  const { data: bill, error } = await supabase
    .from("bills")
    .insert({
      property_id: input.propertyId,
      property_name: input.propertyName,
      tenant_name: input.tenantName,
      tenant_email: input.tenantEmail?.trim() || "",
      current_month: input.currentMonth,
      base_rent: toNumber(input.baseRent),
      confirmed_rent: toNumber(input.confirmedRent ?? input.baseRent),
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
