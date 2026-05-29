import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Activity, UserPlus, UserMinus, Play, Square, Clock } from 'lucide-react';

const MAX_EVENTS = 30;

const iconMap = {
  'user-joined':   { icon: UserPlus,  color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  'user-left':     { icon: UserMinus, color: 'text-amber-400',   bg: 'bg-amber-500/15' },
  'session_start': { icon: Play,      color: 'text-primary-400', bg: 'bg-primary-500/15' },
  'session_end':   { icon: Square,    color: 'text-rose-400',    bg: 'bg-rose-500/15' },
};

/**
 * ActivityFeed — right sidebar showing live room events.
 *
 * Listens to:
 *   "user-joined"   → name
 *   "user-left"     → name
 *   "room-activity" → { type, user, duration?, timestamp }
 */
const ActivityFeed = () => {
  const { socket } = useSocket();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const push = (event) =>
      setEvents((prev) => [event, ...prev].slice(0, MAX_EVENTS));

    const onJoined = (data) => push({
      id: Date.now(),
      type: 'user-joined',
      text: `${data.name} joined the room`,
      time: new Date(),
    });

    const onLeft = (data) => push({
      id: Date.now(),
      type: 'user-left',
      text: `${data.name} left the room`,
      time: new Date(),
    });

    const onActivity = (data) => {
      const text = data.type === 'session_start'
        ? `${data.user?.name ?? 'Someone'} started studying`
        : `${data.user?.name ?? 'Someone'} finished studying${data.duration ? ` (${fmtDuration(data.duration)})` : ''}`;
      push({
        id: Date.now(),
        type: data.type,
        text,
        time: new Date(data.timestamp ?? Date.now()),
      });
    };

    socket.on('user-joined',   onJoined);
    socket.on('user-left',     onLeft);
    socket.on('room-activity', onActivity);

    return () => {
      socket.off('user-joined',   onJoined);
      socket.off('user-left',     onLeft);
      socket.off('room-activity', onActivity);
    };
  }, [socket]);

  return (
    <aside className="w-72 border-l border-white/5 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <Activity size={14} className="text-primary-400" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-dark-300">
          Live Activity
        </h3>
        {events.length > 0 && (
          <span className="ml-auto badge-primary text-[10px]">{events.length}</span>
        )}
      </div>

      {/* Event list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3 space-y-2">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Clock size={22} className="text-dark-600 mb-2" />
            <p className="text-dark-500 text-xs">No activity yet</p>
          </div>
        ) : (
          events.map((ev) => {
            const meta = iconMap[ev.type] ?? iconMap['user-joined'];
            const Icon = meta.icon;
            return (
              <div
                key={ev.id}
                className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/[0.03] transition-colors"
              >
                <div className={`p-1.5 rounded-md ${meta.bg} shrink-0 mt-0.5`}>
                  <Icon size={12} className={meta.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-dark-200 leading-snug">{ev.text}</p>
                  <p className="text-[10px] text-dark-500 mt-0.5">
                    {ev.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};

function fmtDuration(secs) {
  if (!secs || secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m >= 60
    ? `${Math.floor(m / 60)}h ${m % 60}m`
    : `${m}m ${s}s`;
}

export default ActivityFeed;
