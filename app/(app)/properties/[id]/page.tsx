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
} from "@/components/ui/dialog";

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
    }
    setIsLoading(false);
  }, [propertyId]);

  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [dateJoined, setDateJoined] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [tenant, setTenant] = useState<any>(null);
  const [billingTab, setBillingTab] = useState("profile");

  const handleDeleteProperty = () => {
    const allProperties = JSON.parse(localStorage.getItem('properties') || '[]');
    const filteredProperties = allProperties.filter((p: any) => p.id !== Number(propertyId));
    localStorage.setItem('properties', JSON.stringify(filteredProperties));
    setDeleteDialogOpen(false);
    router.push('/properties');
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading property...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild className="-ml-2">
        <Link href="/properties">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Properties
        </Link>
      </Button>

      {/* Property Header with carousel */}
      <div className="relative overflow-hidden rounded-xl">
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
                        // Navigate to create bill with this property
                        const event = new CustomEvent('createBillFromProperty', { detail: { propertyId: propertyData.id, propertyName: propertyData.name, tenant } });
                        window.dispatchEvent(event);
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
                      <p className="text-sm font-medium">{tenant.dateJoined}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Lease End</p>
                      <p className="text-sm font-medium">{tenant.dateEnd}</p>
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
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <Receipt className="mr-2 h-4 w-4" />
                Add Charge
              </Button>
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <Building2 className="mr-2 h-4 w-4" />
                Edit Property
              </Button>
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
            <p className="text-sm text-muted-foreground">Share this ID/QR with a user or add them manually below.</p>
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
                  <Label>Name</Label>
                  <Input value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="Full name" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} placeholder="Email" />
                </div>
                <div>
                  <Label>Contact Number</Label>
                  <Input value={manualPhone} onChange={(e) => setManualPhone(e.target.value)} placeholder="Phone" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Date Joined</Label>
                    <Input type="date" value={dateJoined} onChange={(e) => setDateJoined(e.target.value)} />
                  </div>
                  <div>
                    <Label>Lease End</Label>
                    <Input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => { 
                    setShowManual(false);
                    // Clear only if adding new tenant
                    if (!tenant) {
                      setManualName(''); 
                      setManualEmail(''); 
                      setManualPhone(''); 
                      setDateJoined(''); 
                      setDateEnd('');
                    }
                  }}>Back</Button>
                  <Button size="sm" onClick={() => {
                    // save manual user to property in localStorage
                    const allProperties = JSON.parse(localStorage.getItem('properties') || '[]');
                    const idx = allProperties.findIndex((p: any) => p.id === propertyData.id);
                    if (idx !== -1) {
                      allProperties[idx].tenant = { 
                        name: manualName || 'Tenant', 
                        email: manualEmail || '', 
                        phone: manualPhone || '', 
                        dateJoined: dateJoined || '', 
                        dateEnd: dateEnd || '' 
                      };
                      localStorage.setItem('properties', JSON.stringify(allProperties));
                    }
                    setTenant({
                      name: manualName || 'Tenant',
                      email: manualEmail || '',
                      phone: manualPhone || '',
                      dateJoined: dateJoined || '',
                      dateEnd: dateEnd || ''
                    });
                    // clear fields and close
                    setManualName(''); 
                    setManualEmail(''); 
                    setManualPhone(''); 
                    setDateJoined(''); 
                    setDateEnd(''); 
                    setShowManual(false); 
                    setShareDialogOpen(false);
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
    </div>
  );
}
