'use client';

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import axios from 'axios';
import api from '@/lib/api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatContextType {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  toggle: () => void;
  close: () => void;
  open: () => void;
  sendMessage: (text: string) => Promise<void>;
}

const AIChatContext = createContext<AIChatContextType | null>(null);

export function AIChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'How can I help?' },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const close = useCallback(() => setIsOpen(false), []);
  const open = useCallback(() => setIsOpen(true), []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await api.post('/api/ai/chat', { message: text.trim() });
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: res.data.response || "I'm not sure how to respond to that.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const errorText = axios.isAxiosError<{ error?: string }>(err)
        ? err.response?.data?.error || err.message
        : 'Something went wrong. Please try again.';
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Error: ${errorText}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({ isOpen, messages, isLoading, toggle, close, open, sendMessage }),
    [isOpen, messages, isLoading, toggle, close, open, sendMessage]
  );

  return <AIChatContext.Provider value={value}>{children}</AIChatContext.Provider>;
}

export function useAIChat() {
  const ctx = useContext(AIChatContext);
  if (!ctx) throw new Error('useAIChat must be used inside AIChatProvider');
  return ctx;
}
