/**
 * @fileoverview Chat Window Component
 * The main chat UI: header, session sidebar, message list, and input box.
 * Features:
 *  - Glassmorphism design with medical blue theme
 *  - Collapsible history sidebar
 *  - Auto-scroll to latest message
 *  - Empty state with suggested prompts
 *  - Mobile responsive
 */

import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChatContext } from "../../Context/ChatContext";
import { AppContext } from "../../Context/AppContext";
import Message from "./Message";
import TypingAnimation from "./TypingAnimation";
import InputBox from "./InputBox";

/* ── Session History Sidebar ─────────────────────────────────────────────── */
const Sidebar = ({ sessions, currentSessionId, onSelect, onNew, onDelete }) => (
  <div className="w-56 bg-gray-50 border-r border-gray-100 flex flex-col h-full">
    <div className="p-3 border-b border-gray-100">
      <button
        onClick={onNew}
        className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700
                   text-white text-xs font-medium px-3 py-2 rounded-xl transition-colors duration-200"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New Chat
      </button>
    </div>

    <div className="flex-1 overflow-y-auto py-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">History</p>
      {sessions.length === 0 ? (
        <p className="text-xs text-gray-400 px-3 py-2">No previous chats</p>
      ) : (
        sessions.map((s) => (
          <div
            key={s._id}
            className={`group flex items-center justify-between mx-2 mb-0.5 px-2 py-2 rounded-lg
                        cursor-pointer text-xs transition-colors duration-150
                        ${s._id === currentSessionId
                          ? "bg-blue-100 text-blue-800 font-medium"
                          : "hover:bg-gray-100 text-gray-600"
                        }`}
            onClick={() => onSelect(s._id)}
          >
            <div className="flex-1 truncate flex items-center gap-1.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="truncate">{s.title || "Chat"}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(s._id); }}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500
                         transition-all duration-150 flex-shrink-0 ml-1 p-0.5 rounded"
              aria-label="Delete session"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))
      )}
    </div>
  </div>
);

/* ── Empty State ─────────────────────────────────────────────────────────── */
const EmptyState = ({ onSend }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700
                    flex items-center justify-center mb-4 shadow-lg">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white"
           strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <circle cx="9" cy="10" r="0.5" fill="white" /><circle cx="12" cy="10" r="0.5" fill="white" />
        <circle cx="15" cy="10" r="0.5" fill="white" />
      </svg>
    </div>
    <h3 className="font-bold text-gray-800 text-base mb-1">MediBot AI Assistant</h3>
    <p className="text-xs text-gray-500 mb-4 leading-relaxed">
      Describe your symptoms and I'll recommend the right specialist and available doctors.
    </p>
    <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
      {[
        { icon: "🩺", text: "I have chest pain" },
        { icon: "💊", text: "Explain my medication" },
        { icon: "📅", text: "How do I book an appointment?" },
        { icon: "🧴", text: "Skin rash treatment" },
      ].map(({ icon, text }) => (
        <button
          key={text}
          onClick={() => onSend(text)}
          className="flex items-center gap-2 text-left text-xs text-gray-700 bg-white
                     border border-gray-100 hover:border-blue-200 hover:bg-blue-50
                     px-3 py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow"
        >
          <span className="text-base">{icon}</span>
          <span>{text}</span>
        </button>
      ))}
    </div>
  </div>
);

/* ── Main Chat Window ────────────────────────────────────────────────────── */
const ChatWindow = () => {
  const {
    isOpen,
    closeChat,
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
  } = useContext(ChatContext);

  const { isAuthenticated, userProfile } = useContext(AppContext);
  const [showSidebar, setShowSidebar] = useState(false);

  // Load history when chat opens for the first time
  useEffect(() => {
    if (isOpen && isAuthenticated && !historyLoaded) {
      loadHistory();
    }
  }, [isOpen, isAuthenticated, historyLoaded, loadHistory]);

  if (!isOpen) return null;

  return (
    /* Outer container — fixed position, bottom-right */
    <div
      id="chatbot-window"
      className="fixed bottom-24 right-6 z-50
                 w-[95vw] sm:w-[440px]
                 h-[85vh] sm:h-[600px]
                 flex flex-col
                 bg-white rounded-2xl shadow-2xl border border-gray-100
                 overflow-hidden
                 animate-in slide-in-from-bottom-4 duration-300"
      style={{
        animation: "chatSlideIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-3 flex items-center gap-3">
        {/* Bot icon */}
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <circle cx="9" cy="10" r="0.5" fill="white" /><circle cx="12" cy="10" r="0.5" fill="white" />
            <circle cx="15" cy="10" r="0.5" fill="white" />
          </svg>
        </div>

        {/* Title */}
        <div className="flex-1">
          <h2 className="text-white font-bold text-sm leading-none mb-0.5">MediBot AI</h2>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-blue-100 text-xs">Online · Medical Assistant</span>
          </div>
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-1">
          {/* History toggle */}
          {isAuthenticated && (
            <button
              onClick={() => {
                setShowSidebar((v) => !v);
                if (!historyLoaded) loadHistory();
              }}
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5
                         transition-colors duration-150"
              aria-label="Chat history"
              title="Chat history"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.71" />
              </svg>
            </button>
          )}

          {/* New chat */}
          <button
            onClick={startNewSession}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5
                       transition-colors duration-150"
            aria-label="New chat"
            title="New chat"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          {/* Close */}
          <button
            onClick={closeChat}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5
                       transition-colors duration-150"
            aria-label="Close chat"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Body: Sidebar + Messages ────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (conditionally shown) */}
        {showSidebar && isAuthenticated && (
          <Sidebar
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelect={(id) => { loadSession(id); setShowSidebar(false); }}
            onNew={() => { startNewSession(); setShowSidebar(false); }}
            onDelete={deleteSession}
          />
        )}

        {/* Messages area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
          {/* Auth gate */}
          {!isAuthenticated ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-blue-50 border-2 border-blue-100
                              flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                     stroke="#3b82f6" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" /><path d="M6 20v-2a6 6 0 0 1 12 0v2" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Sign in Required</h3>
              <p className="text-sm text-gray-500 mb-4">
                Please log in to use the AI medical assistant and save your chat history.
              </p>
              <Link
                to="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium
                           px-5 py-2 rounded-xl transition-colors duration-200"
              >
                Go to Login
              </Link>
            </div>
          ) : messages.length === 0 ? (
            <EmptyState onSend={sendMessage} />
          ) : (
            /* Message list */
            <div className="flex-1 overflow-y-auto py-4 scroll-smooth">
              {messages.map((msg, idx) => (
                <Message key={msg.timestamp ? `${msg.role}-${msg.timestamp}` : idx} message={msg} />
              ))}
              {isTyping && <TypingAnimation />}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input box — always at bottom when authenticated */}
          {isAuthenticated && (
            <InputBox onSend={sendMessage} disabled={isTyping} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
