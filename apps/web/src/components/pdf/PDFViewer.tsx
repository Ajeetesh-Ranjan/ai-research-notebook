import { useState, useEffect } from 'react';
import { useDocumentStore } from '@/stores';
import { documentApi } from '@/lib/apiClient';
import { PDFPage } from './PDFPage';
import { ThumbnailStrip } from './ThumbnailStrip';
import { AnnotationToolbar } from '@/components/annotation/AnnotationToolbar';
import { FileText, Loader2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

export function PDFViewer() {
  const activeDocId = useDocumentStore((s) => s.activeDocumentId);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [scale, setScale] = useState(1.2);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!activeDocId) {
      setFileUrl(null);
      setPageCount(0);
      return;
    }
    setLoading(true);
    documentApi
      .get(activeDocId)
      .then((res) => {
        setPageCount(res.pageCount || 1);
        setFileUrl(res.fileUrl || null);
      })
      .catch(() => toast.error('Failed to load document'))
      .finally(() => setLoading(false));
  }, [activeDocId]);

  if (!activeDocId) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-sm text-fg-muted">
        <FileText className="mb-2 h-8 w-8 text-fg-muted" />
        <p>Select a document to start reading</p>
        <p className="text-xs">Upload PDFs from the Sources tab</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-fg-muted">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading PDF...
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <ThumbnailStrip
        pageCount={pageCount}
        currentPage={currentPage}
        onPageSelect={setCurrentPage}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AnnotationToolbar
          scale={scale}
          onScaleChange={setScale}
          currentPage={currentPage}
          pageCount={pageCount}
          onPageChange={setCurrentPage}
        />
        <div className="flex-1 overflow-auto bg-bg-subtle p-4">
          {fileUrl ? (
            <PDFPage
              fileUrl={fileUrl}
              pageNumber={currentPage}
              scale={scale}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-fg-muted">
              <Upload className="mr-2 h-4 w-4" />
              Document file not available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
