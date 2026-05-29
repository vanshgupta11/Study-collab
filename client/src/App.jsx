import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';

import Home       from './pages/Home';
import Login      from './pages/Login';
import Register   from './pages/Register';
import Rooms      from './pages/Rooms';
import RoomPage  from './pages/RoomPage';
import DashboardPage from './pages/DashboardPage';

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <SocketProvider>
        <Routes>
          {/* Public */}
          <Route path="/"         element={<Home />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected */}
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/rooms" element={
            <ProtectedRoute><Rooms /></ProtectedRoute>
          } />
          <Route path="/rooms/:id" element={
            <ProtectedRoute><RoomPage /></ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SocketProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
