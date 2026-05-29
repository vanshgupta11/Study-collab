import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  ArrowLeft, Users, Hash, Send, Loader2, Play, Square,
  BookOpen, MessageCircle
} from 'lucide-react';

const RoomDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [room, setRoom]         = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [text, setText]         = useState('');
  const [sending, setSending]   = useState(false);
  const [activities, setActivities] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // Fetch room details
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const { data } = await api.get(`/rooms/${id}`);
        if (data.success) {
          setRoom(data.data.room);
          setMessages(data.data.messages);
        } else {
          setError('Room not found');
        }
      } catch {
        setError('Failed to load room');
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [id]);

  // Socket events
  useEffect(() => {
    if (!socket || !id) return;

    socket.emit('join-room', id);

    socket.on('receive-message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('user-joined', (data) => {
      setActivities((prev) => [`${data.name} joined the room`, ...prev].slice(0, 10));
    });

    socket.on('user-left', (data) => {
      setActivities((prev) => [`${data.name} left the room`, ...prev].slice(0, 10));
    });

    socket.on('room-activity', (data) => {
      const msg = data.type === 'session_start'
        ? `${data.user.name} started a study session`
        : `${data.user.name} ended a session (${data.duration}s)`;
      setActivities((prev) => [msg, ...prev].slice(0, 10));
    });

    return () => {
      socket.emit('leave-room', id);
      socket.off('receive-message');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('room-activity');
    };
  }, [socket, id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !socket) return;
    setSending(true);
    socket.emit('send-message', { roomId: id, text: text.trim() });
    setText('');
    setSending(false);
  };

  const startSession = async () => {
    setSessionLoading(true);
    try {
      const { data } = await api.post('/sessions/start', { roomId: id });
      if (data.success) {
        setActiveSession(data.data);
        socket?.emit('session-started', { roomId: id });
      }
    } catch (err) {
      console.error(err.response?.data?.message);
    } finally {
      setSessionLoading(false);
    }
  };

  const endSession = async () => {
    if (!activeSession) return;
    setSessionLoading(true);
    try {
      const { data } = await api.post(`/sessions/end/${activeSession._id}`);
      if (data.success) {
        socket?.emit('session-ended', { roomId: id, duration: data.data.duration });
        setActiveSession(null);
      }
    } catch (err) {
      console.error(err.response?.data?.message);
    } finally {
      setSessionLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-primary-400" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-red-400">{error}</p>
      <Link to="/rooms" className="btn-secondary text-sm">Back to Rooms</Link>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <Link to="/rooms" className="text-dark-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-primary-400" />
          <div>
            <h1 className="font-semibold leading-tight">{room?.name}</h1>
            <p className="text-dark-400 text-xs flex items-center gap-2">
              <span className="flex items-center gap-1"><Users size={10} />{room?.members?.length} members</span>
              <span className="flex items-center gap-1"><Hash size={10} />{room?.inviteCode}</span>
            </p>
          </div>
        </div>
        <div className="ml-auto">
          {activeSession ? (
            <button id="end-session-btn" onClick={endSession} disabled={sessionLoading} className="btn-danger flex items-center gap-2 text-sm py-2 px-4">
              {sessionLoading ? <Loader2 size={14} className="animate-spin" /> : <Square size={14} />}
              End Session
            </button>
          ) : (
            <button id="start-session-btn" onClick={startSession} disabled={sessionLoading} className="btn-primary flex items-center gap-2 text-sm py-2 px-4">
              {sessionLoading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              Start Session
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="text-center py-20">
                <MessageCircle size={32} className="mx-auto text-dark-600 mb-3" />
                <p className="text-dark-400 text-sm">No messages yet. Say hello!</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                return (
                  <div key={msg._id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2.5 rounded-2xl text-sm ${
                      isMe
                        ? 'bg-primary-600 text-white rounded-br-sm'
                        : 'bg-white/8 text-dark-100 rounded-bl-sm'
                    }`}>
                      {!isMe && (
                        <p className="text-xs font-medium mb-0.5 text-primary-300">
                          {msg.sender?.name ?? 'Unknown'}
                        </p>
                      )}
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="border-t border-white/5 p-4 flex items-center gap-3">
            <input
              id="message-input"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message…"
              className="input-field flex-1"
            />
            <button id="send-message-btn" type="submit" disabled={!text.trim() || sending} className="btn-primary p-3">
              <Send size={16} />
            </button>
          </form>
        </div>

        {/* Sidebar — Members & Activity */}
        <aside className="w-64 border-l border-white/5 flex flex-col">
          {/* Members */}
          <div className="p-4 border-b border-white/5">
            <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-3">Members</h3>
            <div className="space-y-2">
              {room?.members?.map((m) => (
                <div key={m._id} className="flex items-center gap-2 text-sm">
                  <div className="w-7 h-7 rounded-full bg-primary-600/30 border border-primary-500/30 flex items-center justify-center text-primary-300 text-xs font-semibold">
                    {m.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-dark-200 truncate">{m.name}</span>
                  {m._id === room.owner?._id && <span className="badge-primary text-xs ml-auto">Owner</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Activity feed */}
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
            <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-3">Activity</h3>
            {activities.length === 0 ? (
              <p className="text-dark-500 text-xs">No recent activity</p>
            ) : (
              <div className="space-y-2">
                {activities.map((a, i) => (
                  <p key={i} className="text-xs text-dark-400 border-l-2 border-primary-600/40 pl-2">{a}</p>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default RoomDetail;
