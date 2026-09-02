import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  api,
  LANGS,
  relativeTime,
  type Alert,
  type ApiUser,
  type LoginDay,
  type Stats,
} from '../lib';
import { Card, Donut, HBars, Icon, Line, VBars } from '../ui';

export function Overview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [logins, setLogins] = useState<LoginDay[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api<Stats>('/admin/stats'),
      api<ApiUser[]>('/admin/users'),
      api<Alert[]>('/admin/alerts'),
      api<LoginDay[]>('/admin/stats/logins?days=14'),
    ])
      .then(([s, u, a, l]) => {
        setStats(s);
        setUsers(u.filter((x) => x.role !== 'admin'));
        setAlerts(a);
        setLogins(l);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : 'Erreur de chargement.'),
      );
  }, []);

  const activity = useMemo(() => {
    let ok = 0;
    let slow = 0;
    let idle = 0;
    let never = 0;
    for (const u of users) {
      if (!u.lastSeenAt) {
        never++;
        continue;
      }
      const d = (Date.now() - new Date(u.lastSeenAt).getTime()) / 864e5;
      if (d < 7) ok++;
      else if (d < 30) slow++;
      else idle++;
    }
    return [
      { label: 'Actif (< 7 j)', value: ok, color: 'var(--color-success)' },
      { label: 'Ralenti (7–30 j)', value: slow, color: 'var(--color-warning)' },
      { label: 'Inactif (> 30 j)', value: idle, color: 'var(--color-error)' },
      { label: 'Jamais', value: never, color: 'var(--color-neutral)' },
    ];
  }, [users]);

  const perMonth = useMemo(() => {
    const now = new Date();
    const buckets: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        label: d.toLocaleDateString('fr-FR', { month: 'short' }),
        value: 0,
      });
    }
    for (const u of users) {
      const c = new Date(u.createdAt);
      const idx =
        (c.getFullYear() - now.getFullYear()) * 12 +
        (c.getMonth() - now.getMonth()) +
        5;
      if (idx >= 0 && idx < 6) buckets[idx].value++;
    }
    return buckets;
  }, [users]);

  const byLang = useMemo(() => {
    const m = new Map<string, number>();
    for (const u of users) m.set(u.language, (m.get(u.language) ?? 0) + 1);
    return [...m.entries()]
      .map(([k, v]) => ({ label: LANGS[k] ?? k, value: v }))
      .sort((a, b) => b.value - a.value);
  }, [users]);

  const loginPoints = logins.map((d) => ({
    label: d.date.slice(5),
    value: d.count,
  }));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Vue d'ensemble</h1>
        <p className="mt-1 text-sm text-base-content/60">
          Activité des comptes O'Facilit et alertes en cours.
        </p>
      </header>

      {error && (
        <div className="alert alert-error">
          <Icon name="warning" className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {!stats && !error && (
        <div className="grid place-items-center py-20">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <Item label="Comptes" value={stats.total} icon="users" />
            <Item
              label="Actifs"
              value={stats.active}
              desc={`${stats.disabled} désactivé(s)`}
            />
            <Item label="Vus 7 jours" value={stats.seenLast7d} tone="success" />
            <Item label="Vus 30 jours" value={stats.seenLast30d} />
            <Item
              label="Jamais connectés"
              value={stats.neverConnected}
              tone={stats.neverConnected ? 'error' : undefined}
            />
            <Item
              label="Alertes"
              value={alerts.length}
              tone={alerts.length ? 'warning' : undefined}
              icon="bell"
            />
          </div>

          <Card title="Connexions par jour (14 derniers jours)">
            <Line points={loginPoints} />
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Répartition de l'activité">
              <Donut segments={activity} />
            </Card>
            <Card title="Comptes créés par mois">
              <VBars data={perMonth} />
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Langues préférées">
              {byLang.length ? (
                <HBars data={byLang} />
              ) : (
                <Empty>Aucun compte.</Empty>
              )}
            </Card>
            <Card title="Dernières alertes">
              {alerts.length === 0 ? (
                <Empty>Aucune alerte en cours.</Empty>
              ) : (
                <ul className="divide-y divide-base-200">
                  {alerts.slice(0, 5).map((a) => (
                    <li
                      key={a.id}
                      className="flex items-start gap-3 py-2.5 first:pt-0"
                    >
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-warning" />
                      <span className="flex-1 text-sm text-base-content/80">
                        {a.message}
                      </span>
                      <span className="shrink-0 text-xs text-base-content/40">
                        {relativeTime(a.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 border-t border-base-200 pt-3">
                <Link
                  to="/alerts"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Voir toutes les alertes
                  <Icon name="external" className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

const TONE_TEXT: Record<string, string> = {
  success: 'text-success',
  error: 'text-error',
  warning: 'text-warning',
};

function Item({
  label,
  value,
  desc,
  tone,
  icon,
}: {
  label: string;
  value: number;
  desc?: string;
  tone?: 'success' | 'error' | 'warning';
  icon?: 'users' | 'bell';
}) {
  return (
    <div className="rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-base-content/50">
          {label}
        </span>
        {icon && <Icon name={icon} className="h-4 w-4 text-base-content/30" />}
      </div>
      <div
        className={`mt-2 text-2xl font-bold tabular-nums ${tone ? TONE_TEXT[tone] : ''}`}
      >
        {value}
      </div>
      {desc && <div className="mt-0.5 text-xs text-base-content/50">{desc}</div>}
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="py-4 text-center text-sm text-base-content/45">{children}</p>
  );
}
