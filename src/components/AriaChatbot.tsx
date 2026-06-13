"use client";
import { useEffect, useState, useRef } from "react";
import { Sparkles, X, Send, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  time: string;
}

export default function AriaChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  
  const messageAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Tooltip display on first mount
  useEffect(() => {
    const hasSeen = localStorage.getItem("aria-chatbot-seen");
    if (!hasSeen) {
      setShowTooltip(true);
      const timer = setTimeout(() => {
        setShowTooltip(false);
        localStorage.setItem("aria-chatbot-seen", "true");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Hydrate chat history from localStorage
  useEffect(() => {
    const cached = localStorage.getItem("aria-chat-history");
    if (cached) {
      try {
        setMessages(JSON.parse(cached));
      } catch {
        localStorage.removeItem("aria-chat-history");
      }
    }
  }, []);

  // Save messages to localStorage (maintain last 20 messages)
  const saveMessages = (updated: Message[]) => {
    const slice = updated.slice(-20);
    setMessages(slice);
    localStorage.setItem("aria-chat-history", JSON.stringify(slice));
  };

  // Auto-scroll to bottom of message list
  useEffect(() => {
    if (messageAreaRef.current) {
      messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userTime = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: "user",
      text: textToSend.trim(),
      time: userTime
    };

    const newHistory = [...messages, userMessage];
    saveMessages(newHistory);
    setInputText("");
    setLoading(true);

    try {
      const pathname = typeof window !== "undefined" ? window.location.pathname : "";
      const res = await fetch("/api/aria/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newHistory.map(m => ({ role: m.role, text: m.text })),
          pathname
        })
      });

      if (!res.ok) throw new Error("Chat request failed");
      const data = await res.json();

      const modelTime = new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });

      const modelMessage: Message = {
        id: `${Date.now()}-model`,
        role: "model",
        text: data.response || "Sorry, I couldn't process that request.",
        time: modelTime
      };

      saveMessages([...newHistory, modelMessage]);
    } catch (error) {
      console.error(error);
      const errorTime = new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
      const errorMessage: Message = {
        id: `${Date.now()}-error`,
        role: "model",
        text: "I'm having trouble connecting to my knowledge base. Please check your connection and try again.",
        time: errorTime
      };
      saveMessages([...newHistory, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem("aria-chat-history");
  };

  // Custom Rupee parser and highlights loader
  const formatRupees = (text: string) => {
    const parts = text.split(/(₹[0-9,]+(?:\.[0-9]+)?(?:[a-zA-Z])?)/g);
    return parts.map((part, index) => {
      if (part.startsWith("₹")) {
        return (
          <span key={index} style={{ color: "#0d9488", fontWeight: 700 }}>
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Render markdown bold and bullets
  const formatMessageText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, lineIdx) => {
      let trimmed = line.trim();
      const isBullet = trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*");
      
      if (isBullet) {
        trimmed = "• " + trimmed.replace(/^[•\-*]\s*/, "");
      }

      const boldParts = trimmed.split(/(\*\*[^*]+\*\*)/g);
      const elements = boldParts.map((part, partIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          const raw = part.slice(2, -2);
          return <strong key={partIdx} style={{ fontWeight: 700, color: "#fff" }}>{formatRupees(raw)}</strong>;
        }
        return <span key={partIdx}>{formatRupees(part)}</span>;
      });

      return (
        <div
          key={lineIdx}
          style={{
            marginTop: lineIdx > 0 ? 5 : 0,
            paddingLeft: isBullet ? 12 : 0,
            textIndent: isBullet ? -12 : 0,
            lineHeight: 1.5,
          }}
        >
          {elements}
        </div>
      );
    });
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999 }}>
        {/* First-load Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              style={{
                position: "absolute",
                right: 70,
                top: 14,
                background: "rgba(15, 15, 26, 0.95)",
                border: "1px solid rgba(124, 58, 237, 0.3)",
                color: "#c4b5fd",
                fontSize: 12,
                fontWeight: 700,
                padding: "8px 14px",
                borderRadius: 10,
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.4)",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                display: "flex",
                alignItems: "center"
              }}
            >
              Ask ARIA anything →
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse ring background */}
        {!isOpen && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: "rgba(124, 58, 237, 0.2)",
              zIndex: -1,
              animation: "pulse-ring 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Core trigger button */}
        <motion.button
          whileHover={{ scale: 1.1, boxShadow: "0 0 25px rgba(13, 148, 136, 0.4)" }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #7c3aed, #0d9488)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 10px 30px rgba(124, 58, 237, 0.3)",
          }}
        >
          {isOpen ? <X size={22} /> : <Sparkles size={22} />}
        </motion.button>
      </div>

      {/* Floating Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              position: "fixed",
              bottom: 92,
              right: 24,
              width: "calc(100% - 48px)",
              maxWidth: 380,
              height: "calc(100vh - 140px)",
              maxHeight: 520,
              background: "#0d0d1f",
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.02\'/%3E%3C/svg%3E")',
              border: "1px solid rgba(124, 58, 237, 0.2)",
              borderRadius: 20,
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6), 0 0 40px rgba(124, 58, 237, 0.08)",
              overflow: "hidden",
              zIndex: 9998,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div
              style={{
                height: 56,
                background: "linear-gradient(90deg, #7c3aed, #0d9488)",
                padding: "0 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <Sparkles size={16} color="white" />
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>ARIA Assistant</div>
                  <div style={{ fontSize: 9.5, color: "rgba(255, 255, 255, 0.6)" }}>Powered by Gemini</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "rgba(255,255,255,0.6)",
                      fontSize: 10.5,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                    onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
                  >
                    Clear history
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "rgba(255, 255, 255, 0.8)",
                    cursor: "pointer",
                    padding: 4
                  }}
                >
                  <Minimize2 size={14} />
                </button>
              </div>
            </div>

            {/* Scrollable Message Box */}
            <div
              ref={messageAreaRef}
              style={{
                flex: 1,
                padding: 16,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 14,
                scrollbarWidth: "none"
              }}
            >
              {messages.length === 0 ? (
                /* Welcome Screen */
                <div style={{ margin: "auto 0", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 10px" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #0d9488)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, boxShadow: "0 8px 20px rgba(124,58,237,0.25)" }}>
                    <Sparkles size={20} color="white" />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>Hi, I&apos;m ARIA 👋</h3>
                  <p style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.42)", margin: "0 0 20px", lineHeight: 1.5 }}>
                    Ask me anything about your customers, campaigns, or strategy.
                  </p>

                  {/* Welcome Chips Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%" }}>
                    {[
                      { emoji: "📊", text: "How are my campaigns doing?", label: "Campaign state" },
                      { emoji: "👥", text: "Who are my VIP customers?", label: "VIP profile" },
                      { emoji: "⚠️", text: "Which customers are at risk?", label: "At-risk customers" },
                      { emoji: "💡", text: "What should I do next?", label: "Next best steps" }
                    ].map((chip) => (
                      <button
                        key={chip.text}
                        onClick={() => handleSend(chip.text)}
                        style={{
                          background: "rgba(255, 255, 255, 0.025)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: 12,
                          padding: 10,
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "all 0.15s",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          gap: 4
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                          e.currentTarget.style.borderColor = "rgba(124, 58, 237, 0.3)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.025)";
                          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{chip.emoji}</span>
                        <span style={{ fontSize: 10.5, fontWeight: 600, color: "rgba(255, 255, 255, 0.72)", lineHeight: 1.3 }}>{chip.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Message Bubbles */
                messages.map((m) => {
                  const isUser = m.role === "user";
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isUser ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          background: isUser ? "rgba(124, 58, 237, 0.82)" : "rgba(255, 255, 255, 0.045)",
                          border: isUser ? "none" : "1px solid rgba(255, 255, 255, 0.06)",
                          color: isUser ? "#fff" : "rgba(255, 255, 255, 0.88)",
                          borderRadius: 16,
                          borderTopRightRadius: isUser ? 2 : 16,
                          borderTopLeftRadius: isUser ? 16 : 2,
                          padding: "9px 14px",
                          fontSize: 12.5,
                          maxWidth: isUser ? "80%" : "85%",
                          wordBreak: "break-word",
                          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.15)"
                        }}
                      >
                        {formatMessageText(m.text)}
                      </div>
                      <span
                        style={{
                          fontSize: 8.5,
                          color: "rgba(255, 255, 255, 0.22)",
                          marginTop: 3,
                          marginRight: isUser ? 3 : 0,
                          marginLeft: isUser ? 0 : 3
                        }}
                      >
                        {m.time}
                      </span>
                    </div>
                  );
                })
              )}

              {/* Loader/Typing Dots */}
              {loading && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.045)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      borderRadius: 16,
                      borderTopLeftRadius: 2,
                      padding: "10px 18px",
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    {[0, 1, 2].map((dotIndex) => (
                      <span
                        key={dotIndex}
                        style={{
                          width: 5.5,
                          height: 5.5,
                          borderRadius: "50%",
                          background: "#a78bfa",
                          display: "inline-block",
                          animation: `dots-pulse 1.4s infinite ease-in-out both`,
                          animationDelay: `${dotIndex * 0.2}s`
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.025)",
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexShrink: 0,
              }}
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask ARIA anything..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(inputText);
                  }
                }}
                disabled={loading}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  fontSize: 12.5,
                  outline: "none",
                }}
              />
              <button
                disabled={!inputText.trim() || loading}
                onClick={() => handleSend(inputText)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: inputText.trim() && !loading ? "pointer" : "default",
                  color: inputText.trim() && !loading ? "#c4b5fd" : "rgba(255, 255, 255, 0.25)",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s",
                }}
              >
                <Send size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse-ring {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.5);
          }
          70% {
            transform: scale(1.15);
            box-shadow: 0 0 0 14px rgba(124, 58, 237, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(124, 58, 237, 0);
          }
        }
        @keyframes dots-pulse {
          0%, 100% { opacity: 0.2; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-3px); }
        }
      `}</style>
    </>
  );
}
