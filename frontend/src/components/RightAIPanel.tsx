"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Paperclip, Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function RightAIPanel() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "I've analyzed your latest blood report. Your LDL cholesterol is slightly elevated at 110 mg/dL. Would you like a personalized diet plan to help manage this?" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userMsg })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting to the server. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <aside className="w-[420px] bg-white border-l border-gray-200 h-screen flex flex-col fixed right-0 top-0 shadow-sm z-10">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
            <Bot size={18} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800 text-sm">Vitalis Assistant</h2>
            <p className="text-xs text-green-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span> Online
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50">
        <div className="flex flex-col gap-1 items-center justify-center h-32 text-center text-gray-500 text-sm">
          <Bot size={32} className="text-gray-300 mb-2" />
          <p>I'm your healthcare assistant.</p>
          <p>Ask me about your reports or diet plans.</p>
        </div>

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${
              msg.role === 'user' ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
            </div>
            <div className={`rounded-2xl p-3 text-sm shadow-sm whitespace-pre-wrap ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-blue-600 mt-1">
              <Bot size={16} />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none p-3 text-sm text-gray-700 shadow-sm flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-blue-600" />
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <div className="relative flex items-center bg-gray-100 rounded-xl border border-gray-200 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all p-1">
          <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-200">
            <Paperclip size={18} />
          </button>
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask about your health..." 
            className="flex-1 bg-transparent border-none focus:outline-none text-sm px-2 text-gray-700 placeholder-gray-400 disabled:opacity-50"
          />
          <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-200">
            <Mic size={18} />
          </button>
          <button 
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="p-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 transition-colors rounded-lg ml-1"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="text-[10px] text-gray-400 text-center mt-2">
          Vitalis AI can make mistakes. Always verify with your doctor.
        </div>
      </div>
    </aside>
  );
}
