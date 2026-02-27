"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  Upload,
  Eye,
  Calendar,
  ImageIcon,
  X,
  Building2,
  FolderOpen,
  Users,
  MessageCircle,
  Receipt,
  Loader2,
  Trash2,
  Search,
  FileUp,
} from "lucide-react";
import { useUser } from "@/lib/user-context";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  fetchProperties,
  fetchPropertyDocuments,
  uploadPropertyDocument,
  deletePropertyDocument,
  type PropertyDocumentRecord,
  type PropertyRecord,
} from "@/lib/rental-data";
import {
  FilePreviewThumbnail,
  FileLightbox,
  type LightboxItem,
} from "@/components/file-preview";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const DOC_TYPE_OPTIONS = [
  "Contract",
  "Agreement",
  "Insurance",
  "Tax",
  "Identity",
  "Receipt",
  "Invoice",
  "Photo",
  "Other",
] as const;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DocumentsPage() {
  const { user, connections } = useUser();

  // --- Data state ---
  const [documents, setDocuments] = useState<PropertyDocumentRecord[]>([]);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Upload dialog ---
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadDocType, setUploadDocType] = useState<string>("Other");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Lightbox ---
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxItems, setLightboxItems] = useState<LightboxItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // --- Search ---
  const [searchQuery, setSearchQuery] = useState("");

  // --- Delete ---
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // --- Tabs ---
  const [activeTab, setActiveTab] = useState("all");

  // --- Load data ---
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [docs, props] = await Promise.all([
        fetchPropertyDocuments(),
        fetchProperties(),
      ]);
      setDocuments(docs);
      setProperties(props);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user.profileId) void loadData();
  }, [user.profileId, loadData]);

  // Derived: group documents by property
  const docsByProperty = new Map<number, PropertyDocumentRecord[]>();
  for (const doc of documents) {
    const list = docsByProperty.get(doc.property_id) || [];
    list.push(doc);
    docsByProperty.set(doc.property_id, list);
  }

  // Filtered documents
  const filteredDocuments = documents.filter((doc) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      doc.name.toLowerCase().includes(q) ||
      (doc.property_name || "").toLowerCase().includes(q) ||
      (doc.doc_type || "").toLowerCase().includes(q) ||
      (doc.description || "").toLowerCase().includes(q)
    );
  });

  // Associated profiles with their documents
  const associatedProfiles = connections
    .filter((c) => c.status === "active")
    .map((connection) => {
      const propId = connection.propertyId ? Number(connection.propertyId) : null;
      const docs = propId ? docsByProperty.get(propId) || [] : [];
      return { ...connection, documents: docs };
    });

  // ---------------------------------------------------------------------------
  // Upload flow
  // ---------------------------------------------------------------------------

  const openUploadDialog = () => {
    setSelectedPropertyId("");
    setUploadFiles([]);
    setUploadDocType("Other");
    setUploadDescription("");
    setUploadError(null);
    setUploadDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadFiles((prev) => [...prev, ...files]);
    // reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeUploadFile = (index: number) => {
    setUploadFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!selectedPropertyId) {
      setUploadError("Please select a property.");
      return;
    }
    if (uploadFiles.length === 0) {
      setUploadError("Please select at least one file.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      for (const file of uploadFiles) {
        await uploadPropertyDocument({
          propertyId: Number(selectedPropertyId),
          file,
          docType: uploadDocType,
          description: uploadDescription || undefined,
        });
      }

      setUploadDialogOpen(false);
      await loadData();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  const handleDelete = async () => {
    if (deleteId == null) return;
    const doc = documents.find((d) => d.id === deleteId);
    if (!doc) return;
    setDeleting(true);
    try {
      await deletePropertyDocument(doc.id, doc.url);
      setDeleteId(null);
      await loadData();
    } catch {
      // silent
    } finally {
      setDeleting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Lightbox
  // ---------------------------------------------------------------------------

  const openLightbox = (doc: PropertyDocumentRecord) => {
    const items: LightboxItem[] = filteredDocuments
      .filter(
        (d) =>
          d.mime_type?.startsWith("image/") || d.mime_type === "application/pdf"
      )
      .map((d) => ({
        url: d.url,
        name: d.name,
        mime: d.mime_type,
      }));
    const idx = items.findIndex((i) => i.url === doc.url);
    setLightboxItems(items);
    setLightboxIndex(idx >= 0 ? idx : 0);
    setLightboxOpen(true);
  };

  // ---------------------------------------------------------------------------
  // Render: document row
  // ---------------------------------------------------------------------------

  const renderDocumentRow = (doc: PropertyDocumentRecord, showProperty = true) => {
    const isImage = doc.mime_type?.startsWith("image/");
    const isPdf = doc.mime_type === "application/pdf";
    const canPreview = isImage || isPdf;
    const isOwner = doc.uploaded_by_profile_id === user.profileId;

    return (
      <div
        key={doc.id}
        className="flex items-center gap-4 rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted/30"
      >
        {/* Thumbnail */}
        <FilePreviewThumbnail
          src={doc.url}
          mime={doc.mime_type}
          alt={doc.name}
          className="h-12 w-12"
          onClick={canPreview ? () => openLightbox(doc) : undefined}
        />

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium text-foreground">{doc.name}</p>
            {doc.doc_type && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                {doc.doc_type}
              </Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(doc.uploaded_at)}
            </span>
            {showProperty && doc.property_name && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {doc.property_name}
              </span>
            )}
            {doc.uploader_name && (
              <span>by {doc.uploader_name}</span>
            )}
          </div>
          {doc.description && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{doc.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 gap-1">
          {canPreview && (
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent"
              onClick={() => openLightbox(doc)}
            >
              <Eye className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">View</span>
            </Button>
          )}
          <Button variant="outline" size="sm" className="bg-transparent" asChild>
            <a href={doc.url} download={doc.name}>
              <Download className="h-4 w-4" />
            </a>
          </Button>
          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent text-destructive hover:text-destructive"
              onClick={() => setDeleteId(doc.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground lg:text-2xl">Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your documents and view shared files
          </p>
        </div>
        <Button onClick={openUploadDialog}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-none">
          <TabsTrigger value="all">
            <FolderOpen className="mr-2 h-4 w-4 hidden sm:block" />
            All Docs ({filteredDocuments.length})
          </TabsTrigger>
          <TabsTrigger value="by-property">
            <Building2 className="mr-2 h-4 w-4 hidden sm:block" />
            By Property
          </TabsTrigger>
          <TabsTrigger value="connections">
            <Users className="mr-2 h-4 w-4 hidden sm:block" />
            People
          </TabsTrigger>
        </TabsList>

        {/* ==================== All Documents Tab ==================== */}
        <TabsContent value="all" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredDocuments.length > 0 ? (
            <div className="space-y-3">{filteredDocuments.map((doc) => renderDocumentRow(doc))}</div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <EmptyState
                  icon={FileText}
                  title="No documents"
                  description={
                    searchQuery
                      ? "No documents match your search."
                      : "Upload your first document to get started."
                  }
                  action={
                    !searchQuery
                      ? { label: "Upload Document", onClick: openUploadDialog }
                      : undefined
                  }
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ==================== By Property Tab ==================== */}
        <TabsContent value="by-property" className="mt-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : properties.length > 0 ? (
            properties.map((prop) => {
              const propDocs = (docsByProperty.get(prop.id) || []).filter((d) => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                return d.name.toLowerCase().includes(q) || (d.doc_type || "").toLowerCase().includes(q);
              });
              return (
                <Card key={prop.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{prop.property_name}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {prop.location} &middot; {propDocs.length} document{propDocs.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-transparent"
                      onClick={() => {
                        setSelectedPropertyId(String(prop.id));
                        openUploadDialog();
                        setSelectedPropertyId(String(prop.id));
                      }}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {propDocs.length > 0 ? (
                      <div className="space-y-3">
                        {propDocs.map((doc) => renderDocumentRow(doc, false))}
                      </div>
                    ) : (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        No documents for this property yet.
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="p-6">
                <EmptyState
                  icon={Building2}
                  title="No properties"
                  description="Add a property first, then you can upload documents."
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ==================== People Tab ==================== */}
        <TabsContent value="connections" className="mt-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <Users className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Associated Profiles</h3>
              <p className="text-xs text-muted-foreground">
                View documents shared with your connections
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
                              : "bg-emerald-500/10 text-emerald-600"
                          )}
                        >
                          {profile.avatar ? (
                            <img
                              src={profile.avatar}
                              alt={profile.name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            profile.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground">{profile.name}</p>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-xs",
                                profile.role === "landlord"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-emerald-500/10 text-emerald-600"
                              )}
                            >
                              {profile.role === "landlord" ? "Your Landlord" : "Your Tenant"}
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
                        <Button variant="outline" size="sm" className="bg-transparent" asChild>
                          <Link href="/messages">
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Message
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      Shared Documents ({profile.documents.length})
                    </p>
                    {profile.documents.length > 0 ? (
                      profile.documents.map((doc) => renderDocumentRow(doc, false))
                    ) : (
                      <p className="py-3 text-center text-sm text-muted-foreground">
                        No shared documents yet.
                      </p>
                    )}
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
                  description="Connect with landlords or tenants to share documents."
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ==================== Upload Document Dialog ==================== */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Select a property and upload files.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Property picker */}
            <div className="space-y-2">
              <Label>Property</Label>
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a property..." />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((prop) => {
                    const isOwner = prop.owner_profile_id === user.profileId;
                    return (
                      <SelectItem key={prop.id} value={String(prop.id)}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{prop.property_name}</span>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {isOwner ? "Owned" : "Rented"}
                          </Badge>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Show rest of form only when property selected */}
            {selectedPropertyId && (
              <>
                {/* Document type */}
                <div className="space-y-2">
                  <Label>Document Type</Label>
                  <Select value={uploadDocType} onValueChange={setUploadDocType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOC_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Input
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Brief description of the document"
                  />
                </div>

                {/* File drop / select zone */}
                <div className="space-y-2">
                  <Label>Files</Label>
                  <div
                    className="relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/30"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const files = Array.from(e.dataTransfer.files);
                      setUploadFiles((prev) => [...prev, ...files]);
                    }}
                  >
                    <FileUp className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to browse or drag files here
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Images, PDFs, documents
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </div>
                </div>

                {/* File previews */}
                {uploadFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {uploadFiles.length} file{uploadFiles.length !== 1 ? "s" : ""} selected
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {uploadFiles.map((file, idx) => (
                        <div key={`${file.name}-${idx}`} className="flex flex-col items-center gap-1">
                          <FilePreviewThumbnail
                            src={file}
                            alt={file.name}
                            className="h-20 w-20"
                            onRemove={() => removeUploadFile(idx)}
                          />
                          <p className="max-w-[80px] truncate text-[10px] text-muted-foreground">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleUpload()}
              disabled={uploading || !selectedPropertyId || uploadFiles.length === 0}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload ({uploadFiles.length})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== Delete Confirm Dialog ==================== */}
      <Dialog open={deleteId != null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              This will permanently delete the document. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== File Lightbox ==================== */}
      <FileLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        items={lightboxItems}
        startIndex={lightboxIndex}
      />
    </div>
  );
}
