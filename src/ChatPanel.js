import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Trash2, ChevronDown, Bot, User, Loader2, Copy, Check } from 'lucide-react';

// agent-backend 地址
const AGENT_BACKEND = 'http://192.168.34.65:20520';
const CONVERSATION_ID = 'dpfs-dashboard-chat';
const STORAGE_KEY = 'dpfs_chat_messages';

// --- 本地存储 ---
const loadLocalMessages = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveLocalMessages = (msgs) => {
  try {
    const toSave = msgs
      .filter((m) => m.content || m.role === 'user')
      .map(({ role, content, files, error }) => ({ role, content, files, error }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch { /* localStorage 满时静默 */ }
};

const clearLocalMessages = () => {
  localStorage.removeItem(STORAGE_KEY);
};

// 复制代码块内容
const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-600/50 transition-all opacity-0 group-hover:opacity-100"
      title="复制代码"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
};

// Markdown 渲染
const renderMarkdown = (text) => {
  if (!text) return null;
  // 代码块处理
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // 代码块前的文本
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'code', lang: match[1], content: match[2].trimEnd() });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  if (parts.length === 0) {
    parts.push({ type: 'text', content: text });
  }

  return parts.map((part, pi) => {
    if (part.type === 'code') {
      return (
        <div key={pi} className="relative group my-3 rounded-xl overflow-hidden bg-[#1e1e2e] border border-slate-700/50">
          {part.lang && (
            <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-slate-700/50">
              <span className="text-[11px] text-slate-400 font-mono">{part.lang}</span>
            </div>
          )}
          <CopyButton text={part.content} />
          <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
            <code className="text-emerald-300 font-mono">{part.content}</code>
          </pre>
        </div>
      );
    }

    // 普通文本，逐行处理
    const lines = part.content.split('\n');
    return (
      <span key={pi}>
        {lines.map((line, i) => {
          let rendered = line
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1.5 py-0.5 rounded-md text-xs font-mono text-emerald-700 border border-slate-200">$1</code>')
            .replace(/^### (.*)/, '<h4 class="font-bold text-sm mt-3 mb-1 text-slate-800">$1</h4>')
            .replace(/^## (.*)/, '<h3 class="font-bold text-base mt-4 mb-1 text-slate-800">$1</h3>')
            .replace(/^# (.*)/, '<h2 class="font-bold text-lg mt-4 mb-2 text-slate-800">$1</h2>')
            .replace(/^- (.*)/, '<span class="inline-block ml-2">• $1</span>')
            .replace(/^\d+\. (.*)/, '<span class="inline-block ml-2">$1</span>');
          return (
            <span key={i}>
              <span dangerouslySetInnerHTML={{ __html: rendered }} />
              {i < lines.length - 1 && <br />}
            </span>
          );
        })}
      </span>
    );
  });
};

export default function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [clientId, setClientId] = useState(() => localStorage.getItem('agent_chat_client_id') || '');
  const [unreadCount, setUnreadCount] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // 获取 client ID
  useEffect(() => {
    const initClientId = async () => {
      if (clientId) return;
      try {
        const res = await fetch(`${AGENT_BACKEND}/api/chat/client-id`, { method: 'POST' });
        const data = await res.json();
        if (data.code === 0 && data.client_id) {
          setClientId(data.client_id);
          localStorage.setItem('agent_chat_client_id', data.client_id);
        }
      } catch (e) {
        console.error('Failed to get client ID:', e);
      }
    };
    initClientId();
  }, [clientId]);

  // 打开面板时从本地加载
  useEffect(() => {
    if (isOpen) {
      setMessages(loadLocalMessages());
    }
  }, [isOpen]);

  // 消息变化时持久化
  useEffect(() => {
    if (messages.length > 0) saveLocalMessages(messages);
  }, [messages]);

  // 自动滚动
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  // 聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
    setAutoScroll(atBottom);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isStreaming || !clientId) return;

    setInput('');
    setAutoScroll(true);

    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg, { role: 'assistant', content: '', streaming: true }]);

    setIsStreaming(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(`${AGENT_BACKEND}/v1/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-I2H-Client-Id': clientId,
        },
        body: JSON.stringify({
          model: 'hermes-agent',
          input: text,
          conversation: CONVERSATION_ID,
          store: true,
          stream: true,
          ...(localStorage.getItem('dpfs_token') ? { user_token: parseInt(localStorage.getItem('dpfs_token')) } : {}),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          const lines = part.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === '[DONE]') continue;
            try {
              const event = JSON.parse(jsonStr);
              if (event.type === 'response.output_text.delta' && event.delta) {
                assistantText += event.delta;
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last && last.role === 'assistant') {
                    updated[updated.length - 1] = { ...last, content: assistantText };
                  }
                  return updated;
                });
              } else if (event.type === 'proxy.error') {
                assistantText += `\n\n[错误] ${event.body || '请求失败'}`;
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last && last.role === 'assistant') {
                    updated[updated.length - 1] = { ...last, content: assistantText };
                  }
                  return updated;
                });
              }
            } catch { /* 忽略 */ }
          }
        }
      }

      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === 'assistant') {
          updated[updated.length - 1] = { ...last, streaming: false };
        }
        return updated;
      });
    } catch (e) {
      if (e.name === 'AbortError') return;
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === 'assistant') {
          updated[updated.length - 1] = { ...last, content: `发送失败: ${e.message}`, streaming: false, error: true };
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  };

  const clearChat = () => {
    clearLocalMessages();
    setMessages([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const togglePanel = () => {
    setIsOpen((prev) => {
      if (!prev) setUnreadCount(0);
      return !prev;
    });
  };

  // 快捷提问
  const quickQuestions = [
    '如何查询商品溯源信息？',
    '系统支持哪些食品安全风险评估？',
    '帮我分析最近的风险报告',
  ];

  return (
    <>
      {/* 悬浮按钮 */}
      {!isOpen && (
        <button
          onClick={togglePanel}
          className="fixed bottom-6 right-6 z-[90] w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl shadow-2xl shadow-slate-900/40 hover:from-emerald-600 hover:to-emerald-700 transition-all transform hover:scale-105 flex items-center justify-center group"
          title="打开 AI 助手"
        >
          <MessageCircle size={22} className="group-hover:scale-110 transition-transform" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* 聊天面板 - DeepSeek 风格 */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 z-[90] w-[420px] h-screen flex flex-col bg-[#f9fafb] shadow-2xl shadow-slate-900/20 animate-in slide-in-from-right duration-300">

          {/* 顶部栏 */}
          <div className="shrink-0 px-5 py-3.5 bg-white border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-sm shadow-emerald-200">
                <Bot size={16} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">DPFS 智能助手</div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  Hermes Agent · 在线
                </div>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={clearChat}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                title="新对话"
              >
                <Trash2 size={15} />
              </button>
              <button
                onClick={togglePanel}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                title="关闭"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* 消息区域 */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto"
          >
            {messages.length === 0 ? (
              /* 空态 - DeepSeek 风格欢迎页 */
              <div className="flex flex-col items-center justify-center h-full px-8">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-emerald-200/50 rotate-3">
                  <Bot size={30} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">你好，我是 AI 助手</h3>
                <p className="text-sm text-slate-400 text-center leading-relaxed mb-8 max-w-[280px]">
                  基于 DPFS 食品溯源系统，可以帮你解答溯源查询、食品安全风险评估等问题。
                </p>
                <div className="space-y-2.5 w-full">
                  {quickQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(q)}
                      className="w-full text-left px-5 py-3.5 bg-white rounded-xl text-sm text-slate-600 border border-slate-100 hover:border-emerald-300 hover:shadow-sm hover:text-emerald-700 transition-all flex items-center gap-3 group"
                    >
                      <span className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all shrink-0">
                        <MessageCircle size={12} />
                      </span>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* 消息列表 */
              <div className="px-5 py-6 space-y-5">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {/* Assistant头像 */}
                    {msg.role !== 'user' && (
                      <div className="shrink-0 w-7 h-7 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mt-0.5 shadow-sm">
                        <Bot size={14} className="text-white" />
                      </div>
                    )}

                    {/* 消息气泡 */}
                    <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                      {/* 角色标签 */}
                      <div className={`text-[10px] text-slate-400 mb-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                        {msg.role === 'user' ? '你' : 'AI 助手'}
                      </div>
                      <div
                        className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-emerald-600 text-white rounded-tr-sm'
                            : msg.error
                            ? 'bg-red-50 text-red-700 border border-red-200 rounded-tl-sm'
                            : 'bg-white text-slate-700 border border-slate-100 shadow-sm rounded-tl-sm'
                        }`}
                      >
                        {msg.role === 'user' ? (
                          <span className="whitespace-pre-wrap">{msg.content}</span>
                        ) : (
                          <div className="prose prose-sm max-w-none break-words">
                            {msg.content ? renderMarkdown(msg.content) : (
                              <span className="inline-flex items-center gap-2 text-slate-400">
                                <Loader2 size={14} className="animate-spin" />
                                <span>正在思考...</span>
                              </span>
                            )}
                            {msg.streaming && msg.content && (
                              <span className="inline-block w-1.5 h-4 bg-emerald-500 ml-0.5 animate-pulse rounded-sm"></span>
                            )}
                          </div>
                        )}
                        {/* 文件附件 */}
                        {msg.files?.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {msg.files.map((f, fi) => (
                              <a
                                key={fi}
                                href={f.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg text-xs text-emerald-600 hover:bg-emerald-50 transition-all"
                              >
                                📎 {f.name}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 用户头像 */}
                    {msg.role === 'user' && (
                      <div className="shrink-0 w-7 h-7 bg-slate-700 rounded-lg flex items-center justify-center mt-0.5">
                        <User size={14} className="text-white" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* 回到底部 */}
          {!autoScroll && messages.length > 0 && (
            <div className="absolute bottom-[120px] left-1/2 -translate-x-1/2 z-10">
              <button
                onClick={() => {
                  setAutoScroll(true);
                  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-3 py-1.5 bg-white text-slate-600 text-xs rounded-full shadow-lg border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-1"
              >
                <ChevronDown size={14} /> 回到底部
              </button>
            </div>
          )}

          {/* 输入区域 - DeepSeek 风格 */}
          <div className="shrink-0 px-4 pb-4 pt-2 bg-white border-t border-slate-100">
            <div className="flex items-end gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="给 AI 助手发消息..."
                rows={1}
                className="flex-1 px-3 py-2.5 bg-transparent text-sm resize-none outline-none placeholder:text-slate-400 max-h-28"
                style={{ minHeight: '36px' }}
                disabled={!clientId}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 112) + 'px';
                }}
              />
              {isStreaming ? (
                <button
                  onClick={stopGeneration}
                  className="shrink-0 w-9 h-9 bg-red-500 text-white rounded-xl flex items-center justify-center hover:bg-red-600 transition-all"
                  title="停止生成"
                >
                  <span className="w-2.5 h-2.5 bg-white rounded-sm"></span>
                </button>
              ) : (
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || !clientId}
                  className="shrink-0 w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-emerald-600 transition-all disabled:opacity-30 disabled:hover:bg-slate-900"
                  title="发送"
                >
                  <Send size={15} />
                </button>
              )}
            </div>
            <div className="mt-2 text-[10px] text-slate-300 text-center">
              内容由 AI 生成，仅供参考 · Hermes Agent
            </div>
          </div>
        </div>
      )}
    </>
  );
}
