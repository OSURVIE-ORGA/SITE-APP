import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, relativeTime, type Alert } from '../lib';
import { Icon } from '../ui';

const LABELS: Record<Alert['type'], string> = {
  user_inactive: 'Personne inactive',
  medication_missed: 'Médicament oublié',
  new_message: 'Nouveau message',
};

const TYPE_BADGE: Record<Alert['type'], string> = {
  user_inactive: 'badge-warning',
  medication_missed: 'badge-error',
  new_message: 'badge-primary',
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
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            Alertes
            {unread > 0 && (
              <span className="badge badge-error badge-sm">{unread}</span>
            )}
          </h1>
          <p className="mt-1 text-sm text-base-content/60">
            Comptes inactifs et rappels de suivi.
          </p>
        </div>
        <button
          className="btn btn-ghost btn-sm gap-2 border border-base-300"
          disabled={unread === 0}
          onClick={() => void markAll()}
        >
          <Icon name="check" className="h-4 w-4" />
          Tout marquer comme lu
        </button>
      </header>

      {error && (
        <div className="alert alert-error">
          <Icon name="warning" className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      <section className="rounded-xl border border-base-300 bg-base-100 shadow-sm">
        <div className="flex items-center justify-between border-b border-base-300 p-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-base-content/70">
            <input
              type="checkbox"
              className="toggle toggle-sm"
              checked={showRead}
              onChange={(e) => setShowRead(e.target.checked)}
            />
            Afficher les alertes lues
          </label>
          <span className="text-sm text-base-content/45">
            {shown.length} affichée(s)
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <span className="loading loading-spinner text-primary" />
          </div>
        ) : shown.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Icon name="bell" className="h-8 w-8 text-base-content/25" />
            <p className="text-sm text-base-content/45">Aucune alerte.</p>
          </div>
        ) : (
          <ul className="divide-y divide-base-200">
            {shown.map((a) => (
              <li
                key={a.id}
                className={`flex items-start gap-3 px-4 py-3.5 ${
                  a.readAt ? 'opacity-55' : 'bg-warning/5'
                }`}
              >
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    a.readAt ? 'bg-base-300' : 'bg-warning'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`badge badge-sm ${
                        TYPE_BADGE[a.type] ?? 'badge-ghost'
                      }`}
                    >
                      {LABELS[a.type] ?? a.type}
                    </span>
                    <span className="text-xs text-base-content/40">
                      {relativeTime(a.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-base-content/80">
                    {a.message}
                  </p>
                </div>
                {!a.readAt && (
                  <button
                    className="btn btn-ghost btn-xs shrink-0 gap-1"
                    onClick={() => void markRead(a.id)}
                  >
                    <Icon name="check" className="h-3.5 w-3.5" />
                    Lu
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
