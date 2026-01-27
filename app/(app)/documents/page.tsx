"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  Upload,
  Eye,
  Calendar,
  User,
  ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Building2,
  FolderOpen,
  Users,
  MessageCircle,
  Receipt,
  CheckCircle2,
} from "lucide-react";
import { useUser } from "@/lib/user-context";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Mock data for user's own documents
const myDocuments = [
  {
    id: 1,
    name: "Lease Agreement - Unit 3B",
    type: "Contract",
    version: "v2.0",
    uploadDate: "Dec 15, 2025",
    property: "Sunset Apartments",
    fileSize: "245 KB",
    fileType: "pdf",
  },
  {
    id: 2,
    name: "Property Insurance Certificate",
    type: "Insurance",
    version: "v1.0",
    uploadDate: "Jan 1, 2026",
    property: "All Properties",
    fileSize: "512 KB",
    fileType: "pdf",
  },
  {
    id: 3,
    name: "Tax Documentation 2025",
    type: "Tax",
    version: "v1.0",
    uploadDate: "Jan 10, 2026",
    property: "All Properties",
    fileSize: "1.2 MB",
    fileType: "pdf",
  },
  {
    id: 4,
    name: "ID Verification",
    type: "Identity",
    version: "v1.0",
    uploadDate: "Nov 1, 2025",
    property: "Personal",
    fileSize: "156 KB",
    fileType: "pdf",
  },
];

// Mock data for room condition images
const roomConditions = {
  before: [
    {
      id: 1,
      name: "Living Room - Before",
      date: "Nov 1, 2025",
      uploadedBy: "You",
      url: "/placeholder.svg?height=400&width=600",
    },
    {
      id: 2,
      name: "Kitchen - Before",
      date: "Nov 1, 2025",
      uploadedBy: "You",
      url: "/placeholder.svg?height=400&width=600",
    },
    {
      id: 3,
      name: "Bedroom - Before",
      date: "Nov 1, 2025",
      uploadedBy: "You",
      url: "/placeholder.svg?height=400&width=600",
    },
    {
      id: 4,
      name: "Bathroom - Before",
      date: "Nov 1, 2025",
      uploadedBy: "You",
      url: "/placeholder.svg?height=400&width=600",
    },
  ],
  after: [
    {
      id: 5,
      name: "Living Room - After",
      date: "Jan 15, 2026",
      uploadedBy: "Tenant",
      url: "/placeholder.svg?height=400&width=600",
    },
    {
      id: 6,
      name: "Kitchen - After",
      date: "Jan 15, 2026",
      uploadedBy: "Tenant",
      url: "/placeholder.svg?height=400&width=600",
    },
  ],
};

// Mock data for reports
const reports = [
  {
    id: 1,
    name: "Ledger Report - 2025",
    type: "PDF",
    description: "Complete transaction history for 2025",
    icon: FileText,
  },
  {
    id: 2,
    name: "Ledger Export - 2025",
    type: "CSV",
    description: "Spreadsheet format for accounting",
    icon: FileSpreadsheet,
  },
  {
    id: 3,
    name: "Monthly Summary - Jan 2026",
    type: "PDF",
    description: "Summary of January 2026 transactions",
    icon: FileText,
  },
];

export default function DocumentsPage() {
  const { connections } = useUser();
  const [activeTab, setActiveTab] = useState("my-documents");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const allImages = [...roomConditions.before, ...roomConditions.after];

  // Associated profiles with their documents
  const associatedProfiles = connections
    .filter((c) => c.status === "active")
    .map((connection) => ({
      ...connection,
      documents: [
        {
          id: `${connection.id}-1`,
          name:
            connection.role === "tenant"
              ? "Lease Agreement"
              : "Rental Agreement",
          type: "Contract",
          uploadDate: "Dec 1, 2025",
          fileSize: "245 KB",
        },
        {
          id: `${connection.id}-2`,
          name: connection.role === "tenant" ? "ID Proof" : "Property Deed",
          type: "Verification",
          uploadDate: "Nov 15, 2025",
          fileSize: "156 KB",
        },
      ],
    }));

  const handleImagePreview = (url: string) => {
    const index = allImages.findIndex((img) => img.url === url);
    setPreviewIndex(index);
    setPreviewImage(url);
  };

  const handlePrevImage = () => {
    const newIndex =
      previewIndex === 0 ? allImages.length - 1 : previewIndex - 1;
    setPreviewIndex(newIndex);
    setPreviewImage(allImages[newIndex].url);
  };

  const handleNextImage = () => {
    const newIndex =
      previewIndex === allImages.length - 1 ? 0 : previewIndex + 1;
    setPreviewIndex(newIndex);
    setPreviewImage(allImages[newIndex].url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground lg:text-2xl">
            Documents
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your documents and view shared files
          </p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-none">
          <TabsTrigger value="my-documents">
            <FolderOpen className="mr-2 h-4 w-4 hidden sm:block" />
            Your Docs
          </TabsTrigger>
          <TabsTrigger value="connections">
            <Users className="mr-2 h-4 w-4 hidden sm:block" />
            People
          </TabsTrigger>
          <TabsTrigger value="room">Room</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* My Documents Tab */}
        <TabsContent value="my-documents" className="mt-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <FolderOpen className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Your Documents</h3>
              <p className="text-xs text-muted-foreground">
                Personal documents and files you've uploaded
              </p>
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-base font-semibold">
                All Documents
              </CardTitle>
              <Button size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
            </CardHeader>
            <CardContent>
              {myDocuments.length > 0 ? (
                <div className="space-y-3">
                  {myDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-4 rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted/30"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium text-foreground">
                            {doc.name}
                          </p>
                          <Badge variant="secondary" className="shrink-0 text-xs">
                            {doc.type}
                          </Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {doc.uploadDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {doc.property}
                          </span>
                          <span>{doc.fileSize}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button variant="outline" size="sm" className="bg-transparent">
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="bg-transparent">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No documents"
                  description="Upload your first document to get started."
                  action={{ label: "Upload Document", onClick: () => {} }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Connections Tab - Associated Profiles */}
        <TabsContent value="connections" className="mt-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
              <Users className="h-4 w-4 text-success" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Associated Profiles
              </h3>
              <p className="text-xs text-muted-foreground">
                View documents shared by your connections
              </p>
            </div>
          </div>

          {associatedProfiles.length > 0 ? (
            <div className="space-y-4">
              {associatedProfiles.map((profile) => (
                <Card key={profile.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold",
                            profile.role === "landlord"
                              ? "bg-primary/10 text-primary"
                              : "bg-success/10 text-success"
                          )}
                        >
                          {profile.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground">
                              {profile.name}
                            </p>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-xs",
                                profile.role === "landlord"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-success/10 text-success"
                              )}
                            >
                              {profile.role === "landlord"
                                ? "Your Landlord"
                                : "Your Tenant"}
                            </Badge>
                          </div>
                          {profile.propertyName && (
                            <p className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              {profile.propertyName}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-transparent"
                          asChild
                        >
                          <Link href="/messages">
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Message
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-transparent"
                          asChild
                        >
                          <Link href="/transactions">
                            <Receipt className="mr-2 h-4 w-4" />
                            Transactions
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      Shared Documents
                    </p>
                    {profile.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {doc.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {doc.type} - {doc.uploadDate}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Document for {profile.name}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <EmptyState
                  icon={Users}
                  title="No connections"
                  description="Add landlords or tenants to share documents with them."
                  action={{ label: "Add Person", onClick: () => {} }}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Room Condition Tab */}
        <TabsContent value="room" className="mt-6 space-y-6">
          {/* Before Images */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-base font-semibold">
                Before Move-in
              </CardTitle>
              <Button size="sm" variant="outline" className="bg-transparent">
                <Upload className="mr-2 h-4 w-4" />
                Add Photos
              </Button>
            </CardHeader>
            <CardContent>
              {roomConditions.before.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {roomConditions.before.map((image) => (
                    <button
                      key={image.id}
                      className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted"
                      onClick={() => handleImagePreview(image.url)}
                    >
                      <img
                        src={image.url || "/placeholder.svg"}
                        alt={image.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors group-hover:bg-foreground/20">
                        <Eye className="h-6 w-6 text-background opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/60 to-transparent p-2">
                        <p className="truncate text-xs font-medium text-background">
                          {image.name}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={ImageIcon}
                  title="No before photos"
                  description="Document the property condition before move-in."
                />
              )}
            </CardContent>
          </Card>

          {/* After Images */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-base font-semibold">
                After Move-out
              </CardTitle>
              <Button size="sm" variant="outline" className="bg-transparent">
                <Upload className="mr-2 h-4 w-4" />
                Add Photos
              </Button>
            </CardHeader>
            <CardContent>
              {roomConditions.after.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {roomConditions.after.map((image) => (
                    <button
                      key={image.id}
                      className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted"
                      onClick={() => handleImagePreview(image.url)}
                    >
                      <img
                        src={image.url || "/placeholder.svg"}
                        alt={image.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors group-hover:bg-foreground/20">
                        <Eye className="h-6 w-6 text-background opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/60 to-transparent p-2">
                        <p className="truncate text-xs font-medium text-background">
                          {image.name}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={ImageIcon}
                  title="No after photos"
                  description="Photos will be uploaded when the tenant moves out."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Available Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex flex-col rounded-lg border border-border bg-background p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <report.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">
                          {report.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {report.type}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {report.description}
                    </p>
                    <Button
                      className="mt-4 bg-transparent"
                      variant="outline"
                      size="sm"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Image Preview Modal */}
      <Dialog
        open={!!previewImage}
        onOpenChange={() => setPreviewImage(null)}
      >
        <DialogContent className="max-w-3xl p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10 bg-background/80 backdrop-blur-sm"
              onClick={() => setPreviewImage(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            <img
              src={previewImage || ""}
              alt="Preview"
              className="h-auto max-h-[80vh] w-full object-contain"
            />
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-foreground/80 to-transparent p-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-background hover:bg-background/20"
                onClick={handlePrevImage}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <p className="text-sm font-medium text-background">
                {allImages[previewIndex]?.name}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="text-background hover:bg-background/20"
                onClick={handleNextImage}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
