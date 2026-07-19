import { useState, useCallback } from 'react';
import { useAIStore } from '@/stores';
import { aiApi } from '@/lib/apiClient';
import type { AIConversation } from '@/types';
import toast from 'react-hot-toast';

export function useAI(projectId: string) {
  const [loading, setLoading] = useState(false);
  const conversations = useAIStore((s) => s.conversations[projectId] || []);
  const activeConversationId = useAIStore((s) => s.activeConversationId);
  const addConversation = useAIStore((s) => s.addConversation);
  const setStreamingContent = useAIStore((s) => s.setStreamingContent);
  const appendStreamingContent = useAIStore((s) => s.appendStreamingContent);
  const clearStreamingContent = useAIStore((s) => s.clearStreamingContent);

  const sendMessage = useCallback(async (content: string, context?: { documentIds?: string[]; annotationIds?: string[] }) => {
    if (!content.trim() || !projectId) return;
    setLoading(true);
    clearStreamingContent();

    try {
      let conversationId = activeConversationId;
      if (!conversationId) {
        const conv = await aiApi.createConversation(projectId, content.trim());
        const newConv = { ...(conv as { id: string; title: string | null; updatedAt: string }), projectId, userId: '', model: 'gpt-4o', systemPrompt: null, contextDocuments: [], contextAnnotations: [], isPinned: false, createdAt: new Date().toISOString() } as AIConversation;
        addConversation(projectId, newConv);
        conversationId = newConv.id;
      }

      await aiApi.sendMessage(conversationId, content.trim(), context);

      // Simulate streaming for demo
      const mockResponse = "Based on your research, here are the key insights...";
      const chunks = mockResponse.split(' ');
      for (const chunk of chunks) {
        await new Promise((r) => setTimeout(r, 50));
        appendStreamingContent(chunk + ' ');
      }

      clearStreamingContent();
    } catch {
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  }, [projectId, activeConversationId, addConversation, setStreamingContent, appendStreamingContent, clearStreamingContent]);

  const summarize = useCallback(async (documentId: string, type: 'executive' | 'detailed' | 'bullet') => {
    try {
      const res = await aiApi.summarize(documentId, type);
      return (res as { summary?: string })?.summary || '';
    } catch {
      toast.error('Failed to summarize');
      return '';
    }
  }, []);

  return {
    conversations,
    loading,
    sendMessage,
    summarize,
  };
}
