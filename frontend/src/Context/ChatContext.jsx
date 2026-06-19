/**
 * @fileoverview Chat Context
 * Global state management for the AI chatbot.
 * Provides: chat open/close, message sending, session history management.
 *
 * Fixes applied:
 *  - historyLoaded resets when auth state changes (logout → login works correctly)
 *  - Rate limit (429) error shown as toast
 *  - Error messages surface properly in chat UI
 */

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { AppContext } from "./AppContext";
import api from "../utils/api";
import { toast } from "react-toastify";

export const ChatContext = createContext();

const ChatProvider = ({ children }) => {
  // ── UI state ───────────────────────────────────────────────────────────────
  const [isOpen, setIsOpen] = useState(false);

  // ── Session state ──────────────────────────────────────────────────────────
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages]  = useState([]);
  const [sessions, setSessions]  = useState([]);
  const [isTyping, setIsTyping]  = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const { isAuthenticated } = useContext(AppContext);

  // Reset chat state whenever the user logs out or switches accounts
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentSessionId(null);
      setMessages([]);
      setSessions([]);
      setHistoryLoaded(false);
      setIsOpen(false);
    }
  }, [isAuthenticated]);

  // Ref for auto-scroll
  const messagesEndRef = useRef(null);
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // ── Open / Close ───────────────────────────────────────────────────────────
  const openChat   = useCallback(() => setIsOpen(true),  []);
  const closeChat  = useCallback(() => setIsOpen(false), []);
  const toggleChat = useCallback(() => setIsOpen((prev) => !prev), []);

  // ── Start a fresh session ──────────────────────────────────────────────────
  const startNewSession = useCallback(() => {
    setCurrentSessionId(null);
    setMessages([]);
  }, []);

  // ── Load chat session history list ─────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await api.get("/chat/history");
      if (data.success) {
        setSessions(data.sessions || []);
        setHistoryLoaded(true);
      }
    } catch (err) {
      // Silently fail — not critical, user can still chat
      console.warn("[ChatContext] loadHistory error:", err.message);
    }
  }, [isAuthenticated]);

  // ── Load a specific session's messages ────────────────────────────────────
  const loadSession = useCallback(async (sessionId) => {
    try {
      const { data } = await api.get(`/chat/${sessionId}`);
      if (data.success) {
        setCurrentSessionId(sessionId);
        setMessages(
          data.session.messages.map((m) => ({
            role: m.role,
            content: m.content,
            // suggestedDoctorIds is populated on the server when fetching session
            suggestedDoctors: Array.isArray(m.suggestedDoctorIds)
              ? m.suggestedDoctorIds.filter(Boolean)
              : [],
            timestamp: m.timestamp,
          }))
        );
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.warn("[ChatContext] loadSession error:", err.message);
      toast.error("Could not load that chat session.");
    }
  }, [scrollToBottom]);

  // ── Send a message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    if (!text?.trim() || isTyping) return;
    if (!isAuthenticated) {
      toast.info("Please log in to use the AI assistant.");
      return;
    }

    // Optimistically add user message to UI immediately
    const userMsg = {
      role: "user",
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    setTimeout(scrollToBottom, 50);

    try {
      const { data } = await api.post("/chat/message", {
        message: text.trim(),
        sessionId: currentSessionId,
      });

      if (data.success) {
        setCurrentSessionId(data.sessionId);

        const aiMsg = {
          role: "assistant",
          content: data.reply,
          suggestedDoctors: data.suggestedDoctors || [],
          detectedSpecialty: data.detectedSpecialty,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMsg]);

        // Refresh sidebar session list
        loadHistory();
      } else {
        throw new Error(data.message || "Failed to get AI response");
      }
    } catch (err) {
      let errorContent = "⚠️ I'm having trouble responding right now. Please try again in a moment.";

      if (err.response?.status === 429) {
        errorContent = "⏱️ You're sending messages too quickly. Please wait a moment before trying again.";
        toast.warn("Rate limit reached — please slow down.");
      } else if (err.response?.status === 401) {
        // Don't add error message — api.js interceptor will redirect to login
        return;
      } else if (err.response?.status === 503) {
        errorContent = "🔌 The AI service is temporarily unavailable. Please try again shortly.";
      }

      const errMsg = {
        role: "assistant",
        content: errorContent,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
      console.error("[ChatContext] sendMessage error:", err.response?.status, err.message);
    } finally {
      setIsTyping(false);
      setTimeout(scrollToBottom, 100);
    }
  }, [isTyping, isAuthenticated, currentSessionId, scrollToBottom, loadHistory]);

  // ── Delete a session ───────────────────────────────────────────────────────
  const deleteSession = useCallback(async (sessionId) => {
    try {
      await api.delete(`/chat/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
      if (sessionId === currentSessionId) startNewSession();
      toast.success("Chat deleted.");
    } catch (err) {
      console.error("[ChatContext] deleteSession error:", err.message);
      toast.error("Could not delete chat.");
    }
  }, [currentSessionId, startNewSession]);

  const value = {
    isOpen,
    openChat,
    closeChat,
    toggleChat,
    messages,
    sessions,
    currentSessionId,
    isTyping,
    historyLoaded,
    messagesEndRef,
    sendMessage,
    loadHistory,
    loadSession,
    startNewSession,
    deleteSession,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatProvider;
