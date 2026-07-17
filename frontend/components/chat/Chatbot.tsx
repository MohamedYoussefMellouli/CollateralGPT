"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot, User, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import { useTranslation } from "@/components/Providers";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

export function Chatbot() {
  const { t, language } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: t("chatGreeting"),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Update greeting message when language changes
  useEffect(() => {
    setMessages((prev) => [
      {
        ...prev[0],
        content: t("chatGreeting"),
      },
      ...prev.slice(1),
    ]);
  }, [language, t]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data } = await apiClient.post("/api/chat", {
        question: userMessage.content,
        language: language, // Envoyer la langue au backend
        history: messages.map(m => ({ role: m.role, content: m.content }))
      });

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer || t("connectionError"),
        sources: data.sources || [],
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: t("connectionError"),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: isOpen ? 0 : 1, opacity: isOpen ? 0 : 1 }}
        className="fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        aria-label={t("openChatbot")}
      >
        <MessageSquare className="w-6 h-6" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-6 right-6 z-50 w-[380px] h-[550px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                  <Bot className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">CollateralGPT</h3>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {t("online")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
                aria-label={t("closeChatbot")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
            >
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={cn(
                      "flex max-w-[85%]",
                      msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                  >
                    {/* Avatar */}
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mx-2 mt-1",
                        msg.role === "user"
                          ? "bg-slate-700"
                          : "bg-blue-600"
                      )}
                    >
                      {msg.role === "user" ? (
                        <User className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <Bot className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>

                    {/* Bubble */}
                    <div className="flex flex-col gap-1.5">
                      <div
                        className={cn(
                          "px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm",
                          msg.role === "user"
                            ? "bg-blue-600 text-white rounded-tr-none"
                            : "bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none"
                        )}
                      >
                        {msg.content}
                      </div>

                      {/* Sources */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 ml-1">
                          {msg.sources.map((source) => (
                            <button
                              key={source}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700 text-[10px] font-mono text-blue-400 hover:bg-slate-700 hover:border-blue-500/50 transition-colors"
                            >
                              <Hash className="w-2.5 h-2.5" />
                              {source}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing Indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex max-w-[85%] mr-auto"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mx-2 mt-1">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="px-4 py-3.5 rounded-2xl bg-slate-800 border border-slate-700 rounded-tl-none flex items-center gap-1.5">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                      className="w-1.5 h-1.5 bg-slate-500 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                      className="w-1.5 h-1.5 bg-slate-500 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                      className="w-1.5 h-1.5 bg-slate-500 rounded-full"
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input Area */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("askAboutDispute")}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2.5 rounded-xl bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
