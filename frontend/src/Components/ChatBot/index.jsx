/**
 * @fileoverview ChatBot barrel index
 * Exports the main ChatBot composite component (FloatingButton + ChatWindow).
 * Import: import ChatBot from './Components/ChatBot'
 */

import React from "react";
import FloatingButton from "./FloatingButton";
import ChatWindow from "./ChatWindow";

/**
 * ChatBot composite component.
 * Renders the floating button AND the chat window (window is conditionally shown based on context state).
 * Place this once in App.jsx outside of <Routes> so it persists across page navigation.
 */
const ChatBot = () => (
  <>
    <ChatWindow />
    <FloatingButton />
  </>
);

export default ChatBot;
