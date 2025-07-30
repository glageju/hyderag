import { useState, useEffect } from 'react';
import { ChatMessage } from '@/types';

const CHAT_HISTORY_KEY = 'hyderag_chat_history';
const SESSION_KEY = 'hyderag_session_id';

export function useChatHistory() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>('');

  // Load chat history from localStorage on mount
  useEffect(() => {
    try {
      // Get or create session ID
      let currentSessionId = localStorage.getItem(SESSION_KEY);
      if (!currentSessionId) {
        currentSessionId = Math.random().toString(36).substr(2, 9);
        localStorage.setItem(SESSION_KEY, currentSessionId);
      }
      setSessionId(currentSessionId);

      // Load chat history for this session
      const savedHistory = localStorage.getItem(`${CHAT_HISTORY_KEY}_${currentSessionId}`);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsedHistory.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }, []);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      try {
        localStorage.setItem(`${CHAT_HISTORY_KEY}_${sessionId}`, JSON.stringify(messages));
      } catch (error) {
        console.error('Error saving chat history:', error);
      }
    }
  }, [messages, sessionId]);

  const addMessage = (message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  };

  const clearHistory = () => {
    try {
      if (sessionId) {
        localStorage.removeItem(`${CHAT_HISTORY_KEY}_${sessionId}`);
      }
      setMessages([]);
      
      // Generate new session ID
      const newSessionId = Math.random().toString(36).substr(2, 9);
      localStorage.setItem(SESSION_KEY, newSessionId);
      setSessionId(newSessionId);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };

  const startNewChat = () => {
    try {
      // Don't delete the current session - just start a new one
      setMessages([]);
      
      // Generate new session ID
      const newSessionId = Math.random().toString(36).substr(2, 9);
      localStorage.setItem(SESSION_KEY, newSessionId);
      setSessionId(newSessionId);
    } catch (error) {
      console.error('Error starting new chat:', error);
    }
  };

  const getAllSessions = (): string[] => {
    try {
      const sessions: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CHAT_HISTORY_KEY)) {
          const sessionId = key.replace(`${CHAT_HISTORY_KEY}_`, '');
          sessions.push(sessionId);
        }
      }
      return sessions;
    } catch (error) {
      console.error('Error getting sessions:', error);
      return [];
    }
  };

  const loadSession = (targetSessionId: string) => {
    try {
      const savedHistory = localStorage.getItem(`${CHAT_HISTORY_KEY}_${targetSessionId}`);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        const messagesWithDates = parsedHistory.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
        setSessionId(targetSessionId);
        localStorage.setItem(SESSION_KEY, targetSessionId);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  return {
    messages,
    sessionId,
    addMessage,
    clearHistory,
    startNewChat,
    getAllSessions,
    loadSession,
    setMessages
  };
} 