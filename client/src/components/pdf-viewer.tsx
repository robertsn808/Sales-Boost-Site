import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Minimize2 } from "lucide-react";

// Lazy-load pdfjs
let pdfjsLib: any = null;
const getPdfjs = async () => {
  if (!pdfjsLib) {
    pdfjsLib = await import("pdfjs-dist");
    // Use CDN worker for reliable loading across all bundlers
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }
  return pdfjsLib;
};

// ─── Full PDF Viewer (used in preview modal) ─────────────────────────
interface PdfViewerProps {
  url: string;
  className?: string;
}

export function PdfViewer({ url, className = "" }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const renderTaskRef = useRef<any>(null);

  // Load PDF document
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const pdfjs = await getPdfjs();
        const doc = await pdfjs.getDocument({ url, withCredentials: false }).promise;
        if (!cancelled) {
          setPdfDoc(doc);
          setTotalPages(doc.numPages);
          setCurrentPage(1);
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("PDF load error:", err);
          setError(err.message || "Failed to load PDF");
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [url]);

  // Render current page
  const renderPage = useCallback(async (pageNum: number, renderScale: number) => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      // Cancel previous render
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch {}
      }

      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: renderScale });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // HiDPI support
      const dpr = window.devicePixelRatio || 1;
      canvas.width = viewport.width * dpr;
      canvas.height = viewport.height * dpr;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      ctx.scale(dpr, dpr);

      const task = page.render({ canvasContext: ctx, viewport });
      renderTaskRef.current = task;
      await task.promise;
    } catch (err: any) {
      if (err?.name !== "RenderingCancelledException") {
        console.error("PDF render error:", err);
      }
    }
  }, [pdfDoc]);

  useEffect(() => {
    if (pdfDoc) renderPage(currentPage, scale);
  }, [pdfDoc, currentPage, scale, renderPage]);

  // Auto-fit width on load
  useEffect(() => {
    if (!pdfDoc || !containerRef.current) return;
    (async () => {
      const page = await pdfDoc.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      const containerWidth = containerRef.current!.clientWidth - 32;
      const fitScale = Math.min(containerWidth / viewport.width, 2.5);
      setScale(Math.max(0.5, fitScale));
    })();
  }, [pdfDoc]);

  const goTo = (page: number) => setCurrentPage(Math.max(1, Math.min(totalPages, page)));
  const zoom = (delta: number) => setScale(s => Math.max(0.5, Math.min(4, s + delta)));

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ minHeight: "300px" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading PDF…</p>
        </div>
      </div>
    );
  }

  if (error) {
    // Fall back to native browser PDF viewer (iframe) which supports multi-page
    return (
      <div className={`flex flex-col ${className}`}>
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30 rounded-t-lg shrink-0">
          <span className="text-xs text-muted-foreground">Using browser PDF viewer</span>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => window.open(url, "_blank", "noopener,noreferrer")}>
            Open in New Tab
          </Button>
        </div>
        <iframe src={`${url}#toolbar=1&navpanes=1`} title="PDF" className="flex-1 border-0 bg-white rounded-b" style={{ minHeight: "300px" }} />
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30 rounded-t-lg shrink-0">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={currentPage <= 1} onClick={() => goTo(currentPage - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-1.5 text-sm">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => goTo(parseInt(e.target.value) || 1)}
              className="w-12 h-7 text-center text-sm bg-background border border-border rounded px-1"
            />
            <span className="text-muted-foreground">of {totalPages}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={currentPage >= totalPages} onClick={() => goTo(currentPage + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => zoom(-0.25)} title="Zoom out">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => zoom(0.25)} title="Zoom in">
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {/* Canvas area */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-black/10 flex justify-center p-4" style={{ minHeight: "300px" }}>
        <canvas ref={canvasRef} className="shadow-lg rounded" />
      </div>
    </div>
  );
}

// ─── PDF Thumbnail (renders page 1 as a small image) ─────────────────
interface PdfThumbnailProps {
  url: string;
  className?: string;
  width?: number;
  height?: number;
}

const thumbnailCache = new Map<string, string>();

export function PdfThumbnail({ url, className = "", width = 200, height = 128 }: PdfThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [src, setSrc] = useState<string | null>(thumbnailCache.get(url) || null);

  useEffect(() => {
    if (src) { setReady(true); return; }
    let cancelled = false;

    (async () => {
      try {
        const pdfjs = await getPdfjs();
        const doc = await pdfjs.getDocument({ url, withCredentials: false }).promise;
        const page = await doc.getPage(1);

        // Calculate scale to fit the target dimensions
        const viewport = page.getViewport({ scale: 1 });
        const scaleX = width / viewport.width;
        const scaleY = height / viewport.height;
        const fitScale = Math.min(scaleX, scaleY) * (window.devicePixelRatio || 1);
        const scaledViewport = page.getViewport({ scale: fitScale });

        // Render to offscreen canvas
        const offscreen = document.createElement("canvas");
        offscreen.width = scaledViewport.width;
        offscreen.height = scaledViewport.height;
        const ctx = offscreen.getContext("2d");
        if (!ctx) return;

        await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;

        if (!cancelled) {
          const dataUrl = offscreen.toDataURL("image/jpeg", 0.8);
          thumbnailCache.set(url, dataUrl);
          setSrc(dataUrl);
          setReady(true);
        }
        doc.destroy();
      } catch (err) {
        // Mark as failed so fallback icon shows
        if (!cancelled) { setFailed(true); setReady(false); }
      }
    })();

    return () => { cancelled = true; };
  }, [url, width, height, src]);

  if (failed) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width, height }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400 opacity-50"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 12v4"/><path d="M14 12v4"/></svg>
      </div>
    );
  }

  if (!ready || !src) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width: "100%", height: "100%" }}>
        <div className="w-5 h-5 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="PDF preview"
      className={className}
      style={{ maxWidth: width, maxHeight: height, objectFit: "cover" }}
    />
  );
}
