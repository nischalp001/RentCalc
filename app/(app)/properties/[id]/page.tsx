"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  MapPin,
  User,
  Mail,
  Calendar,
  DollarSign,
  FileText,
  Receipt,
  Edit2,
  Lock,
  Trash2,
  Bed,
  Home,
  Coffee,
  Bath,
  Plus,
  Zap,
  Droplets,
} from "lucide-react";
import { StatusBadge, type StatusType } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/date-picker";
import { formatDateWithBothCalendars } from "@/lib/date-utils";

// Mock property data - would come from params in a real app
const mockPropertyData = {
  id: 1,
  name: "Sunset Apartments - Unit 3B",
  address: "123 Sunset Blvd, Apt 3B, Los Angeles, CA 90028",
  tenant: "John Doe",
  tenantEmail: "john@example.com",
  tenantPhone: "+1 (555) 987-6543",
  rent: "$1,200",
  status: "active" as StatusType,
  dueDate: "1st of every month",
  leaseStart: "Jan 1, 2025",
  leaseEnd: "Dec 31, 2025",
  securityDeposit: "$2,400",
  image: "/placeholder.svg?height=300&width=600",
};

const recentTransactions = [
  {
    id: 1,
    date: "Jan 15, 2026",
    description: "Monthly rent payment",
    amount: "+$1,200",
    status: "verified" as StatusType,
  },
  {
    id: 2,
    date: "Dec 15, 2025",
    description: "Monthly rent payment",
    amount: "+$1,200",
    status: "verified" as StatusType,
  },
  {
    id: 3,
    date: "Dec 10, 2025",
    description: "Late fee",
    amount: "+$50",
    status: "verified" as StatusType,
  },
];

const linkedDocuments = [
  {
    id: 1,
    name: "Lease Agreement",
    date: "Jan 1, 2025",
    type: "Contract",
  },
  {
    id: 2,
    name: "Move-in Inspection",
    date: "Jan 1, 2025",
    type: "Report",
  },
];

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const [propertyData, setPropertyData] = useState<any>(mockPropertyData);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load property from localStorage or use mock data
    const allProperties = JSON.parse(localStorage.getItem('properties') || '[]');
    const foundProperty = allProperties.find((p: any) => p.id === Number(propertyId));
    
    if (foundProperty) {
      // Transform stored property to match display format
      setPropertyData({
        id: foundProperty.id,
        name: foundProperty.name || foundProperty.propertyName,
        address: foundProperty.address || foundProperty.location,
        tenant: foundProperty.tenant?.name || undefined,
        tenantEmail: foundProperty.tenant?.email || undefined,
        tenantPhone: foundProperty.tenant?.phone || undefined,
        rent: foundProperty.rent || `$${foundProperty.price}`,
        status: foundProperty.status || 'active',
        dueDate: foundProperty.dueDate || '1st of every month',
        leaseStart: 'Jan 1, 2025',
        leaseEnd: foundProperty.leaseEnd || 'Dec 31, 2026',
        securityDeposit: '$2,400',
        image: foundProperty.image || '/placeholder.svg',
        images: foundProperty.images || (foundProperty.image ? [foundProperty.image] : []),
        propertyType: foundProperty.propertyType,
        price: foundProperty.price,
        currency: foundProperty.currency,
        interval: foundProperty.interval,
        rooms: foundProperty.rooms,
        bedrooms: foundProperty.bedrooms,
        bathrooms: foundProperty.bathrooms,
        kitchens: foundProperty.kitchens,
        dinings: foundProperty.dinings,
        livings: foundProperty.livings,
        bikeParking: foundProperty.bikeParking,
        carParking: foundProperty.carParking,
        services: foundProperty.services,
        description: foundProperty.description,
      });
      
      // Load tenant information
      if (foundProperty.tenant) {
        setTenant(foundProperty.tenant);
      }

      // Load uploaded documents for this property
      const allDocuments = JSON.parse(localStorage.getItem('propertyDocuments') || '{}');
      const propertyDocuments = allDocuments[propertyId] || [];
      setUploadedFiles(propertyDocuments);

      // Set edit form defaults
      setEditPropertyName(foundProperty.name || foundProperty.propertyName || '');
      setEditPropertyAddress(foundProperty.address || foundProperty.location || '');
      setEditPropertyRent(foundProperty.price || '');
      setEditPropertyDueDate(foundProperty.dueDate || '1st of every month');
      setEditPropertyBedrooms(foundProperty.bedrooms || '');
      setEditPropertyBathrooms(foundProperty.bathrooms || '');
      setEditPropertySqft(foundProperty.sqft || '');
      setEditPropertyDescription(foundProperty.description || '');
    }
    setIsLoading(false);
  }, [propertyId]);

  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [dateJoined, setDateJoined] = useState<Date | undefined>();
  const [dateEnd, setDateEnd] = useState<Date | undefined>();
  const [tenant, setTenant] = useState<any>(null);
  const [billingTab, setBillingTab] = useState("profile");

  // New state for image carousel popup
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  // New state for create bill dialog
  const [createBillOpen, setCreateBillOpen] = useState(false);
  const [confirmedRent, setConfirmedRent] = useState("");
  const [billMonth, setBillMonth] = useState<Date | undefined>();
  const [prevElectricityUnit, setPrevElectricityUnit] = useState("");
  const [currElectricityUnit, setCurrElectricityUnit] = useState("");
  const [electricityRate, setElectricityRate] = useState("12");
  const [prevWaterUnit, setPrevWaterUnit] = useState("");
  const [currWaterUnit, setCurrWaterUnit] = useState("");
  const [waterRate, setWaterRate] = useState("5");
  const [internetBill, setInternetBill] = useState("");
  const [customFields, setCustomFields] = useState<Array<{ id?: number; name: string; amount: string }>>([]);

  // New state for add charge dialog
  const [addChargeOpen, setAddChargeOpen] = useState(false);
  const [chargeType, setChargeType] = useState("");
  const [previousElectricityUnit, setPreviousElectricityUnit] = useState("");
  const [currentElectricityUnit, setCurrentElectricityUnit] = useState("");
  const [previousWaterUnit, setPreviousWaterUnit] = useState("");
  const [currentWaterUnit, setCurrentWaterUnit] = useState("");

  // New state for upload document dialog
  const [uploadDocumentOpen, setUploadDocumentOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{id: number, name: string, type: string, url: string, description: string, uploadedAt: string}>>([]);
  const [documentDescription, setDocumentDescription] = useState("");

  // New state for edit property dialog
  const [editPropertyOpen, setEditPropertyOpen] = useState(false);
  const [editPropertyName, setEditPropertyName] = useState("");
  const [editPropertyAddress, setEditPropertyAddress] = useState("");
  const [editPropertyRent, setEditPropertyRent] = useState("");
  const [editPropertyDueDate, setEditPropertyDueDate] = useState("");
  const [editPropertyBedrooms, setEditPropertyBedrooms] = useState("");
  const [editPropertyBathrooms, setEditPropertyBathrooms] = useState("");
  const [editPropertySqft, setEditPropertySqft] = useState("");
  const [editPropertyDescription, setEditPropertyDescription] = useState("");
  const [editPropertyErrors, setEditPropertyErrors] = useState<Record<string, string>>({});

  // New state for edit tenant dialog
  const [editTenantErrors, setEditTenantErrors] = useState<Record<string, string>>({});

  const handleDeleteProperty = () => {
    const allProperties = JSON.parse(localStorage.getItem('properties') || '[]');
    const filteredProperties = allProperties.filter((p: any) => p.id !== Number(propertyId));
    localStorage.setItem('properties', JSON.stringify(filteredProperties));
    setDeleteDialogOpen(false);
    router.push('/properties');
  };

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  };

  const validateEditProperty = () => {
    const errors: Record<string, string> = {};

    if (!editPropertyName.trim()) errors.name = "Property name is required";
    if (!editPropertyAddress.trim()) errors.address = "Address is required";
    if (!editPropertyRent || parseFloat(editPropertyRent) <= 0) errors.rent = "Valid rent amount is required";
    if (!editPropertyDueDate) errors.dueDate = "Due date is required";
    if (!editPropertyBedrooms || parseInt(editPropertyBedrooms) < 0) errors.bedrooms = "Valid number of bedrooms is required";
    if (!editPropertyBathrooms || parseFloat(editPropertyBathrooms) <= 0) errors.bathrooms = "Valid number of bathrooms is required";
    if (!editPropertySqft || parseInt(editPropertySqft) <= 0) errors.sqft = "Valid square footage is required";
    if (!editPropertyDescription.trim()) errors.description = "Description is required";

    setEditPropertyErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEditTenant = () => {
    const errors: Record<string, string> = {};

    if (!manualName.trim()) errors.name = "Name is required";
    if (!manualEmail.trim()) errors.email = "Email is required";
    else if (!validateEmail(manualEmail)) errors.email = "Please enter a valid email address";
    if (!manualPhone.trim()) errors.phone = "Phone number is required";
    else if (!validatePhone(manualPhone)) errors.phone = "Phone number must be 10 digits";
    if (!dateJoined) errors.leaseStart = "Lease start date is required";
    if (!dateEnd) errors.leaseEnd = "Lease end date is required";
    else if (dateJoined && dateEnd <= dateJoined) errors.leaseEnd = "Lease end date must be after start date";

    setEditTenantErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const calculateUtilityCharge = (previous: number, current: number, rate: number) => {
    return Math.max(0, (current - previous) * rate);
  };

  const getElectricityAmount = () => {
    if (previousElectricityUnit && currentElectricityUnit) {
      return calculateUtilityCharge(
        parseFloat(previousElectricityUnit),
        parseFloat(currentElectricityUnit),
        12
      );
    }
    return 0;
  };

  const getWaterAmount = () => {
    if (previousWaterUnit && currentWaterUnit) {
      return calculateUtilityCharge(
        parseFloat(previousWaterUnit),
        parseFloat(currentWaterUnit),
        5
      );
    }
    return 0;
  };

  const calculateBillTotal = () => {
    let total = parseFloat(confirmedRent) || 0;
    
    if (prevElectricityUnit && currElectricityUnit) {
      total += calculateUtilityCharge(
        parseFloat(prevElectricityUnit),
        parseFloat(currElectricityUnit),
        parseFloat(electricityRate) || 12
      );
    }
    
    if (prevWaterUnit && currWaterUnit) {
      total += calculateUtilityCharge(
        parseFloat(prevWaterUnit),
        parseFloat(currWaterUnit),
        parseFloat(waterRate) || 5
      );
    }
    
    if (internetBill) {
      total += parseFloat(internetBill);
    }
    
    customFields.forEach((field) => {
      if (field.amount) {
        total += parseFloat(field.amount);
      }
    });
    
    return total;
  };

  const handleCreateBill = async () => {
    if (!confirmedRent || !billMonth) {
      alert('Please fill in all required fields');
      return;
    }

    const electricity = prevElectricityUnit && currElectricityUnit ? {
      amount: calculateUtilityCharge(
        parseFloat(prevElectricityUnit),
        parseFloat(currElectricityUnit),
        parseFloat(electricityRate) || 12
      ),
      previousUnit: parseFloat(prevElectricityUnit),
      currentUnit: parseFloat(currElectricityUnit),
      rate: parseFloat(electricityRate) || 12,
    } : { amount: 0, previousUnit: 0, currentUnit: 0, rate: 0 };

    const water = prevWaterUnit && currWaterUnit ? {
      amount: calculateUtilityCharge(
        parseFloat(prevWaterUnit),
        parseFloat(currWaterUnit),
        parseFloat(waterRate) || 5
      ),
      previousUnit: parseFloat(prevWaterUnit),
      currentUnit: parseFloat(currWaterUnit),
      rate: parseFloat(waterRate) || 5,
    } : { amount: 0, previousUnit: 0, currentUnit: 0, rate: 0 };

    const billData = {
      id: Date.now(),
      tenantName: tenant.name,
      tenantEmail: tenant.email,
      property: propertyData.name,
      propertyId: propertyData.id,
      currentMonth: billMonth ? billMonth.toISOString().slice(0, 7) : new Date().toISOString().slice(0, 7),
      breakdown: {
        baseRent: parseFloat(confirmedRent),
        electricity,
        water,
        internet: parseFloat(internetBill) || 0,
        ...customFields.reduce((acc, field) => {
          acc[field.name.toLowerCase().replace(/\s+/g, '_')] = parseFloat(field.amount) || 0;
          return acc;
        }, {} as any),
      },
      total: calculateBillTotal(),
      status: 'pending' as StatusType,
      paidDate: null,
      paymentMethod: null,
      proofUrl: null,
    };

    // Save to localStorage
    const savedBills = JSON.parse(localStorage.getItem('tenantBills') || '[]');
    const updatedReceipts = [...savedBills, billData];
    localStorage.setItem('tenantBills', JSON.stringify(updatedReceipts));

    // Try to call API
    try {
      await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billData),
      });
    } catch (error) {
      console.log('Bill saved locally:', billData);
    }

    // Reset and close
    setCreateBillOpen(false);
    setConfirmedRent("");
    setBillMonth(undefined);
    setPrevElectricityUnit("");
    setCurrElectricityUnit("");
    setPrevWaterUnit("");
    setCurrWaterUnit("");
    setInternetBill("");
    setCustomFields([]);
    
    alert('Bill created successfully!');
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading property...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link href="/properties">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Properties
        </Link>
      </Button>

      {/* Property Header with carousel */}
      <div className="relative overflow-hidden rounded-xl cursor-pointer" onClick={() => setImageDialogOpen(true)}>
        {(propertyData.images && (propertyData.images as string[]).length > 0) ? (
          <Carousel>
            <CarouselContent>
              {(propertyData.images as string[]).map((src: string, i: number) => (
                <CarouselItem key={i} className="h-48 md:h-64">
                  <img src={src} alt={`${propertyData.name}-${i}`} className="h-48 md:h-64 w-full object-cover" />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        ) : (
          <div className="h-48 md:h-64 w-full bg-muted/50">
            <img src={propertyData.image || "/placeholder.svg"} alt={propertyData.name} className="h-48 md:h-64 w-full object-cover" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-end justify-between">
            <div>
              <StatusBadge status={propertyData.status} />
              <h1 className="mt-2 text-xl font-bold text-background md:text-2xl">
                {propertyData.name}
              </h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-background/80">
                <MapPin className="h-4 w-4" />
                {propertyData.address}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Overview - show type, bedrooms, living, kitchen, bathroom, rent */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Property Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-muted/50 p-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="text-sm font-medium">{(propertyData as any).propertyType || '-'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-muted/50 p-2">
                    <Bed className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bedrooms</p>
                    <p className="text-sm font-medium">{(propertyData as any).bedrooms ?? '-'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-muted/50 p-2">
                    <Home className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Living</p>
                    <p className="text-sm font-medium">{(propertyData as any).livings ?? '-'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-muted/50 p-2">
                    <Coffee className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Kitchen</p>
                    <p className="text-sm font-medium">{(propertyData as any).kitchens ?? '-'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-muted/50 p-2">
                    <Bath className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bathrooms</p>
                    <p className="text-sm font-medium">{(propertyData as any).bathrooms ?? '-'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-muted/50 p-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sq. Ft.</p>
                    <p className="text-sm font-medium">{(propertyData as any).sqft ? `${(propertyData as any).sqft} sq ft` : '-'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-muted/50 p-2">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Monthly Rent</p>
                    <p className="text-sm font-medium">{propertyData.rent}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{propertyData.description || 'No description provided.'}</p>
            </CardContent>
          </Card>

          {/* Property Details and Billing Tab */}
          <Tabs value={billingTab} onValueChange={setBillingTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Property Details</TabsTrigger>
              <TabsTrigger value="billing">Billing Profile</TabsTrigger>
            </TabsList>
            
            {/* Property Details Tab */}
            <TabsContent value="profile" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Property Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-muted/50 p-2">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Type</p>
                          <p className="text-sm font-medium">{(propertyData as any).propertyType || '-'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-muted/50 p-2">
                          <Bed className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Bedrooms</p>
                          <p className="text-sm font-medium">{(propertyData as any).bedrooms ?? '-'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-muted/50 p-2">
                          <Home className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Living Rooms</p>
                          <p className="text-sm font-medium">{(propertyData as any).livings ?? '-'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-muted/50 p-2">
                          <Coffee className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Kitchens</p>
                          <p className="text-sm font-medium">{(propertyData as any).kitchens ?? '-'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-muted/50 p-2">
                          <Bath className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Bathrooms</p>
                          <p className="text-sm font-medium">{(propertyData as any).bathrooms ?? '-'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-muted/50 p-2">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Square Footage</p>
                          <p className="text-sm font-medium">{(propertyData as any).sqft ? `${(propertyData as any).sqft} sq ft` : '-'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-muted/50 p-2">
                          <MapPin className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Location</p>
                          <p className="text-sm font-medium">{propertyData.address}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-muted/50 p-2">
                          <DollarSign className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Price</p>
                          <p className="text-sm font-medium">{propertyData.rent}</p>
                        </div>
                      </div>

                      <div>
                        <p className="font-medium">Services</p>
                        <p className="text-sm text-muted-foreground">{((propertyData as any).services || []).join(', ')}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Billing Profile Tab */}
            <TabsContent value="billing" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Billing Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  {tenant ? (
                    <div className="space-y-4">
                      <div className="rounded-lg bg-muted/50 p-4">
                        <p className="text-sm text-muted-foreground mb-2">Tenant</p>
                        <p className="font-semibold">{tenant.name}</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-4">
                        <p className="text-sm text-muted-foreground mb-2">Base Rent</p>
                        <p className="font-semibold">{propertyData.rent}</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-4">
                        <p className="text-sm text-muted-foreground mb-2">Lease Period</p>
                        <p className="font-semibold">{tenant.dateJoined} to {tenant.dateEnd}</p>
                      </div>
                      <Button className="w-full" onClick={() => {
                        setConfirmedRent(propertyData.rent.replace(/[^0-9.]/g, ''));
                        setCreateBillOpen(true);
                      }}>
                        <Receipt className="mr-2 h-4 w-4" />
                        Create Bill
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No tenant assigned yet. Add a tenant to create billing profiles.</p>
                      <Button variant="outline" className="mt-4" onClick={() => setShareDialogOpen(true)}>
                        Add Tenant
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tenant Card */}
          {tenant ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Tenant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="text-sm font-medium">{tenant.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">{tenant.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{tenant.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Date Joined</p>
                      <p className="text-sm font-medium">{formatDateWithBothCalendars(tenant.dateJoined).full}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Lease End</p>
                      <p className="text-sm font-medium">{formatDateWithBothCalendars(tenant.dateEnd).full}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" size="sm" onClick={() => { setShareDialogOpen(true); setShowManual(true); }}>
                    <Edit2 className="mr-2 h-3 w-3" />
                    Edit
                  </Button>
                  <Button variant="outline" className="flex-1" size="sm" onClick={() => {
                    const allProperties = JSON.parse(localStorage.getItem('properties') || '[]');
                    const idx = allProperties.findIndex((p: any) => p.id === propertyData.id);
                    if (idx !== -1) {
                      delete allProperties[idx].tenant;
                      localStorage.setItem('properties', JSON.stringify(allProperties));
                    }
                    setTenant(null);
                  }}>
                    <Trash2 className="mr-2 h-3 w-3" />
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Add User</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Generate or share this property's unique ID to connect a user, or add them manually.</p>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => setShareDialogOpen(true)}>
                    Add User
                  </Button>
                  <Button variant="outline" onClick={() => {
                    // Publish property logic - could open a dialog or navigate to marketplace
                    alert('Property published to marketplace!');
                  }}>
                    Publish Property
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start bg-transparent" variant="outline" onClick={() => setAddChargeOpen(true)}>
                <Receipt className="mr-2 h-4 w-4" />
                Add Charge
              </Button>
              <Button className="w-full justify-start bg-transparent" variant="outline" onClick={() => setUploadDocumentOpen(true)}>
                <FileText className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
              <Button className="w-full justify-start bg-transparent" variant="outline" onClick={() => setEditPropertyOpen(true)}>
                <Building2 className="mr-2 h-4 w-4" />
                Edit Property
              </Button>
              {uploadedFiles.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium mb-2">Uploaded Files</p>
                  <div className="space-y-1">
                    {uploadedFiles.map((file) => (
                      <Button 
                        key={file.id} 
                        className="w-full justify-start bg-transparent text-sm h-8" 
                        variant="ghost" 
                        onClick={() => {
                          if (file.type === 'application/pdf') {
                            // For PDFs, create a blob and open in new tab
                            const link = document.createElement('a');
                            link.href = file.url;
                            link.target = '_blank';
                            link.rel = 'noopener noreferrer';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          } else {
                            // For images, open in new tab
                            const newWindow = window.open();
                            if (newWindow) {
                              newWindow.document.write(`
                                <html>
                                  <head>
                                    <title>${file.name}</title>
                                    <style>
                                      body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; }
                                      img { max-width: 90vw; max-height: 90vh; object-fit: contain; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                                    </style>
                                  </head>
                                  <body>
                                    <img src="${file.url}" alt="${file.name}" />
                                  </body>
                                </html>
                              `);
                              newWindow.document.close();
                            }
                          }
                        }}
                      >
                        <FileText className="mr-2 h-3 w-3" />
                        {file.name}
                        {file.description && (
                          <span className="ml-2 text-xs text-muted-foreground truncate">
                            - {file.description}
                          </span>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>Delete Property</Button>
      </div>

      {/* Share / Add Tenant Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{tenant ? 'Edit Tenant' : 'Add Tenant'}</DialogTitle>
            <DialogDescription>
              {tenant ? 'Update tenant information. All fields are required.' : 'Share this ID/QR with a user or add them manually below. All fields are required for manual entry.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!showManual && (
              <div className="flex flex-col items-center">
                <img src={`https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent('property-' + propertyData.id)}`} alt="qr" />
                <p className="mt-2 font-mono text-sm">{`property-${propertyData.id}`}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={() => navigator.clipboard.writeText(`property-${propertyData.id}`)}>Copy ID</Button>
                  <Button variant="outline" size="sm" onClick={() => setShowManual(true)}>Add Manually</Button>
                </div>
              </div>
            )}

            {showManual && (
              <div className="space-y-3">
                <div>
                  <Label>Full Name *</Label>
                  <Input 
                    value={manualName} 
                    onChange={(e) => setManualName(e.target.value)} 
                    placeholder="Full name"
                    className={editTenantErrors.name ? "border-red-500" : ""}
                  />
                  {editTenantErrors.name && <p className="text-sm text-red-500">{editTenantErrors.name}</p>}
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input 
                    type="email"
                    value={manualEmail} 
                    onChange={(e) => setManualEmail(e.target.value)} 
                    placeholder="tenant@example.com"
                    className={editTenantErrors.email ? "border-red-500" : ""}
                  />
                  {editTenantErrors.email && <p className="text-sm text-red-500">{editTenantErrors.email}</p>}
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input 
                    value={manualPhone} 
                    onChange={(e) => setManualPhone(e.target.value)} 
                    placeholder="(555) 123-4567"
                    className={editTenantErrors.phone ? "border-red-500" : ""}
                  />
                  {editTenantErrors.phone && <p className="text-sm text-red-500">{editTenantErrors.phone}</p>}
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <DatePicker
                    label="Lease Start Date"
                    value={dateJoined}
                    onChange={(date) => setDateJoined(date as Date)}
                    placeholder="Select start date"
                    required
                  />
                  {editTenantErrors.leaseStart && <p className="text-sm text-red-500">{editTenantErrors.leaseStart}</p>}

                  <DatePicker
                    label="Lease End Date"
                    value={dateEnd}
                    onChange={(date) => setDateEnd(date as Date)}
                    placeholder="Select end date"
                    required
                  />
                  {editTenantErrors.leaseEnd && <p className="text-sm text-red-500">{editTenantErrors.leaseEnd}</p>}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => { 
                    setShowManual(false);
                    setEditTenantErrors({});
                    // Clear only if adding new tenant
                    if (!tenant) {
                      setManualName(''); 
                      setManualEmail(''); 
                      setManualPhone(''); 
                      setDateJoined(undefined); 
                      setDateEnd(undefined);
                    }
                  }}>Back</Button>
                  <Button size="sm" onClick={() => {
                    if (validateEditTenant()) {
                      // save manual user to property in localStorage
                      const allProperties = JSON.parse(localStorage.getItem('properties') || '[]');
                      const idx = allProperties.findIndex((p: any) => p.id === propertyData.id);
                      if (idx !== -1) {
                        allProperties[idx].tenant = { 
                          name: manualName || 'Tenant', 
                          email: manualEmail || '', 
                          phone: manualPhone || '', 
                          dateJoined: dateJoined ? dateJoined.toISOString().split('T')[0] : '', 
                          dateEnd: dateEnd ? dateEnd.toISOString().split('T')[0] : '' 
                        };
                        localStorage.setItem('properties', JSON.stringify(allProperties));
                      }
                      setTenant({
                        name: manualName || 'Tenant',
                        email: manualEmail || '',
                        phone: manualPhone || '',
                        dateJoined: dateJoined ? dateJoined.toISOString().split('T')[0] : '',
                        dateEnd: dateEnd ? dateEnd.toISOString().split('T')[0] : ''
                      });
                      // clear fields and close
                      setManualName(''); 
                      setManualEmail(''); 
                      setManualPhone(''); 
                      setDateJoined(undefined); 
                      setDateEnd(undefined); 
                      setShowManual(false); 
                      setShareDialogOpen(false);
                      setEditTenantErrors({});
                      alert('Tenant saved successfully!');
                    }
                  }}>Save Tenant</Button>
                </div>
              </div>
            )}

            {!showManual && (
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShareDialogOpen(false)}>Close</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Property</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{propertyData.name}"? This action cannot be undone. The property will be removed from everywhere in the app.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProperty}>
              Delete Property
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Carousel Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{propertyData.name} - Images</DialogTitle>
          </DialogHeader>
          <div className="flex-1 p-4 pt-2 overflow-hidden">
            {(propertyData.images && (propertyData.images as string[]).length > 1) ? (
              <Carousel
                className="h-full"
                opts={{
                  loop: true,
                }}
              >
                <CarouselContent className="h-full">
                  {(propertyData.images as string[]).map((src: string, i: number) => (
                    <CarouselItem key={i} className="h-full">
                      <div className="flex items-center justify-center h-full w-full p-4">
                        <img
                          src={src}
                          alt={`${propertyData.name}-${i}`}
                          className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                          style={{
                            maxWidth: '90vw',
                            maxHeight: '70vh',
                            width: 'auto',
                            height: 'auto'
                          }}
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
              </Carousel>
            ) : (
              <div className="flex items-center justify-center h-full w-full p-4">
                <img
                  src={propertyData.image || "/placeholder.svg"}
                  alt={propertyData.name}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  style={{
                    maxWidth: '90vw',
                    maxHeight: '70vh',
                    width: 'auto',
                    height: 'auto'
                  }}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Bill Dialog */}
      <Dialog open={createBillOpen} onOpenChange={setCreateBillOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Bill</DialogTitle>
            <DialogDescription>
              Create a bill for {tenant?.name} - {propertyData.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {tenant && (
              <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
                <p className="text-sm font-semibold text-blue-900">{propertyData.name}</p>
                <p className="text-sm text-blue-700">{tenant.name}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Billing Month</Label>
                <DatePicker
                  value={billMonth}
                  onChange={(date) => setBillMonth(date as Date)}
                  placeholder="Select billing month"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmed-rent">Confirmed Rent</Label>
                <Input 
                  id="confirmed-rent" 
                  type="number" 
                  placeholder={propertyData.rent || "0.00"}
                  value={confirmedRent}
                  onChange={(e) => setConfirmedRent(e.target.value)}
                />
              </div>
            </div>

            {/* Electricity Section */}
            <div className="rounded-lg border p-4 space-y-3">
              <p className="font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Electricity
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="prev-elec">Previous Unit</Label>
                  <Input 
                    id="prev-elec" 
                    type="number" 
                    placeholder="0"
                    value={prevElectricityUnit}
                    onChange={(e) => setPrevElectricityUnit(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="curr-elec">Current Unit</Label>
                  <Input 
                    id="curr-elec" 
                    type="number" 
                    placeholder="0"
                    value={currElectricityUnit}
                    onChange={(e) => setCurrElectricityUnit(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="elec-rate">Rate/Unit</Label>
                  <Input 
                    id="elec-rate" 
                    type="number" 
                    placeholder="12"
                    value={electricityRate}
                    onChange={(e) => setElectricityRate(e.target.value)}
                  />
                </div>
              </div>
              {prevElectricityUnit && currElectricityUnit && (
                <p className="text-sm text-green-600 font-semibold">
                  Amount: ${calculateUtilityCharge(parseFloat(prevElectricityUnit), parseFloat(currElectricityUnit), parseFloat(electricityRate) || 12).toFixed(2)}
                </p>
              )}
            </div>

            {/* Water Section */}
            <div className="rounded-lg border p-4 space-y-3">
              <p className="font-semibold flex items-center gap-2">
                <Droplets className="h-4 w-4" />
                Water
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="prev-water">Previous Unit</Label>
                  <Input 
                    id="prev-water" 
                    type="number" 
                    placeholder="0"
                    value={prevWaterUnit}
                    onChange={(e) => setPrevWaterUnit(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="curr-water">Current Unit</Label>
                  <Input 
                    id="curr-water" 
                    type="number" 
                    placeholder="0"
                    value={currWaterUnit}
                    onChange={(e) => setCurrWaterUnit(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="water-rate">Rate/Unit</Label>
                  <Input 
                    id="water-rate" 
                    type="number" 
                    placeholder="5"
                    value={waterRate}
                    onChange={(e) => setWaterRate(e.target.value)}
                  />
                </div>
              </div>
              {prevWaterUnit && currWaterUnit && (
                <p className="text-sm text-green-600 font-semibold">
                  Amount: ${calculateUtilityCharge(parseFloat(prevWaterUnit), parseFloat(currWaterUnit), parseFloat(waterRate) || 5).toFixed(2)}
                </p>
              )}
            </div>

            {/* Internet Section */}
            <div className="space-y-2">
              <Label htmlFor="internet">Internet Bill</Label>
              <Input 
                id="internet" 
                type="number" 
                placeholder="0.00"
                value={internetBill}
                onChange={(e) => setInternetBill(e.target.value)}
              />
            </div>

            {/* Custom Fields */}
            <div className="space-y-3">
              <p className="font-semibold">Additional Charges</p>
              {customFields.map((field) => (
                <div key={field.id} className="flex gap-2">
                  <Input 
                    placeholder="Field name"
                    value={field.name}
                    onChange={(e) => {
                      const updated = customFields.map(f => f.id === field.id ? { ...f, name: e.target.value } : f);
                      setCustomFields(updated);
                    }}
                  />
                  <Input 
                    type="number"
                    placeholder="Amount"
                    value={field.amount}
                    onChange={(e) => {
                      const updated = customFields.map(f => f.id === field.id ? { ...f, amount: e.target.value } : f);
                      setCustomFields(updated);
                    }}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCustomFields(customFields.filter(f => f.id !== field.id))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setCustomFields([...customFields, { id: Date.now() + Math.random(), name: '', amount: '' }])}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Field
              </Button>
            </div>

            {/* Total */}
            <Card className="bg-primary/10 border-primary">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <p className="font-semibold">Total Bill Amount</p>
                  <p className="text-2xl font-bold text-primary">${calculateBillTotal().toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateBillOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateBill}>
                Create Bill
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Charge Dialog */}
      <Dialog open={addChargeOpen} onOpenChange={setAddChargeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Charge</DialogTitle>
            <DialogDescription>
              Create a new charge for {tenant?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="charge-type">Charge Type</Label>
              <Select value={chargeType} onValueChange={setChargeType}>
                <SelectTrigger id="charge-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rent">Monthly Rent</SelectItem>
                  <SelectItem value="electricity">Electricity</SelectItem>
                  <SelectItem value="water">Water</SelectItem>
                  <SelectItem value="internet">Internet</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="late-fee">Late Fee</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Electricity Unit Inputs */}
            {chargeType === "electricity" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="prev-electricity">Previous Unit Reading</Label>
                  <Input
                    id="prev-electricity"
                    type="number"
                    placeholder="e.g., 1200"
                    value={previousElectricityUnit}
                    onChange={(e) => setPreviousElectricityUnit(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current-electricity">Current Unit Reading</Label>
                  <Input
                    id="current-electricity"
                    type="number"
                    placeholder="e.g., 1250"
                    value={currentElectricityUnit}
                    onChange={(e) => setCurrentElectricityUnit(e.target.value)}
                  />
                </div>
                {previousElectricityUnit && currentElectricityUnit && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Unit Difference: {Math.max(0, parseFloat(currentElectricityUnit) - parseFloat(previousElectricityUnit))} × $12 = ${getElectricityAmount()}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Water Unit Inputs */}
            {chargeType === "water" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="prev-water">Previous Unit Reading</Label>
                  <Input
                    id="prev-water"
                    type="number"
                    placeholder="e.g., 500"
                    value={previousWaterUnit}
                    onChange={(e) => setPreviousWaterUnit(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current-water">Current Unit Reading</Label>
                  <Input
                    id="current-water"
                    type="number"
                    placeholder="e.g., 525"
                    value={currentWaterUnit}
                    onChange={(e) => setCurrentWaterUnit(e.target.value)}
                  />
                </div>
                {previousWaterUnit && currentWaterUnit && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Unit Difference: {Math.max(0, parseFloat(currentWaterUnit) - parseFloat(previousWaterUnit))} × $5 = ${getWaterAmount()}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Amount Input (for non-utility charges) */}
            {chargeType && !["electricity", "water"].includes(chargeType) && (
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" type="number" placeholder="0.00" />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" placeholder="Additional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddChargeOpen(false);
                setChargeType("");
                setPreviousElectricityUnit("");
                setCurrentElectricityUnit("");
                setPreviousWaterUnit("");
                setCurrentWaterUnit("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setAddChargeOpen(false);
                setChargeType("");
                setPreviousElectricityUnit("");
                setCurrentElectricityUnit("");
                setPreviousWaterUnit("");
                setCurrentWaterUnit("");
                alert('Charge added successfully!');
              }}
            >
              Add Charge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={uploadDocumentOpen} onOpenChange={setUploadDocumentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload images or PDF documents for this property.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="document-file">Select File</Label>
              <Input
                id="document-file"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Validate file type
                    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
                    if (!allowedTypes.includes(file.type)) {
                      alert('Please select an image file (JPEG, PNG, GIF, WebP) or PDF document.');
                      e.target.value = '';
                      return;
                    }

                    // Convert to base64 for storage
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const base64 = event.target?.result as string;
                      const newFile = {
                        id: Date.now(),
                        name: file.name,
                        type: file.type,
                        url: base64,
                        description: documentDescription,
                        uploadedAt: new Date().toLocaleDateString()
                      };

                      const updatedFiles = [...uploadedFiles, newFile];
                      setUploadedFiles(updatedFiles);

                      // Save to localStorage
                      const allDocuments = JSON.parse(localStorage.getItem('propertyDocuments') || '{}');
                      allDocuments[propertyId] = updatedFiles;
                      localStorage.setItem('propertyDocuments', JSON.stringify(allDocuments));

                      setDocumentDescription('');
                      setUploadDocumentOpen(false);
                      alert('Document uploaded successfully!');
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document-description">Description (Optional)</Label>
              <Textarea
                id="document-description"
                placeholder="Add a description for this document..."
                value={documentDescription}
                onChange={(e) => setDocumentDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDocumentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              const fileInput = document.getElementById('document-file') as HTMLInputElement;
              if (!fileInput.files?.[0]) {
                alert('Please select a file to upload.');
                return;
              }
              // The onChange handler will handle the upload
            }}>
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Property Dialog */}
      <Dialog open={editPropertyOpen} onOpenChange={setEditPropertyOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
            <DialogDescription>
              Update property information. All fields are required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-property-name">Property Name *</Label>
              <Input
                id="edit-property-name"
                value={editPropertyName}
                onChange={(e) => setEditPropertyName(e.target.value)}
                placeholder="e.g., Sunset Apartments - Unit 3B"
                className={editPropertyErrors.name ? "border-red-500" : ""}
              />
              {editPropertyErrors.name && <p className="text-sm text-red-500">{editPropertyErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-property-address">Address *</Label>
              <Textarea
                id="edit-property-address"
                value={editPropertyAddress}
                onChange={(e) => setEditPropertyAddress(e.target.value)}
                placeholder="Full property address"
                className={editPropertyErrors.address ? "border-red-500" : ""}
              />
              {editPropertyErrors.address && <p className="text-sm text-red-500">{editPropertyErrors.address}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-monthly-rent">Monthly Rent ($) *</Label>
                <Input
                  id="edit-monthly-rent"
                  type="number"
                  value={editPropertyRent}
                  onChange={(e) => setEditPropertyRent(e.target.value)}
                  placeholder="0.00"
                  className={editPropertyErrors.rent ? "border-red-500" : ""}
                />
                {editPropertyErrors.rent && <p className="text-sm text-red-500">{editPropertyErrors.rent}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-due-date">Due Date *</Label>
                <Select value={editPropertyDueDate} onValueChange={setEditPropertyDueDate}>
                  <SelectTrigger className={editPropertyErrors.dueDate ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select due date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st of every month">1st of every month</SelectItem>
                    <SelectItem value="5th of every month">5th of every month</SelectItem>
                    <SelectItem value="10th of every month">10th of every month</SelectItem>
                    <SelectItem value="15th of every month">15th of every month</SelectItem>
                    <SelectItem value="20th of every month">20th of every month</SelectItem>
                    <SelectItem value="25th of every month">25th of every month</SelectItem>
                    <SelectItem value="Last day of every month">Last day of every month</SelectItem>
                  </SelectContent>
                </Select>
                {editPropertyErrors.dueDate && <p className="text-sm text-red-500">{editPropertyErrors.dueDate}</p>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-bedrooms">Bedrooms *</Label>
                <Input
                  id="edit-bedrooms"
                  type="number"
                  value={editPropertyBedrooms}
                  onChange={(e) => setEditPropertyBedrooms(e.target.value)}
                  placeholder="0"
                  className={editPropertyErrors.bedrooms ? "border-red-500" : ""}
                />
                {editPropertyErrors.bedrooms && <p className="text-sm text-red-500">{editPropertyErrors.bedrooms}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-bathrooms">Bathrooms *</Label>
                <Input
                  id="edit-bathrooms"
                  type="number"
                  value={editPropertyBathrooms}
                  onChange={(e) => setEditPropertyBathrooms(e.target.value)}
                  placeholder="0"
                  className={editPropertyErrors.bathrooms ? "border-red-500" : ""}
                />
                {editPropertyErrors.bathrooms && <p className="text-sm text-red-500">{editPropertyErrors.bathrooms}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sqft">Sq. Ft. *</Label>
                <Input
                  id="edit-sqft"
                  type="number"
                  value={editPropertySqft}
                  onChange={(e) => setEditPropertySqft(e.target.value)}
                  placeholder="0"
                  className={editPropertyErrors.sqft ? "border-red-500" : ""}
                />
                {editPropertyErrors.sqft && <p className="text-sm text-red-500">{editPropertyErrors.sqft}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                value={editPropertyDescription}
                onChange={(e) => setEditPropertyDescription(e.target.value)}
                placeholder="Property description..."
                className={editPropertyErrors.description ? "border-red-500" : ""}
              />
              {editPropertyErrors.description && <p className="text-sm text-red-500">{editPropertyErrors.description}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditPropertyOpen(false);
              setEditPropertyErrors({});
            }}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (validateEditProperty()) {
                // Update property in localStorage
                const allProperties = JSON.parse(localStorage.getItem('properties') || '[]');
                const propertyIndex = allProperties.findIndex((p: any) => p.id === Number(propertyId));

                if (propertyIndex !== -1) {
                  allProperties[propertyIndex] = {
                    ...allProperties[propertyIndex],
                    name: editPropertyName,
                    propertyName: editPropertyName,
                    address: editPropertyAddress,
                    location: editPropertyAddress,
                    price: editPropertyRent,
                    rent: `$${editPropertyRent}`,
                    dueDate: editPropertyDueDate,
                    bedrooms: editPropertyBedrooms,
                    bathrooms: editPropertyBathrooms,
                    sqft: editPropertySqft,
                    description: editPropertyDescription,
                  };

                  localStorage.setItem('properties', JSON.stringify(allProperties));

                  // Update local state
                  setPropertyData({
                    ...propertyData,
                    name: editPropertyName,
                    address: editPropertyAddress,
                    rent: `$${editPropertyRent}`,
                    dueDate: editPropertyDueDate,
                    bedrooms: editPropertyBedrooms,
                    bathrooms: editPropertyBathrooms,
                    description: editPropertyDescription,
                  });

                  setEditPropertyOpen(false);
                  setEditPropertyErrors({});
                  alert('Property updated successfully!');
                }
              }
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
