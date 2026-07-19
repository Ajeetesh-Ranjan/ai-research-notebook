import { useState, useCallback } from 'react';
import { useDocumentStore } from '@/stores';
import { documentApi } from '@/lib/apiClient';
import toast from 'react-hot-toast';

export function usePDF() {
  const activeDocId = useDocumentStore((s) => s.activeDocumentId);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadDocument = useCallback(async (docId?: string) => {
    const id = docId || activeDocId;
    if (!id) return;
    setLoading(true);
    try {
      const res = await documentApi.get(id);
      setPageCount(res.pageCount || 1);
      setFileUrl(res.fileUrl || null);
      setCurrentPage(1);
    } catch {
      toast.error('Failed to load PDF');
    } finally {
      setLoading(false);
    }
  }, [activeDocId]);

  const nextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(pageCount, p + 1));
  }, [pageCount]);

  const prevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(1, p - 1));
  }, []);

  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(3, s + 0.1));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((s) => Math.max(0.5, s - 0.1));
  }, []);

  return {
    pageCount,
    currentPage,
    scale,
    fileUrl,
    loading,
    setCurrentPage,
    setScale,
    loadDocument,
    nextPage,
    prevPage,
    zoomIn,
    zoomOut,
  };
}
