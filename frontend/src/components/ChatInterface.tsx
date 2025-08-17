'use client';

import { useState } from 'react';

interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const newMessage: Message = {
      id: messages.length + 1,
      sender: 'user',
      text: input.trim(),
    };

    setMessages(prev => [...prev, newMessage]);
    const userInput = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Call the buyer-agent API
      const response = await fetch('/api/buyer-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: userInput }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      // Add AI response
      const aiMessage: Message = {
        id: messages.length + 2,
        sender: 'ai',
        text: data.result || 'No response received',
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('API call failed:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: messages.length + 2,
        sender: 'ai',
        text: `Error: Failed to process command. ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] rounded-xl shadow-lg overflow-hidden">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-white font-semibold">Agent Chat</h3>
        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white">
          CHAT
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`px-4 py-2 rounded-lg max-w-xs break-words ${
                msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input Box */}
      <div className="px-4 py-3 border-t border-gray-700 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your command..."
          className="flex-1 px-4 py-2 rounded-lg bg-[#2a2a2a] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className={`px-4 py-2 rounded-lg transition-colors font-mono font-bold ${
            isLoading || !input.trim()
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isLoading ? 'EXEC...' : 'EXEC'}
        </button>
      </div>
    </div>
  );
}
