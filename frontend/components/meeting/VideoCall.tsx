"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface VideoCallProps {
  roomName: string;
  onLeave?: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export default function VideoCall({ roomName, onLeave }: VideoCallProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load Jitsi external API script
    const script = document.createElement("script");
    script.src = "https://meet.jit.si/external_api.js";
    script.async = true;
    script.onload = () => initJitsi();
    document.head.appendChild(script);

    function initJitsi() {
      if (!containerRef.current || !window.JitsiMeetExternalAPI) return;

      const api = new window.JitsiMeetExternalAPI("meet.jit.si", {
        roomName: roomName,
        parentNode: containerRef.current,
        width: "100%",
        height: "100%",
        userInfo: {
          displayName: `${user?.name || "User"} (${user?.role || "guest"})`,
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          disableDeepLinking: true,
          prejoinPageEnabled: false,
          disableThirdPartyRequests: true,
          enableWelcomePage: false,
          toolbarButtons: [
            "microphone",
            "camera",
            "desktop",
            "fullscreen",
            "hangup",
            "chat",
            "raisehand",
            "tileview",
            "settings",
          ],
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_POWERED_BY: false,
          DEFAULT_BACKGROUND: "#1a1a2e",
          TOOLBAR_ALWAYS_VISIBLE: true,
        },
      });

      api.addEventListener("videoConferenceJoined", () => {
        setIsLoading(false);
        console.log("[Jitsi] Conference joined");
      });

      api.addEventListener("videoConferenceLeft", () => {
        console.log("[Jitsi] Conference left");
        onLeave?.();
      });

      api.addEventListener("readyToClose", () => {
        onLeave?.();
      });

      apiRef.current = api;
    }

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
      // Clean up script tag
      const existingScript = document.querySelector(
        'script[src="https://meet.jit.si/external_api.js"]'
      );
      if (existingScript) existingScript.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomName, user?.name, user?.role, onLeave]);

  return (
    <div className="video-call-container">
      {isLoading && (
        <div className="video-loading-overlay">
          <div className="video-loading-spinner"></div>
          <p className="video-loading-text">Connecting to video call...</p>
        </div>
      )}
      <div ref={containerRef} className="video-call-frame" />
    </div>
  );
}
