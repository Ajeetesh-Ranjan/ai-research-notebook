import { useState, useCallback, useEffect } from 'react';
import { useBoardStore } from '@/stores';
import { boardApi } from '@/lib/apiClient';
import type { Note } from '@/types';
import toast from 'react-hot-toast';

export function useBoard(projectId: string) {
  const cards = useBoardStore((s) => s.cards[projectId] || []);
  const selectedCardIds = useBoardStore((s) => s.selectedCardIds);
  const setCards = useBoardStore((s) => s.setCards);
  const addCard = useBoardStore((s) => s.addCard);
  const updateCard = useBoardStore((s) => s.updateCard);
  const removeCard = useBoardStore((s) => s.removeCard);
  const selectCard = useBoardStore((s) => s.selectCard);
  const deselectAll = useBoardStore((s) => s.deselectAll);
  const [loading, setLoading] = useState(false);

  const fetchBoard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await boardApi.get(projectId);
      const boardCards = (res as { cards?: Note[] })?.cards || [];
      setCards(projectId, boardCards);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [projectId, setCards]);

  const createCard = useCallback(async (data: Partial<Note>) => {
    const newCard: Note = {
      id: crypto.randomUUID(),
      projectId,
      userId: '',
      title: data.title || 'New Card',
      content: data.content || '',
      plainText: data.plainText || '',
      color: data.color || null,
      icon: data.icon || null,
      tags: data.tags || [],
      linkedDocumentIds: data.linkedDocumentIds || [],
      linkedAnnotationIds: data.linkedAnnotationIds || [],
      canvasPosition: data.canvasPosition || null,
      isPinned: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addCard(projectId, newCard);
    toast.success('Card added');
    return newCard;
  }, [projectId, addCard]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  return {
    cards,
    selectedCardIds,
    loading,
    fetchBoard,
    createCard,
    updateCard,
    removeCard,
    selectCard,
    deselectAll,
  };
}
