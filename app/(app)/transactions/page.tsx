"use client";

import { useState, useEffect } from "react";
import {
  Lock,
  Plus,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Upload,
  MoreVertical,
  Edit2,
  Trash2,
  Building2,
  User,
  Zap,
  Droplets,
  Wrench,
  Calendar,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  Wifi,
  History,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { StatusBadge, type StatusType } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { useUser } from "@/lib/user-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Mock data for tenant receipts (summary for each property you own)
const tenantReceipts = [
  {
    id: 1,
    tenantName: "John Doe",
    tenantEmail: "john@example.com",
    property: "Sunset Apartments - Unit 3B",
    currentMonth: "January 2026",
    breakdown: {
      baseRent: 1100,
      electricity: { amount: 85, previousUnit: 1200, currentUnit: 1250, rate: 12 },
      water: { amount: 35, previousUnit: 500, currentUnit: 525, rate: 5 },
      internet: 60,
      maintenance: 0,
      lateFee: 0,
    },
    total: 1290,
    status: "paid" as StatusType,
    paidDate: "Jan 2, 2026",
    paymentMethod: "Bank Transfer",
    proofUrl: "receipt_jan_3b.pdf",
  },
  {
    id: 2,
    tenantName: "Jane Smith",
    tenantEmail: "jane@example.com",
    property: "Oak Street House",
    currentMonth: "January 2026",
    breakdown: {
      baseRent: 2300,
      electricity: { amount: 120, previousUnit: 2400, currentUnit: 2450, rate: 12 },
      water: { amount: 45, previousUnit: 800, currentUnit: 830, rate: 5 },
      internet: 80,
      maintenance: 35,
      lateFee: 0,
    },
    total: 2580,
    status: "pending" as StatusType,
    paidDate: null,
    paymentMethod: null,
    proofUrl: null,
  },
  {
    id: 3,
    tenantName: "Tech Corp",
    tenantEmail: "admin@techcorp.com",
    property: "Downtown Office",
    currentMonth: "January 2026",
    breakdown: {
      baseRent: 3200,
      electricity: { amount: 200, previousUnit: 3600, currentUnit: 3750, rate: 12 },
      water: { amount: 50, previousUnit: 1200, currentUnit: 1250, rate: 5 },
      internet: 150,
      maintenance: 50,
      lateFee: 100,
    },
    total: 3750,
    status: "overdue" as StatusType,
    paidDate: null,
    paymentMethod: null,
    proofUrl: null,
  },
];

// Mock data for my receipts (as tenant - what I pay)
const myReceipts = [
  {
    id: 1,
    landlordName: "Property Management Inc.",
    landlordEmail: "support@propmanagement.com",
    property: "Marina View Apartments - Unit 4B",
    month: "January 2026",
    breakdown: {
      baseRent: 1330,
      electricity: { amount: 85, previousUnit: 1200, currentUnit: 1250, rate: 12 },
      water: { amount: 35, previousUnit: 500, currentUnit: 525, rate: 5 },
      internet: 60,
      maintenance: 50,
      lateFee: 0,
    },
    total: 1560,
    status: "pending" as StatusType,
    dueDate: "Jan 5, 2026",
    paidDate: null,
    paymentMethod: null,
  },
  {
    id: 2,
    landlordName: "Property Management Inc.",
    landlordEmail: "support@propmanagement.com",
    property: "Marina View Apartments - Unit 4B",
    month: "December 2025",
    breakdown: {
      baseRent: 1330,
      electricity: { amount: 78, previousUnit: 1150, currentUnit: 1200, rate: 12 },
      water: { amount: 32, previousUnit: 480, currentUnit: 500, rate: 5 },
      internet: 60,
      maintenance: 50,
      lateFee: 0,
    },
    total: 1550,
    status: "verified" as StatusType,
    dueDate: "Dec 5, 2025",
    paidDate: "Dec 3, 2025",
    paymentMethod: "Bank Transfer",
  },
  {
    id: 3,
    landlordName: "Property Management Inc.",
    landlordEmail: "support@propmanagement.com",
    property: "Marina View Apartments - Unit 4B",
    month: "November 2025",
    breakdown: {
      baseRent: 1330,
      electricity: { amount: 92, previousUnit: 1100, currentUnit: 1150, rate: 12 },
      water: { amount: 38, previousUnit: 450, currentUnit: 480, rate: 5 },
      internet: 60,
      maintenance: 50,
      lateFee: 0,
    },
    total: 1570,
    status: "verified" as StatusType,
    dueDate: "Nov 5, 2025",
    paidDate: "Nov 4, 2025",
    paymentMethod: "Bank Transfer",
  },
];

// Mock data for transaction history
const transactionHistory = [
  {
    id: 1,
    timestamp: "2026-01-02T10:30:00Z",
    property: "Sunset Apartments - Unit 3B",
    tenantName: "John Doe",
    landlordName: "You",
    type: "tenant_payment",
    breakdown: {
      baseRent: 1100,
      electricity: { amount: 85, previousUnit: 1200, currentUnit: 1250, rate: 12 },
      water: { amount: 35, previousUnit: 500, currentUnit: 525, rate: 5 },
      internet: 60,
      maintenance: 0,
      lateFee: 0,
    },
    total: 1290,
    status: "paid",
  },
  {
    id: 2,
    timestamp: "2025-12-03T14:15:00Z",
    property: "Marina View Apartments - Unit 4B",
    tenantName: "You",
    landlordName: "Property Management Inc.",
    type: "landlord_payment",
    breakdown: {
      baseRent: 1330,
      electricity: { amount: 78, previousUnit: 1150, currentUnit: 1200, rate: 12 },
      water: { amount: 32, previousUnit: 480, currentUnit: 500, rate: 5 },
      internet: 60,
      maintenance: 50,
      lateFee: 0,
    },
    total: 1550,
    status: "paid",
  },
  {
    id: 3,
    timestamp: "2025-11-04T09:45:00Z",
    property: "Marina View Apartments - Unit 4B",
    tenantName: "You",
    landlordName: "Property Management Inc.",
    type: "landlord_payment",
    breakdown: {
      baseRent: 1330,
      electricity: { amount: 92, previousUnit: 1100, currentUnit: 1150, rate: 12 },
      water: { amount: 38, previousUnit: 450, currentUnit: 480, rate: 5 },
      internet: 60,
      maintenance: 50,
      lateFee: 0,
    },
    total: 1570,
    status: "paid",
  },
];

// Mock data for ledger
const ledgerEntries = [
  {
    id: 1,
    date: "Jan 15, 2026",
    description: "Monthly rent - Unit 3B",
    amount: "+$1,290",
    type: "credit",
    status: "verified" as StatusType,
    property: "Sunset Apartments",
    verified: true,
  },
  {
    id: 2,
    date: "Jan 10, 2026",
    description: "Late fee - December rent",
    amount: "-$50",
    type: "debit",
    status: "verified" as StatusType,
    property: "Sunset Apartments",
    verified: true,
  },
  {
    id: 3,
    date: "Jan 5, 2026",
    description: "Security deposit",
    amount: "+$2,400",
    type: "credit",
    status: "pending" as StatusType,
    property: "Oak Street House",
    verified: false,
  },
];

export default function TransactionsPage() {
  const { connections } = useUser();
  const [activeTab, setActiveTab] = useState("receipts");
  const [addChargeOpen, setAddChargeOpen] = useState(false);
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [viewReceiptOpen, setViewReceiptOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [createBillOpen, setCreateBillOpen] = useState(false);
  const [createBillStep, setCreateBillStep] = useState(1); // 1: select property, 2: fill details
  const [selectedReceipt, setSelectedReceipt] = useState<
    (typeof tenantReceipts)[0] | (typeof myReceipts)[0] | null
  >(null);
  const [chargeType, setChargeType] = useState("");
  const [previousElectricityUnit, setPreviousElectricityUnit] = useState("");
  const [currentElectricityUnit, setCurrentElectricityUnit] = useState("");
  const [previousWaterUnit, setPreviousWaterUnit] = useState("");
  const [currentWaterUnit, setCurrentWaterUnit] = useState("");
  const [expandedHistory, setExpandedHistory] = useState<number[]>([]);
  
  // Bill creation states
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [confirmedRent, setConfirmedRent] = useState("");
  const [billMonth, setBillMonth] = useState("");
  const [prevElectricityUnit, setPrevElectricityUnit] = useState("");
  const [currElectricityUnit, setCurrElectricityUnit] = useState("");
  const [electricityRate, setElectricityRate] = useState("12");
  const [prevWaterUnit, setPrevWaterUnit] = useState("");
  const [currWaterUnit, setCurrWaterUnit] = useState("");
  const [waterRate, setWaterRate] = useState("5");
  const [internetBill, setInternetBill] = useState("");
  const [customFields, setCustomFields] = useState<Array<{ id?: number; name: string; amount: string }>>([]);
  const [allTenantReceipts, setAllTenantReceipts] = useState<any[]>(tenantReceipts);

  const hasTenantsRole = connections.some((c) => c.role === "tenant");
  const hasLandlordRole = connections.some((c) => c.role === "landlord");

  // Load bills from localStorage on mount
  useEffect(() => {
    const savedBills = JSON.parse(localStorage.getItem('tenantBills') || '[]');
    if (savedBills.length > 0) {
      setAllTenantReceipts([...tenantReceipts, ...savedBills]);
    }
  }, []);

  const calculateUtilityCharge = (previous: number, current: number, rate: number) => {
    return Math.max(0, (current - previous) * rate);
  };

  const toggleHistoryExpansion = (id: number) => {
    setExpandedHistory(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
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

  const getPropertiesWithTenants = () => {
    if (typeof window === 'undefined') return [];
    const allProperties = JSON.parse(localStorage.getItem('properties') || '[]');
    return allProperties.filter((p: any) => p.tenant && p.tenant.name);
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
    if (!selectedProperty || !confirmedRent || !billMonth) {
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
      tenantName: selectedProperty.tenant.name,
      tenantEmail: selectedProperty.tenant.email,
      property: selectedProperty.name,
      propertyId: selectedProperty.id,
      currentMonth: billMonth,
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
    const updatedReceipts = [...allTenantReceipts, billData];
    setAllTenantReceipts(updatedReceipts);
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
    setCreateBillStep(1);
    setSelectedProperty(null);
    setConfirmedRent("");
    setBillMonth("");
    setPrevElectricityUnit("");
    setCurrElectricityUnit("");
    setPrevWaterUnit("");
    setCurrWaterUnit("");
    setInternetBill("");
    setCustomFields([]);
    
    alert('Bill created successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground lg:text-2xl">
            Rent & Transactions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View receipts, manage payments, and track your ledger
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setHistoryOpen(true)}>
            <History className="mr-2 h-4 w-4" />
            History
          </Button>
          {hasLandlordRole && (
            <Button onClick={() => {
              setCreateBillStep(1);
              setCreateBillOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Create Bill
            </Button>
          )}
          {hasTenantsRole && (
            <Button onClick={() => setAddChargeOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Charge
            </Button>
          )}
          {hasLandlordRole && (
            <Button onClick={() => setMarkPaidOpen(true)}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark as Paid
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-none">
          <TabsTrigger value="receipts">
            <Receipt className="mr-2 h-4 w-4" />
            Receipts
          </TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
        </TabsList>

        {/* Receipts Tab */}
        <TabsContent value="receipts" className="mt-6 space-y-8">
          {/* Tenant Receipts (As Landlord) */}
          {hasTenantsRole && (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
                  <ArrowDownLeft className="h-4 w-4 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Tenant Payment Receipts
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Payment summary from your tenants
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {allTenantReceipts.map((receipt: any) => (
                  <Card
                    key={receipt.id}
                    className={cn(
                      "transition-all hover:shadow-md",
                      receipt.status === "overdue" && "border-destructive/50"
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {receipt.tenantName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              {receipt.tenantName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {receipt.currentMonth}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={receipt.status} size="sm" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        {receipt.property}
                      </p>

                      {/* Breakdown */}
                      <div className="space-y-2 rounded-lg bg-muted/50 p-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Base Rent
                          </span>
                          <span className="font-medium text-foreground">
                            ${receipt.breakdown.baseRent.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Zap className="h-3 w-3" />
                            Electricity
                          </span>
                          <span className="font-medium text-foreground">
                            ${typeof receipt.breakdown.electricity === 'object' ? receipt.breakdown.electricity.amount : receipt.breakdown.electricity}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Droplets className="h-3 w-3" />
                            Water
                          </span>
                          <span className="font-medium text-foreground">
                            ${typeof receipt.breakdown.water === 'object' ? receipt.breakdown.water.amount : receipt.breakdown.water}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Wifi className="h-3 w-3" />
                            Internet
                          </span>
                          <span className="font-medium text-foreground">
                            ${receipt.breakdown.internet}
                          </span>
                        </div>
                        {receipt.breakdown.maintenance > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Wrench className="h-3 w-3" />
                              Maintenance
                            </span>
                            <span className="font-medium text-foreground">
                              ${receipt.breakdown.maintenance}
                            </span>
                          </div>
                        )}
                        {receipt.breakdown.lateFee > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-destructive">Late Fee</span>
                            <span className="font-medium text-destructive">
                              ${receipt.breakdown.lateFee}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-border pt-2 text-sm">
                          <span className="font-semibold text-foreground">
                            Total
                          </span>
                          <span className="text-lg font-bold text-foreground">
                            ${receipt.total.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Payment Info */}
                      {receipt.paidDate && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Paid on</span>
                          <span className="font-medium text-success">
                            {receipt.paidDate}
                          </span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedReceipt(receipt);
                            setViewReceiptOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                        {receipt.status === "pending" && (
                          <Button size="sm" className="flex-1">
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Verify
                          </Button>
                        )}
                        {receipt.status === "overdue" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                          >
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Send Reminder
                          </Button>
                        )}
                        {receipt.proofUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-transparent"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-transparent"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* My Receipts (As Tenant) */}
          {hasLandlordRole && (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <ArrowUpRight className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Your Payment Receipts
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Rent receipts for properties you rent
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {myReceipts.map((receipt) => (
                  <Card
                    key={receipt.id}
                    className={cn(
                      "transition-all",
                      receipt.status === "pending" && "border-warning/50"
                    )}
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        {/* Left Side - Info */}
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center justify-between lg:justify-start lg:gap-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                {receipt.landlordName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">
                                  {receipt.property}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {receipt.month}
                                </p>
                              </div>
                            </div>
                            <StatusBadge status={receipt.status} />
                          </div>

                          {/* Breakdown Grid */}
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
                            <div className="rounded-lg bg-muted/50 p-3">
                              <p className="text-xs text-muted-foreground">
                                Base Rent
                              </p>
                              <p className="mt-0.5 font-semibold text-foreground">
                                ${receipt.breakdown.baseRent.toLocaleString()}
                              </p>
                            </div>
                            <div className="rounded-lg bg-muted/50 p-3">
                              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Zap className="h-3 w-3" />
                                Electricity
                              </p>
                              <p className="mt-0.5 font-semibold text-foreground">
                                ${typeof receipt.breakdown.electricity === 'object' ? receipt.breakdown.electricity.amount : receipt.breakdown.electricity}
                              </p>
                            </div>
                            <div className="rounded-lg bg-muted/50 p-3">
                              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Droplets className="h-3 w-3" />
                                Water
                              </p>
                              <p className="mt-0.5 font-semibold text-foreground">
                                ${typeof receipt.breakdown.water === 'object' ? receipt.breakdown.water.amount : receipt.breakdown.water}
                              </p>
                            </div>
                            <div className="rounded-lg bg-muted/50 p-3">
                              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Wifi className="h-3 w-3" />
                                Internet
                              </p>
                              <p className="mt-0.5 font-semibold text-foreground">
                                ${receipt.breakdown.internet}
                              </p>
                            </div>
                            <div className="rounded-lg bg-muted/50 p-3">
                              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Wrench className="h-3 w-3" />
                                Maintenance
                              </p>
                              <p className="mt-0.5 font-semibold text-foreground">
                                ${receipt.breakdown.maintenance}
                              </p>
                            </div>
                            <div className="rounded-lg bg-primary/10 p-3">
                              <p className="text-xs text-muted-foreground">
                                Total
                              </p>
                              <p className="mt-0.5 text-lg font-bold text-primary">
                                ${receipt.total.toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {/* Payment Status */}
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              Due: {receipt.dueDate}
                            </span>
                            {receipt.paidDate && (
                              <span className="flex items-center gap-1 text-success">
                                <CheckCircle2 className="h-4 w-4" />
                                Paid: {receipt.paidDate}
                              </span>
                            )}
                            {receipt.paymentMethod && (
                              <Badge variant="secondary">
                                {receipt.paymentMethod}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Right Side - Actions */}
                        <div className="flex gap-2 lg:flex-col">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedReceipt(receipt);
                              setViewReceiptOpen(true);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                          {receipt.status === "pending" && (
                            <Button onClick={() => setMarkPaidOpen(true)}>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Pay Now
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            className="bg-transparent"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </TabsContent>

        {/* Ledger Tab */}
        <TabsContent value="ledger" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-base font-semibold">
                Transaction Ledger
              </CardTitle>
              <Button variant="outline" size="sm" className="bg-transparent">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ledgerEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-4 rounded-lg border border-border bg-background p-4"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        entry.verified
                          ? "bg-success/10 text-success"
                          : entry.status === "overdue"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-warning/10 text-warning-foreground"
                      }`}
                    >
                      {entry.verified ? (
                        <Lock className="h-5 w-5" />
                      ) : entry.status === "overdue" ? (
                        <AlertTriangle className="h-5 w-5" />
                      ) : (
                        <Clock className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">
                          {entry.description}
                        </p>
                        {entry.verified && (
                          <Lock className="h-3.5 w-3.5 text-success" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {entry.property} - {entry.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={entry.status} size="sm" />
                      <span
                        className={`text-sm font-semibold ${
                          entry.type === "credit"
                            ? "text-success"
                            : "text-destructive"
                        }`}
                      >
                        {entry.amount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                <Lock className="mr-1 inline h-3 w-3" />
                Verified records are locked and cannot be edited
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Disputes Tab */}
        <TabsContent value="disputes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Disputed Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={CheckCircle2}
                title="No disputes"
                description="All your transactions are verified and in good standing."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Receipt Details Dialog */}
      <Dialog open={viewReceiptOpen} onOpenChange={setViewReceiptOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bill Details</DialogTitle>
            <DialogDescription>
              Full breakdown of charges and utility consumption
            </DialogDescription>
          </DialogHeader>
          {selectedReceipt && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {selectedReceipt.property}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {'currentMonth' in selectedReceipt ? selectedReceipt.currentMonth : selectedReceipt.month}
                  </p>
                </div>
                <StatusBadge status={selectedReceipt.status} />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Base Rent</span>
                  <span className="font-semibold">${selectedReceipt.breakdown.baseRent.toLocaleString()}</span>
                </div>

                {/* Electricity Details */}
                {typeof selectedReceipt.breakdown.electricity === 'object' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 font-medium">
                        <Zap className="h-4 w-4" />
                        Electricity
                      </span>
                      <span className="font-semibold">${selectedReceipt.breakdown.electricity.amount}</span>
                    </div>
                    <div className="ml-6 space-y-1 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Previous Unit:</span>
                        <span>{selectedReceipt.breakdown.electricity.previousUnit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Current Unit:</span>
                        <span>{selectedReceipt.breakdown.electricity.currentUnit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Unit Difference:</span>
                        <span>{selectedReceipt.breakdown.electricity.currentUnit - selectedReceipt.breakdown.electricity.previousUnit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rate per Unit:</span>
                        <span>${selectedReceipt.breakdown.electricity.rate}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Water Details */}
                {typeof selectedReceipt.breakdown.water === 'object' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 font-medium">
                        <Droplets className="h-4 w-4" />
                        Water
                      </span>
                      <span className="font-semibold">${selectedReceipt.breakdown.water.amount}</span>
                    </div>
                    <div className="ml-6 space-y-1 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Previous Unit:</span>
                        <span>{selectedReceipt.breakdown.water.previousUnit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Current Unit:</span>
                        <span>{selectedReceipt.breakdown.water.currentUnit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Unit Difference:</span>
                        <span>{selectedReceipt.breakdown.water.currentUnit - selectedReceipt.breakdown.water.previousUnit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rate per Unit:</span>
                        <span>${selectedReceipt.breakdown.water.rate}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center py-2 border-b">
                  <span className="flex items-center gap-2 font-medium">
                    <Wifi className="h-4 w-4" />
                    Internet
                  </span>
                  <span className="font-semibold">${selectedReceipt.breakdown.internet}</span>
                </div>

                {selectedReceipt.breakdown.maintenance > 0 && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="flex items-center gap-2 font-medium">
                      <Wrench className="h-4 w-4" />
                      Maintenance
                    </span>
                    <span className="font-semibold">${selectedReceipt.breakdown.maintenance}</span>
                  </div>
                )}

                {selectedReceipt.breakdown.lateFee > 0 && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium text-destructive">Late Fee</span>
                    <span className="font-semibold text-destructive">${selectedReceipt.breakdown.lateFee}</span>
                  </div>
                )}

                <div className="flex justify-between items-center py-2 border-t-2 border-border text-lg">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-primary">${selectedReceipt.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Charge Dialog */}
      <Dialog open={addChargeOpen} onOpenChange={setAddChargeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Charge</DialogTitle>
            <DialogDescription>
              Create a new charge for your tenant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tenant-select">Select Tenant</Label>
              <Select>
                <SelectTrigger id="tenant-select">
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="john">John Doe - Unit 3B</SelectItem>
                  <SelectItem value="jane">Jane Smith - Oak Street</SelectItem>
                  <SelectItem value="tech">Tech Corp - Office</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              }}
            >
              Add Charge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Paid Dialog */}
      <Dialog open={markPaidOpen} onOpenChange={setMarkPaidOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Payment</DialogTitle>
            <DialogDescription>
              Record your rent payment and upload proof.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select>
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-date">Payment Date</Label>
              <Input id="payment-date" type="date" />
            </div>
            <div className="space-y-2">
              <Label>Upload Proof</Label>
              <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Click or drag to upload receipt
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-notes">Notes (optional)</Label>
              <Textarea
                id="payment-notes"
                placeholder="Any additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setMarkPaidOpen(false)}>
              Submit Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction History</DialogTitle>
            <DialogDescription>
              View all previous transactions for your properties
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {transactionHistory.map((transaction) => (
              <Card key={transaction.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {transaction.type === "tenant_payment" ? transaction.tenantName.charAt(0) : transaction.landlordName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {transaction.property}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.timestamp).toLocaleDateString()} at {new Date(transaction.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">${transaction.total.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.type === "tenant_payment" ? `From: ${transaction.tenantName}` : `To: ${transaction.landlordName}`}
                      </p>
                    </div>
                  </div>

                  <Collapsible
                    open={expandedHistory.includes(transaction.id)}
                    onOpenChange={() => toggleHistoryExpansion(transaction.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between p-0 h-auto">
                        <span className="text-sm text-muted-foreground">
                          {expandedHistory.includes(transaction.id) ? "Hide" : "Show"} Details
                        </span>
                        {expandedHistory.includes(transaction.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 mt-3">
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xs text-muted-foreground">Base Rent</p>
                          <p className="mt-0.5 font-semibold">${transaction.breakdown.baseRent.toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Zap className="h-3 w-3" />
                            Electricity
                          </p>
                          <p className="mt-0.5 font-semibold">
                            ${typeof transaction.breakdown.electricity === 'object' ? transaction.breakdown.electricity.amount : transaction.breakdown.electricity}
                          </p>
                          {typeof transaction.breakdown.electricity === 'object' && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {transaction.breakdown.electricity.currentUnit - transaction.breakdown.electricity.previousUnit} units
                            </p>
                          )}
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Droplets className="h-3 w-3" />
                            Water
                          </p>
                          <p className="mt-0.5 font-semibold">
                            ${typeof transaction.breakdown.water === 'object' ? transaction.breakdown.water.amount : transaction.breakdown.water}
                          </p>
                          {typeof transaction.breakdown.water === 'object' && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {transaction.breakdown.water.currentUnit - transaction.breakdown.water.previousUnit} units
                            </p>
                          )}
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Wifi className="h-3 w-3" />
                            Internet
                          </p>
                          <p className="mt-0.5 font-semibold">${transaction.breakdown.internet}</p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Wrench className="h-3 w-3" />
                            Maintenance
                          </p>
                          <p className="mt-0.5 font-semibold">${transaction.breakdown.maintenance}</p>
                        </div>
                      </div>
                      {transaction.breakdown.lateFee > 0 && (
                        <div className="flex justify-between items-center py-2 border-t">
                          <span className="text-destructive">Late Fee</span>
                          <span className="font-semibold text-destructive">${transaction.breakdown.lateFee}</span>
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Bill Dialog */}
      <Dialog open={createBillOpen} onOpenChange={setCreateBillOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Bill</DialogTitle>
            <DialogDescription>
              {createBillStep === 1 ? 'Select a property to create a bill for' : 'Fill in the billing details'}
            </DialogDescription>
          </DialogHeader>

          {createBillStep === 1 ? (
            // Step 1: Select Property
            <div className="space-y-4 py-4">
              <Label htmlFor="property-select">Select Property</Label>
              <Select value={selectedProperty?.id?.toString() || ''} onValueChange={(value) => {
                const properties = getPropertiesWithTenants();
                const selected = properties.find((p: any) => p.id === parseInt(value));
                setSelectedProperty(selected);
              }}>
                <SelectTrigger id="property-select">
                  <SelectValue placeholder="Choose a property" />
                </SelectTrigger>
                <SelectContent>
                  {getPropertiesWithTenants().map((prop: any) => (
                    <SelectItem key={prop.id} value={prop.id.toString()}>
                      {prop.name} - {prop.tenant?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedProperty && (
                <Card className="bg-muted/30">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Property</p>
                        <p className="font-semibold">{selectedProperty.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tenant</p>
                        <p className="font-semibold">{selectedProperty.tenant?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-semibold">{selectedProperty.tenant?.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Base Rent</p>
                        <p className="font-semibold">{selectedProperty.rent}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateBillOpen(false)}>
                  Cancel
                </Button>
                <Button disabled={!selectedProperty} onClick={() => setCreateBillStep(2)}>
                  Continue
                </Button>
              </DialogFooter>
            </div>
          ) : (
            // Step 2: Fill Bill Details
            <div className="space-y-4 py-4">
              {selectedProperty && (
                <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900">{selectedProperty.name}</p>
                  <p className="text-sm text-blue-700">{selectedProperty.tenant?.name}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bill-month">Billing Month</Label>
                  <Input 
                    id="bill-month" 
                    type="month" 
                    value={billMonth}
                    onChange={(e) => setBillMonth(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmed-rent">Confirmed Rent</Label>
                  <Input 
                    id="confirmed-rent" 
                    type="number" 
                    placeholder={selectedProperty?.rent || "0.00"}
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
                <Button variant="outline" onClick={() => {
                  setCreateBillStep(1);
                }}>
                  Back
                </Button>
                <Button onClick={handleCreateBill}>
                  Create Bill
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
