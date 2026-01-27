"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  MapPin,
  User,
  DollarSign,
  Calendar,
  Wifi,
  Car,
  Waves,
  Dumbbell,
  Eye,
  Heart,
  Search,
  SlidersHorizontal,
  Grid3X3,
  List,
  BedDouble,
  Bath,
  Square,
  Star,
  ArrowRight,
  Home,
  Users,
} from "lucide-react";
import { StatusBadge, type StatusType } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { useUser } from "@/lib/user-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Mock data for user's own properties (as landlord)
const myProperties = [
  {
    id: 1,
    name: "Sunset Apartments - Unit 3B",
    address: "123 Sunset Blvd, Apt 3B",
    city: "Los Angeles, CA",
    tenant: {
      name: "John Doe",
      email: "john@example.com",
      phone: "+1 (555) 234-5678",
    },
    rent: "$1,200",
    status: "active" as StatusType,
    dueDate: "1st of every month",
    leaseEnd: "Dec 31, 2026",
    image: "/placeholder.svg?height=200&width=400",
    bedrooms: 2,
    bathrooms: 1,
    sqft: 850,
  },
  {
    id: 2,
    name: "Oak Street House",
    address: "456 Oak Street",
    city: "San Francisco, CA",
    tenant: {
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "+1 (555) 345-6789",
    },
    rent: "$2,500",
    status: "pending" as StatusType,
    dueDate: "5th of every month",
    leaseEnd: "Jun 30, 2026",
    image: "/placeholder.svg?height=200&width=400",
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1400,
  },
  {
    id: 3,
    name: "Downtown Office",
    address: "789 Business Ave, Suite 100",
    city: "San Jose, CA",
    tenant: {
      name: "Tech Corp",
      email: "admin@techcorp.com",
      phone: "+1 (555) 456-7890",
    },
    rent: "$3,500",
    status: "overdue" as StatusType,
    dueDate: "15th of every month",
    leaseEnd: "Mar 31, 2027",
    image: "/placeholder.svg?height=200&width=400",
    bedrooms: 0,
    bathrooms: 2,
    sqft: 2000,
  },
];

// Mock data for properties user is renting (as tenant)
const myRentals = [
  {
    id: 4,
    name: "Marina View Apartments - Unit 4B",
    address: "123 Marina Blvd, Unit 4B",
    city: "San Francisco, CA",
    landlord: {
      name: "Property Management Inc.",
      email: "support@propmanagement.com",
      phone: "+1 (555) 456-7890",
    },
    rent: "$1,500",
    status: "active" as StatusType,
    dueDate: "5th of every month",
    leaseEnd: "Dec 31, 2025",
    image: "/placeholder.svg?height=200&width=400",
    bedrooms: 1,
    bathrooms: 1,
    sqft: 650,
  },
];

// Mock data for marketplace listings (other's properties for rent)
const marketplaceListings = [
  {
    id: 101,
    title: "Modern Loft in Downtown",
    address: "500 Market St, Unit 1201",
    city: "San Francisco, CA",
    price: "$2,800/month",
    availability: "Available Now",
    amenities: ["wifi", "parking", "gym"],
    image: "/placeholder.svg?height=300&width=500",
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1100,
    featured: true,
    rating: 4.8,
    reviews: 24,
    landlord: "Bay Area Rentals",
  },
  {
    id: 102,
    title: "Cozy Studio near Tech Hub",
    address: "200 Innovation Dr, Apt 305",
    city: "Palo Alto, CA",
    price: "$1,950/month",
    availability: "Feb 1, 2026",
    amenities: ["wifi", "pool"],
    image: "/placeholder.svg?height=300&width=500",
    bedrooms: 0,
    bathrooms: 1,
    sqft: 450,
    featured: false,
    rating: 4.5,
    reviews: 12,
    landlord: "Silicon Living",
  },
  {
    id: 103,
    title: "Spacious Family Home",
    address: "789 Oak Lane",
    city: "Mountain View, CA",
    price: "$4,500/month",
    availability: "Available Now",
    amenities: ["wifi", "parking", "pool", "gym"],
    image: "/placeholder.svg?height=300&width=500",
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2400,
    featured: true,
    rating: 4.9,
    reviews: 31,
    landlord: "Premier Homes",
  },
  {
    id: 104,
    title: "Charming Victorian Flat",
    address: "456 Hayes St, Unit 2",
    city: "San Francisco, CA",
    price: "$3,200/month",
    availability: "Mar 1, 2026",
    amenities: ["wifi"],
    image: "/placeholder.svg?height=300&width=500",
    bedrooms: 2,
    bathrooms: 1,
    sqft: 900,
    featured: false,
    rating: 4.7,
    reviews: 18,
    landlord: "Historic Properties SF",
  },
  {
    id: 105,
    title: "Luxury Penthouse Suite",
    address: "1 Embarcadero Center, PH",
    city: "San Francisco, CA",
    price: "$8,500/month",
    availability: "Available Now",
    amenities: ["wifi", "parking", "pool", "gym"],
    image: "/placeholder.svg?height=300&width=500",
    bedrooms: 3,
    bathrooms: 3,
    sqft: 2800,
    featured: true,
    rating: 5.0,
    reviews: 8,
    landlord: "Luxury Living SF",
  },
  {
    id: 106,
    title: "Budget-Friendly Room Share",
    address: "321 Mission St, Apt 8",
    city: "San Francisco, CA",
    price: "$1,200/month",
    availability: "Available Now",
    amenities: ["wifi"],
    image: "/placeholder.svg?height=300&width=500",
    bedrooms: 1,
    bathrooms: 1,
    sqft: 300,
    featured: false,
    rating: 4.2,
    reviews: 45,
    landlord: "Shared Spaces",
  },
];

const amenityIcons: Record<string, typeof Wifi> = {
  wifi: Wifi,
  parking: Car,
  pool: Waves,
  gym: Dumbbell,
};

export default function PropertiesPage() {
  const { connections } = useUser();
  const [activeTab, setActiveTab] = useState("your-properties");
  const [addPropertyOpen, setAddPropertyOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [bedroomFilter, setBedroomFilter] = useState<string>("all");
  const [savedListings, setSavedListings] = useState<number[]>([]);

  const hasTenantsRole = connections.some((c) => c.role === "tenant");
  const hasLandlordRole = connections.some((c) => c.role === "landlord");

  const filteredListings = marketplaceListings.filter((listing) => {
    const matchesSearch =
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.city.toLowerCase().includes(searchQuery.toLowerCase());

    const price = Number.parseInt(listing.price.replace(/\D/g, ""));
    const matchesPrice =
      priceFilter === "all" ||
      (priceFilter === "under-2000" && price < 2000) ||
      (priceFilter === "2000-3500" && price >= 2000 && price <= 3500) ||
      (priceFilter === "over-3500" && price > 3500);

    const matchesBedrooms =
      bedroomFilter === "all" ||
      (bedroomFilter === "studio" && listing.bedrooms === 0) ||
      (bedroomFilter === "1" && listing.bedrooms === 1) ||
      (bedroomFilter === "2" && listing.bedrooms === 2) ||
      (bedroomFilter === "3+" && listing.bedrooms >= 3);

    return matchesSearch && matchesPrice && matchesBedrooms;
  });

  const toggleSaved = (id: number) => {
    setSavedListings((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground lg:text-2xl">
            Properties
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your properties and explore rentals
          </p>
        </div>
        <Button onClick={() => setAddPropertyOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Property
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-none">
          <TabsTrigger value="your-properties" className="gap-2">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Your Properties</span>
            <span className="sm:hidden">Yours</span>
          </TabsTrigger>
          <TabsTrigger value="your-rentals" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Renting</span>
            <span className="sm:hidden">Renting</span>
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Find Rentals</span>
            <span className="sm:hidden">Find</span>
          </TabsTrigger>
        </TabsList>

        {/* Your Properties Tab (As Landlord) */}
        <TabsContent value="your-properties" className="mt-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
              <Home className="h-4 w-4 text-success" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Properties You Own
              </h3>
              <p className="text-xs text-muted-foreground">
                Manage properties where you are the landlord
              </p>
            </div>
          </div>

          {myProperties.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {myProperties.map((property) => (
                <Link
                  key={property.id}
                  href={`/properties/${property.id}`}
                  className="group"
                >
                  <Card className="h-full overflow-hidden transition-all hover:shadow-lg">
                    <div className="relative h-40 w-full overflow-hidden">
                      <img
                        src={property.image || "/placeholder.svg"}
                        alt={property.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute right-2 top-2">
                        <StatusBadge status={property.status} size="sm" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/80 to-transparent p-3">
                        <p className="text-lg font-bold text-background">
                          {property.rent}
                          <span className="text-sm font-normal">/month</span>
                        </p>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground group-hover:text-primary">
                        {property.name}
                      </h3>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {property.city}
                      </p>

                      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                        {property.bedrooms > 0 && (
                          <span className="flex items-center gap-1">
                            <BedDouble className="h-3.5 w-3.5" />
                            {property.bedrooms} bed
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Bath className="h-3.5 w-3.5" />
                          {property.bathrooms} bath
                        </span>
                        <span className="flex items-center gap-1">
                          <Square className="h-3.5 w-3.5" />
                          {property.sqft} sqft
                        </span>
                      </div>

                      <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {property.tenant.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {property.tenant.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Tenant
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Building2}
              title="No properties yet"
              description="Add your first property to start managing rentals."
              action={{
                label: "Add Property",
                onClick: () => setAddPropertyOpen(true),
              }}
            />
          )}
        </TabsContent>

        {/* Your Rentals Tab (As Tenant) */}
        <TabsContent value="your-rentals" className="mt-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Properties You Rent
              </h3>
              <p className="text-xs text-muted-foreground">
                Properties where you are a tenant
              </p>
            </div>
          </div>

          {myRentals.length > 0 ? (
            <div className="space-y-4">
              {myRentals.map((rental) => (
                <Card key={rental.id} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="relative h-48 w-full md:h-auto md:w-72">
                      <img
                        src={rental.image || "/placeholder.svg"}
                        alt={rental.name}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute right-2 top-2">
                        <StatusBadge status={rental.status} />
                      </div>
                    </div>
                    <CardContent className="flex-1 p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">
                            {rental.name}
                          </h3>
                          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {rental.address}, {rental.city}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-foreground">
                            {rental.rent}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            per month
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                        {rental.bedrooms > 0 && (
                          <span className="flex items-center gap-1">
                            <BedDouble className="h-4 w-4" />
                            {rental.bedrooms} Bedroom
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Bath className="h-4 w-4" />
                          {rental.bathrooms} Bathroom
                        </span>
                        <span className="flex items-center gap-1">
                          <Square className="h-4 w-4" />
                          {rental.sqft} sqft
                        </span>
                      </div>

                      <div className="mt-4 flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {rental.landlord.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {rental.landlord.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Landlord
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button asChild>
                          <Link href="/transactions">
                            <DollarSign className="mr-2 h-4 w-4" />
                            Pay Rent
                          </Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href="/messages">
                            Contact Landlord
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Home}
              title="Not renting any property"
              description="Connect with a landlord to add a rental property."
            />
          )}
        </TabsContent>

        {/* Marketplace Tab (Real Estate Style) */}
        <TabsContent value="marketplace" className="mt-6">
          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by location, property name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Select value={priceFilter} onValueChange={setPriceFilter}>
                    <SelectTrigger className="w-[140px]">
                      <DollarSign className="mr-1 h-4 w-4" />
                      <SelectValue placeholder="Price" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Price</SelectItem>
                      <SelectItem value="under-2000">Under $2,000</SelectItem>
                      <SelectItem value="2000-3500">$2,000 - $3,500</SelectItem>
                      <SelectItem value="over-3500">Over $3,500</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={bedroomFilter} onValueChange={setBedroomFilter}>
                    <SelectTrigger className="w-[140px]">
                      <BedDouble className="mr-1 h-4 w-4" />
                      <SelectValue placeholder="Bedrooms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="1">1 Bedroom</SelectItem>
                      <SelectItem value="2">2 Bedrooms</SelectItem>
                      <SelectItem value="3+">3+ Bedrooms</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1 rounded-lg border border-border p-1">
                    <Button
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Featured Listings */}
          {filteredListings.some((l) => l.featured) && (
            <div className="mb-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <Star className="h-5 w-5 text-warning" />
                Featured Listings
              </h3>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredListings
                  .filter((l) => l.featured)
                  .map((listing) => (
                    <Card
                      key={listing.id}
                      className="group overflow-hidden transition-all hover:shadow-xl"
                    >
                      <div className="relative h-48 w-full overflow-hidden">
                        <img
                          src={listing.image || "/placeholder.svg"}
                          alt={listing.title}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                        <button
                          onClick={() => toggleSaved(listing.id)}
                          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-colors hover:bg-background"
                        >
                          <Heart
                            className={cn(
                              "h-5 w-5 transition-colors",
                              savedListings.includes(listing.id)
                                ? "fill-destructive text-destructive"
                                : "text-muted-foreground"
                            )}
                          />
                        </button>
                        <Badge className="absolute left-3 top-3 bg-warning text-warning-foreground">
                          Featured
                        </Badge>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/80 to-transparent p-4">
                          <p className="text-xl font-bold text-background">
                            {listing.price}
                          </p>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-foreground group-hover:text-primary">
                          {listing.title}
                        </h3>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {listing.city}
                        </p>

                        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                          {listing.bedrooms === 0 ? (
                            <span>Studio</span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <BedDouble className="h-3.5 w-3.5" />
                              {listing.bedrooms} bed
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Bath className="h-3.5 w-3.5" />
                            {listing.bathrooms} bath
                          </span>
                          <span className="flex items-center gap-1">
                            <Square className="h-3.5 w-3.5" />
                            {listing.sqft} sqft
                          </span>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          {listing.amenities.map((amenity) => {
                            const Icon = amenityIcons[amenity] || Wifi;
                            return (
                              <div
                                key={amenity}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted"
                                title={amenity}
                              >
                                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-warning text-warning" />
                            <span className="text-sm font-medium text-foreground">
                              {listing.rating}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({listing.reviews} reviews)
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {listing.availability}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {/* All Listings */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              All Listings ({filteredListings.length})
            </h3>

            {viewMode === "grid" ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredListings.map((listing) => (
                  <Card
                    key={listing.id}
                    className="group overflow-hidden transition-all hover:shadow-lg"
                  >
                    <div className="relative h-40 w-full overflow-hidden">
                      <img
                        src={listing.image || "/placeholder.svg"}
                        alt={listing.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <button
                        onClick={() => toggleSaved(listing.id)}
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm"
                      >
                        <Heart
                          className={cn(
                            "h-4 w-4",
                            savedListings.includes(listing.id)
                              ? "fill-destructive text-destructive"
                              : "text-muted-foreground"
                          )}
                        />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/80 to-transparent p-3">
                        <p className="text-lg font-bold text-background">
                          {listing.price}
                        </p>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <h3 className="truncate font-medium text-foreground">
                        {listing.title}
                      </h3>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {listing.city}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} bed`}</span>
                        <span>•</span>
                        <span>{listing.bathrooms} bath</span>
                        <span>•</span>
                        <span>{listing.sqft} sqft</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredListings.map((listing) => (
                  <Card
                    key={listing.id}
                    className="overflow-hidden transition-all hover:shadow-md"
                  >
                    <div className="flex">
                      <div className="relative h-32 w-40 shrink-0">
                        <img
                          src={listing.image || "/placeholder.svg"}
                          alt={listing.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <CardContent className="flex flex-1 items-center justify-between p-4">
                        <div>
                          <h3 className="font-medium text-foreground">
                            {listing.title}
                          </h3>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {listing.city}
                          </p>
                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} bed`}</span>
                            <span>•</span>
                            <span>{listing.bathrooms} bath</span>
                            <span>•</span>
                            <span>{listing.sqft} sqft</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-bold text-foreground">
                              {listing.price}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {listing.availability}
                            </Badge>
                          </div>
                          <button
                            onClick={() => toggleSaved(listing.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-border"
                          >
                            <Heart
                              className={cn(
                                "h-4 w-4",
                                savedListings.includes(listing.id)
                                  ? "fill-destructive text-destructive"
                                  : "text-muted-foreground"
                              )}
                            />
                          </button>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Property Dialog */}
      <Dialog open={addPropertyOpen} onOpenChange={setAddPropertyOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Property</DialogTitle>
            <DialogDescription>
              Add a property you own or manage to start tracking rentals.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="property-name">Property Name</Label>
              <Input
                id="property-name"
                placeholder="e.g., Sunset Apartments - Unit 3B"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="property-address">Address</Label>
              <Textarea
                id="property-address"
                placeholder="Full property address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthly-rent">Monthly Rent</Label>
                <Input id="monthly-rent" type="number" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due-date">Due Date</Label>
                <Select>
                  <SelectTrigger id="due-date">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st of month</SelectItem>
                    <SelectItem value="5">5th of month</SelectItem>
                    <SelectItem value="15">15th of month</SelectItem>
                    <SelectItem value="last">Last day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input id="bedrooms" type="number" placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input id="bathrooms" type="number" placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sqft">Sq. Ft.</Label>
                <Input id="sqft" type="number" placeholder="0" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPropertyOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setAddPropertyOpen(false)}>
              Add Property
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
