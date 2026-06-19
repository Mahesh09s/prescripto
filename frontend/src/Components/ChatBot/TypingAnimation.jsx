/**
 * @fileoverview Typing Animation
 * Three animated dots shown while the AI is generating a response.
 */

import React from "react";

const TypingAnimation = () => {
  return (
    <div className="flex items-start gap-2 px-4 py-1">
      {/* Bot avatar */}
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700
                      flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
             stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>

      {/* Typing bubble */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-none
                      px-4 py-3 flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
              style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
              style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
              style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
};

export default TypingAnimation;
