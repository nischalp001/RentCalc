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
} from "lucide-react";
import Link from "next/link";
import { SummaryCard } from "@/components/summary-card";
import { StatusBadge } from "@/components/status-badge";
import { useUser } from "@/lib/user-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
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
  const [images, setImages] = useState([{ file: null as File | null, label: '' }]);

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

  const hasTenantsRole = connections.some((c) => c.role === "tenant");
  const hasLandlordRole = connections.some((c) => c.role === "landlord");

  return (
    <div className="space-y-6">
      {/* Add Property Dialog */}
      <section>
        <Dialog open={addPropertyOpen} onOpenChange={(open) => {
          setAddPropertyOpen(open);
          if (!open) {
            setImages([{ file: null, label: '' }]);
          }
        }}>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full h-16 text-lg font-bold justify-center">
              Add Your Property
              <Plus className="h-6 w-6 ml-2" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Your Property</DialogTitle>
              <DialogDescription>
                Fill in the details to add your property to the platform.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="property-name">Property Name</Label>
                <Input id="property-name" placeholder="Enter property name" />
              </div>
              <div>
                <Label>Images</Label>
                <div className="space-y-4">
                  {images.map((image, index) => (
                    <div key={index} className="flex items-end space-x-2">
                      <div className="flex-1">
                        <Label htmlFor={`image-${index}`}>Image {index + 1}</Label>
                        <Input
                          id={`image-${index}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => updateImage(index, 'file', e.target.files?.[0] || null)}
                        />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor={`label-${index}`}>Label</Label>
                        <Input
                          id={`label-${index}`}
                          placeholder="Image label"
                          value={image.label}
                          onChange={(e) => updateImage(index, 'label', e.target.value)}
                        />
                      </div>
                      {images.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeImage(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addImage}>
                    Add Image
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="property-type">Property Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="flat">Flat</SelectItem>
                    <SelectItem value="room">Room</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="coworking">Coworking Space</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rooms">Number of Rooms</Label>
                  <Input id="rooms" type="number" />
                </div>
                <div>
                  <Label htmlFor="bathrooms">Number of Bathrooms</Label>
                  <Input id="bathrooms" type="number" />
                </div>
                <div>
                  <Label htmlFor="kitchens">Number of Kitchens</Label>
                  <Input id="kitchens" type="number" />
                </div>
                <div>
                  <Label htmlFor="dinings">Number of Dining Areas</Label>
                  <Input id="dinings" type="number" />
                </div>
                <div>
                  <Label htmlFor="livings">Number of Living Areas</Label>
                  <Input id="livings" type="number" />
                </div>
                <div>
                  <Label htmlFor="bike-parking">Bike Parking</Label>
                  <Input id="bike-parking" type="number" />
                </div>
                <div>
                  <Label htmlFor="car-parking">Car Parking</Label>
                  <Input id="car-parking" type="number" />
                </div>
              </div>
              <div>
                <Label>Services</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="garage" />
                    <Label htmlFor="garage">Garage</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="furnished" />
                    <Label htmlFor="furnished">Furnished</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="semi-furnished" />
                    <Label htmlFor="semi-furnished">Semi Furnished</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="no-furnished" />
                    <Label htmlFor="no-furnished">No Furnished</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="balcony" />
                    <Label htmlFor="balcony">Balcony</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="water-supply" />
                    <Label htmlFor="water-supply">Water Supply</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="ev-charging" />
                    <Label htmlFor="ev-charging">EV Charging Point</Label>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Room Description</Label>
                <Textarea id="description" placeholder="Describe the rooms" />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setAddPropertyOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setAddPropertyOpen(false)}>
                Add Property
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </section>

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

      {/* Top Action Buttons */}
      <section>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Button size="lg" className="justify-between">
            Rent Your Property
            <Plus className="h-4 w-4" />
          </Button>
          <Button size="lg" className="justify-between">
            Rent a Property
            <Building2 className="h-4 w-4" />
          </Button>
          <Button size="lg" className="justify-between">
            BNB
            <Bed className="h-4 w-4" />
          </Button>
        </div>
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
    </div>
  );
}
