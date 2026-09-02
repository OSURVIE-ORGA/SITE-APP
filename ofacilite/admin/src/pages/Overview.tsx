import { useEffect, useMemo, useState } from 'react';
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
import { Card, Donut, HBars, Line, VBars } from '../ui';

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
      { label: 'Actif (< 7 j)', value: ok, color: '#16a34a' },
      { label: 'Ralenti (7–30 j)', value: slow, color: '#d97706' },
      { label: 'Inactif (> 30 j)', value: idle, color: '#dc2626' },
      { label: 'Jamais', value: never, color: '#9ca3af' },
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Vue d'ensemble</h1>
      {error && <div className="alert alert-error">{error}</div>}

      {stats && (
        <div className="stats stats-vertical w-full bg-base-100 shadow sm:stats-horizontal">
          <Item label="Comptes" value={stats.total} />
          <Item
            label="Actifs"
            value={stats.active}
            desc={`${stats.disabled} désactivé(s)`}
          />
          <Item label="Vus 7 j" value={stats.seenLast7d} tone="text-success" />
          <Item label="Vus 30 j" value={stats.seenLast30d} />
          <Item
            label="Jamais connectés"
            value={stats.neverConnected}
            tone="text-error"
          />
          <Item
            label="Alertes"
            value={alerts.length}
            tone={alerts.length ? 'text-warning' : ''}
          />
        </div>
      )}

      <Card title="Connexions par jour (14 j)">
        <Line points={loginPoints} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Répartition d'activité">
          <Donut segments={activity} />
        </Card>
        <Card title="Comptes créés par mois">
          <VBars data={perMonth} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Langue préférée">
          {byLang.length ? (
            <HBars data={byLang} />
          ) : (
            <p className="text-sm opacity-50">Aucun compte.</p>
          )}
        </Card>
        <Card title="Dernières alertes">
          {alerts.length === 0 ? (
            <p className="text-sm opacity-50">Aucune alerte en cours.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {alerts.slice(0, 5).map((a) => (
                <li key={a.id} className="flex justify-between gap-2">
                  <span>{a.message}</span>
                  <span className="shrink-0 opacity-40">
                    {relativeTime(a.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/alerts" className="link link-primary text-sm">
            Voir toutes les alertes →
          </Link>
        </Card>
      </div>
    </div>
  );
}

function Item({
  label,
  value,
  desc,
  tone,
}: {
  label: string;
  value: number;
  desc?: string;
  tone?: string;
}) {
  return (
    <div className="stat">
      <div className="stat-title">{label}</div>
      <div className={`stat-value text-2xl ${tone ?? ''}`}>{value}</div>
      {desc && <div className="stat-desc">{desc}</div>}
    </div>
  );
}
