import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen, Plus, Hash, Users, ChevronRight, Loader2,
  LogOut, LayoutDashboard, X
} from 'lucide-react';

const Rooms = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms]           = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [error, setError]           = useState('');

  // Create room modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [creating, setCreating]     = useState(false);

  // Join room modal
  const [showJoin, setShowJoin]   = useState(false);
  const [joinCode, setJoinCode]   = useState('');
  const [joining, setJoining]     = useState(false);
  const [joinError, setJoinError] = useState('');

  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const { data } = await api.get('/rooms');
      if (data.success) setRooms(data.data);
    } catch {
      setError('Failed to load rooms');
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => { fetchRooms(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { data } = await api.post('/rooms', createForm);
      if (data.success) {
        setShowCreate(false);
        setCreateForm({ name: '', description: '' });
        fetchRooms();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setJoining(true);
    setJoinError('');
    try {
      const { data } = await api.post('/rooms/join', { inviteCode: joinCode.trim().toUpperCase() });
      if (data.success) {
        setShowJoin(false);
        setJoinCode('');
        navigate(`/rooms/${data.data._id}`);
      }
    } catch (err) {
      setJoinError(err.response?.data?.message || 'Invalid invite code');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-primary-400" />
          <span className="font-bold tracking-tight">StudyRoom</span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/rooms" className="nav-link-active">Rooms</Link>
          <Link to="/dashboard" className="nav-link flex items-center gap-1"><LayoutDashboard size={14} />Dashboard</Link>
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-sm text-dark-400 hidden md:block">{user?.name}</span>
          <button onClick={logout} className="btn-secondary py-1.5 px-3 text-sm flex items-center gap-1.5">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full animate-fade-in">
        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Study Rooms</h1>
            <p className="text-dark-400 text-sm mt-0.5">Browse active rooms or create your own</p>
          </div>
          <div className="flex items-center gap-3">
            <button id="join-room-btn" onClick={() => setShowJoin(true)} className="btn-secondary flex items-center gap-2">
              <Hash size={15} /> Join with code
            </button>
            <button id="create-room-btn" onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
              <Plus size={15} /> Create room
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Room grid */}
        {loadingRooms ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-primary-400" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen size={40} className="mx-auto text-dark-600 mb-4" />
            <p className="text-dark-400">No rooms yet. Create the first one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <Link
                key={room._id}
                to={`/rooms/${room._id}`}
                id={`room-${room._id}`}
                className="glass-card-hover p-5 flex flex-col gap-3 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate group-hover:text-primary-300 transition-colors">
                      {room.name}
                    </h3>
                    {room.description && (
                      <p className="text-dark-400 text-xs mt-1 line-clamp-2">{room.description}</p>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-dark-500 group-hover:text-primary-400 transition-colors mt-0.5 shrink-0" />
                </div>

                <div className="flex items-center gap-3 text-xs text-dark-400">
                  <span className="flex items-center gap-1">
                    <Users size={12} /> {room.members?.length ?? 0} member{room.members?.length !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Hash size={12} /> {room.inviteCode}
                  </span>
                  {room.isActive && <span className="badge-green">Active</span>}
                </div>

                <div className="text-xs text-dark-500 flex items-center gap-1">
                  Owner: {room.owner?.name ?? 'Unknown'}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Create Room Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 px-4">
          <div className="glass-card w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Create Study Room</h2>
              <button onClick={() => setShowCreate(false)} className="text-dark-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Room Name *</label>
                <input
                  id="create-room-name"
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. Algorithms Study Group"
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Description</label>
                <textarea
                  id="create-room-description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="What will you be studying?"
                  rows={3}
                  className="input-field resize-none"
                />
              </div>
              <div className="flex gap-3 mt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                <button id="create-room-submit" type="submit" disabled={creating} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {creating ? <><Loader2 size={15} className="animate-spin" /> Creating…</> : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Room Modal */}
      {showJoin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 px-4">
          <div className="glass-card w-full max-w-sm p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Join a Room</h2>
              <button onClick={() => setShowJoin(false)} className="text-dark-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleJoin} className="flex flex-col gap-4">
              {joinError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2.5 rounded-xl">
                  {joinError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Invite Code</label>
                <input
                  id="join-room-code"
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="e.g. AB12CD"
                  maxLength={6}
                  required
                  className="input-field uppercase tracking-widest text-center text-lg font-mono"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowJoin(false)} className="btn-secondary flex-1">Cancel</button>
                <button id="join-room-submit" type="submit" disabled={joining} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {joining ? <><Loader2 size={15} className="animate-spin" /> Joining…</> : 'Join Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;
