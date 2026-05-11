"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X, MessageSquare, ArrowUp,
  User, Loader2, RotateCcw, Sparkles
} from "lucide-react";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { SiriOrb } from "./siri-orb";

// =========================================
// 1. TYPES & CONFIG
// =========================================

interface Message {
  role: "bot" | "user";
  content: string;
  timestamp?: number;
}

const SUGGESTED_QUESTIONS = [
  "How can I save more tax this year?",
  "What is the FIRE method for retirement?",
  "Explain Old vs New tax regime",
  "How to start SIP investment?",
  "What is a good Money Health Score?",
  "How much term insurance do I need?",
  "Best tax-saving investments under 80C",
  "How to calculate my HRA exemption?",
];

// =========================================
// 2. MARKDOWN-LIKE RENDERER
// =========================================

function renderContent(text: string) {
  let html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white/95">$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-white/10 text-[13px] font-mono text-white/80">$1</code>')
    .replace(/^[-•]\s+(.+)$/gm, '<div class="flex gap-2 items-start ml-1"><span class="text-white/30 mt-0.5">•</span><span>$1</span></div>')
    .replace(/\n/g, "<br/>");
  return html;
}

// =========================================
// 3. MAIN COMPONENT
// =========================================

export const GlobalChatbot: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = useCallback(async (text?: string) => {
    const query = (text || input).trim();
    if (!query || isLoading) return;

    const userMsg: Message = { role: "user", content: query, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    try {
      const systemPrompt = "You are Finshala AI — a warm, knowledgeable Indian financial advisor assistant. You help users with Tax planning, FIRE planning, Money Health Score analysis, Investment advice, Insurance guidance, and General personal finance questions. Be concise but helpful. Use Indian Rupee (₹) for amounts. Reference Indian tax laws and financial products. Be friendly and conversational. Keep responses under 200 words unless the user asks for detail.";
      
      const payloadMessages = [
        { role: "system", content: systemPrompt },
        ...newMessages.slice(-10).map(m => ({ 
          role: m.role === "bot" ? "assistant" : "user", 
          content: m.content 
        }))
      ];

      const res = await fetch(`/api/llm/proxy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "meta-llama/Llama-3.1-8B-Instruct:novita",
          messages: payloadMessages,
        }),
      });

      const data = await res.json();
      const reply = data.text || data.choices?.[0]?.message?.content?.trim() || data.error || data[0]?.generated_text || "Sorry, I couldn't process that. Please try again.";

      setMessages(prev => [...prev, {
        role: "bot",
        content: reply,
        timestamp: Date.now(),
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "bot",
        content: "I'm having trouble connecting to my AI engine right now. Please try again in a moment.",
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const showWelcome = messages.length === 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center p-3 md:p-6"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-2xl"
          />

          {/* Main Window — Black Liquid Glass */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="relative w-full max-w-[780px] h-[88vh] md:h-[700px] flex flex-col overflow-hidden"
            style={{
              background: "linear-gradient(180deg, rgba(15,15,15,0.92) 0%, rgba(8,8,8,0.96) 100%)",
              borderRadius: "24px",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: `
                0 0 0 1px rgba(255,255,255,0.03),
                0 25px 60px -12px rgba(0,0,0,0.8),
                0 0 120px -30px rgba(255,255,255,0.04),
                inset 0 1px 0 rgba(255,255,255,0.06),
                inset 0 -1px 0 rgba(255,255,255,0.02)
              `,
              backdropFilter: "blur(40px)",
            }}
          >
            {/* Glass Highlight */}
            <div
              className="absolute inset-0 pointer-events-none rounded-[24px]"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.02) 100%)",
              }}
            />

            {/* Subtle Warm Accent Line */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[1px] pointer-events-none"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.3), rgba(185,130,60,0.2), transparent)",
              }}
            />

            {/* ─── Header ─── */}
            <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                {/* SiriOrb as header icon */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden"
                >
                  <SiriOrb size="36px" animationDuration={12} />
                </div>
                <h3 className="text-[15px] font-semibold text-white/90 tracking-tight" style={{ fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif" }}>
                  Finshala AI
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleNewChat}
                  className="p-2 rounded-xl text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all duration-200"
                  title="New Chat"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all duration-200"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ─── Chat Area ─── */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto relative z-10" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
              {showWelcome ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.5 }}
                  className="flex flex-col items-center justify-center h-full px-6 py-10"
                >
                  {/* Heading */}
                  <h2
                    className="text-2xl md:text-3xl font-semibold text-white/90 mb-2 text-center"
                    style={{ fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif" }}
                  >
                    How can I help you today?
                  </h2>
                  <p className="text-sm text-white/35 mb-10 text-center max-w-md">
                    Your personal AI financial advisor — ask about taxes, investments, FIRE planning, insurance, and more.
                  </p>

                  {/* Suggestion Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 w-full max-w-lg">
                    {SUGGESTED_QUESTIONS.map((q, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.05 }}
                        onClick={() => handleSend(q)}
                        className="group relative text-left px-4 py-3.5 rounded-2xl text-[13px] text-white/50 hover:text-white/80 transition-all duration-300 overflow-hidden"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                          (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                          (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
                        }}
                      >
                        <span className="relative z-10 leading-snug">{q}</span>
                        <MessageSquare size={14} className="absolute top-3 right-3 text-white/15 group-hover:text-white/30 transition-all" />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="px-4 md:px-0 py-6 space-y-0">
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`py-5 px-4 md:px-16 ${m.role === "bot" ? "bg-white/[0.02]" : ""}`}
                    >
                      <div className="flex gap-4 max-w-[680px] mx-auto">
                        <div className="flex-shrink-0 mt-0.5">
                          {m.role === "bot" ? (
                            /* SiriOrb for bot avatar */
                            <div
                              className="w-7 h-7 rounded-lg overflow-hidden"
                            >
                              <SiriOrb size="28px" animationDuration={10} />
                            </div>
                          ) : (
                            <div
                              className="w-7 h-7 rounded-lg overflow-hidden"
                            >
                              <SiriOrb 
                                size="28px" 
                                animationDuration={10} 
                                colors={{
                                  bg: "transparent",
                                  c1: "oklch(65% 0.15 250)",
                                  c2: "oklch(55% 0.12 280)",
                                  c3: "oklch(75% 0.10 220)",
                                }} 
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-white/40 mb-1.5 uppercase tracking-wider">
                            {m.role === "bot" ? "Finshala AI" : "You"}
                          </p>
                          <div
                            className="text-[14px] leading-[1.7] text-white/75 break-words"
                            style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                            dangerouslySetInnerHTML={{ __html: renderContent(m.content) }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-5 px-4 md:px-16 bg-white/[0.02]"
                    >
                      <div className="flex gap-4 max-w-[680px] mx-auto">
                        <div className="flex-shrink-0 mt-0.5">
                          <div
                            className="w-7 h-7 rounded-lg overflow-hidden"
                          >
                            <SiriOrb size="28px" animationDuration={8} />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-[11px] font-semibold text-white/40 mb-1.5 uppercase tracking-wider">Finshala AI</p>
                          <div className="flex items-center gap-2 text-white/40 text-sm">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Loader2 size={14} />
                            </motion.div>
                            <span className="text-[13px]">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* ─── Input Area ─── */}
            <div className="relative z-10 px-4 md:px-6 pb-5 pt-3">
              <div className="relative max-w-[680px] mx-auto">
                <div
                  className="relative flex items-end rounded-2xl overflow-hidden transition-all duration-300"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)",
                  }}
                  onFocus={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(255,255,255,0.05)";
                  }}
                  onBlur={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)";
                  }}
                >
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleTextareaInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything about finance..."
                    rows={1}
                    className="w-full bg-transparent pl-5 pr-14 py-4 text-[14px] focus:outline-none placeholder:text-white/20 text-white/85 resize-none"
                    style={{
                      fontFamily: "'Inter', system-ui, sans-serif",
                      maxHeight: "120px",
                      scrollbarWidth: "none",
                    }}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 bottom-2 p-2.5 rounded-xl transition-all duration-200 disabled:opacity-20"
                    style={{
                      background: input.trim() ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.08)",
                    }}
                  >
                    <ArrowUp size={16} className={input.trim() ? "text-black" : "text-white/40"} />
                  </button>
                </div>
              </div>

              <p className="text-center text-[10px] text-white/20 mt-3 tracking-wide">
                Finshala AI may make mistakes. Verify important financial decisions with a certified advisor.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
