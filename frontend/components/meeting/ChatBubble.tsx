"use client";

import { Message } from "@/lib/api";

interface ChatBubbleProps {
  message: Message;
  isOwn: boolean;
}

export default function ChatBubble({ message, isOwn }: ChatBubbleProps) {
  const timeStr = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`chat-bubble-wrapper ${isOwn ? "chat-bubble-own-wrapper" : "chat-bubble-other-wrapper"}`}>
      {!isOwn && (
        <span className="chat-bubble-sender">
          {message.senderName}
          <span className={`chat-role-badge chat-role-${message.senderRole}`}>
            {message.senderRole}
          </span>
        </span>
      )}
      <div className={`chat-bubble ${isOwn ? "chat-bubble-own" : "chat-bubble-other"}`}>
        <p className="chat-bubble-text">{message.text}</p>
        <span className="chat-bubble-time">{timeStr}</span>
      </div>
    </div>
  );
}
