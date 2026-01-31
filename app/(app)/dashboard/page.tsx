"use client";

import {
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  ArrowRight,
  Building2,
  Calendar,
  Users,
  Bed,
  QrCode,
  Camera,
  Upload,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { SummaryCard } from "@/components/summary-card";
import { StatusBadge } from "@/components/status-badge";
import { useUser } from "@/lib/user-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface Property {
  id: number;
  propertyName: string;
  propertyType: string;
  price: string;
  currency: string;
  interval: string;
  location: string;
  rooms: string;
  bedrooms?: number;
  bathrooms: string;
  kitchens: string;
  dinings: string;
  livings: string;
  bikeParking: string;
  carParking: string;
  services: string[];
  description: string;
  image?: string;
  images?: string[];
  rent?: string;
}

// Mock data for amount to receive (as landlord)
const amountToReceive = {
  total: "$7,200",
  received: "$4,700",
  pending: "$2,100",
  overdue: "$400",
  tenants: [
    {
      id: 1,
      name: "John Doe",
      property: "Sunset Apartments - Unit 3B",
      amount: "$1,200",
      status: "paid" as const,
      dueDate: "Jan 1",
      paidDate: "Jan 1",
    },
    {
      id: 2,
      name: "Jane Smith",
      property: "Oak Street House",
      amount: "$2,500",
      status: "pending" as const,
      dueDate: "Jan 5",
      paidDate: null,
    },
    {
      id: 3,
      name: "Tech Corp",
      property: "Downtown Office",
      amount: "$3,500",
      status: "overdue" as const,
      dueDate: "Dec 28",
      paidDate: null,
    },
  ],
};

// Mock data for amount to pay (as tenant)
const amountToPay = {
  total: "$1,500",
  paid: "$0",
  pending: "$1,500",
  overdue: "$0",
  landlords: [
    {
      id: 1,
      name: "Property Management Inc.",
      property: "Marina View Apartments - Unit 4B",
      amount: "$1,500",
      status: "pending" as const,
      dueDate: "Jan 5, 2026",
      utilities: {
        electricity: "$85",
        water: "$35",
        maintenance: "$50",
      },
    },
  ],
};

// Mock pending actions
const pendingActions = [
  {
    id: 1,
    title: "Verify payment from John Doe",
    description: "Apartment 3B - January rent",
    date: "2 hours ago",
    type: "verify",
  },
  {
    id: 2,
    title: "Upload rent receipt",
    description: "Monthly rent for Unit 4B",
    date: "Due today",
    type: "upload",
  },
  {
    id: 3,
    title: "Review lease renewal",
    description: "Sunset Apartments - Unit 5A",
    date: "3 days left",
    type: "review",
  },
  {
    id: 4,
    title: "Payment pending verification",
    description: "Your January rent payment",
    date: "Submitted yesterday",
    type: "pending",
  },
];

export default function DashboardPage() {
  const { user, connections } = useUser();
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [selectedFilterPay, setSelectedFilterPay] = useState<string | null>(null);
  const [addPropertyOpen, setAddPropertyOpen] = useState(false);
  const [connectPropertyOpen, setConnectPropertyOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [images, setImages] = useState([{ file: null as File | null, label: '' }]);

  // Resize image to limit stored data size and return data URL
  const resizeImageFile = (file: File, maxWidth = 1024, maxHeight = 1024, quality = 0.7) =>
    new Promise<string>((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          const aspect = width / height;
          if (width > maxWidth) {
            width = maxWidth;
            height = Math.round(maxWidth / aspect);
          }
          if (height > maxHeight) {
            height = maxHeight;
            width = Math.round(maxHeight * aspect);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas not supported');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          URL.revokeObjectURL(url);
          resolve(dataUrl);
        } catch (err) {
          URL.revokeObjectURL(url);
          reject(err);
        }
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      img.src = url;
    });
  const [propertyType, setPropertyType] = useState<string>('');
  const [interval, setInterval] = useState<string>('monthly');
  const [currency, setCurrency] = useState<string>('USD');
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    const props = JSON.parse(localStorage.getItem('properties') || '[]');
    setProperties(props);
  }, []);

  const addImage = () => {
    setImages([...images, { file: null, label: '' }]);
  };

  const updateImage = (index: number, field: 'file' | 'label', value: File | string | null) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], [field]: value };
    setImages(newImages);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const propertyName = formData.get('propertyName') as string;
    const propertyType = formData.get('propertyType') as string;
    const price = formData.get('price') as string;
    const currency = formData.get('currency') as string;
    const interval = formData.get('interval') as string;
    const location = formData.get('location') as string;
    const rooms = formData.get('rooms') as string;
    const bathrooms = formData.get('bathrooms') as string;
    const kitchens = formData.get('kitchens') as string;
    const dinings = formData.get('dinings') as string;
    const livings = formData.get('livings') as string;
    const bikeParking = formData.get('bikeParking') as string;
    const carParking = formData.get('carParking') as string;
    const services = formData.getAll('services') as string[];
    const description = formData.get('description') as string;

    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        // Success
        setAddPropertyOpen(false);
        setImages([{ file: null, label: '' }]);

        // convert any uploaded images to data URLs so they persist in localStorage
        const imageData = await Promise.all(
          images.map(async (img) => {
            if (img.file) {
              try {
                // resize before converting to data URL to reduce storage size
                return await resizeImageFile(img.file as File, 1024, 1024, 0.7);
              } catch (e) {
                return null;
              }
            }
            return img.label || null;
          })
        );

        // keep only valid images and limit count
        const imagesFiltered = (imageData.filter(Boolean) as string[]).slice(0, 6);

        const bedrooms = formData.get('bedrooms') as string;
        const sqft = formData.get('sqft') as string;

        const propertyData = {
          id: Date.now(),
          name: propertyName,
          propertyName,
          propertyType,
          price,
          currency,
          interval,
          address: location,
          location,
          city: location,
          rooms,
          bedrooms: parseInt(bedrooms),
          bathrooms: parseInt(bathrooms),
          sqft: parseInt(sqft),
          kitchens,
          dinings,
          livings,
          bikeParking,
          carParking,
          services,
          description,
          image: imagesFiltered[0] || '/placeholder.jpg',
          images: imagesFiltered,
          status: 'active' as const,
          rent: `$${price}`,
          dueDate: '1st of every month',
          leaseEnd: 'Dec 31, 2026',
        };

        const existing = JSON.parse(localStorage.getItem('properties') || '[]');
        existing.push(propertyData);
        try {
          localStorage.setItem('properties', JSON.stringify(existing));
          setProperties(existing);
        } catch (err: any) {
          // localStorage quota exceeded: try to save without images as fallback
          console.warn('localStorage quota exceeded, retrying without images', err);
          const existingNoImages = existing.map((p: any) => {
            const clone = { ...p };
            delete clone.images;
            delete clone.image;
            return clone;
          });
          try {
            localStorage.setItem('properties', JSON.stringify(existingNoImages));
            setProperties(existingNoImages);
            // inform user
            alert('Property saved, but images could not be stored due to localStorage limits.');
          } catch (err2) {
            console.error('Failed to save property to localStorage', err2);
            alert('Failed to save property locally. Try removing large images.');
          }
        }

        // Optionally show a success message
      } else {
        // Handle error
        console.error('Failed to submit property');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const hasTenantsRole = connections.some((c) => c.role === "tenant");
  const hasLandlordRole = connections.some((c) => c.role === "landlord");

  return (
    <div className="space-y-6">
      {/* Add Property Dialog */}
      <section>
        <Button size="lg" className="w-full h-16 text-lg font-bold justify-center" onClick={() => setAddPropertyOpen(true)}>
          Add Your Property
          <Plus className="h-6 w-6 ml-2" />
        </Button>
        <Dialog open={addPropertyOpen} onOpenChange={(open) => {
          setAddPropertyOpen(open);
          if (!open) {
            setImages([{ file: null, label: '' }]);
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Add Your Property</DialogTitle>
              <DialogDescription>
                Fill in the details to add your property to the platform.
              </DialogDescription>
            </DialogHeader>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="property-name">Property Name *</Label>
                <Input id="property-name" name="propertyName" placeholder="Enter property name" required />
              </div>
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input id="location" name="location" placeholder="Enter location" required />
              </div>
              <div>
                <Label htmlFor="property-type">Property Type *</Label>
                <Select name="propertyType" value={propertyType} onValueChange={setPropertyType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="flat">Flat</SelectItem>
                    <SelectItem value="room">Room</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="coworking">Coworking Space</SelectItem>
                    <SelectItem value="bnb">BNB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="price">Price *</Label>
                <div className="flex gap-2">
                  <Select name="currency" value={currency} onValueChange={setCurrency} required>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">NPR</SelectItem>
                      <SelectItem value="EUR">USD</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input id="price" name="price" type="number" min="0" step="1" placeholder="Enter price" required />
                  <Select name="interval" value={interval} onValueChange={setInterval} required>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyType === 'bnb' ? (
                        <SelectItem value="daily">Daily</SelectItem>
                      ) : (
                        <>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="3months">3 Months</SelectItem>
                          <SelectItem value="6months">6 Months</SelectItem>
                          <SelectItem value="year">Year</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="mb-4">Images *</Label>
                <div className="space-y-4">
                  {images.map((image, index) => (
                    <div key={index} className="flex items-end space-x-2">
                      <div className="flex-1">
                        <Label htmlFor={`image-${index}`}>Image {index + 1}</Label>
                        <Input
                          id={`image-${index}`}
                          name={`image-${index}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => updateImage(index, 'file', e.target.files?.[0] || null)}
                        />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor={`label-${index}`}>Label</Label>
                        <Input
                          id={`label-${index}`}
                          name={`label-${index}`}
                          placeholder="Image label"
                          value={image.label}
                          onChange={(e) => updateImage(index, 'label', e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeImage(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addImage}>
                    Add Image
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Number of Bedrooms *</Label>
                  <Input id="bedrooms" name="bedrooms" type="number" min="0" required />
                </div>
                <div>
                  <Label htmlFor="bathrooms">Number of Bathrooms *</Label>
                  <Input id="bathrooms" name="bathrooms" type="number" min="0" required />
                </div>
                <div>
                  <Label htmlFor="sqft">Square Footage (Sq. Ft.) *</Label>
                  <Input id="sqft" name="sqft" type="number" min="0" required />
                </div>
                <div>
                  <Label htmlFor="rooms">Number of Rooms *</Label>
                  <Input id="rooms" name="rooms" type="number" min="0" required />
                </div>
                <div>
                  <Label htmlFor="kitchens">Number of Kitchens *</Label>
                  <Input id="kitchens" name="kitchens" type="number" min="0" required />
                </div>
                <div>
                  <Label htmlFor="dinings">Number of Dining Areas *</Label>
                  <Input id="dinings" name="dinings" type="number" min="0" required />
                </div>
                <div>
                  <Label htmlFor="livings">Number of Living Areas *</Label>
                  <Input id="livings" name="livings" type="number" min="0" required />
                </div>
                <div>
                  <Label htmlFor="bike-parking">Bike Parking</Label>
                  <Select name="bikeParking" defaultValue="no">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="car-parking">Car Parking</Label>
                  <Select name="carParking" defaultValue="no">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Services</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="garage" name="services" value="garage" />
                    <Label htmlFor="garage">Garage</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="furnished" name="services" value="furnished" />
                    <Label htmlFor="furnished">Furnished</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="semi-furnished" name="services" value="semi-furnished" />
                    <Label htmlFor="semi-furnished">Semi Furnished</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="no-furnished" name="services" value="no-furnished" />
                    <Label htmlFor="no-furnished">No Furnished</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="balcony" name="services" value="balcony" />
                    <Label htmlFor="balcony">Balcony</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="water-supply" name="services" value="water-supply" />
                    <Label htmlFor="water-supply">Water Supply</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="ev-charging" name="services" value="ev-charging" />
                    <Label htmlFor="ev-charging">EV Charging Point</Label>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Room Description *</Label>
                <Textarea id="description" name="description" placeholder="Describe the rooms" required />
              </div>
            </form>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setAddPropertyOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                const form = formRef.current;
                if (!form) return;

                const formData = new FormData(form);
                const propertyName = formData.get('propertyName') as string;
                const propertyType = formData.get('propertyType') as string;
                const price = formData.get('price') as string;
                const interval = formData.get('interval') as string;
                const location = formData.get('location') as string;
                const bedrooms = formData.get('bedrooms') as string;
                const bathrooms = formData.get('bathrooms') as string;
                const sqft = formData.get('sqft') as string;
                const rooms = formData.get('rooms') as string;
                const kitchens = formData.get('kitchens') as string;
                const dinings = formData.get('dinings') as string;
                const livings = formData.get('livings') as string;
                const description = formData.get('description') as string;
                const image0 = formData.get('image-0') as File;

                if (!propertyName || !propertyType || !price || !interval || !location || !bedrooms || !bathrooms || !sqft || !rooms || !kitchens || !dinings || !livings || !description || !image0) {
                  alert('Please fill in all required fields and upload at least one image.');
                  return;
                }

                if (parseFloat(price) < 0 || parseInt(bedrooms) < 0 || parseInt(bathrooms) < 0 || parseInt(sqft) < 0 || parseInt(rooms) < 0 || parseInt(kitchens) < 0 || parseInt(dinings) < 0 || parseInt(livings) < 0) {
                  alert('Please ensure all numeric values are non-negative.');
                  return;
                }

                setConfirmDialogOpen(true);
              }}>
                Add Property
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </section>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Add Property</DialogTitle>
            <DialogDescription>
              Are you sure you want to add this property? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Deny
            </Button>
            <Button onClick={() => {
              formRef.current?.requestSubmit();
              setConfirmDialogOpen(false);
            }}>
              Accept
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Connect Property Dialog */}
      <section>
        <Dialog open={connectPropertyOpen} onOpenChange={setConnectPropertyOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full h-16 text-lg font-bold justify-center">
              Connect Your Property
              <QrCode className="h-6 w-6 ml-2" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Connect Your Property</DialogTitle>
              <DialogDescription>
                Scan QR code or enter the unique ID provided by the landlord.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Scan QR Code</Label>
                <div className="flex space-x-2">
                  <Button variant="outline" className="flex-1" onClick={() => document.getElementById('camera-input')?.click()}>
                    <Camera className="h-4 w-4 mr-2" />
                    Open Camera
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => document.getElementById('file-input')?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                </div>
                <Input id="camera-input" type="file" accept="image/*" capture="environment" className="hidden" />
                <Input id="file-input" type="file" accept="image/*" className="hidden" />
              </div>
              <div>
                <Label htmlFor="unique-id">Unique ID</Label>
                <Input id="unique-id" placeholder="Enter unique ID from landlord" />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setConnectPropertyOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setConnectPropertyOpen(false)}>
                Connect
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </section>

      {/* Amount to Receive Section (As Landlord) */}
      {hasTenantsRole && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
                <ArrowDownLeft className="h-4 w-4 text-success" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Amount to Receive
              </h2>
              <span className="text-xs text-muted-foreground">(As Landlord)</span>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/transactions" className="text-primary">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div onClick={() => setSelectedFilter(null)} className="cursor-pointer">
              <SummaryCard
                title="Total Receivable"
                value={amountToReceive.total}
                icon={DollarSign}
                variant="default"
              />
            </div>
            <div onClick={() => setSelectedFilter("paid")} className="cursor-pointer">
              <SummaryCard
                title="Received"
                value={amountToReceive.received}
                icon={CheckCircle2}
                variant="success"
              />
            </div>
            <div onClick={() => setSelectedFilter("pending")} className="cursor-pointer">
              <SummaryCard
                title="Pending"
                value={amountToReceive.pending}
                icon={Clock}
                variant="warning"
              />
            </div>
            <div onClick={() => setSelectedFilter("overdue")} className="cursor-pointer">
              <SummaryCard
                title="Overdue"
                value={amountToReceive.overdue}
                icon={AlertTriangle}
                variant={amountToReceive.overdue === "$0" ? "default" : "destructive"}
              />
            </div>
          </div>

          {/* Tenant Payment List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Users className="h-4 w-4 text-muted-foreground" />
                Tenant Payments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {amountToReceive.tenants
                .filter((tenant) => !selectedFilter || tenant.status === selectedFilter)
                .map((tenant) => (
                <div
                  key={tenant.id}
                  className={`flex items-center gap-4 rounded-lg border border-border bg-background p-4 ${
                    selectedFilter && tenant.status === selectedFilter ? "animate-pulse bg-yellow-100" : ""
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {tenant.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {tenant.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {tenant.property}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">
                        {tenant.amount}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Due: {tenant.dueDate}
                      </p>
                    </div>
                    <StatusBadge status={tenant.status} size="sm" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Amount to Pay Section (As Tenant) */}
      {hasLandlordRole && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <ArrowUpRight className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Amount to Pay
              </h2>
              <span className="text-xs text-muted-foreground">(As Tenant)</span>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/transactions" className="text-primary">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div onClick={() => setSelectedFilterPay(null)} className="cursor-pointer">
              <SummaryCard
                title="Total Payable"
                value={amountToPay.total}
                icon={DollarSign}
                variant="default"
              />
            </div>
            <div onClick={() => setSelectedFilterPay("paid")} className="cursor-pointer">
              <SummaryCard
                title="Paid"
                value={amountToPay.paid}
                icon={CheckCircle2}
                variant="success"
              />
            </div>
            <div onClick={() => setSelectedFilterPay("pending")} className="cursor-pointer">
              <SummaryCard
                title="Pending"
                value={amountToPay.pending}
                icon={Clock}
                variant="warning"
              />
            </div>
            <div onClick={() => setSelectedFilterPay("overdue")} className="cursor-pointer">
              <SummaryCard
                title="Overdue"
                value={amountToPay.overdue}
                icon={AlertTriangle}
                variant={amountToPay.overdue === "$0" ? "default" : "destructive"}
              />
            </div>
          </div>

          {/* Landlord Payment List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Your Rent Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {amountToPay.landlords
                .filter((landlord) => !selectedFilterPay || landlord.status === selectedFilterPay)
                .map((landlord) => (
                <div
                  key={landlord.id}
                  className={`rounded-lg border border-border bg-background p-4 ${
                    selectedFilterPay && landlord.status === selectedFilterPay ? "animate-pulse bg-yellow-100" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {landlord.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {landlord.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {landlord.property}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-foreground">
                        {landlord.amount}
                      </p>
                      <StatusBadge status={landlord.status} size="sm" />
                    </div>
                  </div>

                  {/* Utilities Breakdown */}
                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Base Rent</p>
                      <p className="mt-0.5 font-semibold text-foreground">
                        $1,330
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Electricity</p>
                      <p className="mt-0.5 font-semibold text-foreground">
                        {landlord.utilities.electricity}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Water</p>
                      <p className="mt-0.5 font-semibold text-foreground">
                        {landlord.utilities.water}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Maintenance</p>
                      <p className="mt-0.5 font-semibold text-foreground">
                        {landlord.utilities.maintenance}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      <Calendar className="mr-1 inline h-4 w-4" />
                      Due: {landlord.dueDate}
                    </p>
                    <Button size="sm">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Mark as Paid
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending Actions */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-semibold">
              Pending Actions
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/transactions" className="text-primary">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingActions.slice(0, 4).map((action) => (
              <div
                key={action.id}
                className="flex items-center gap-4 rounded-lg border border-border bg-background p-3 transition-colors hover:bg-muted/50"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    action.type === "verify"
                      ? "bg-warning/10 text-warning-foreground"
                      : action.type === "pending"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {action.type === "verify" ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : action.type === "upload" ? (
                    <Plus className="h-5 w-5" />
                  ) : (
                    <Calendar className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {action.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {action.description}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {action.date}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {hasTenantsRole && (
              <>
                <Button className="w-full justify-start gap-2" size="lg">
                  <Plus className="h-4 w-4" />
                  Add Charge
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 bg-transparent"
                  size="lg"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Verify Payments
                </Button>
              </>
            )}
            {hasLandlordRole && (
              <>
                <Button className="w-full justify-start gap-2" size="lg">
                  <CheckCircle2 className="h-4 w-4" />
                  Mark Rent as Paid
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 bg-transparent"
                  size="lg"
                >
                  <DollarSign className="h-4 w-4" />
                  View Payment History
                </Button>
              </>
            )}
            <Button
              variant="outline"
              className="w-full justify-start gap-2 bg-transparent"
              size="lg"
              asChild
            >
              <Link href="/properties">
                <Building2 className="h-4 w-4" />
                Manage Properties
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Your Properties Section */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Your Properties</h2>
        {properties.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((prop) => (
              <Link key={prop.id} href={`/properties/${prop.id}`} className="group">
                <Card className="h-full overflow-hidden transition-all hover:shadow-lg">
                  <div className="relative h-40 w-full overflow-hidden">
                    <img
                      src={prop.image || "/placeholder.jpg"}
                      alt={prop.propertyName}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/80 to-transparent p-3">
                      <p className="text-lg font-bold text-background">
                        {prop.rent}
                        <span className="text-sm font-normal">/month</span>
                      </p>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground group-hover:text-primary">{prop.propertyName}</h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {prop.location}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">{prop.description?.slice(0, 80)}...</p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      {prop.bedrooms != null && prop.bedrooms > 0 && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {prop.bedrooms} bed
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {prop.bathrooms} bath
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No properties added yet. Click "Add Your Property" to get started!</p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
