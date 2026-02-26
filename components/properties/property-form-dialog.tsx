"use client";

import { useMemo, useState, type WheelEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createProperty, type CreatePropertyInput } from "@/lib/rental-data";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";
import { useUser } from "@/lib/user-context";

type PropertyFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => Promise<void> | void;
};

type PropertyCreateFormProps = {
  onSuccess?: () => Promise<void> | void;
  showCancel: boolean;
  closeOnSuccess: boolean;
  onCancel?: () => void;
};

type ImageEntry = {
  id: string;
  file: File | null;
  label: string;
};

type ProfileLookupRow = {
  id: string;
  auth_user_id: string | null;
  app_user_id: string | null;
  email: string;
};

type ProfileHealthCheck = {
  sessionAuthUserId: string | null;
  contextAuthUserId: string | null;
  contextProfileId: string | null;
  contextAppUserId: string | null;
  contextEmail: string | null;
  dbProfileByAuthId: string | null;
  dbProfileByAuthEmail: string | null;
  dbProfileByAuthAppUserId: string | null;
  dbProfileByEmailId: string | null;
  dbProfileByEmailAuthUserId: string | null;
  dbProfileByEmailAppUserId: string | null;
  dbCurrentProfileId: string | null;
  propertiesReadByOwnerOk: boolean | null;
  notes: string[];
};

const descriptionMaxWords = 150;

const createImageEntry = (): ImageEntry => ({
  id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  file: null,
  label: "",
});

const countWords = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;

const parseRequiredNonNegative = (value: string, label: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${label} is required.`);
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a non-negative number.`);
  }

  return parsed;
};

const parseOptionalNonNegative = (value: string, label: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a non-negative number.`);
  }

  return parsed;
};

function PropertyCreateForm({ onSuccess, showCancel, closeOnSuccess, onCancel }: PropertyCreateFormProps) {
  const { user, profileReady } = useUser();

  const [error, setError] = useState<string | null>(null);
  const [errorOpen, setErrorOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [healthData, setHealthData] = useState<ProfileHealthCheck | null>(null);

  const [propertyName, setPropertyName] = useState("");
  const [propertyType, setPropertyType] = useState("flat");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [interval, setIntervalValue] = useState("monthly");
  const [location, setLocation] = useState("");
  const [sqft, setSqft] = useState("");
  const [description, setDescription] = useState("");

  const [images, setImages] = useState<ImageEntry[]>([createImageEntry()]);

  const descriptionWordCount = useMemo(() => countWords(description), [description]);

  const resetForm = () => {
    setPropertyName("");
    setPropertyType("flat");
    setMonthlyRent("");
    setIntervalValue("monthly");
    setLocation("");
    setSqft("");
    setDescription("");
    setImages([createImageEntry()]);
    setError(null);
    setErrorOpen(false);
  };

  const showError = (message: string) => {
    setError(message);
    setErrorOpen(true);
  };

  const normalizeCreatePropertyError = (message: string) => {
    const lower = message.toLowerCase();
    if (lower.includes("row-level security policy") && lower.includes("properties")) {
      return "Unable to save property because your account profile is not fully linked yet. Please close this window and try again in a few seconds.";
    }
    return message;
  };

  const runProfileLinkHealthCheck = async () => {
    setHealthLoading(true);
    setHealthError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        throw new Error(sessionError.message || "Failed to read auth session");
      }

      const sessionAuthUserId = sessionData.session?.user?.id || null;
      const sessionEmail = sessionData.session?.user?.email?.trim().toLowerCase() || null;
      const contextEmail = user.email?.trim().toLowerCase() || null;
      const authUserIdToCheck = sessionAuthUserId || user.authUserId || null;
      const emailToCheck = sessionEmail || contextEmail || null;

      let byAuth: ProfileLookupRow | null = null;
      if (authUserIdToCheck) {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, auth_user_id, app_user_id, email")
          .eq("auth_user_id", authUserIdToCheck)
          .maybeSingle();
        if (error) {
          throw new Error(error.message || "Failed to check profile by auth user ID");
        }
        byAuth = (data as ProfileLookupRow | null) || null;
      }

      let byEmail: ProfileLookupRow | null = null;
      if (emailToCheck) {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, auth_user_id, app_user_id, email")
          .eq("email", emailToCheck)
          .maybeSingle();
        if (error) {
          throw new Error(error.message || "Failed to check profile by email");
        }
        byEmail = (data as ProfileLookupRow | null) || null;
      }

      const notes: string[] = [];
      const { data: rpcCurrentProfileId } = await supabase.rpc("current_profile_id");
      const dbCurrentProfileId = typeof rpcCurrentProfileId === "string" ? rpcCurrentProfileId : null;
      let propertiesReadByOwnerOk: boolean | null = null;
      if (user.profileId) {
        const { error } = await supabase
          .from("properties")
          .select("id")
          .eq("owner_profile_id", user.profileId)
          .limit(1);
        propertiesReadByOwnerOk = !error;
        if (error) {
          notes.push(`Properties select policy check failed: ${error.message}`);
        }
      }

      if (!profileReady) {
        notes.push("Profile context is still loading in the app.");
      }
      if (!sessionAuthUserId) {
        notes.push("No active auth session user ID found.");
      }
      if (!authUserIdToCheck) {
        notes.push("Missing auth user ID to match with profiles.auth_user_id.");
      } else if (!byAuth?.id) {
        notes.push("No profile row found where profiles.auth_user_id matches your auth user ID.");
      }
      if (!emailToCheck) {
        notes.push("No email found to match profiles.email.");
      } else if (!byEmail?.id) {
        notes.push("No profile row found where profiles.email matches your email.");
      }
      if (byEmail?.id && !byEmail.auth_user_id) {
        notes.push("Profile found by email, but auth_user_id is NULL.");
      }
      if (byEmail?.auth_user_id && authUserIdToCheck && byEmail.auth_user_id !== authUserIdToCheck) {
        notes.push("Profile email row points to a different auth_user_id.");
      }
      if (user.profileId && byAuth?.id && user.profileId !== byAuth.id) {
        notes.push("App context profileId does not match DB profile matched by auth_user_id.");
      }
      if (!dbCurrentProfileId) {
        notes.push("current_profile_id() returned NULL, so RLS cannot treat you as a property owner.");
      }
      if (propertiesReadByOwnerOk === false) {
        notes.push("RLS denied reading properties for your owner_profile_id. Re-run connect_user_ownership.sql to refresh policies.");
      }

      setHealthData({
        sessionAuthUserId,
        contextAuthUserId: user.authUserId || null,
        contextProfileId: user.profileId || null,
        contextAppUserId: user.id || null,
        contextEmail,
        dbProfileByAuthId: byAuth?.id || null,
        dbProfileByAuthEmail: byAuth?.email || null,
        dbProfileByAuthAppUserId: byAuth?.app_user_id || null,
        dbProfileByEmailId: byEmail?.id || null,
        dbProfileByEmailAuthUserId: byEmail?.auth_user_id || null,
        dbProfileByEmailAppUserId: byEmail?.app_user_id || null,
        dbCurrentProfileId,
        propertiesReadByOwnerOk,
        notes,
      });
    } catch (caughtError) {
      setHealthError(caughtError instanceof Error ? caughtError.message : "Failed to run profile health check");
      setHealthData(null);
    } finally {
      setHealthLoading(false);
    }
  };

  const openHealthDialog = () => {
    setHealthOpen(true);
    void runProfileLinkHealthCheck();
  };

  const preventWheelChange = (event: WheelEvent<HTMLInputElement>) => {
    event.currentTarget.blur();
  };

  const setImageFile = (id: string, file: File | null) => {
    setImages((prev) => prev.map((image) => (image.id === id ? { ...image, file } : image)));
  };

  const setImageLabel = (id: string, label: string) => {
    setImages((prev) => prev.map((image) => (image.id === id ? { ...image, label } : image)));
  };

  const addImage = () => {
    setImages((prev) => [...prev, createImageEntry()]);
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      if (prev.length === 1) {
        return prev;
      }
      return prev.filter((image) => image.id !== id);
    });
  };

  const buildPayload = (): CreatePropertyInput => {
    if (!propertyName.trim()) throw new Error("Property name is required.");
    if (!location.trim()) throw new Error("Location is required.");
    if (!propertyType.trim()) throw new Error("Property type is required.");
    if (!interval.trim()) throw new Error("Interval is required.");

    if (!description.trim()) throw new Error("Description is required.");
    if (descriptionWordCount > descriptionMaxWords) {
      throw new Error(`Description must be ${descriptionMaxWords} words or fewer.`);
    }

    const parsedImages = images.map((image, index) => {
      if (!image.file) {
        throw new Error(`Image ${index + 1} file is required.`);
      }
      if (!image.label.trim()) {
        throw new Error(`Image ${index + 1} description is required.`);
      }
      return {
        file: image.file,
        label: image.label.trim(),
      };
    });

    if (parsedImages.length === 0) {
      throw new Error("At least one image is required.");
    }

    const parsedMonthlyRent = parseRequiredNonNegative(monthlyRent, "Monthly rent");
    const parsedSqft = parseOptionalNonNegative(sqft, "Square feet");

    return {
      propertyName: propertyName.trim(),
      propertyType: propertyType.trim(),
      currency: "NPR",
      price: parsedMonthlyRent,
      desiredRent: parsedMonthlyRent,
      interval: interval.trim(),
      location: location.trim(),
      rooms: 0,
      bedrooms: 0,
      bathrooms: 0,
      kitchens: 0,
      dinings: 0,
      livings: 0,
      sqft: parsedSqft,
      description: description.trim(),
      bikeParking: false,
      carParking: false,
      carParkingSpaces: 0,
      waterSupply: false,
      wifi: false,
      furnishedLevel: "none",
      otherServices: [],
      ownerProfileId: user.profileId || "",
      ownerName: user.name || "",
      ownerEmail: user.email || "",
      ownerAppUserId: user.id || "",
      ownerAuthUserId: user.authUserId || "",
      images: parsedImages,
    };
  };

  const handleCreateProperty = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      if (!profileReady || !user.profileId) {
        throw new Error("Your profile is still loading. Please wait a moment and try again.");
      }

      const payload = buildPayload();
      await createProperty(payload);

      await onSuccess?.();
      resetForm();

      if (closeOnSuccess) {
        onCancel?.();
      }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Failed to create property";
      showError(normalizeCreatePropertyError(message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="grid gap-4 py-2">
        <div className="space-y-2">
          <Label>Property Name</Label>
          <Input value={propertyName} onChange={(event) => setPropertyName(event.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Location</Label>
          <Input value={location} onChange={(event) => setLocation(event.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2 col-span-2">
            <Label>Type</Label>
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="flat">Flat</SelectItem>
                <SelectItem value="room">Room</SelectItem>
                <SelectItem value="office">Office</SelectItem>
                <SelectItem value="bnb">BNB</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Monthly Rent</Label>
            <Input
              min={0}
              type="number"
              value={monthlyRent}
              onWheel={preventWheelChange}
              onChange={(event) => setMonthlyRent(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Interval</Label>
            <Select value={interval} onValueChange={setIntervalValue}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Square Feet (optional)</Label>
          <Input min={0} type="number" value={sqft} onWheel={preventWheelChange} onChange={(event) => setSqft(event.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
          <p className={`text-xs ${descriptionWordCount > descriptionMaxWords ? "text-destructive" : "text-muted-foreground"}`}>
            {descriptionWordCount}/{descriptionMaxWords} words
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Images (at least one required)</Label>
            <Button type="button" variant="outline" size="sm" onClick={addImage}>
              <Plus className="mr-2 h-4 w-4" />
              Add Image
            </Button>
          </div>

          <div className="space-y-3">
            {images.map((image, index) => (
              <div key={image.id} className="grid gap-2 rounded-md border p-3">
                <div className="space-y-2">
                  <Label>Image {index + 1}</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setImageFile(image.id, event.target.files?.[0] || null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Image Description</Label>
                  <Input
                    value={image.label}
                    onChange={(event) => setImageLabel(image.id, event.target.value)}
                    placeholder="Front view, kitchen, bedroom, etc."
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={images.length === 1}
                    onClick={() => removeImage(image.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showCancel ? (
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleCreateProperty} disabled={isSubmitting || !profileReady || !user.profileId}>
            {isSubmitting ? "Saving..." : "Save Property"}
          </Button>
        </DialogFooter>
      ) : (
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={resetForm}>Reset</Button>
          <Button onClick={handleCreateProperty} disabled={isSubmitting || !profileReady || !user.profileId}>
            {isSubmitting ? "Saving..." : "Save Property"}
          </Button>
        </div>
      )}

      <div className="pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={openHealthDialog}>
          Profile Link Health Check
        </Button>
      </div>

      <Dialog open={errorOpen} onOpenChange={setErrorOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Could not save property</DialogTitle>
            <DialogDescription>
              Please review this notice before trying again.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-destructive">{error || "An unknown error occurred."}</p>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setErrorOpen(false);
                openHealthDialog();
              }}
            >
              Health Check
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setErrorOpen(false);
                setError(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={healthOpen} onOpenChange={setHealthOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Profile Link Health Check</DialogTitle>
            <DialogDescription>
              Confirms whether your auth user, profile row, and RLS profile ID are linked.
            </DialogDescription>
          </DialogHeader>

          {healthLoading && <p className="text-sm text-muted-foreground">Checking profile linkage...</p>}
          {!healthLoading && healthError && <p className="text-sm text-destructive">{healthError}</p>}

          {!healthLoading && healthData && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
                <span className="text-muted-foreground">Session auth user ID</span>
                <code className="break-all text-xs">{healthData.sessionAuthUserId || "Missing"}</code>

                <span className="text-muted-foreground">Context auth user ID</span>
                <code className="break-all text-xs">{healthData.contextAuthUserId || "Missing"}</code>

                <span className="text-muted-foreground">Context profile ID</span>
                <code className="break-all text-xs">{healthData.contextProfileId || "Missing"}</code>

                <span className="text-muted-foreground">current_profile_id()</span>
                <code className="break-all text-xs">{healthData.dbCurrentProfileId || "NULL"}</code>

                <span className="text-muted-foreground">Properties read check</span>
                <code className="break-all text-xs">
                  {healthData.propertiesReadByOwnerOk === null
                    ? "Skipped"
                    : healthData.propertiesReadByOwnerOk
                      ? "OK"
                      : "Denied"}
                </code>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
                <span className="text-muted-foreground">Profile by auth_user_id</span>
                <code className="break-all text-xs">{healthData.dbProfileByAuthId || "Not found"}</code>

                <span className="text-muted-foreground">Profile by email</span>
                <code className="break-all text-xs">{healthData.dbProfileByEmailId || "Not found"}</code>

                <span className="text-muted-foreground">Profile email (context)</span>
                <code className="break-all text-xs">{healthData.contextEmail || "Missing"}</code>

                <span className="text-muted-foreground">App user ID</span>
                <code className="break-all text-xs">{healthData.contextAppUserId || "Missing"}</code>
              </div>

              <div className="rounded-md border p-3">
                <p className="mb-2 font-medium">Findings</p>
                {healthData.notes.length === 0 ? (
                  <p className="text-emerald-600">No linkage issues detected.</p>
                ) : (
                  <div className="space-y-1 text-destructive">
                    {healthData.notes.map((note, index) => (
                      <p key={`health-note-${index}`}>- {note}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => void runProfileLinkHealthCheck()} disabled={healthLoading}>
              Recheck
            </Button>
            <Button variant="outline" onClick={() => setHealthOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function PropertyFormDialog({ open, onOpenChange, onSuccess }: PropertyFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Property</DialogTitle>
          <DialogDescription>Add a new property to Supabase.</DialogDescription>
        </DialogHeader>

        <PropertyCreateForm
          onSuccess={onSuccess}
          showCancel
          closeOnSuccess
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
