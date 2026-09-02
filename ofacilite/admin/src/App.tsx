import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import { api } from './lib';
import { DialogProvider, Layout } from './ui';
import { Login } from './pages/Login';
import { Overview } from './pages/Overview';
import { Users } from './pages/Users';
import { Alerts } from './pages/Alerts';

export function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary" />
        <p className="text-sm text-base-content/50">Chargement…</p>
      </div>
    );
  }

  return (
    <DialogProvider>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login />}
        />
        {user ? (
          <Route element={<Shell />}>
            <Route index element={<Overview />} />
            <Route path="users" element={<Users />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </DialogProvider>
  );
}

function Shell() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const load = () =>
      api<{ count: number }>('/admin/alerts/unread-count')
        .then((r) => setUnread(r.count))
        .catch(() => {});
    void load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  return <Layout unread={unread} />;
}
