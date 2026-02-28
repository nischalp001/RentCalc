"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase-client";

// ── Types ──────────────────────────────────────────────────────────────────

export interface AdminProfile {
  id: string;
  auth_user_id: string | null;
  app_user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminProperty {
  id: number;
  property_code: string;
  owner_profile_id: string | null;
  property_name: string;
  property_type: string;
  currency: string;
  price: number;
  desired_rent: number;
  interval: string;
  location: string | null;
  bedrooms: number;
  sqft: number | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  owner_name?: string;
}

export interface AdminBill {
  id: number;
  property_id: number;
  property_name: string;
  tenant_name: string;
  tenant_email: string | null;
  current_month: string;
  base_rent: number;
  confirmed_rent: number;
  total: number;
  status: string;
  paid_date: string | null;
  payment_method: string | null;
  created_at: string;
}

export interface AdminTenant {
  id: number;
  property_id: number;
  tenant_profile_id: string | null;
  tenant_name: string;
  tenant_email: string | null;
  tenant_phone: string | null;
  monthly_rent: number | null;
  date_joined: string | null;
  date_end: string | null;
  status: string;
  created_at: string;
}

export interface AdminNotification {
  id: number;
  profile_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalProperties: number;
  totalBills: number;
  totalRevenue: number;
  pendingBills: number;
  activeConnections: number;
  totalTenants: number;
  totalDocuments: number;
}

// ── Admin email list (simple approach – extend as needed) ──────────────────
const ADMIN_EMAILS = ["admin@rentflow.com", "admin@example.com"];

export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) return false;

  const email = data.session.user.email?.toLowerCase() ?? "";
  // Allow any authenticated user as admin if ADMIN_EMAILS is not customised,
  // or match against the list.  For production, add your admin email here.
  if (ADMIN_EMAILS.length === 0) return true;

  // For demo purposes, allow any authenticated user to access admin
  return true;
}

// ── Dashboard stats ────────────────────────────────────────────────────────

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const supabase = getSupabaseBrowserClient();

  const [profiles, properties, bills, connections, tenants, documents] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("properties").select("id", { count: "exact", head: true }),
    supabase.from("bills").select("id, total, status"),
    supabase.from("connections").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("property_tenants").select("id", { count: "exact", head: true }),
    supabase.from("property_documents").select("id", { count: "exact", head: true }),
  ]);

  const billRows = bills.data ?? [];
  const totalRevenue = billRows
    .filter((b) => b.status === "paid")
    .reduce((sum, b) => sum + (Number(b.total) || 0), 0);
  const pendingBills = billRows.filter((b) => b.status === "pending").length;

  return {
    totalUsers: profiles.count ?? 0,
    totalProperties: properties.count ?? 0,
    totalBills: billRows.length,
    totalRevenue,
    pendingBills,
    activeConnections: connections.count ?? 0,
    totalTenants: tenants.count ?? 0,
    totalDocuments: documents.count ?? 0,
  };
}

// ── Users / Profiles ───────────────────────────────────────────────────────

export async function fetchAllProfiles(): Promise<AdminProfile[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchProfileById(id: string): Promise<AdminProfile | null> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateProfile(
  id: string,
  updates: Partial<Pick<AdminProfile, "name" | "email" | "phone" | "avatar_url">>
) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteProfile(id: string) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Password reset (sends Supabase password reset email) ───────────────────

export async function sendPasswordResetEmail(email: string) {
  const supabase = getSupabaseBrowserClient();

  // Using Supabase's built-in password recovery
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/admin/settings`,
  });
  if (error) throw new Error(error.message);
}

// ── Properties ─────────────────────────────────────────────────────────────

export async function fetchAllProperties(): Promise<AdminProperty[]> {
  const supabase = getSupabaseBrowserClient();

  const { data: properties, error } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  // Attach owner names
  const ownerIds = [...new Set((properties ?? []).map((p) => p.owner_profile_id).filter(Boolean))];
  let ownerMap: Record<string, string> = {};
  if (ownerIds.length > 0) {
    const { data: owners } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", ownerIds);
    ownerMap = Object.fromEntries((owners ?? []).map((o) => [o.id, o.name]));
  }

  return (properties ?? []).map((p) => ({
    ...p,
    owner_name: p.owner_profile_id ? ownerMap[p.owner_profile_id] ?? "Unknown" : "Unassigned",
  }));
}

export async function deleteProperty(propertyCode: string) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("properties").delete().eq("property_code", propertyCode);
  if (error) throw new Error(error.message);
}

// ── Bills / Transactions ───────────────────────────────────────────────────

export async function fetchAllBills(): Promise<AdminBill[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("bills")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Fetch all bills enriched with owner_profile_id from properties table */
export async function fetchAllBillsWithOwner(): Promise<(AdminBill & { owner_profile_id: string | null })[]> {
  const supabase = getSupabaseBrowserClient();
  const { data: bills, error } = await supabase
    .from("bills")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const propertyIds = [...new Set((bills ?? []).map((b) => b.property_id).filter(Boolean))];
  let propOwnerMap: Record<number, string | null> = {};
  if (propertyIds.length > 0) {
    const { data: props } = await supabase
      .from("properties")
      .select("id, owner_profile_id")
      .in("id", propertyIds);
    propOwnerMap = Object.fromEntries((props ?? []).map((p) => [p.id, p.owner_profile_id]));
  }

  return (bills ?? []).map((b) => ({
    ...b,
    owner_profile_id: propOwnerMap[b.property_id] ?? null,
  }));
}

export async function updateBillStatus(billId: number, status: string) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("bills")
    .update({ status, ...(status === "paid" ? { paid_date: new Date().toISOString() } : {}) })
    .eq("id", billId);
  if (error) throw new Error(error.message);
}

export async function deleteBill(billId: number) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("bills").delete().eq("id", billId);
  if (error) throw new Error(error.message);
}

// ── Tenants ────────────────────────────────────────────────────────────────

export async function fetchAllTenants(): Promise<AdminTenant[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("property_tenants")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── Connections ────────────────────────────────────────────────────────────

export async function fetchAllConnections() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("connections")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── Notifications ──────────────────────────────────────────────────────────

export async function fetchAllNotifications(): Promise<AdminNotification[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return data ?? [];
}
