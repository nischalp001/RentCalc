"use client";

import Link from "next/link";
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
} from "lucide-react";
import { StatusBadge, type StatusType } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Mock property data - would come from params in a real app
const propertyData = {
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
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild className="-ml-2">
        <Link href="/properties">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Properties
        </Link>
      </Button>

      {/* Property Header */}
      <div className="relative h-48 overflow-hidden rounded-xl md:h-64">
        <img
          src={propertyData.image || "/placeholder.svg"}
          alt={propertyData.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
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
            <Button variant="secondary" size="sm">
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Property Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs">Monthly Rent</span>
                  </div>
                  <p className="mt-1 text-xl font-bold text-foreground">
                    {propertyData.rent}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs">Due Date</span>
                  </div>
                  <p className="mt-1 font-semibold text-foreground">
                    {propertyData.dueDate}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs">Lease End</span>
                  </div>
                  <p className="mt-1 font-semibold text-foreground">
                    {propertyData.leaseEnd}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs">Security Deposit</span>
                  </div>
                  <p className="mt-1 font-semibold text-foreground">
                    {propertyData.securityDeposit}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-base font-semibold">
                Recent Transactions
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/transactions" className="text-primary">
                  View all
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-4 rounded-lg border border-border p-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                      <Lock className="h-5 w-5 text-success" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {tx.description}
                      </p>
                      <p className="text-xs text-muted-foreground">{tx.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-success">{tx.amount}</p>
                      <StatusBadge status={tx.status} size="sm" showIcon={false} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Linked Documents */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-base font-semibold">
                Linked Documents
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/documents" className="text-primary">
                  View all
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {linkedDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-4 rounded-lg border border-border p-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {doc.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {doc.type} · {doc.date}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tenant Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Tenant Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                  {propertyData.tenant.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {propertyData.tenant}
                  </p>
                  <p className="text-sm text-muted-foreground">Tenant</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {propertyData.tenantEmail}
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  {propertyData.tenantPhone}
                </p>
              </div>
              <Button variant="outline" className="w-full bg-transparent" asChild>
                <Link href="/messages">Contact Tenant</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Quick Actions
              </CardTitle>
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
    </div>
  );
}
