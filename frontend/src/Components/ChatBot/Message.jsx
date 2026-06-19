/**
 * @fileoverview Message Component
 * Renders a single chat message bubble.
 * - User messages: right-aligned, blue gradient
 * - AI messages: left-aligned, white card with markdown rendering
 * - Doctor suggestion cards rendered inline for AI messages
 */

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNavigate } from "react-router-dom";

/* ── Doctor Suggestion Card ──────────────────────────────────────────────── */
const DoctorCard = ({ doctor }) => {
  const navigate = useNavigate();

  return (
    <div
      className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl
                 p-3 mt-2 cursor-pointer hover:bg-blue-100 transition-colors duration-200
                 hover:shadow-sm group"
      onClick={() => navigate(`/appointment/${doctor._id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/appointment/${doctor._id}`)}
      aria-label={`Book appointment with ${doctor.name}`}
    >
      {/* Doctor image */}
      <img
        src={doctor.image && doctor.image !== "default.jpg" ? doctor.image : "/logo.svg"}
        alt={doctor.name}
        className="w-10 h-10 rounded-full object-cover bg-blue-100 flex-shrink-0"
        onError={(e) => { e.target.src = "/logo.svg"; }}
      />

      {/* Doctor info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">Dr. {doctor.name}</p>
        <p className="text-xs text-blue-600">{doctor.speciality}</p>
        <p className="text-xs text-gray-500">₹{doctor.fees} • {doctor.experience}</p>
      </div>

      {/* Book arrow */}
      <div className="text-blue-500 group-hover:translate-x-0.5 transition-transform">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
};

/* ── Markdown components (styled for chat) ───────────────────────────────── */
const mdComponents = {
  p:          ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
  strong:     ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
  em:         ({ children }) => <em className="italic text-gray-700">{children}</em>,
  ul:         ({ children }) => <ul className="list-disc list-inside mb-1.5 space-y-0.5">{children}</ul>,
  ol:         ({ children }) => <ol className="list-decimal list-inside mb-1.5 space-y-0.5">{children}</ol>,
  li:         ({ children }) => <li className="text-gray-700">{children}</li>,
  h1:         ({ children }) => <h1 className="text-base font-bold mb-1 text-gray-900">{children}</h1>,
  h2:         ({ children }) => <h2 className="text-sm font-bold mb-1 text-gray-800">{children}</h2>,
  h3:         ({ children }) => <h3 className="text-sm font-semibold mb-1 text-gray-800">{children}</h3>,
  // react-markdown v9: `inline` prop removed; detect inline code by parent element
  // A code element inside a <pre> is a block code; otherwise it's inline.
  code: ({ node, className, children, ...props }) => {
    const isBlock = node?.position?.start?.line !== node?.position?.end?.line
      || className?.startsWith("language-");
    return isBlock ? (
      <pre className="bg-gray-900 text-green-300 p-3 rounded-lg overflow-x-auto mt-2 mb-2 text-xs font-mono whitespace-pre-wrap">
        <code className={className}>{children}</code>
      </pre>
    ) : (
      <code className="bg-gray-100 text-blue-700 px-1 py-0.5 rounded text-xs font-mono" {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => <>{children}</>,  // pre is already rendered inside code component
  a:   ({ href, children }) => (
    <a href={href} className="text-blue-600 underline hover:text-blue-800"
       target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-blue-300 pl-3 italic text-gray-600 my-1.5">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-2">
      <table className="text-xs border-collapse border border-gray-200 w-full">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border border-gray-300 px-2 py-1 bg-gray-100 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border border-gray-300 px-2 py-1">{children}</td>,
};


/* ── Main Message Component ──────────────────────────────────────────────── */
const Message = ({ message }) => {
  const isUser = message.role === "user";
  const hasDoctors = !isUser && message.suggestedDoctors?.length > 0;

  // Format timestamp
  const time = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  if (isUser) {
    return (
      <div className="flex justify-end px-4 py-1">
        <div className="max-w-[75%]">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white
                          rounded-2xl rounded-tr-none px-4 py-2.5 shadow-sm">
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>
          {time && <p className="text-xs text-gray-400 text-right mt-1">{time}</p>}
        </div>
      </div>
    );
  }

  // AI / Assistant message
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

      <div className="max-w-[78%]">
        {/* Message bubble */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-none px-4 py-3">
          <div className="text-sm text-gray-700">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Detected specialty badge */}
          {message.detectedSpecialty && (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700
                               text-xs font-medium px-2.5 py-1 rounded-full border border-blue-100">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm1 14H11v-2h2v2zm0-4H11V7h2v5z"/>
                </svg>
                Recommended: {message.detectedSpecialty}
              </span>
            </div>
          )}
        </div>

        {/* Doctor suggestion cards */}
        {hasDoctors && (
          <div className="mt-1.5">
            <p className="text-xs text-gray-500 mb-1 ml-1">Available Doctors:</p>
            {message.suggestedDoctors.map((doc) => (
              <DoctorCard key={doc._id} doctor={doc} />
            ))}
          </div>
        )}

        {time && <p className="text-xs text-gray-400 mt-1 ml-1">{time}</p>}
      </div>
    </div>
  );
};

export default Message;
