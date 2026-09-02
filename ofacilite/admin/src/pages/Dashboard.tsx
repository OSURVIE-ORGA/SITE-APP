import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useAuth } from '../auth';
import {
  activityDot,
  api,
  LANGS,
  relativeTime,
  type Alert,
  type ApiUser,
  type Stats,
} from '../lib';

export function Dashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ApiUser | 'new' | null>(null);
  const [onlyInactive, setOnlyInactive] = useState(false);
  const [query, setQuery] = useState('');

  const reload = useCallback(async () => {
    setError(null);
    try {
      const [s, u, a] = await Promise.all([
        api<Stats>('/admin/stats'),
        api<ApiUser[]>('/admin/users'),
        api<Alert[]>('/admin/alerts'),
      ]);
      setStats(s);
      setUsers(u);
      setAlerts(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((u) => u.role !== 'admin')
      .filter((u) => {
        if (!onlyInactive) return true;
        if (!u.lastSeenAt) return true;
        return Date.now() - new Date(u.lastSeenAt).getTime() > 30 * 864e5;
      })
      .filter(
        (u) =>
          !q ||
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
          u.loginCode.includes(q),
      );
  }, [users, onlyInactive, query]);

  const setDisabled = async (u: ApiUser, disabled: boolean) => {
    await api(`/admin/users/${u.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ disabled }),
    });
    void reload();
  };

  const regenerate = async (u: ApiUser) => {
    if (!confirm(`Générer un nouveau numéro pour ${u.firstName} ${u.lastName} ?`))
      return;
    const res = await api<ApiUser>(`/admin/users/${u.id}/regenerate-code`, {
      method: 'POST',
    });
    alert(`Nouveau numéro : ${res.loginCode}`);
    void reload();
  };

  const remove = async (u: ApiUser) => {
    if (!confirm(`Supprimer le compte de ${u.firstName} ${u.lastName} ?`)) return;
    await api(`/admin/users/${u.id}`, { method: 'DELETE' });
    void reload();
  };

  const markAlert = async (id: string) => {
    await api(`/admin/alerts/${id}/read`, { method: 'PATCH' });
    setAlerts((a) => a.filter((x) => x.id !== id));
  };
  const markAllAlerts = async () => {
    await api('/admin/alerts/read-all', { method: 'POST' });
    setAlerts([]);
  };

  return (
    <div className="min-h-full bg-base-200">
      {/* ── Barre du haut ─────────────────────────────────────── */}
      <div className="navbar sticky top-0 z-30 bg-base-100 shadow-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4">
          <div className="flex flex-1 items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="text-lg font-bold">O'Facilit</span>
            <span className="text-sm text-base-content/50">Administration</span>
          </div>
          <AlertsBell alerts={alerts} onRead={markAlert} onReadAll={markAllAlerts} />
          <div className="dropdown dropdown-end">
            <button tabIndex={0} className="btn btn-ghost btn-sm gap-2">
              <div className="avatar avatar-placeholder">
                <div className="w-7 rounded-full bg-neutral text-neutral-content">
                  <span className="text-xs">
                    {user?.firstName?.[0] ?? 'A'}
                  </span>
                </div>
              </div>
              <span className="hidden sm:inline">{user?.firstName}</span>
            </button>
            <ul
              tabIndex={0}
              className="menu dropdown-content z-30 mt-2 w-44 rounded-box bg-base-100 p-2 shadow-lg"
            >
              <li>
                <button onClick={() => void logout()}>Se déconnecter</button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        {error && <div className="alert alert-error">{error}</div>}

        {/* ── Statistiques ────────────────────────────────────── */}
        {stats && (
          <div className="stats stats-vertical w-full bg-base-100 shadow sm:stats-horizontal">
            <StatCard label="Comptes" value={stats.total} />
            <StatCard label="Actifs" value={stats.active} desc={`${stats.disabled} désactivé(s)`} />
            <StatCard
              label="Vus cette semaine"
              value={stats.seenLast7d}
              tone="text-success"
            />
            <StatCard label="Vus ce mois" value={stats.seenLast30d} />
            <StatCard
              label="Jamais connectés"
              value={stats.neverConnected}
              tone="text-error"
            />
          </div>
        )}

        {/* ── Comptes ─────────────────────────────────────────── */}
        <div className="card bg-base-100 shadow">
          <div className="card-body gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="card-title">Comptes</h2>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setEditing('new')}
              >
                + Créer un compte
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="search"
                className="input input-sm w-full max-w-xs"
                placeholder="Rechercher (nom, numéro)…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="toggle toggle-sm"
                  checked={onlyInactive}
                  onChange={(e) => setOnlyInactive(e.target.checked)}
                />
                Inactifs &gt; 30 j
              </label>
              <span className="ml-auto text-sm text-base-content/50">
                {shown.length} / {users.filter((u) => u.role !== 'admin').length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="table-zebra table">
                <thead>
                  <tr>
                    <th>Personne</th>
                    <th>Numéro</th>
                    <th>Âge</th>
                    <th>Langue</th>
                    <th>Activité</th>
                    <th>Statut</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={7} className="py-10 text-center">
                        <span className="loading loading-spinner" />
                      </td>
                    </tr>
                  )}
                  {!loading && shown.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-10 text-center text-base-content/50"
                      >
                        Aucun compte.
                      </td>
                    </tr>
                  )}
                  {shown.map((u) => {
                    const dot = activityDot(u.lastSeenAt);
                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="font-medium">
                            {u.firstName} {u.lastName}
                          </div>
                          {(u.phone || u.email) && (
                            <div className="text-xs text-base-content/50">
                              {u.phone ?? u.email}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="badge badge-ghost font-mono tracking-wider">
                            {u.loginCode}
                          </span>
                        </td>
                        <td>{u.age ?? '—'}</td>
                        <td>{LANGS[u.language] ?? u.language}</td>
                        <td>
                          <span className="flex items-center gap-2">
                            <span
                              className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${dot.cls}`}
                            />
                            <span className="text-sm">
                              {relativeTime(u.lastSeenAt)}
                            </span>
                          </span>
                        </td>
                        <td>
                          <button
                            className={`badge badge-sm ${
                              u.disabled ? 'badge-error' : 'badge-success'
                            }`}
                            onClick={() => void setDisabled(u, !u.disabled)}
                            title="Cliquer pour changer"
                          >
                            {u.disabled ? 'Désactivé' : 'Actif'}
                          </button>
                        </td>
                        <td>
                          <div className="flex justify-end gap-1">
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => setEditing(u)}
                            >
                              Modifier
                            </button>
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => void regenerate(u)}
                            >
                              Nº
                            </button>
                            <button
                              className="btn btn-ghost btn-xs text-error"
                              onClick={() => void remove(u)}
                            >
                              Suppr.
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <UserFormModal
          user={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void reload();
          }}
        />
      )}
    </div>
  );
}

function StatCard({
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
      <div className={`stat-value text-3xl ${tone ?? ''}`}>{value}</div>
      {desc && <div className="stat-desc">{desc}</div>}
    </div>
  );
}

function AlertsBell({
  alerts,
  onRead,
  onReadAll,
}: {
  alerts: Alert[];
  onRead: (id: string) => void;
  onReadAll: () => void;
}) {
  return (
    <div className="dropdown dropdown-end">
      <button tabIndex={0} className="btn btn-ghost btn-circle">
        <div className="indicator">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.7V5a2 2 0 10-4 0v.3A6 6 0 006 11v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {alerts.length > 0 && (
            <span className="badge indicator-item badge-error badge-xs">
              {alerts.length}
            </span>
          )}
        </div>
      </button>
      <div
        tabIndex={0}
        className="card dropdown-content z-30 mt-2 w-80 bg-base-100 shadow-xl"
      >
        <div className="card-body gap-0 p-0">
          <div className="flex items-center justify-between border-b border-base-200 p-3">
            <span className="text-sm font-semibold">
              Alertes {alerts.length > 0 && `(${alerts.length})`}
            </span>
            {alerts.length > 0 && (
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => void onReadAll()}
              >
                Tout lire
              </button>
            )}
          </div>
          <ul className="max-h-96 divide-y divide-base-200 overflow-y-auto">
            {alerts.length === 0 && (
              <li className="p-4 text-sm text-base-content/50">
                Aucune alerte en cours.
              </li>
            )}
            {alerts.map((a) => (
              <li key={a.id} className="p-3 text-sm">
                <p>{a.message}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-xs text-base-content/40">
                    {relativeTime(a.createdAt)}
                  </span>
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={() => void onRead(a.id)}
                  >
                    Lu
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function UserFormModal({
  user,
  onClose,
  onSaved,
}: {
  user: ApiUser | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    birthDate: user?.birthDate ?? '',
    language: user?.language ?? 'fr',
    notes: user?.notes ?? '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload: Record<string, unknown> = {
      firstName: f.firstName.trim(),
      lastName: f.lastName.trim(),
      language: f.language,
    };
    if (f.email.trim()) payload.email = f.email.trim();
    if (f.phone.trim()) payload.phone = f.phone.trim();
    if (f.birthDate) payload.birthDate = f.birthDate;
    if (f.notes.trim()) payload.notes = f.notes.trim();

    try {
      if (user) {
        await api(`/admin/users/${user.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        onSaved();
      } else {
        const created = await api<ApiUser>('/admin/users', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setCreatedCode(created.loginCode);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-lg">
        <h3 className="text-lg font-bold">
          {user ? 'Modifier le compte' : 'Nouveau compte'}
        </h3>

        {createdCode ? (
          <div className="space-y-4 py-4">
            <p className="text-sm">
              Compte créé. Numéro de connexion à communiquer à la personne :
            </p>
            <div className="rounded-box bg-base-200 py-6 text-center font-mono text-4xl tracking-[0.3em]">
              {createdCode}
            </div>
            <div className="modal-action">
              <button className="btn btn-primary" onClick={onSaved}>
                Terminé
              </button>
            </div>
          </div>
        ) : (
          <form className="space-y-3 py-4" onSubmit={submit}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Prénom *" value={f.firstName} onChange={(v) => set('firstName', v)} />
              <Field label="Nom *" value={f.lastName} onChange={(v) => set('lastName', v)} />
              <Field label="Email" type="email" value={f.email} onChange={(v) => set('email', v)} />
              <Field label="Téléphone" value={f.phone} onChange={(v) => set('phone', v)} />
              <Field
                label="Date de naissance"
                type="date"
                value={f.birthDate}
                onChange={(v) => set('birthDate', v)}
              />
              <div>
                <label className="mb-1 block text-sm font-medium">Langue</label>
                <select
                  className="select w-full"
                  value={f.language}
                  onChange={(e) => set('language', e.target.value)}
                >
                  {Object.entries(LANGS).map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <textarea
                className="textarea w-full"
                rows={2}
                value={f.notes}
                onChange={(e) => set('notes', e.target.value)}
              />
            </div>

            {error && <div className="alert alert-error py-2 text-sm">{error}</div>}

            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Annuler
              </button>
              <button
                className="btn btn-primary"
                disabled={busy || !f.firstName.trim() || !f.lastName.trim()}
              >
                {busy && <span className="loading loading-spinner loading-sm" />}
                Enregistrer
              </button>
            </div>
          </form>
        )}
      </div>
      <button
        type="button"
        className="modal-backdrop"
        aria-label="Fermer"
        onClick={onClose}
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        type={type}
        className="input w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
