"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "@/context/SocketContext";
import { fetchMessages, Message } from "@/lib/api";

export function useChat(appointmentId: string) {
  const { socket } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [otherTyping, setOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetchMessages(appointmentId);
        setMessages(res.data);
      } catch (err) {
        console.error("Failed to load chat history:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, [appointmentId]);

  // Socket room join/leave and event listeners
  useEffect(() => {
    if (!socket) return;

    socket.emit("join-room", { appointmentId });

    const handleNewMessage = (message: Message) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    };

    const handleUserTyping = () => {
      setOtherTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 3000);
    };

    const handleStopTyping = () => {
      setOtherTyping(false);
    };

    socket.on("new-message", handleNewMessage);
    socket.on("user-typing", handleUserTyping);
    socket.on("user-stop-typing", handleStopTyping);

    return () => {
      socket.emit("leave-room", { appointmentId });
      socket.off("new-message", handleNewMessage);
      socket.off("user-typing", handleUserTyping);
      socket.off("user-stop-typing", handleStopTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [socket, appointmentId]);

  const sendMessage = useCallback(
    (text: string, senderName: string) => {
      if (!socket || !text.trim()) return;
      socket.emit("send-message", { appointmentId, text: text.trim(), senderName });
    },
    [socket, appointmentId]
  );

  const emitTyping = useCallback(() => {
    if (!socket) return;
    socket.emit("typing", { appointmentId });
  }, [socket, appointmentId]);

  const emitStopTyping = useCallback(() => {
    if (!socket) return;
    socket.emit("stop-typing", { appointmentId });
  }, [socket, appointmentId]);

  return { messages, isLoading, otherTyping, sendMessage, emitTyping, emitStopTyping };
}
