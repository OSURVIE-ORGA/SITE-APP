import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { activityDot, api, LANGS, relativeTime, type ApiUser } from '../lib';

export function Users() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ApiUser | 'new' | null>(null);
  const [onlyInactive, setOnlyInactive] = useState(false);
  const [showAdmins, setShowAdmins] = useState(false);
  const [query, setQuery] = useState('');

  const reload = useCallback(async () => {
    setError(null);
    try {
      setUsers(await api<ApiUser[]>('/admin/users'));
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
      .filter((u) => showAdmins || u.role !== 'admin')
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
  }, [users, onlyInactive, showAdmins, query]);

  const setDisabled = async (u: ApiUser, disabled: boolean) => {
    await api(`/admin/users/${u.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ disabled }),
    });
    void reload();
  };

  const regenerate = async (u: ApiUser) => {
    if (!confirm(`Nouveau numéro pour ${u.firstName} ${u.lastName} ?`)) return;
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Utilisateurs</h1>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setEditing('new')}
        >
          + Créer un compte
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card bg-base-100 shadow">
        <div className="card-body gap-4">
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
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="toggle toggle-sm"
                checked={showAdmins}
                onChange={(e) => setShowAdmins(e.target.checked)}
              />
              Voir les admins
            </label>
            <span className="ml-auto text-sm opacity-50">
              {shown.length} compte(s)
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
                    <td colSpan={7} className="py-10 text-center opacity-50">
                      Aucun compte.
                    </td>
                  </tr>
                )}
                {shown.map((u) => {
                  const dot = activityDot(u.lastSeenAt);
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-2 font-medium">
                          {u.firstName} {u.lastName}
                          {u.role === 'admin' && (
                            <span className="badge badge-primary badge-xs">
                              admin
                            </span>
                          )}
                        </div>
                        {(u.phone || u.email) && (
                          <div className="text-xs opacity-50">
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
                        <span
                          className="flex items-center gap-2"
                          title={dot.label}
                        >
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
    role: user?.role ?? 'user',
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
        payload.role = f.role;
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
            {!user && (
              <div className="join">
                <button
                  type="button"
                  className={`btn join-item btn-sm ${
                    f.role === 'user' ? 'btn-primary' : ''
                  }`}
                  onClick={() => set('role', 'user')}
                >
                  Utilisateur
                </button>
                <button
                  type="button"
                  className={`btn join-item btn-sm ${
                    f.role === 'admin' ? 'btn-primary' : ''
                  }`}
                  onClick={() => set('role', 'admin')}
                >
                  Administrateur
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field
                label="Prénom *"
                value={f.firstName}
                onChange={(v) => set('firstName', v)}
              />
              <Field
                label="Nom *"
                value={f.lastName}
                onChange={(v) => set('lastName', v)}
              />
              <Field
                label="Email"
                type="email"
                value={f.email}
                onChange={(v) => set('email', v)}
              />
              <Field
                label="Téléphone"
                value={f.phone}
                onChange={(v) => set('phone', v)}
              />
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

            {error && (
              <div className="alert alert-error py-2 text-sm">{error}</div>
            )}

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
