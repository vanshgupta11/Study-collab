import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import RoomCard from '../components/RoomCard';
import {
  BookOpen, Clock, Activity, Users, Plus, Hash, LogOut,
  LayoutDashboard, Calendar, X, Loader2, ChevronRight, AlertCircle
} from 'lucide-react';

const formatTotalTime = (secs) => {
  if (!secs) return '0h 0m';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return `${h}h ${m}m`;
};

const formatDuration = (secs) => {
  if (!secs) return '0s';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const CardSkeleton = () => (
  <div className="glass-card p-5 animate-pulse flex flex-col gap-3">
    <div className="h-4 bg-white/10 rounded w-1/3" />
    <div className="h-8 bg-white/10 rounded w-2/3" />
    <div className="h-3 bg-white/10 rounded w-1/2" />
  </div>
);

const RoomCardSkeleton = () => (
  <div className="glass-card p-5 animate-pulse flex flex-col justify-between gap-4 h-[220px]">
    <div className="flex flex-col gap-2">
      <div className="h-5 bg-white/10 rounded w-3/4" />
      <div className="h-4 bg-white/10 rounded w-5/6" />
    </div>
    <div className="space-y-2 mt-auto">
      <div className="h-4 bg-white/10 rounded w-full border-t border-white/5 pt-3" />
      <div className="h-3 bg-white/10 rounded w-1/2" />
    </div>
    <div className="h-9 bg-white/10 rounded-lg w-full mt-2" />
  </div>
);

const TableRowSkeleton = () => (
  <tr className="animate-pulse border-b border-white/5">
    <td className="py-4 pl-4 pr-3"><div className="h-4 bg-white/10 rounded w-2/3" /></td>
    <td className="py-4 px-3"><div className="h-4 bg-white/10 rounded w-1/2" /></td>
    <td className="py-4 px-3"><div className="h-4 bg-white/10 rounded w-1/3" /></td>
  </tr>
);

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Component states
  const [rooms, setRooms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [roomsRes, sessionsRes, statsRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/sessions/my'),
        api.get('/sessions/stats')
      ]);

      if (roomsRes.data.success) {
        setRooms(roomsRes.data.data);
      }
      if (sessionsRes.data.success) {
        // Only keep the last 10 sessions for the table representation
        setSessions(sessionsRes.data.data.slice(0, 10));
      }
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard metrics. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;

    setCreating(true);
    setCreateError('');
    try {
      const { data } = await api.post('/rooms', createForm);
      if (data.success) {
        setShowCreate(false);
        setCreateForm({ name: '', description: '' });
        // Refresh all dashboard metrics & rooms
        await fetchData();
      }
    } catch (err) {
      console.error('Error creating room:', err);
      setCreateError(err.response?.data?.message || 'Failed to create room. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setJoining(true);
    setJoinError('');
    try {
      const { data } = await api.post('/rooms/join', {
        inviteCode: joinCode.trim().toUpperCase()
      });
      if (data.success) {
        setShowJoin(false);
        setJoinCode('');
        // Navigate directly to the newly joined room
        navigate(`/rooms/${data.data._id}`);
      }
    } catch (err) {
      console.error('Error joining room:', err);
      setJoinError(err.response?.data?.message || 'Invalid invite code. Room not found.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-900 text-dark-100 selection:bg-primary-500/30 selection:text-white">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-dark-900/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-tr from-primary-600 to-violet-500 p-2 rounded-xl shadow-lg shadow-primary-500/10">
            <BookOpen size={20} className="text-white" />
          </div>
          <span className="font-bold tracking-tight text-lg bg-gradient-to-r from-white to-dark-200 bg-clip-text text-transparent">
            StudyRoom
          </span>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/rooms" className="nav-link flex items-center gap-1.5 transition-colors">
            <Users size={15} /> Rooms
          </Link>
          <Link to="/dashboard" className="nav-link-active flex items-center gap-1.5 border-b-2 border-primary-500 pb-1 px-1">
            <LayoutDashboard size={15} /> Dashboard
          </Link>
        </nav>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-semibold text-white">{user?.name}</span>
            <span className="text-[10px] text-dark-400 font-mono">{user?.email}</span>
          </div>
          <button
            onClick={logout}
            className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 hover:text-red-400 hover:border-red-500/20 transition-all"
          >
            <LogOut size={13} />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full animate-fade-in flex flex-col gap-8">
        
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-primary-950/20 to-violet-950/10 p-6 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-primary-500/5 to-violet-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="z-10">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Welcome back, {user?.name ?? 'Scholar'}! <span className="animate-pulse">👋</span>
            </h1>
            <p className="text-dark-300 text-sm mt-1 max-w-md">
              Step into your collaborative classroom, study with peers, and track your focus milestones.
            </p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0 z-10">
            <button
              id="dashboard-join-btn"
              onClick={() => setShowJoin(true)}
              className="btn-secondary flex items-center gap-2 text-sm shadow-md py-2.5"
            >
              <Hash size={16} className="text-violet-400" />
              <span>Join with code</span>
            </button>
            <button
              id="dashboard-create-btn"
              onClick={() => setShowCreate(true)}
              className="btn-primary flex items-center gap-2 text-sm shadow-lg shadow-primary-500/10 py-2.5"
            >
              <Plus size={16} />
              <span>Create room</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2 animate-shake">
            <AlertCircle size={18} className="shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={fetchData} className="text-xs underline hover:text-white font-medium ml-2">
              Retry
            </button>
          </div>
        )}

        {/* 1. Stats cards row */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} className="text-primary-400" />
            <h2 className="font-bold text-lg text-white">Study Insights</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {loading ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : (
              <>
                {/* Card 1: Total Study Time */}
                <div className="stat-card relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-primary-500/5 rounded-full blur-lg group-hover:bg-primary-500/10 transition-all duration-500" />
                  <div className="flex items-center gap-2 text-primary-400 mb-1">
                    <Clock size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider text-dark-300">Total Study Time</span>
                  </div>
                  <p className="text-3xl font-extrabold text-white tracking-tight mt-1">
                    {formatTotalTime(stats?.totalStudyTime)}
                  </p>
                  <p className="text-dark-400 text-[11px] font-medium mt-0.5">
                    {stats?.totalStudyTime ? `${(stats.totalStudyTime / 60).toFixed(1)} mins` : 'No study log yet'}
                  </p>
                </div>

                {/* Card 2: Total Sessions */}
                <div className="stat-card relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-violet-500/5 rounded-full blur-lg group-hover:bg-violet-500/10 transition-all duration-500" />
                  <div className="flex items-center gap-2 text-violet-400 mb-1">
                    <Activity size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider text-dark-300">Total Sessions</span>
                  </div>
                  <p className="text-3xl font-extrabold text-white tracking-tight mt-1">
                    {stats?.totalSessions ?? 0}
                  </p>
                  <p className="text-dark-400 text-[11px] font-medium mt-0.5">
                    Sessions successfully logged
                  </p>
                </div>

                {/* Card 3: Rooms Joined */}
                <div className="stat-card relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-lg group-hover:bg-emerald-500/10 transition-all duration-500" />
                  <div className="flex items-center gap-2 text-emerald-400 mb-1">
                    <Users size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider text-dark-300">Rooms Joined</span>
                  </div>
                  <p className="text-3xl font-extrabold text-white tracking-tight mt-1">
                    {rooms.length}
                  </p>
                  <p className="text-dark-400 text-[11px] font-medium mt-0.5">
                    Active workspace connections
                  </p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* 2. My Rooms Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-primary-400" />
              <h2 className="font-bold text-lg text-white">My Rooms</h2>
            </div>
            {!loading && rooms.length > 0 && (
              <span className="text-xs text-dark-400 bg-white/5 px-2 py-0.5 rounded font-medium border border-white/5">
                {rooms.length} Room{rooms.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <RoomCardSkeleton />
              <RoomCardSkeleton />
              <RoomCardSkeleton />
            </div>
          ) : rooms.length === 0 ? (
            <div className="glass-card p-10 text-center flex flex-col items-center justify-center border border-dashed border-white/10 hover:border-white/20 transition-all">
              <div className="bg-white/5 p-4 rounded-full mb-4">
                <Users size={32} className="text-dark-400" />
              </div>
              <h3 className="font-bold text-white mb-1">You haven't joined any rooms yet</h3>
              <p className="text-dark-300 text-sm max-w-sm">
                Get started by joining an existing classroom with an invite code or creating your own study circle.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowJoin(true)}
                  className="btn-secondary text-xs flex items-center gap-1.5"
                >
                  <Hash size={13} />
                  <span>Join with code</span>
                </button>
                <button
                  onClick={() => setShowCreate(true)}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  <Plus size={13} />
                  <span>Create room</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {rooms.map((room) => {
                // Find matching stats breakdown if it exists to get total time
                const breakdown = stats?.roomBreakdown?.find(
                  (rb) => rb.roomId === room._id
                );
                const totalTime = breakdown ? breakdown.studyTime : 0;
                
                return (
                  <RoomCard
                    key={room._id}
                    room={room}
                    totalTime={totalTime}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* 3. Recent Sessions Table */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-primary-400" />
            <h2 className="font-bold text-lg text-white">Recent Sessions</h2>
          </div>

          <div className="glass-card overflow-hidden border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/2 text-dark-300 text-xs font-semibold uppercase tracking-wider">
                    <th scope="col" className="py-3 px-4">Room</th>
                    <th scope="col" className="py-3 px-4">Date &amp; Time</th>
                    <th scope="col" className="py-3 px-4">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {loading ? (
                    <>
                      <TableRowSkeleton />
                      <TableRowSkeleton />
                      <TableRowSkeleton />
                    </>
                  ) : sessions.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-10 text-center text-dark-400">
                        <Calendar size={24} className="mx-auto text-dark-500 mb-2" />
                        <span className="text-sm font-medium">No study sessions logged yet.</span>
                      </td>
                    </tr>
                  ) : (
                    sessions.map((session) => (
                      <tr key={session._id} className="hover:bg-white/2 transition-colors">
                        <td className="py-4 px-4 font-semibold text-white">
                          {session.roomId ? (
                            <Link
                              to={`/rooms/${session.roomId._id}`}
                              className="hover:text-primary-400 transition-colors flex items-center gap-1.5"
                            >
                              <span>{session.roomId.name}</span>
                              <ChevronRight size={12} className="text-dark-500" />
                            </Link>
                          ) : (
                            <span className="text-dark-400 italic">Deleted Room</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-dark-300 font-medium">
                          {formatDate(session.startTime)}
                        </td>
                        <td className="py-4 px-4 text-white font-mono font-medium">
                          {formatDuration(session.duration)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>

      {/* 4. Create Room Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="glass-card w-full max-w-md p-6 border border-white/10 animate-slide-up">
            <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Plus size={18} className="text-primary-400" />
                  <span>Create Study Room</span>
                </h2>
                <p className="text-xs text-dark-400 mt-0.5">Start a new shared workspace with custom rules</p>
              </div>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setCreateError('');
                }}
                className="text-dark-300 hover:text-white transition-colors bg-white/5 p-1.5 rounded-lg border border-white/5"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateRoom} className="flex flex-col gap-4">
              {createError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded-xl flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{createError}</span>
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-dark-300 mb-1.5">
                  Room Name *
                </label>
                <input
                  id="create-room-name"
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. CS101 Study Lounge"
                  required
                  maxLength={50}
                  className="input-field text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-dark-300 mb-1.5">
                  Description
                </label>
                <textarea
                  id="create-room-description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="e.g. Let's work on problem sets and prepare for quizzes!"
                  rows={3}
                  maxLength={200}
                  className="input-field text-sm resize-none custom-scrollbar"
                />
              </div>
              
              <div className="flex gap-3 mt-2 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    setCreateError('');
                  }}
                  className="btn-secondary flex-1 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  id="create-room-submit"
                  type="submit"
                  disabled={creating || !createForm.name.trim()}
                  className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Room</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Room Modal */}
      {showJoin && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="glass-card w-full max-w-sm p-6 border border-white/10 animate-slide-up">
            <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Hash size={18} className="text-violet-400" />
                  <span>Join Room</span>
                </h2>
                <p className="text-xs text-dark-400 mt-0.5">Enter invite code to join a classroom</p>
              </div>
              <button
                onClick={() => {
                  setShowJoin(false);
                  setJoinError('');
                }}
                className="text-dark-300 hover:text-white transition-colors bg-white/5 p-1.5 rounded-lg border border-white/5"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleJoinRoom} className="flex flex-col gap-4">
              {joinError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded-xl flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{joinError}</span>
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-dark-300 mb-1.5 text-center">
                  Invite Code (6 characters)
                </label>
                <input
                  id="join-room-code"
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="e.g. AB12CD"
                  maxLength={6}
                  required
                  className="input-field text-center font-mono uppercase tracking-widest text-lg py-2.5"
                />
              </div>
              
              <div className="flex gap-3 mt-2 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowJoin(false);
                    setJoinError('');
                  }}
                  className="btn-secondary flex-1 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  id="join-room-submit"
                  type="submit"
                  disabled={joining || joinCode.trim().length !== 6}
                  className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-2"
                >
                  {joining ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Joining...</span>
                    </>
                  ) : (
                    <span>Join Room</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 px-6 text-center text-xs text-dark-400 mt-auto">
        <p>&copy; {new Date().getFullYear()} StudyRoom. Built for collaborative deep focus.</p>
      </footer>
    </div>
  );
};

export default DashboardPage;
