import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAIStore, useDocumentStore } from '@/stores';
import { aiApi } from '@/lib/apiClient';
import { SuggestedPrompts } from './SuggestedPrompts';
import { StreamingText } from './StreamingText';
import { Send, Loader2, MessageSquare, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export function AIChatPanel() {
  const { id } = useParams<{ id: string }>();
  const projectId = id!;
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const streamingContent = useAIStore((s) => s.streamingContent);
  const conversations = useAIStore((s) => s.conversations[projectId] || []);
  const activeConversationId = useAIStore((s) => s.activeConversationId);
  const addConversation = useAIStore((s) => s.addConversation);
  const appendStreamingContent = useAIStore((s) => s.appendStreamingContent);
  const clearStreamingContent = useAIStore((s) => s.clearStreamingContent);
  const activeDocId = useDocumentStore((s) => s.activeDocumentId);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [conversations, streamingContent]);

  const handleSend = async () => {
    if (!input.trim() || !projectId) return;
    setLoading(true);
    clearStreamingContent();

    try {
      let conversationId = activeConversationId;
      if (!conversationId) {
        const conv = await aiApi.createConversation(projectId, input.trim());
        const newConv = { ...(conv as { id: string; title: string | null; updatedAt: string }), projectId, userId: '', model: 'gpt-4o', systemPrompt: null, contextDocuments: [], contextAnnotations: [], isPinned: false, createdAt: new Date().toISOString() };
        addConversation(projectId, newConv as import('@/types').AIConversation);
        conversationId = newConv.id;
      }

      await aiApi.sendMessage(conversationId, input.trim(), {
        documentIds: activeDocId ? [activeDocId] : undefined,
      });

      // Simulate streaming for mock
      const mockResponse = "Based on the document, I can see that the research focuses on several key areas. Here's a summary of the main findings...";
      const chunks = mockResponse.split(' ');
      for (let i = 0; i < chunks.length; i++) {
        await new Promise((r) => setTimeout(r, 50));
        appendStreamingContent(chunks[i] + ' ');
      }

      setInput('');
    } catch {
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
      clearStreamingContent();
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border-default px-3 py-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary-500" />
          <span className="text-sm font-medium text-fg-primary">AI Chat</span>
        </div>
        <button
          onClick={() => { /* create new conversation */ }}
          className="rounded-md p-1 text-fg-muted hover:bg-surface-raised hover:text-fg-primary"
          title="New conversation"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        {conversations.length === 0 && !streamingContent && (
          <div className="py-8 text-center">
            <p className="mb-4 text-sm text-fg-muted">Ask questions about your research</p>
            <SuggestedPrompts onSelect={setInput} />
          </div>
        )}

        {activeConversation && (
          <div className="mb-3 rounded-lg bg-surface-raised p-3 text-sm text-fg-muted">
            Conversation: {activeConversation.title || 'Untitled'}
          </div>
        )}

        {streamingContent && (
          <div className="mb-3">
            <div className="rounded-lg bg-surface-raised p-3">
              <StreamingText content={streamingContent} />
            </div>
          </div>
        )}

        {loading && !streamingContent && (
          <div className="flex items-center gap-2 py-2 text-xs text-fg-muted">
            <Loader2 className="h-3 w-3 animate-spin" />
            Thinking...
          </div>
        )}
      </div>

      <div className="border-t border-border-default p-2">
        <div className="flex items-end gap-2 rounded-lg border border-border-default bg-bg-input p-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask a question..."
            className="max-h-24 flex-1 resize-none bg-transparent text-sm text-fg-primary outline-none placeholder:text-fg-muted"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className={cn(
              'rounded-md p-1.5 transition-colors',
              input.trim() && !loading
                ? 'bg-primary-500 text-white hover:bg-primary-600'
                : 'text-fg-muted'
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
