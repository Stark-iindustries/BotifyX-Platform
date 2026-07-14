import React, { createContext, useContext, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing   from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Deploy    from './pages/Deploy';
import BotDetail from './pages/BotDetail';
import Navbar    from './components/Navbar';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

function AuthProvider({ children }) {
  const [user, setUser]     = useState(undefined); // undefined = loading
  const [config, setConfig] = useState({});

  useEffect(() => {
    Promise.all([
      fetch('/api/me').then(r => r.ok ? r.json() : null),
      fetch('/api/config').then(r => r.json()),
    ]).then(([me, cfg]) => {
      setUser(me);
      setConfig(cfg);
    }).catch(() => setUser(null));
  }, []);

  const logout = async () => {
    await fetch('/auth/logout', { method: 'POST' });
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, setUser, logout, config }}>
      {children}
    </AuthCtx.Provider>
  );
}

function PrivateRoute({ children }) {
  const { user } = useAuth();
  if (user === undefined) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-zinc-500 text-sm">Loading…</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Navbar />
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/deploy" element={
            <PrivateRoute>
              <Navbar />
              <Deploy />
            </PrivateRoute>
          } />
          <Route path="/bots/:id" element={
            <PrivateRoute>
              <Navbar />
              <BotDetail />
            </PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
