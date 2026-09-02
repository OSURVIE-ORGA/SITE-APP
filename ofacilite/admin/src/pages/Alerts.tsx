import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, relativeTime, type Alert } from '../lib';

const LABELS: Record<Alert['type'], string> = {
  user_inactive: 'Personne inactive',
  medication_missed: 'Médicament oublié',
};

export function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRead, setShowRead] = useState(true);

  const reload = useCallback(async () => {
    setError(null);
    try {
      setAlerts(await api<Alert[]>('/admin/alerts?all=1'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const markRead = async (id: string) => {
    await api(`/admin/alerts/${id}/read`, { method: 'PATCH' });
    void reload();
  };

  const markAll = async () => {
    await api('/admin/alerts/read-all', { method: 'POST' });
    void reload();
  };

  const shown = useMemo(
    () => alerts.filter((a) => showRead || !a.readAt),
    [alerts, showRead],
  );
  const unread = alerts.filter((a) => !a.readAt).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">
          Alertes
          {unread > 0 && (
            <span className="badge badge-error ml-2 align-middle">{unread}</span>
          )}
        </h1>
        <button
          className="btn btn-outline btn-sm"
          disabled={unread === 0}
          onClick={() => void markAll()}
        >
          Tout marquer comme lu
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card bg-base-100 shadow">
        <div className="card-body gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="toggle toggle-sm"
              checked={showRead}
              onChange={(e) => setShowRead(e.target.checked)}
            />
            Afficher les alertes lues
          </label>

          {loading ? (
            <div className="py-10 text-center">
              <span className="loading loading-spinner" />
            </div>
          ) : shown.length === 0 ? (
            <p className="py-10 text-center opacity-50">Aucune alerte.</p>
          ) : (
            <ul className="divide-y divide-base-200">
              {shown.map((a) => (
                <li
                  key={a.id}
                  className={`flex items-start gap-3 py-3 ${
                    a.readAt ? 'opacity-50' : ''
                  }`}
                >
                  <span
                    className={`mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full ${
                      a.readAt ? 'bg-base-300' : 'bg-error'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge badge-ghost badge-sm">
                        {LABELS[a.type] ?? a.type}
                      </span>
                      <span className="text-xs opacity-40">
                        {relativeTime(a.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm">{a.message}</p>
                  </div>
                  {!a.readAt && (
                    <button
                      className="btn btn-ghost btn-xs shrink-0"
                      onClick={() => void markRead(a.id)}
                    >
                      Marquer lu
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
