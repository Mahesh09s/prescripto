/**
 * @fileoverview Input Box Component
 * Chat input with send button, character counter, and Enter key submission.
 * Supports multi-line input (Shift+Enter for newline).
 */

import React, { useState, useRef, useEffect } from "react";

const InputBox = ({ onSend, disabled }) => {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);
  const MAX_CHARS = 2000;

  // Auto-resize textarea based on content
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    }
  }, [value]);

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    // Enter sends; Shift+Enter adds newline
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const remaining = MAX_CHARS - value.length;
  const isNearLimit = remaining < 200;

  return (
    <div className="border-t border-gray-100 bg-white p-3">
      {/* Suggested prompts (shown when input is empty) */}
      {!value && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {[
            "I have a headache",
            "Skin rash treatment",
            "Book appointment",
            "Heart checkup",
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => !disabled && onSend(prompt)}
              disabled={disabled}
              className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100
                         px-2.5 py-1 rounded-full transition-colors duration-150 disabled:opacity-50
                         disabled:cursor-not-allowed"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className={`flex items-end gap-2 bg-gray-50 border rounded-2xl px-3 py-2 transition-all
                       ${disabled ? "opacity-60" : "border-gray-200 focus-within:border-blue-400 focus-within:shadow-sm"}`}>
        <textarea
          id="chatbot-input"
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, MAX_CHARS))}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Describe your symptoms or ask a question…"
          rows={1}
          className="flex-1 bg-transparent resize-none text-sm text-gray-800 placeholder-gray-400
                     focus:outline-none min-h-[24px] max-h-[120px] leading-relaxed py-0.5"
          aria-label="Message input"
        />

        {/* Character count (shown near limit) */}
        {isNearLimit && value.length > 0 && (
          <span className={`text-xs flex-shrink-0 ${remaining < 50 ? "text-red-400" : "text-gray-400"}`}>
            {remaining}
          </span>
        )}

        {/* Send button */}
        <button
          id="chatbot-send-btn"
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center
                     transition-all duration-200
                     disabled:opacity-40 disabled:cursor-not-allowed
                     bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800
                     text-white hover:shadow-md active:scale-95"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 mt-1.5">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
};

export default InputBox;
