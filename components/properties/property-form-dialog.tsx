"use client";

import { useMemo, useState, type WheelEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createProperty, type CreatePropertyInput } from "@/lib/rental-data";
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
  const { user } = useUser();

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [propertyName, setPropertyName] = useState("");
  const [propertyType, setPropertyType] = useState("flat");
  const [currency, setCurrency] = useState("USD");
  const [price, setPrice] = useState("");
  const [interval, setIntervalValue] = useState("monthly");
  const [location, setLocation] = useState("");
  const [rooms, setRooms] = useState("1");
  const [bedrooms, setBedrooms] = useState("1");
  const [bathrooms, setBathrooms] = useState("1");
  const [kitchens, setKitchens] = useState("1");
  const [dinings, setDinings] = useState("1");
  const [livings, setLivings] = useState("1");
  const [sqft, setSqft] = useState("");
  const [description, setDescription] = useState("");

  const [bikeParking, setBikeParking] = useState(false);
  const [carParking, setCarParking] = useState(false);
  const [carParkingSpaces, setCarParkingSpaces] = useState("0");
  const [waterSupply, setWaterSupply] = useState(false);
  const [wifi, setWifi] = useState(false);
  const [furnishedLevel, setFurnishedLevel] = useState<"none" | "semi" | "full">("none");
  const [otherServicesCsv, setOtherServicesCsv] = useState("");

  const [images, setImages] = useState<ImageEntry[]>([createImageEntry()]);

  const descriptionWordCount = useMemo(() => countWords(description), [description]);

  const resetForm = () => {
    setPropertyName("");
    setPropertyType("flat");
    setCurrency("USD");
    setPrice("");
    setIntervalValue("monthly");
    setLocation("");
    setRooms("1");
    setBedrooms("1");
    setBathrooms("1");
    setKitchens("1");
    setDinings("1");
    setLivings("1");
    setSqft("");
    setDescription("");
    setBikeParking(false);
    setCarParking(false);
    setCarParkingSpaces("0");
    setWaterSupply(false);
    setWifi(false);
    setFurnishedLevel("none");
    setOtherServicesCsv("");
    setImages([createImageEntry()]);
    setError(null);
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
    if (!currency.trim()) throw new Error("Currency is required.");
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

    const parsedPrice = parseRequiredNonNegative(price, "Price");
    const parsedRooms = parseRequiredNonNegative(rooms, "Rooms");
    const parsedBedrooms = parseRequiredNonNegative(bedrooms, "Bedrooms");
    const parsedBathrooms = parseRequiredNonNegative(bathrooms, "Bathrooms");
    const parsedKitchens = parseRequiredNonNegative(kitchens, "Kitchens");
    const parsedDinings = parseRequiredNonNegative(dinings, "Dinings");
    const parsedLivings = parseRequiredNonNegative(livings, "Livings");
    const parsedSqft = parseOptionalNonNegative(sqft, "Square feet");

    let parsedCarParkingSpaces = 0;
    if (carParking) {
      parsedCarParkingSpaces = parseRequiredNonNegative(carParkingSpaces, "Car parking spaces");
    }

    const otherServices = otherServicesCsv
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    return {
      propertyName: propertyName.trim(),
      propertyType: propertyType.trim(),
      currency: currency.trim(),
      price: parsedPrice,
      interval: interval.trim(),
      location: location.trim(),
      rooms: parsedRooms,
      bedrooms: parsedBedrooms,
      bathrooms: parsedBathrooms,
      kitchens: parsedKitchens,
      dinings: parsedDinings,
      livings: parsedLivings,
      sqft: parsedSqft,
      description: description.trim(),
      bikeParking,
      carParking,
      carParkingSpaces: parsedCarParkingSpaces,
      waterSupply,
      wifi,
      furnishedLevel,
      otherServices,
      ownerName: user.name || "",
      ownerEmail: user.email || "",
      ownerAppUserId: user.id || "",
      images: parsedImages,
    };
  };

  const handleCreateProperty = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = buildPayload();
      await createProperty(payload);

      await onSuccess?.();
      resetForm();

      if (closeOnSuccess) {
        onCancel?.();
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to create property");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {error && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

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
          <div className="space-y-2">
            <Label>Property Type</Label>
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

          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="NPR">NPR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Price</Label>
            <Input
              min={0}
              type="number"
              value={price}
              onWheel={preventWheelChange}
              onChange={(event) => setPrice(event.target.value)}
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

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label>Rooms</Label>
            <Input min={0} type="number" value={rooms} onWheel={preventWheelChange} onChange={(event) => setRooms(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Bedrooms</Label>
            <Input min={0} type="number" value={bedrooms} onWheel={preventWheelChange} onChange={(event) => setBedrooms(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Bathrooms</Label>
            <Input min={0} type="number" value={bathrooms} onWheel={preventWheelChange} onChange={(event) => setBathrooms(event.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label>Kitchens</Label>
            <Input min={0} type="number" value={kitchens} onWheel={preventWheelChange} onChange={(event) => setKitchens(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Dinings</Label>
            <Input min={0} type="number" value={dinings} onWheel={preventWheelChange} onChange={(event) => setDinings(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Livings</Label>
            <Input min={0} type="number" value={livings} onWheel={preventWheelChange} onChange={(event) => setLivings(event.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Square Feet (optional)</Label>
          <Input min={0} type="number" value={sqft} onWheel={preventWheelChange} onChange={(event) => setSqft(event.target.value)} />
        </div>

        <div className="space-y-3">
          <Label>Preloaded Services</Label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={bikeParking} onCheckedChange={(checked) => setBikeParking(checked === true)} />
              <span>Bike Parking</span>
            </label>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={carParking}
                onCheckedChange={(checked) => {
                  const enabled = checked === true;
                  setCarParking(enabled);
                  if (!enabled) {
                    setCarParkingSpaces("0");
                  }
                }}
              />
              <span>Car Parking</span>
            </label>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={waterSupply} onCheckedChange={(checked) => setWaterSupply(checked === true)} />
              <span>Water Supply</span>
            </label>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={wifi} onCheckedChange={(checked) => setWifi(checked === true)} />
              <span>WiFi</span>
            </label>
          </div>

          <div className="space-y-2">
            <Label>Car Parking Spaces</Label>
            <Input
              min={0}
              type="number"
              value={carParkingSpaces}
              disabled={!carParking}
              onWheel={preventWheelChange}
              onChange={(event) => setCarParkingSpaces(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Furnished</Label>
            <RadioGroup
              value={furnishedLevel}
              onValueChange={(value) => setFurnishedLevel(value as "none" | "semi" | "full")}
              className="grid grid-cols-1 gap-2 sm:grid-cols-3"
            >
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="none" />
                <span>No Furnished</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="semi" />
                <span>Semi Furnished</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="full" />
                <span>Full Furnished</span>
              </label>
            </RadioGroup>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Other Services (optional, comma separated)</Label>
          <Input
            value={otherServicesCsv}
            onChange={(event) => setOtherServicesCsv(event.target.value)}
            placeholder="balcony, generator backup"
          />
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
          <Button onClick={handleCreateProperty} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Property"}
          </Button>
        </DialogFooter>
      ) : (
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={resetForm}>Reset</Button>
          <Button onClick={handleCreateProperty} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Property"}
          </Button>
        </div>
      )}
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
