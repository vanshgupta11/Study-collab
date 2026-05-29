import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen, Clock, BarChart2, Hash, ChevronRight, Loader2,
  LogOut, Users, Activity, LayoutDashboard
} from 'lucide-react';

const fmt = (secs) => {
  if (!secs) return '0m';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessRes, statsRes] = await Promise.all([
          api.get('/sessions/my'),
          api.get('/sessions/stats'),
        ]);
        if (sessRes.data.success)   setSessions(sessRes.data.data);
        if (statsRes.data.success)  setStats(statsRes.data.data);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-primary-400" />
          <span className="font-bold tracking-tight">StudyRoom</span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/rooms" className="nav-link flex items-center gap-1"><Users size={14} />Rooms</Link>
          <Link to="/dashboard" className="nav-link-active flex items-center gap-1"><LayoutDashboard size={14} />Dashboard</Link>
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-sm text-dark-400 hidden md:block">{user?.name}</span>
          <button onClick={logout} className="btn-secondary py-1.5 px-3 text-sm flex items-center gap-1.5">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-dark-400 text-sm mt-0.5">Your study statistics and session history</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-primary-400" />
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="stat-card">
                <div className="flex items-center gap-2 text-primary-400 mb-1">
                  <Clock size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-dark-400">Total Study Time</span>
                </div>
                <p className="text-3xl font-bold">{fmt(stats?.totalStudyTime)}</p>
                <p className="text-dark-500 text-xs">{stats?.totalStudyTime ?? 0} seconds</p>
              </div>

              <div className="stat-card">
                <div className="flex items-center gap-2 text-violet-400 mb-1">
                  <Activity size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-dark-400">Total Sessions</span>
                </div>
                <p className="text-3xl font-bold">{stats?.totalSessions ?? 0}</p>
                <p className="text-dark-500 text-xs">completed sessions</p>
              </div>

              <div className="stat-card">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <BarChart2 size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-dark-400">Rooms Studied</span>
                </div>
                <p className="text-3xl font-bold">{stats?.roomBreakdown?.length ?? 0}</p>
                <p className="text-dark-500 text-xs">unique rooms</p>
              </div>
            </div>

            {/* Per-room breakdown */}
            {stats?.roomBreakdown?.length > 0 && (
              <div className="glass-card p-5 mb-8">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <BarChart2 size={16} className="text-primary-400" /> Room Breakdown
                </h2>
                <div className="space-y-3">
                  {stats.roomBreakdown.map((rb) => {
                    const pct = stats.totalStudyTime > 0
                      ? Math.round((rb.studyTime / stats.totalStudyTime) * 100)
                      : 0;
                    return (
                      <div key={rb.roomId}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{rb.roomName}</span>
                          <span className="text-xs text-dark-400">{fmt(rb.studyTime)} · {rb.sessionCount} sessions</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary-600 to-violet-500 rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Session history */}
            <div>
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Clock size={16} className="text-primary-400" /> Session History
              </h2>
              {sessions.length === 0 ? (
                <div className="glass-card p-8 text-center">
                  <Clock size={32} className="mx-auto text-dark-600 mb-3" />
                  <p className="text-dark-400 text-sm">No sessions yet. Join a room and start studying!</p>
                  <Link to="/rooms" className="btn-primary inline-flex items-center gap-2 text-sm mt-4">
                    Browse Rooms <ChevronRight size={14} />
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <div key={s._id} className="glass-card-hover px-5 py-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {s.roomId?.name ?? 'Deleted Room'}
                          </span>
                          {s.roomId && (
                            <span className="badge text-xs bg-white/5 text-dark-400 border border-white/10 flex items-center gap-1">
                              <Hash size={9} />{s.roomId?.inviteCode}
                            </span>
                          )}
                        </div>
                        <p className="text-dark-400 text-xs mt-0.5">
                          {s.startTime ? new Date(s.startTime).toLocaleString() : '—'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-sm">{fmt(s.duration)}</p>
                        {s.endTime ? (
                          <span className="badge-green text-xs">Completed</span>
                        ) : (
                          <span className="badge-primary text-xs">Active</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
