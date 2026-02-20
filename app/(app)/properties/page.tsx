"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus, MapPin, BedDouble, Bath, Square } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PropertyFormDialog } from "@/components/properties/property-form-dialog";
import { useUser } from "@/lib/user-context";
import { fetchProperties, type PropertyRecord } from "@/lib/rental-data";

const refreshMs = 5000;

export default function PropertiesPage() {
  const { user } = useUser();
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const loadProperties = async () => {
    try {
      const data = await fetchProperties();
      setProperties(data);
      setError(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to load properties");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
    const id = setInterval(loadProperties, refreshMs);
    return () => clearInterval(id);
  }, []);

  const sorted = useMemo(
    () => [...properties].sort((a, b) => b.id - a.id),
    [properties]
  );

  const ownedProperties = useMemo(
    () => sorted.filter((property) => property.owner_profile_id === user.profileId),
    [sorted, user.profileId]
  );

  const rentedProperties = useMemo(
    () => sorted.filter((property) => property.owner_profile_id !== user.profileId),
    [sorted, user.profileId]
  );

  const renderPropertyGrid = (entries: PropertyRecord[], emptyMessage: string) => {
    if (entries.length === 0) {
      return (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">{emptyMessage}</CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {entries.map((property) => {
          const image = property.property_images?.[0]?.url || "/placeholder.svg";
          return (
            <Link key={property.id} href={`/properties/${property.id}`} className="group">
              <Card className="h-full overflow-hidden transition-all hover:shadow-lg">
                <div className="h-40 w-full overflow-hidden">
                  <img src={image} alt={property.property_name} className="h-full w-full object-cover" />
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-1 text-base">{property.property_name}</CardTitle>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {property.location || property.address || property.city || "-"}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">
                    NPR {Number(property.desired_rent ?? property.price ?? 0).toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground">/{property.interval}</span>
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BedDouble className="h-3.5 w-3.5" />
                      {property.bedrooms ?? 0} bed
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="h-3.5 w-3.5" />
                      {property.bathrooms ?? 0} bath
                    </span>
                    <span className="flex items-center gap-1">
                      <Square className="h-3.5 w-3.5" />
                      {property.sqft ?? 0} sqft
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold lg:text-2xl">Properties</h1>
          <p className="text-sm text-muted-foreground">Live properties from Supabase</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Property
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">Loading properties...</CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Owned Properties</h2>
            {renderPropertyGrid(ownedProperties, "No owned properties yet. Add your first property.")}
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Rental Properties</h2>
            {renderPropertyGrid(rentedProperties, "You are not currently added to any rental property.")}
          </div>
        </div>
      )}

      <PropertyFormDialog open={addOpen} onOpenChange={setAddOpen} onSuccess={loadProperties} />
    </div>
  );
}
