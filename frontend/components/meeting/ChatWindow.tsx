"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/context/AuthContext";
import ChatBubble from "./ChatBubble";

interface ChatWindowProps {
  appointmentId: string;
}

export default function ChatWindow({ appointmentId }: ChatWindowProps) {
  const { user } = useAuth();
  const { messages, isLoading, otherTyping, sendMessage, emitTyping, emitStopTyping } = useChat(appointmentId);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input, user?.name || "Unknown");
    setInput("");
    emitStopTyping();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    emitTyping();
    // Auto stop typing after 2 seconds of no input
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => emitStopTyping(), 2000);
  };

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        <div className="chat-header-dot"></div>
        <h3 className="chat-header-title">Live Chat</h3>
      </div>

      <div className="chat-messages-container">
        {isLoading ? (
          <div className="chat-loading">
            <div className="chat-loading-dot"></div>
            <div className="chat-loading-dot"></div>
            <div className="chat-loading-dot"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <p className="chat-empty-text">No messages yet</p>
            <p className="chat-empty-sub">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatBubble key={msg._id} message={msg} isOwn={msg.senderId === user?.userId} />
          ))
        )}

        {otherTyping && (
          <div className="chat-typing-indicator">
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
            <span className="typing-label">typing</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <input
          type="text"
          className="chat-input"
          placeholder="Type a message..."
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />
        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!input.trim()}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
