"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  ImageIcon,
  Trash2,
  X,
  ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isImageMime(mime?: string | null): boolean {
  return !!mime && mime.startsWith("image/");
}

function isPdfMime(mime?: string | null): boolean {
  return mime === "application/pdf";
}

function mimeFromFile(file: File): string {
  return file.type || "";
}

function mimeFromUrl(url: string): string {
  const lower = url.toLowerCase().split("?")[0];
  if (/\.(jpe?g)$/i.test(lower)) return "image/jpeg";
  if (/\.png$/i.test(lower)) return "image/png";
  if (/\.gif$/i.test(lower)) return "image/gif";
  if (/\.webp$/i.test(lower)) return "image/webp";
  if (/\.svg$/i.test(lower)) return "image/svg+xml";
  if (/\.pdf$/i.test(lower)) return "application/pdf";
  return "";
}

// ---------------------------------------------------------------------------
// Inline thumbnail – used in lists, forms, grids
// ---------------------------------------------------------------------------

export type FilePreviewThumbnailProps = {
  /** Remote URL or local File object */
  src: string | File;
  /** Optional explicit mime type (auto-detected otherwise) */
  mime?: string | null;
  /** Alt text */
  alt?: string;
  /** Fixed CSS class for the wrapper – defaults to "h-16 w-16" */
  className?: string;
  /** Called when the thumbnail is clicked (e.g. open lightbox) */
  onClick?: () => void;
  /** Show a remove button */
  onRemove?: () => void;
};

export function FilePreviewThumbnail({
  src,
  mime,
  alt = "Preview",
  className = "h-16 w-16",
  onClick,
  onRemove,
}: FilePreviewThumbnailProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const resolvedMime = useMemo(() => {
    if (mime) return mime;
    if (src instanceof File) return mimeFromFile(src);
    return mimeFromUrl(src as string);
  }, [src, mime]);

  useEffect(() => {
    if (src instanceof File) {
      const url = URL.createObjectURL(src);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setObjectUrl(null);
  }, [src]);

  const displayUrl = objectUrl || (typeof src === "string" ? src : "");
  const isImage = isImageMime(resolvedMime);
  const isPdf = isPdfMime(resolvedMime);

  return (
    <div className={cn("group relative shrink-0 overflow-hidden rounded-lg border border-border bg-muted", className)}>
      {isImage && displayUrl ? (
        <img
          src={displayUrl}
          alt={alt}
          className="h-full w-full object-cover"
        />
      ) : isPdf ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-destructive/80">
          <FileText className="h-6 w-6" />
          <span className="text-[9px] font-medium uppercase">PDF</span>
        </div>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
          <FileText className="h-6 w-6" />
          <span className="text-[9px] font-medium uppercase">FILE</span>
        </div>
      )}

      {/* Hover overlay */}
      {onClick && (
        <button
          type="button"
          onClick={onClick}
          className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors hover:bg-foreground/20"
        >
          <ZoomIn className="h-5 w-5 text-background opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      )}

      {/* Remove button */}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lightbox – full-screen preview dialog for images and PDFs
// ---------------------------------------------------------------------------

export type LightboxItem = {
  url: string;
  name?: string;
  mime?: string | null;
};

export type FileLightboxProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: LightboxItem[];
  startIndex?: number;
};

export function FileLightbox({
  open,
  onOpenChange,
  items,
  startIndex = 0,
}: FileLightboxProps) {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    if (open) setIndex(startIndex);
  }, [open, startIndex]);

  const goPrev = useCallback(() => setIndex((i) => (i === 0 ? items.length - 1 : i - 1)), [items.length]);
  const goNext = useCallback(() => setIndex((i) => (i === items.length - 1 ? 0 : i + 1)), [items.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, goPrev, goNext]);

  const current = items[index];
  if (!current) return null;

  const resolvedMime = current.mime || mimeFromUrl(current.url);
  const isImage = isImageMime(resolvedMime);
  const isPdf = isPdfMime(resolvedMime);
  const canPrev = items.length > 1;
  const canNext = items.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{current.name || "Preview"}</DialogTitle>
        </DialogHeader>

        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-border px-2 sm:px-4 py-2">
          <p className="truncate text-xs sm:text-sm font-medium text-foreground">
            {current.name || "File"}{" "}
            {items.length > 1 && (
              <span className="text-muted-foreground">
                ({index + 1}/{items.length})
              </span>
            )}
          </p>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" asChild>
              <a href={current.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" asChild>
              <a href={current.url} download={current.name || true}>
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="relative flex min-h-[50vh] max-h-[70vh] sm:min-h-[60vh] sm:max-h-[75vh] md:max-h-[80vh] items-center justify-center bg-muted/30">
          {isImage ? (
            <img
              src={current.url}
              alt={current.name || "Preview"}
              className="max-h-[48vh] sm:max-h-[73vh] md:max-h-[78vh] max-w-full w-auto h-auto object-contain p-2 sm:p-4"
            />
          ) : isPdf ? (
            <iframe
              src={current.url}
              title={current.name || "PDF Preview"}
              className="h-[48vh] sm:h-[73vh] md:h-[78vh] w-full"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 py-8 sm:py-16 px-4 text-muted-foreground">
              <FileText className="h-12 w-12 sm:h-16 sm:w-16" />
              <p className="text-xs sm:text-sm text-center">Preview not available for this file type</p>
              <Button variant="outline" size="sm" asChild>
                <a href={current.url} download={current.name || true}>
                  <Download className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Download File
                </a>
              </Button>
            </div>
          )}

          {/* Nav arrows */}
          {canPrev && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-10 sm:w-10 bg-background/60 backdrop-blur-sm hover:bg-background/80"
              onClick={goPrev}
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}
          {canNext && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-10 sm:w-10 bg-background/60 backdrop-blur-sm hover:bg-background/80"
              onClick={goNext}
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
