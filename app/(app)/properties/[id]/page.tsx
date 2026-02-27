"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  BedDouble,
  Bath,
  Square,
  Bike,
  Car,
  Droplets,
  Wifi,
  Plus,
  User,
  Copy,
  Check,
  Trash2,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NepaliDateInput } from "@/components/ui/nepali-date-picker";
import { useUser } from "@/lib/user-context";
import {
  createPropertyTenant,
  createPropertyTenantByUserId,
  deleteProperty,
  deletePropertyTenant,
  fetchBills,
  fetchProperties,
  fetchPropertyTenants,
  getBillSectionSummary,
  type BillRecord,
  type PropertyRecord,
  type PropertyTenantRecord,
} from "@/lib/rental-data";

const descriptionPreviewWordCount = 70;

const words = (value: string) => value.trim().split(/\s+/).filter(Boolean);
const formatNpr = (value: number) => `NPR ${value.toFixed(2)}`;

export default function PropertyDetailPage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [property, setProperty] = useState<PropertyRecord | null>(null);
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [tenants, setTenants] = useState<PropertyTenantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const [addTenantOpen, setAddTenantOpen] = useState(false);
  const [tenantName, setTenantName] = useState("");
  const [tenantEmail, setTenantEmail] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [tenantMonthlyRent, setTenantMonthlyRent] = useState("");
  const [tenantDateJoined, setTenantDateJoined] = useState("");
  const [tenantSubmitting, setTenantSubmitting] = useState(false);
  const [tenantError, setTenantError] = useState<string | null>(null);
  const [tenantMode, setTenantMode] = useState<"code" | "manual">("code");
  const [tenantUniqueId, setTenantUniqueId] = useState("");
  const [copied, setCopied] = useState(false);
  const [propertyCodeCopied, setPropertyCodeCopied] = useState(false);
  const [deleteTenantOpen, setDeleteTenantOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePropertyOpen, setDeletePropertyOpen] = useState(false);
  const [deletePropertyStep, setDeletePropertyStep] = useState<1 | 2>(1);
  const [deletePropertyConfirmationText, setDeletePropertyConfirmationText] = useState("");
  const [deletePropertySubmitting, setDeletePropertySubmitting] = useState(false);
  const [deletePropertyError, setDeletePropertyError] = useState<string | null>(null);

  const propertyCode = useMemo(
    () => (property?.property_code && /^\d{10}$/.test(property.property_code) ? property.property_code : ""),
    [property?.property_code]
  );

  const load = async () => {
    try {
      const [propertyData, billData, tenantData] = await Promise.all([
        fetchProperties(),
        fetchBills({ propertyId: id }),
        fetchPropertyTenants(id),
      ]);

      const found = propertyData.find((entry) => entry.id === id) || null;
      setProperty(found);
      setBills(billData);
      setTenants(tenantData);
      setError(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to load property");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isNaN(id)) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const resetTenantForm = () => {
    setTenantName("");
    setTenantEmail("");
    setTenantPhone("");
    setTenantMonthlyRent("");
    setTenantDateJoined("");
    setTenantUniqueId("");
    setTenantError(null);
    setTenantMode("code");
  };

  const resolveTenantMonthlyRent = () => {
    const trimmed = tenantMonthlyRent.trim();
    if (!trimmed) {
      return undefined;
    }

    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new Error("Tenant monthly rent must be a non-negative number.");
    }

    return parsed;
  };

  const handleAddTenant = async () => {
    setTenantError(null);
    setTenantSubmitting(true);
    try {
      const monthlyRent = resolveTenantMonthlyRent();
      await createPropertyTenant({
        propertyId: id,
        tenantName,
        tenantEmail,
        tenantPhone,
        monthlyRent,
        dateJoined: tenantDateJoined,
      });
      setAddTenantOpen(false);
      resetTenantForm();
      const updated = await fetchPropertyTenants(id);
      setTenants(updated);
    } catch (caughtError) {
      setTenantError(caughtError instanceof Error ? caughtError.message : "Failed to add tenant");
    } finally {
      setTenantSubmitting(false);
    }
  };

  const handleAddTenantByUniqueId = async () => {
    setTenantError(null);
    setTenantSubmitting(true);
    try {
      const monthlyRent = resolveTenantMonthlyRent();
      await createPropertyTenantByUserId({
        propertyId: id,
        tenantAppUserId: tenantUniqueId,
        monthlyRent,
      });
      setAddTenantOpen(false);
      resetTenantForm();
      const updated = await fetchPropertyTenants(id);
      setTenants(updated);
    } catch (caughtError) {
      setTenantError(caughtError instanceof Error ? caughtError.message : "Failed to connect tenant");
    } finally {
      setTenantSubmitting(false);
    }
  };

  const closeDeleteDialog = () => {
    setDeleteTenantOpen(false);
    setDeleteStep(1);
    setDeleteError(null);
    setDeleteSubmitting(false);
  };

  const handleDeleteTenant = async () => {
    if (!tenantToDelete) {
      setDeleteError("No tenant found for this property.");
      return;
    }

    setDeleteError(null);
    setDeleteSubmitting(true);

    try {
      await deletePropertyTenant(tenantToDelete.id);
      const [updatedTenants, updatedBills] = await Promise.all([
        fetchPropertyTenants(id),
        fetchBills({ propertyId: id }),
      ]);
      setTenants(updatedTenants);
      setBills(updatedBills);
      closeDeleteDialog();
    } catch (caughtError) {
      setDeleteError(caughtError instanceof Error ? caughtError.message : "Failed to delete tenant");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const closeDeletePropertyDialog = () => {
    setDeletePropertyOpen(false);
    setDeletePropertyStep(1);
    setDeletePropertyConfirmationText("");
    setDeletePropertyError(null);
    setDeletePropertySubmitting(false);
  };

  const handleDeleteProperty = async () => {
    if (!property) {
      setDeletePropertyError("Property not found.");
      return;
    }

    setDeletePropertyError(null);
    setDeletePropertySubmitting(true);

    try {
      await deleteProperty(property.id);
      closeDeletePropertyDialog();
      router.push("/properties");
      router.refresh();
    } catch (caughtError) {
      setDeletePropertyError(caughtError instanceof Error ? caughtError.message : "Failed to delete property");
    } finally {
      setDeletePropertySubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading property...</div>;
  }

  if (error) {
    return <div className="p-6 text-sm text-destructive">{error}</div>;
  }

  if (!property) {
    return <div className="p-6 text-sm text-muted-foreground">Property not found.</div>;
  }

  const allImages = property.property_images || [];
  const galleryImages = allImages.length > 0
    ? allImages.map((image) => image.url).filter(Boolean)
    : ["/placeholder.svg"];
  const galleryColumns = galleryImages.length <= 3 ? galleryImages.length : Math.ceil(galleryImages.length / 2);
  const galleryRows = galleryImages.length <= 3 ? 1 : 2;

  const descriptionText = property.description || "-";
  const descriptionWords = words(descriptionText);
  const hasMoreDescription = descriptionWords.length > descriptionPreviewWordCount;
  const shownDescription = descriptionExpanded || !hasMoreDescription
    ? descriptionText
    : `${descriptionWords.slice(0, descriptionPreviewWordCount).join(" ")}...`;

  const facilities = [
    { icon: BedDouble, label: `${property.bedrooms ?? 0} Bedrooms` },
    { icon: Bath, label: `${property.bathrooms ?? 0} Bathrooms` },
    { icon: Square, label: `${property.sqft ?? 0} Sq.ft` },
    { icon: Bike, label: property.bike_parking === "yes" ? "Bike Parking" : "No Bike Parking" },
    { icon: Car, label: property.car_parking === "yes" ? `${property.car_parking_spaces ?? 0} Car Spaces` : "No Car Parking" },
    { icon: Droplets, label: property.water_supply ? "Water Supply" : "No Water Supply" },
    { icon: Wifi, label: property.wifi ? "WiFi Available" : "No WiFi" },
  ];

  const hasTenants = tenants.length > 0;
  const activeTenant = tenants.find((tenant) => tenant.status === "active") || tenants[0] || null;
  const tenantToDelete = activeTenant;
  const monthlyRent = Number(activeTenant?.monthly_rent ?? property.desired_rent ?? property.price ?? 0);
  const isOwner = property.owner_profile_id === user.profileId;

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link href="/properties">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Properties
        </Link>
      </Button>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="md:col-span-3 overflow-hidden">
          <div className="h-[300px] p-2">
            <div
              className="grid h-full gap-2"
              style={{
                gridTemplateColumns: `repeat(${galleryColumns}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${galleryRows}, minmax(0, 1fr))`,
              }}
            >
              {galleryImages.map((url, index) => (
                <div key={`gallery-${index}`} className="overflow-hidden rounded-md border bg-muted/20">
                  <img
                    src={url}
                    alt={`${property.property_name} ${index + 1}`}
                    className="h-full w-full object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className={`grid gap-6 ${isOwner ? "lg:grid-cols-3" : ""}`}>
        <div className={`space-y-6 ${isOwner ? "lg:col-span-2" : ""}`}>
          <div>
            <h1 className="text-2xl font-semibold">{property.property_name}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {property.location || property.address || "-"}
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>Monthly Rent: NPR {monthlyRent.toLocaleString()}</span>
              <span>{property.bedrooms ?? 0} bed</span>
              <span>{property.bathrooms ?? 0} bath</span>
              <span>{property.sqft ?? 0} sq.ft</span>
            </div>
          </div>

          <Tabs defaultValue="property-details">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="property-details">Property details</TabsTrigger>
              <TabsTrigger value="investment-details">Investment details</TabsTrigger>
            </TabsList>

            <TabsContent value="property-details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Monthly Rent</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">{formatNpr(monthlyRent)}</p>
                  <p className="text-xs text-muted-foreground">
                    Source: {activeTenant?.monthly_rent != null ? "Tenant rent" : property.desired_rent != null ? "Desired rent" : "Property price"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Property Description</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>{shownDescription}</p>
                  {hasMoreDescription && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDescriptionExpanded((prev) => !prev)}
                    >
                      {descriptionExpanded ? "Show less" : "Show more"}
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Facilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {facilities.map((facility) => (
                      <div key={facility.label} className="flex items-center gap-2 text-sm">
                        <facility.icon className="h-4 w-4 text-muted-foreground" />
                        <span>{facility.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

            </TabsContent>

            <TabsContent value="investment-details">
              <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  Investment details are coming soon.
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bills</CardTitle>
            </CardHeader>
            <CardContent>
              {bills.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">No bills yet for this property.</p>
                  {isOwner && hasTenants && (
                    <Button asChild size="sm">
                      <Link href={`/transactions?propertyId=${property.id}`}>Create First Bill</Link>
                    </Button>
                  )}
                  {isOwner && !hasTenants && (
                    <p className="text-xs text-amber-700">
                      Add a tenant first. Bill creation is not allowed when a property has no tenant.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {bills.map((bill) => {
                    const sections = getBillSectionSummary(bill);
                    return (
                      <div key={bill.id} className="rounded-md border p-3 text-sm space-y-1">
                        <div className="font-medium">{bill.tenant_name} - {bill.current_month}</div>
                        <div className="text-muted-foreground capitalize">Status: {bill.status}</div>
                        <div className="flex justify-between"><span>Rent (per month)</span><span>{formatNpr(sections.rentPerMonth)}</span></div>
                        <div className="flex justify-between"><span>Due</span><span>{formatNpr(sections.due)}</span></div>
                        <div className="flex justify-between"><span>Penalty (10% of due)</span><span>{formatNpr(sections.penalty)}</span></div>
                        <div className="text-xs rounded-md border px-2 py-1">
                          <div className="flex justify-between"><span>Electricity bill</span><span>{formatNpr(sections.electricity.amount)}</span></div>
                          <div className="text-muted-foreground">
                            Prev: {sections.electricity.previousUnit} | Current: {sections.electricity.currentUnit} | Rate: {sections.electricity.rate}
                          </div>
                        </div>
                        <div className="text-xs rounded-md border px-2 py-1">
                          <div className="flex justify-between"><span>Water bill</span><span>{formatNpr(sections.water.amount)}</span></div>
                          <div className="text-muted-foreground">
                            Prev: {sections.water.previousUnit} | Current: {sections.water.currentUnit} | Rate: {sections.water.rate}
                          </div>
                        </div>
                        <div className="flex justify-between"><span>Wifi</span><span>{formatNpr(sections.wifi)}</span></div>
                        <div className="text-xs rounded-md border px-2 py-1">
                          <div className="flex justify-between"><span>Others</span><span>{formatNpr(sections.othersTotal)}</span></div>
                          {sections.others.length > 0 ? (
                            sections.others.map((charge, index) => (
                              <div key={`${bill.id}-${charge.name}-${index}`} className="flex justify-between text-muted-foreground">
                                <span>{charge.name}</span>
                                <span>{formatNpr(charge.amount)}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-muted-foreground">No additional charges</div>
                          )}
                        </div>
                        <div className="flex justify-between font-medium"><span>Total</span><span>{formatNpr(sections.total)}</span></div>
                        <div className="pt-1">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/transactions/${bill.id}`}>View Bill Details</Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {isOwner && (
          <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Property Reference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="text-muted-foreground">Unique Property ID</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-md border bg-muted/30 px-3 py-2 font-mono text-sm">
                  {propertyCode || "Not generated"}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!propertyCode}
                  onClick={async () => {
                    try {
                      if (!propertyCode) {
                        return;
                      }
                      await navigator.clipboard.writeText(propertyCode);
                      setPropertyCodeCopied(true);
                      setTimeout(() => setPropertyCodeCopied(false), 1500);
                    } catch {
                      // no-op
                    }
                  }}
                >
                  {propertyCodeCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {propertyCodeCopied ? "Copied" : "Copy"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Tenants</CardTitle>
            </CardHeader>
            <CardContent>
              {hasTenants ? (
                <div className="space-y-2">
                  {tenants.map((tenant) => (
                    <div key={tenant.id} className="rounded-md border p-3 text-sm">
                      <div className="flex items-center gap-2 font-medium">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {tenant.tenant_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {tenant.tenant_email || "No email"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {tenant.tenant_phone || "No phone"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Monthly Rent: {tenant.monthly_rent != null ? formatNpr(Number(tenant.monthly_rent)) : "Not set"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Joined: {tenant.date_joined || "N/A"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No tenants added yet.</p>
              )}
            </CardContent>
          </Card>

          {!hasTenants ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add Tenant</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Add tenant manually to this property.
                </p>
                <Button className="w-full" onClick={() => setAddTenantOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Tenant
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Delete Tenant</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1 rounded-md border bg-muted/30 p-3 text-sm">
                  <div className="font-medium">{tenantToDelete?.tenant_name || "No active tenant"}</div>
                  <div className="text-xs text-muted-foreground">{tenantToDelete?.tenant_email || "No email"}</div>
                  <div className="text-xs text-muted-foreground">{tenantToDelete?.tenant_phone || "No phone"}</div>
                </div>
                <Button
                  className="w-full"
                  variant="destructive"
                  disabled={!tenantToDelete}
                  onClick={() => {
                    setDeleteError(null);
                    setDeleteStep(1);
                    setDeleteTenantOpen(true);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Tenant
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-base text-destructive">Property Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Deleting this property removes all tenants and bills linked to it.
              </p>
              <Button
                className="w-full"
                variant="destructive"
                onClick={() => {
                  setDeletePropertyError(null);
                  setDeletePropertyStep(1);
                  setDeletePropertyConfirmationText("");
                  setDeletePropertyOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Property
              </Button>
            </CardContent>
          </Card>

          </div>
        )}
      </div>

      <Dialog open={addTenantOpen} onOpenChange={setAddTenantOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Tenant Manually</DialogTitle>
            <DialogDescription>
              Choose how you want to add tenant for this property.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={tenantMode} onValueChange={(value) => setTenantMode(value as "code" | "manual")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="code">Add with Property Code</TabsTrigger>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            </TabsList>

            <TabsContent value="code" className="space-y-3 pt-3">
              <div className="space-y-2">
                <Label>Property Code</Label>
                <div className="flex gap-2">
                  <Input value={propertyCode || "Not generated"} readOnly className="font-mono" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      try {
                        if (!propertyCode) {
                          return;
                        }
                        await navigator.clipboard.writeText(propertyCode);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      } catch {
                        // no-op
                      }
                    }}
                  >
                    {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Share this 10-digit code with the tenant. They can enter it to add this property in their list.
              </p>
              <div className="space-y-2">
                <Label>Tenant Unique ID</Label>
                <Input
                  value={tenantUniqueId}
                  onChange={(event) => setTenantUniqueId(event.target.value)}
                  placeholder="Enter tenant unique ID (e.g. USR1234AB)"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the tenant unique ID to connect that user and add them as tenant for this property.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Monthly Rent (NPR)</Label>
                <Input
                  min={0}
                  type="number"
                  value={tenantMonthlyRent}
                  onChange={(event) => setTenantMonthlyRent(event.target.value)}
                  placeholder="e.g. 25000"
                />
              </div>
              {tenantError && <p className="text-sm text-destructive">{tenantError}</p>}
              <Button onClick={handleAddTenantByUniqueId} disabled={tenantSubmitting || !tenantUniqueId.trim()}>
                {tenantSubmitting ? "Connecting..." : "Connect Tenant"}
              </Button>
            </TabsContent>

            <TabsContent value="manual" className="space-y-3 pt-3">
              <div className="space-y-2">
                <Label>Property Code</Label>
                  <Input value={propertyCode || "Not generated"} readOnly className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label>Tenant Name</Label>
                <Input value={tenantName} onChange={(event) => setTenantName(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tenant Email (optional)</Label>
                <Input value={tenantEmail} onChange={(event) => setTenantEmail(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tenant Phone (optional)</Label>
                <Input value={tenantPhone} onChange={(event) => setTenantPhone(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Monthly Rent (NPR)</Label>
                <Input
                  min={0}
                  type="number"
                  value={tenantMonthlyRent}
                  onChange={(event) => setTenantMonthlyRent(event.target.value)}
                  placeholder="e.g. 25000"
                />
              </div>
              <div className="space-y-2">
                <Label>Date Joined (optional, Nepali)</Label>
                <NepaliDateInput value={tenantDateJoined} onChange={setTenantDateJoined} />
              </div>
              {tenantError && <p className="text-sm text-destructive">{tenantError}</p>}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTenantOpen(false)}>Close</Button>
            {tenantMode === "manual" && (
              <Button onClick={handleAddTenant} disabled={tenantSubmitting}>
                {tenantSubmitting ? "Adding..." : "Add Tenant"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTenantOpen} onOpenChange={(open) => (open ? setDeleteTenantOpen(true) : closeDeleteDialog())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{deleteStep === 1 ? "Warning" : "Confirm Tenant Deletion"}</DialogTitle>
            <DialogDescription>
              {deleteStep === 1
                ? "Deleting a tenant will remove the tenant and reset all bills for this property."
                : `This action is permanent. Click confirm only if you want to delete ${tenantToDelete?.tenant_name || "this tenant"} now.`}
            </DialogDescription>
          </DialogHeader>

          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteDialog}>Cancel</Button>
            {deleteStep === 1 ? (
              <Button onClick={() => setDeleteStep(2)}>Continue</Button>
            ) : (
              <Button variant="destructive" onClick={handleDeleteTenant} disabled={deleteSubmitting}>
                {deleteSubmitting ? "Deleting..." : "Confirm Delete"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deletePropertyOpen} onOpenChange={(open) => (open ? setDeletePropertyOpen(true) : closeDeletePropertyDialog())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{deletePropertyStep === 1 ? "Warning" : "Confirm Property Deletion"}</DialogTitle>
            <DialogDescription>
              {deletePropertyStep === 1
                ? "Deleting this property is permanent and will remove all related tenants and bills."
                : `Type "${property.property_name}" to confirm this deletion.`}
            </DialogDescription>
          </DialogHeader>

          {deletePropertyStep === 2 && (
            <div className="space-y-2">
              <Label htmlFor="delete-property-confirmation">Property name confirmation</Label>
              <Input
                id="delete-property-confirmation"
                value={deletePropertyConfirmationText}
                onChange={(event) => setDeletePropertyConfirmationText(event.target.value)}
                placeholder={property.property_name}
              />
            </div>
          )}

          {deletePropertyError && <p className="text-sm text-destructive">{deletePropertyError}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={closeDeletePropertyDialog}>Cancel</Button>
            {deletePropertyStep === 1 ? (
              <Button onClick={() => setDeletePropertyStep(2)}>Continue</Button>
            ) : (
              <Button
                variant="destructive"
                onClick={handleDeleteProperty}
                disabled={
                  deletePropertySubmitting ||
                  deletePropertyConfirmationText.trim() !== property.property_name.trim()
                }
              >
                {deletePropertySubmitting ? "Deleting..." : "Confirm Delete Property"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
