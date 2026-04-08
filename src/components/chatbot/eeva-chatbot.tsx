"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, User, RotateCcw, ChevronDown } from "lucide-react";
import { EevaAvatar, EevaMiniAvatar } from "./eeva-avatar";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hey there! I'm **Eeva** — your personal EventEase guide. I know everything about events, registration, certificates, and more. Ask me anything!",
};

const QUICK_PROMPTS = [
  { label: "Register for event", text: "How do I register for an event?" },
  { label: "Get certificate", text: "How do I get my certificate?" },
  { label: "Organizer tools", text: "What can organizers do?" },
  { label: "QR attendance", text: "How does QR attendance work?" },
];

export function EevaChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setHasNewMessage(false);
    }
  }, [isOpen]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const apiMessages = updatedMessages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.message,
        },
      ]);

      if (!isOpen) setHasNewMessage(true);
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Sorry, I'm having trouble right now. Please try again!";
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: errorMsg,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const resetChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setInput("");
  };

  const formatMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, '<code class="bg-purple-100 text-purple-800 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
      .replace(/^- (.*)/gm, '<span class="flex items-start gap-1.5"><span class="text-purple-400 mt-0.5">&#8226;</span><span>$1</span></span>')
      .replace(/^\d+\.\s(.*)/gm, '<span class="flex items-start gap-1.5"><span class="text-purple-500 font-semibold">$&</span></span>')
      .replace(/\n/g, "<br />");
  };

  return (
    <>
      {/* ===== Floating Eeva Button ===== */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Tooltip when closed */}
        {!isOpen && (
          <div className="absolute -top-12 right-0 whitespace-nowrap rounded-xl bg-white px-3 py-1.5 text-xs font-medium text-purple-700 shadow-lg border border-purple-100 eeva-tooltip">
            Need help? Ask Eeva!
            <div className="absolute -bottom-1 right-5 h-2 w-2 rotate-45 bg-white border-b border-r border-purple-100" />
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`group relative flex h-16 w-16 items-center justify-center rounded-full shadow-xl transition-all duration-300 hover:shadow-2xl ${
            isOpen
              ? "bg-gradient-to-br from-purple-100 to-purple-200 scale-90"
              : "bg-gradient-to-br from-violet-500 to-purple-700 eeva-float hover:scale-110"
          }`}
          aria-label={isOpen ? "Close Eeva" : "Chat with Eeva"}
        >
          {isOpen ? (
            <X className="h-6 w-6 text-purple-700" />
          ) : (
            <EevaAvatar expression="waving" size={48} />
          )}

          {/* Notification dot */}
          {hasNewMessage && !isOpen && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75" />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-pink-500" />
            </span>
          )}

          {/* Glow ring */}
          {!isOpen && (
            <span className="absolute inset-0 rounded-full border-2 border-purple-400/30 eeva-glow" />
          )}
        </button>
      </div>

      {/* ===== Chat Window ===== */}
      {isOpen && (
        <div className="fixed bottom-[6.5rem] right-6 z-50 flex h-[540px] w-[400px] flex-col overflow-hidden rounded-2xl border border-purple-200/60 bg-white shadow-2xl eeva-slide-up">
          {/* --- Header --- */}
          <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-4 py-3.5">
            {/* Decorative circles */}
            <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/5" />
            <div className="absolute -left-6 -bottom-8 h-24 w-24 rounded-full bg-white/5" />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <EevaAvatar expression="happy" size={42} />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-purple-600 bg-green-400" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-white text-sm tracking-wide">Eeva</h3>
                    <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-purple-100">
                      AI
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-200">
                    {isLoading ? (
                      <span className="flex items-center gap-1">
                        <span className="eeva-typing-status">typing</span>
                        <span className="eeva-typing-dots">
                          <span>.</span><span>.</span><span>.</span>
                        </span>
                      </span>
                    ) : (
                      "Your EventEase guide"
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={resetChat}
                  className="rounded-lg p-2 text-purple-200 hover:bg-white/10 hover:text-white transition-colors"
                  title="New conversation"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-2 text-purple-200 hover:bg-white/10 hover:text-white transition-colors"
                  title="Minimize"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* --- Messages --- */}
          <div
            ref={chatBodyRef}
            className="flex-1 overflow-y-auto bg-gradient-to-b from-purple-50/50 to-white px-4 py-4 space-y-4 scroll-smooth"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2.5 ${message.role === "user" ? "flex-row-reverse" : "flex-row"} eeva-msg-appear`}
              >
                {/* Avatar */}
                <div className="shrink-0 mt-0.5">
                  {message.role === "user" ? (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-gray-700 to-gray-900 shadow-sm">
                      <User className="h-3.5 w-3.5 text-white" />
                    </div>
                  ) : (
                    <EevaMiniAvatar />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                    message.role === "user"
                      ? "bg-gradient-to-br from-violet-600 to-purple-700 text-white rounded-tr-md"
                      : "bg-white text-gray-800 border border-purple-100/60 rounded-tl-md"
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: formatMessage(message.content),
                  }}
                />
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex gap-2.5 eeva-msg-appear">
                <div className="shrink-0 mt-0.5">
                  <EevaMiniAvatar className="eeva-bounce-subtle" />
                </div>
                <div className="rounded-2xl rounded-tl-md bg-white border border-purple-100/60 px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1">
                    <span className="eeva-dot h-2 w-2 rounded-full bg-purple-400" style={{ animationDelay: "0ms" }} />
                    <span className="eeva-dot h-2 w-2 rounded-full bg-purple-400" style={{ animationDelay: "150ms" }} />
                    <span className="eeva-dot h-2 w-2 rounded-full bg-purple-400" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* --- Quick Prompts (initial state only) --- */}
          {messages.length === 1 && (
            <div className="border-t border-purple-100 bg-purple-50/50 px-4 py-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-purple-400">
                Suggested
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.text}
                    onClick={() => sendMessage(prompt.text)}
                    className="rounded-xl border border-purple-200 bg-white px-3 py-2 text-left text-xs font-medium text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 hover:shadow-sm"
                  >
                    {prompt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* --- Input --- */}
          <div className="border-t border-purple-100 bg-white px-3 py-3">
            <div className="flex items-end gap-2 rounded-xl border border-purple-200 bg-purple-50/50 px-3 py-2 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Eeva anything..."
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-gray-800 outline-none placeholder:text-purple-300 max-h-20"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 text-white transition-all hover:shadow-md hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-purple-300">
              Powered by Eeva AI &middot; EventEase
            </p>
          </div>
        </div>
      )}
    </>
  );
}
