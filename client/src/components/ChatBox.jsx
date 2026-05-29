import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Send, MessageCircle } from 'lucide-react';

/**
 * ChatBox — Scrollable message list + input.
 *
 * Props:
 *   roomId          – the current room's _id
 *   initialMessages – array of pre-fetched messages (last 50)
 */
const ChatBox = ({ roomId, initialMessages = [] }) => {
  const { user }   = useAuth();
  const { socket } = useSocket();

  const [messages, setMessages] = useState(initialMessages);
  const [text, setText]         = useState('');
  const endRef = useRef(null);

  // Sync if initialMessages arrive after first render
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Listen for incoming messages
  useEffect(() => {
    if (!socket) return;

    const handler = (msg) => setMessages((prev) => [...prev, msg]);
    socket.on('receive-message', handler);

    return () => socket.off('receive-message', handler);
  }, [socket]);

  // Auto-scroll on new message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket) return;
    socket.emit('send-message', { roomId, text: text.trim() });
    setText('');
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-4">
              <MessageCircle size={28} className="text-dark-500" />
            </div>
            <p className="text-dark-400 text-sm">No messages yet</p>
            <p className="text-dark-500 text-xs mt-0.5">Be the first to say hello!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const senderId = msg.sender?._id ?? msg.sender;
            const isMe = senderId === user?._id;
            return (
              <div key={msg._id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                {/* Avatar for others */}
                {!isMe && (
                  <div className="w-7 h-7 rounded-full bg-primary-600/30 border border-primary-500/30 flex items-center justify-center text-primary-300 text-xs font-semibold mr-2 mt-auto mb-0.5 shrink-0">
                    {(msg.sender?.name?.[0] ?? '?').toUpperCase()}
                  </div>
                )}
                <div
                  className={`max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'bg-primary-600 text-white rounded-br-sm'
                      : 'bg-white/[0.07] text-dark-100 rounded-bl-sm border border-white/5'
                  }`}
                >
                  {!isMe && (
                    <p className="text-[11px] font-semibold mb-0.5 text-primary-300">
                      {msg.sender?.name ?? 'Unknown'}
                    </p>
                  )}
                  <p>{msg.text}</p>
                  <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/50' : 'text-dark-500'}`}>
                    {msg.createdAt
                      ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : ''}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Input bar */}
      <form onSubmit={sendMessage} className="border-t border-white/5 px-4 py-3 flex items-center gap-3">
        <input
          id="chat-input"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="input-field flex-1"
          autoComplete="off"
        />
        <button
          id="chat-send-btn"
          type="submit"
          disabled={!text.trim()}
          className="btn-primary p-3 shrink-0"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
