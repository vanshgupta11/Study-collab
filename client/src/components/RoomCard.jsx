import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Hash, Clock, ArrowRight } from 'lucide-react';

const RoomCard = ({ room, totalTime }) => {
  const formatTime = (secs) => {
    if (!secs) return '0m';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const memberCount = room.members?.length ?? 0;

  return (
    <div className="glass-card-hover p-5 flex flex-col justify-between gap-4 h-full relative overflow-hidden group">
      {/* Decorative gradient corner */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary-500/10 to-violet-500/0 rounded-full blur-xl -mr-8 -mt-8 group-hover:from-primary-500/20 group-hover:to-violet-500/10 transition-all duration-500" />
      
      <div className="flex flex-col gap-2 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg truncate group-hover:text-primary-300 transition-colors">
            {room.name}
          </h3>
          {room.isActive && (
            <span className="badge-green text-[10px] shrink-0 self-center">Active</span>
          )}
        </div>
        {room.description ? (
          <p className="text-dark-300 text-sm mt-0.5 line-clamp-2 min-h-[2.5rem]">
            {room.description}
          </p>
        ) : (
          <p className="text-dark-400 text-sm mt-0.5 italic min-h-[2.5rem]">
            No description provided.
          </p>
        )}
      </div>

      <div className="space-y-2 mt-auto">
        <div className="flex flex-wrap gap-y-2 items-center justify-between text-xs text-dark-300 border-t border-white/5 pt-3">
          <span className="flex items-center gap-1">
            <Users size={13} className="text-primary-400" />
            <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
          </span>
          <span className="flex items-center gap-1 font-mono text-[11px] bg-white/5 px-2 py-0.5 rounded border border-white/10">
            <Hash size={11} className="text-violet-400" />
            <span>{room.inviteCode}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-dark-300">
          <Clock size={13} className="text-emerald-400" />
          <span>Your study time: <strong className="text-white">{formatTime(totalTime)}</strong></span>
        </div>
      </div>

      <div className="mt-2">
        <Link
          to={`/rooms/${room._id}`}
          className="btn-primary w-full text-center py-2 text-sm flex items-center justify-center gap-1.5 group/btn"
        >
          Join Room
          <ArrowRight size={14} className="transform group-hover/btn:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default RoomCard;
