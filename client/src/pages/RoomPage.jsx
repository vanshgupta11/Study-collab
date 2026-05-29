import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

import SessionTimer  from '../components/SessionTimer';
import ChatBox       from '../components/ChatBox';
import ActivityFeed  from '../components/ActivityFeed';

import {
  ArrowLeft, BookOpen, Hash, Users, Copy, Check,
  Loader2, Wifi, WifiOff
} from 'lucide-react';

const RoomPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket, connected } = useSocket();

  const [room, setRoom]         = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  // Online participants tracked via socket events
  const [onlineUsers, setOnlineUsers] = useState([]);
  // Copy-to-clipboard feedback
  const [copied, setCopied] = useState(false);

  // ─── Fetch room + messages ───────────────────────────────────────
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

  // ─── Socket: join/leave channel & track online users ─────────────
  useEffect(() => {
    if (!socket || !id) return;

    // Join the Socket.io room channel
    socket.emit('join-room', id);

    // Seed yourself into the online list
    if (user) {
      setOnlineUsers((prev) => {
        if (prev.find((u) => u._id === user._id)) return prev;
        return [...prev, { _id: user._id, name: user.name }];
      });
    }

    const onJoined = (data) => {
      setOnlineUsers((prev) => {
        if (prev.find((u) => u._id === data._id)) return prev;
        return [...prev, { _id: data._id, name: data.name }];
      });
    };

    const onLeft = (data) => {
      setOnlineUsers((prev) => prev.filter((u) => u._id !== data._id));
    };

    socket.on('user-joined', onJoined);
    socket.on('user-left',   onLeft);

    return () => {
      socket.emit('leave-room', id);
      socket.off('user-joined', onJoined);
      socket.off('user-left',   onLeft);
    };
  }, [socket, id, user]);

  // ─── Copy invite code ───────────────────────────────────────────
  const copyCode = useCallback(() => {
    if (!room?.inviteCode) return;
    navigator.clipboard.writeText(room.inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [room?.inviteCode]);

  // ─── Loading / Error states ──────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-400 text-sm">{error}</p>
        <Link to="/rooms" className="btn-secondary text-sm">Back to Rooms</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── Room Header ──────────────────────────────────────────── */}
      <header className="border-b border-white/5 px-6 py-3 flex items-center gap-4 animate-fade-in">
        {/* Back button */}
        <Link to="/rooms" className="p-2 rounded-lg hover:bg-white/5 text-dark-400 hover:text-white transition-all">
          <ArrowLeft size={18} />
        </Link>

        {/* Room info */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary-600/20 border border-primary-500/30">
            <BookOpen size={18} className="text-primary-400" />
          </div>
          <div>
            <h1 className="font-semibold text-base leading-tight">{room?.name}</h1>
            <div className="flex items-center gap-3 mt-0.5">
              {/* Invite code — click to copy */}
              <button
                id="copy-invite-code"
                onClick={copyCode}
                className="flex items-center gap-1 text-xs text-dark-400 hover:text-primary-300 transition-colors cursor-pointer"
                title="Click to copy invite code"
              >
                <Hash size={10} />
                <span className="font-mono">{room?.inviteCode}</span>
                {copied
                  ? <Check size={10} className="text-emerald-400" />
                  : <Copy size={10} />
                }
              </button>

              {/* Member count */}
              <span className="flex items-center gap-1 text-xs text-dark-400">
                <Users size={10} /> {room?.members?.length} members
              </span>

              {/* Connection indicator */}
              <span className={`flex items-center gap-1 text-xs ${connected ? 'text-emerald-400' : 'text-red-400'}`}>
                {connected ? <Wifi size={10} /> : <WifiOff size={10} />}
                {connected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Online participants pills */}
        <div className="ml-auto hidden md:flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-dark-500 mr-1">Online</span>
          {onlineUsers.slice(0, 5).map((u) => (
            <div
              key={u._id}
              title={u.name}
              className="w-7 h-7 rounded-full bg-primary-600/30 border border-primary-500/30 flex items-center justify-center text-primary-300 text-xs font-semibold relative"
            >
              {u.name?.[0]?.toUpperCase()}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-dark-900" />
            </div>
          ))}
          {onlineUsers.length > 5 && (
            <div className="w-7 h-7 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-dark-300 text-[10px] font-semibold">
              +{onlineUsers.length - 5}
            </div>
          )}
        </div>
      </header>

      {/* ─── Session Timer Bar ────────────────────────────────────── */}
      <div className="px-6 pt-4 pb-2 animate-fade-in">
        <SessionTimer roomId={id} />
      </div>

      {/* ─── Main Content: Chat + Activity Feed ───────────────────── */}
      <div className="flex-1 flex overflow-hidden animate-fade-in">
        {/* Chat takes the remaining space */}
        <ChatBox roomId={id} initialMessages={messages} />

        {/* Activity feed sidebar */}
        <ActivityFeed />
      </div>
    </div>
  );
};

export default RoomPage;
