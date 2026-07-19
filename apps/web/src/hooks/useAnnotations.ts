import { useState, useCallback, useEffect } from 'react';
import { useAnnotationStore, useDocumentStore } from '@/stores';
import { annotationApi } from '@/lib/apiClient';
import type { Annotation } from '@/types';
import toast from 'react-hot-toast';

export function useAnnotations() {
  const activeDocId = useDocumentStore((s) => s.activeDocumentId);
  const annotations = useAnnotationStore((s) => (activeDocId ? s.annotations[activeDocId] || [] : []));
  const setAnnotations = useAnnotationStore((s) => s.setAnnotations);
  const addAnnotation = useAnnotationStore((s) => s.addAnnotation);
  const updateAnnotation = useAnnotationStore((s) => s.updateAnnotation);
  const removeAnnotation = useAnnotationStore((s) => s.removeAnnotation);
  const [loading, setLoading] = useState(false);

  const fetchAnnotations = useCallback(async (docId?: string) => {
    const id = docId || activeDocId;
    if (!id) return;
    setLoading(true);
    try {
      const res = (await annotationApi.list(id)) as { annotations?: Annotation[] };
      setAnnotations(id, res.annotations || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [activeDocId, setAnnotations]);

  const createAnnotation = useCallback(async (data: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!activeDocId) return;
    try {
      const res = await annotationApi.create(activeDocId, data);
      const annotation = (res as { annotation?: Annotation })?.annotation || { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Annotation;
      addAnnotation(activeDocId, annotation);
      toast.success('Annotation saved');
      return annotation;
    } catch {
      toast.error('Failed to save annotation');
    }
  }, [activeDocId, addAnnotation]);

  const deleteAnnotation = useCallback(async (id: string) => {
    if (!activeDocId) return;
    try {
      await annotationApi.delete(id);
      removeAnnotation(activeDocId, id);
      toast.success('Annotation removed');
    } catch {
      toast.error('Failed to remove annotation');
    }
  }, [activeDocId, removeAnnotation]);

  useEffect(() => {
    if (activeDocId) fetchAnnotations(activeDocId);
  }, [activeDocId, fetchAnnotations]);

  return {
    annotations,
    loading,
    fetchAnnotations,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
  };
}
