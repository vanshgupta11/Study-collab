import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Users, Zap, ChevronRight, Star, Shield, Globe } from 'lucide-react';

const features = [
  {
    icon: <Users size={22} className="text-primary-400" />,
    title: 'Live Study Rooms',
    desc: 'Join or create collaborative rooms with real-time chat and session tracking.',
  },
  {
    icon: <Zap size={22} className="text-violet-400" />,
    title: 'Session Analytics',
    desc: 'Track study time per room with duration stats and personal dashboards.',
  },
  {
    icon: <Shield size={22} className="text-emerald-400" />,
    title: 'Invite-Only Access',
    desc: 'Secure rooms with unique 6-character invite codes shared only with your group.',
  },
  {
    icon: <Globe size={22} className="text-amber-400" />,
    title: 'Real-Time Sync',
    desc: 'Messages and activity updates arrive instantly via WebSocket connections.',
  },
];

const Home = () => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={22} className="text-primary-400" />
          <span className="font-bold text-lg tracking-tight">StudyRoom</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="nav-link">Sign In</Link>
          <Link to="/register" className="btn-primary py-2 px-4 text-sm">Get Started</Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center animate-fade-in">
        <div className="badge-primary mb-6 text-sm px-3 py-1">
          <Star size={12} /> Real-time collaborative learning
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-3xl">
          Study smarter,{' '}
          <span className="gradient-text">together</span>
        </h1>

        <p className="text-dark-300 text-lg md:text-xl max-w-xl mb-10 leading-relaxed">
          Create or join study rooms, track your sessions, and collaborate in real-time with
          peers — all in one seamless workspace.
        </p>

        <div className="flex items-center gap-4 flex-wrap justify-center">
          <Link to="/register" className="btn-primary flex items-center gap-2 text-base px-7 py-3">
            Start for free <ChevronRight size={16} />
          </Link>
          <Link to="/login" className="btn-secondary text-base px-7 py-3">
            Sign in
          </Link>
        </div>

        {/* Feature grid */}
        <div className="mt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl animate-slide-up">
          {features.map((f) => (
            <div key={f.title} className="glass-card-hover p-5 text-left">
              <div className="mb-3 p-2 rounded-lg bg-white/5 w-fit">{f.icon}</div>
              <h3 className="font-semibold mb-1 text-sm">{f.title}</h3>
              <p className="text-dark-400 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-white/5 px-6 py-4 text-center text-dark-500 text-xs">
        © {new Date().getFullYear()} StudyRoom — Collaborative Classroom Platform
      </footer>
    </div>
  );
};

export default Home;
