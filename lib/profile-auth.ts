"use client";

import type { SupabaseClient, User as SupabaseAuthUser } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

export type ProfileRecord = {
  id: string;
  auth_user_id: string | null;
  app_user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
};

function buildDisplayName(authUser: SupabaseAuthUser, email: string) {
  const metaName = typeof authUser.user_metadata?.name === "string" ? authUser.user_metadata.name.trim() : "";
  if (metaName) {
    return metaName;
  }
  const emailName = email.split("@")[0]?.trim();
  return emailName || "User";
}

function randomAppUserId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 8; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `USR${suffix}`;
}

async function generateUniqueAppUserId(supabase: SupabaseClient) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = randomAppUserId();
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("app_user_id", candidate)
      .maybeSingle();
    if (error) {
      throw new Error(error.message || "Failed to validate generated user ID");
    }
    if (!data) {
      return candidate;
    }
  }
  return `USR${Date.now().toString().slice(-10)}`;
}

async function updateProfileById(
  supabase: SupabaseClient,
  profileId: string,
  updates: Partial<ProfileRecord>
) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", profileId)
    .select("id, auth_user_id, app_user_id, name, email, phone, avatar_url")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to update profile");
  }

  return data as ProfileRecord;
}

export async function ensureProfileForAuthUser(authUser: SupabaseAuthUser): Promise<ProfileRecord> {
  const supabase = getSupabaseBrowserClient();
  const email = authUser.email?.trim().toLowerCase() || "";
  if (!email) {
    throw new Error("Authenticated account is missing email");
  }

  const name = buildDisplayName(authUser, email);

  const { data: byAuthUserId, error: byAuthUserIdError } = await supabase
    .from("profiles")
    .select("id, auth_user_id, app_user_id, name, email, phone, avatar_url")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();

  if (byAuthUserIdError) {
    throw new Error(byAuthUserIdError.message || "Failed to load profile");
  }

  if (byAuthUserId) {
    const updates: Partial<ProfileRecord> = {};
    if (!byAuthUserId.app_user_id) {
      updates.app_user_id = await generateUniqueAppUserId(supabase);
    }
    if (byAuthUserId.email !== email) {
      updates.email = email;
    }
    if (!byAuthUserId.name?.trim()) {
      updates.name = name;
    }
    if (Object.keys(updates).length === 0) {
      return byAuthUserId as ProfileRecord;
    }
    return updateProfileById(supabase, byAuthUserId.id, updates);
  }

  const { data: byEmail, error: byEmailError } = await supabase
    .from("profiles")
    .select("id, auth_user_id, app_user_id, name, email, phone, avatar_url")
    .eq("email", email)
    .maybeSingle();

  if (byEmailError) {
    throw new Error(byEmailError.message || "Failed to load profile by email");
  }

  if (byEmail) {
    const updates: Partial<ProfileRecord> = {
      auth_user_id: authUser.id,
    };
    if (!byEmail.app_user_id) {
      updates.app_user_id = await generateUniqueAppUserId(supabase);
    }
    if (!byEmail.name?.trim()) {
      updates.name = name;
    }
    return updateProfileById(supabase, byEmail.id, updates);
  }

  const appUserId = await generateUniqueAppUserId(supabase);
  const { data: inserted, error: insertError } = await supabase
    .from("profiles")
    .insert({
      auth_user_id: authUser.id,
      app_user_id: appUserId,
      name,
      email,
      avatar_url:
        typeof authUser.user_metadata?.avatar_url === "string"
          ? authUser.user_metadata.avatar_url
          : null,
    })
    .select("id, auth_user_id, app_user_id, name, email, phone, avatar_url")
    .single();

  if (insertError || !inserted) {
    throw new Error(insertError?.message || "Failed to create profile");
  }

  return inserted as ProfileRecord;
}
