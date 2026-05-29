import { useState } from 'react';
import useTimer from '../hooks/useTimer';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Play, Square, Loader2, Timer } from 'lucide-react';

/**
 * SessionTimer — Start / Stop a study session with a visible HH:MM:SS clock.
 *
 * Props:
 *   roomId – the current room's _id
 */
const SessionTimer = ({ roomId }) => {
  const { socket } = useSocket();
  const { seconds, running, display, start, stop, reset } = useTimer();
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading]     = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/sessions/start', { roomId });
      if (data.success) {
        setSessionId(data.data._id);
        start();
        socket?.emit('session-started', { roomId });
      }
    } catch (err) {
      console.error('Failed to start session:', err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const { data } = await api.post(`/sessions/end/${sessionId}`);
      if (data.success) {
        socket?.emit('session-ended', { roomId, duration: data.data.duration });
        setSessionId(null);
        stop();
        reset();
      }
    } catch (err) {
      console.error('Failed to end session:', err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-4 flex items-center gap-4">
      {/* Timer icon + display */}
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-lg ${running ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-white/5 border border-white/10'} transition-colors`}>
          <Timer size={18} className={running ? 'text-emerald-400' : 'text-dark-400'} />
        </div>
        <span className={`font-mono text-2xl font-bold tracking-wider ${running ? 'text-emerald-300' : 'text-dark-300'} transition-colors`}>
          {display}
        </span>
      </div>

      {/* Pulsing dot when active */}
      {running && (
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
      )}

      <div className="ml-auto">
        {running ? (
          <button
            id="stop-session-btn"
            onClick={handleStop}
            disabled={loading}
            className="btn-danger flex items-center gap-2 text-sm py-2 px-4"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Square size={14} />}
            End Session
          </button>
        ) : (
          <button
            id="start-session-btn"
            onClick={handleStart}
            disabled={loading}
            className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            Start Session
          </button>
        )}
      </div>
    </div>
  );
};

export default SessionTimer;
