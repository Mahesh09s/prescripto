/**
 * @fileoverview Floating Chat Button
 * Fixed bottom-right button that opens/closes the chatbot.
 * Features: pulse ring when closed, smooth rotate-to-close animation, tooltip on hover.
 */

import React, { useContext, useState } from "react";
import { ChatContext } from "../../Context/ChatContext";

const FloatingButton = () => {
  const { isOpen, toggleChat } = useContext(ChatContext);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Tooltip — shown on hover when chat is closed */}
      {!isOpen && showTooltip && (
        <div className="bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg
                        whitespace-nowrap mb-1 mr-1 pointer-events-none
                        animate-fade-in">
          Chat with MediBot AI
        </div>
      )}

      {/* Button wrapper */}
      <div className="relative">
        {/* Pulse ring — only shown when chat is closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-blue-400 opacity-25 animate-ping" />
        )}

        <button
          id="chatbot-floating-btn"
          onClick={toggleChat}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          aria-label={isOpen ? "Close AI assistant" : "Open AI assistant"}
          aria-expanded={isOpen}
          className={`
            relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center
            text-white transition-all duration-300 ease-in-out
            hover:scale-110 active:scale-95
            focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2
            ${isOpen
              ? "bg-gradient-to-br from-gray-600 to-gray-800"
              : "bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
            }
          `}
        >
          <div className={`transition-transform duration-300 ${isOpen ? "rotate-90" : "rotate-0"}`}>
            {isOpen ? (
              /* Close X icon */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              /* Chat bubble icon */
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <circle cx="9" cy="10" r="0.5" fill="currentColor" />
                <circle cx="12" cy="10" r="0.5" fill="currentColor" />
                <circle cx="15" cy="10" r="0.5" fill="currentColor" />
              </svg>
            )}
          </div>
        </button>
      </div>
    </div>
  );
};

export default FloatingButton;
