"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api, { Appointment } from "@/lib/api";
import VideoCall from "@/components/meeting/VideoCall";
import ChatWindow from "@/components/meeting/ChatWindow";

export default function MeetingRoom() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const appointmentId = params.appointmentId as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chatOpen, setChatOpen] = useState(true);

  useEffect(() => {
    const loadAppointment = async () => {
      try {
        const res = await api.get<Appointment[]>("/appointments");
        const found = res.data.find((a: Appointment) => a._id === appointmentId);
        if (!found) {
          setError("Appointment not found");
          return;
        }
        // Verify access: patient can only see their own, doctor can see all
        if (user?.role === "patient" && found.userId !== user?.userId) {
          setError("You don't have access to this appointment");
          return;
        }
        if (found.paymentStatus !== "PAID") {
          setError("Payment is required to join this meeting");
          return;
        }
        setAppointment(found);
      } catch (err) {
        setError("Failed to load appointment details");
      } finally {
        setLoading(false);
      }
    };
    loadAppointment();
  }, [appointmentId, user?.role, user?.userId]);

  const handleLeave = () => {
    router.push(user?.role === "doctor" ? "/doctor" : "/patient");
  };

  // Extract room name from meetingLink (e.g., https://meet.jit.si/doctor-app-xxx → doctor-app-xxx)
  const roomName = appointment?.meetingLink?.split("/").pop() || appointmentId;

  if (loading) {
    return (
      <div className="meeting-room-loading">
        <div className="video-loading-spinner"></div>
        <p>Loading meeting room...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="meeting-room-error">
        <div className="meeting-error-icon">⚠️</div>
        <h2>{error}</h2>
        <button className="clay-btn" onClick={handleLeave}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="meeting-room">
      {/* Top Bar */}
      <div className="meeting-topbar">
        <button className="meeting-back-btn" onClick={handleLeave}>
          <ArrowLeft size={18} />
          <span>Back to Dashboard</span>
        </button>
        <div className="meeting-topbar-info">
          <span className="meeting-patient-name">
            {appointment?.name} — {appointment?.date} at {appointment?.time}
          </span>
        </div>
        <div className="meeting-topbar-actions">
          <button
            className={`meeting-chat-toggle ${chatOpen ? "active" : ""}`}
            onClick={() => setChatOpen(!chatOpen)}
            title={chatOpen ? "Hide Chat" : "Show Chat"}
          >
            <MessageSquare size={18} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="meeting-content">
        <div className={`meeting-video-panel ${chatOpen ? "" : "meeting-video-full"}`}>
          <VideoCall roomName={roomName} onLeave={handleLeave} />
        </div>

        {chatOpen && (
          <div className="meeting-chat-panel">
            <ChatWindow appointmentId={appointmentId} />
          </div>
        )}
      </div>
    </div>
  );
}
