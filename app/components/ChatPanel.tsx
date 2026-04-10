"use client";

import { useEffect, useRef, useState, useCallback, FormEvent } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const SUGGESTED_PROMPTS = [
  "Summarize today's markets",
  "What's the biggest tech story today?",
  "What's the top cybersecurity threat right now?",
];

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "12px",
        animation: "fadeSlideUp 0.2s ease forwards",
      }}
    >
      <div
        style={{
          maxWidth: "88%",
          padding: "10px 13px",
          borderRadius: isUser ? "14px 14px 3px 14px" : "14px 14px 14px 3px",
          background: isUser ? "var(--accent)" : "var(--surface-hover)",
          color: isUser ? "#fff" : "var(--foreground)",
          fontSize: "14px",
          lineHeight: 1.55,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {msg.content}
        {msg.content === "" && (
          <span style={{ display: "inline-flex", gap: "3px", alignItems: "center" }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--muted)", animation: "dotPulse 1.2s infinite 0s" }} />
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--muted)", animation: "dotPulse 1.2s infinite 0.2s" }} />
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--muted)", animation: "dotPulse 1.2s infinite 0.4s" }} />
          </span>
        )}
      </div>
    </div>
  );
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [context, setContext] = useState<string>("");
  const [contextLoading, setContextLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load dashboard context on mount
  useEffect(() => {
    fetch("/api/context")
      .then((r) => r.json())
      .then((data) => {
        setContext(data.context ?? "");
      })
      .catch(() => {})
      .finally(() => setContextLoading(false));
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || streaming) return;

      const userMsg: Message = { role: "user", content: text.trim() };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setInput("");
      setStreaming(true);

      // Add empty assistant placeholder for streaming
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      abortRef.current = new AbortController();

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: nextMessages,
            context,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`Chat API error ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: updated[updated.length - 1].content + chunk,
            };
            return updated;
          });
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: "Sorry, something went wrong. Try again.",
          };
          return updated;
        });
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, context, streaming]
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    if (streaming) {
      abortRef.current?.abort();
      setStreaming(false);
    }
    setMessages([]);
  };

  const panelContent = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--surface)",
        borderLeft: "1px solid var(--border)",
      }}
    >
      <style>{`
        @keyframes dotPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>💬</span>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--muted)",
            }}
          >
            JARVIS Chat
          </span>
          {contextLoading && (
            <span style={{ fontSize: "11px", color: "var(--muted)", opacity: 0.6 }}>
              loading context…
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              title="Clear chat"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--muted)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                padding: "4px 6px",
                borderRadius: "4px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
            >
              <ClearIcon />
              Clear
            </button>
          )}
          {/* Mobile close button */}
          <button
            className="chat-mobile-close"
            onClick={() => setMobileOpen(false)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--muted)",
              fontSize: "18px",
              lineHeight: 1,
              padding: "2px 4px",
              display: "none",
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "12px",
            }}
          >
            <p
              style={{
                color: "var(--muted)",
                fontSize: "13px",
                textAlign: "center",
                marginBottom: "8px",
              }}
            >
              Ask anything about today's briefing
            </p>
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                disabled={contextLoading}
                style={{
                  padding: "10px 14px",
                  background: "var(--surface-hover)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--foreground)",
                  fontSize: "13px",
                  cursor: "pointer",
                  textAlign: "left",
                  lineHeight: 1.4,
                  transition: "border-color 0.15s",
                  opacity: contextLoading ? 0.5 : 1,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "var(--accent)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "var(--border)")
                }
              >
                {prompt}
              </button>
            ))}
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          gap: "8px",
          alignItems: "flex-end",
          flexShrink: 0,
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            // Auto-resize
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask JARVIS anything…"
          disabled={streaming}
          rows={1}
          style={{
            flex: 1,
            background: "var(--surface-hover)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "10px 12px",
            color: "var(--foreground)",
            fontSize: "14px",
            resize: "none",
            outline: "none",
            lineHeight: 1.4,
            fontFamily: "inherit",
            overflowY: "hidden",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
        <button
          type="submit"
          disabled={!input.trim() || streaming}
          style={{
            padding: "10px 12px",
            background: input.trim() && !streaming ? "var(--accent)" : "var(--surface-hover)",
            border: "none",
            borderRadius: "8px",
            color: input.trim() && !streaming ? "#fff" : "var(--muted)",
            cursor: input.trim() && !streaming ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "all 0.15s",
          }}
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );

  return (
    <>
      <style>{`
        /* Desktop sidebar */
        .chat-sidebar {
          width: 360px;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow: hidden;
        }
        /* Mobile: hide sidebar, show FAB */
        @media (max-width: 900px) {
          .chat-sidebar { display: none !important; }
          .chat-fab { display: flex !important; }
          .chat-mobile-close { display: block !important; }
          .chat-mobile-sheet {
            display: flex !important;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 70vh;
            z-index: 100;
            border-radius: 16px 16px 0 0;
            overflow: hidden;
          }
        }
      `}</style>

      {/* Desktop sidebar */}
      <aside className="chat-sidebar">{panelContent}</aside>

      {/* Mobile FAB */}
      <button
        className="chat-fab"
        onClick={() => setMobileOpen(true)}
        style={{
          display: "none",
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          background: "var(--accent)",
          border: "none",
          color: "#fff",
          fontSize: "22px",
          cursor: "pointer",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
          zIndex: 50,
        }}
      >
        💬
      </button>

      {/* Mobile bottom sheet */}
      {mobileOpen && (
        <div className="chat-mobile-sheet">
          {panelContent}
        </div>
      )}
    </>
  );
}
