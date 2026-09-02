import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { activityDot, api, LANGS, relativeTime, type ApiUser } from '../lib';
import { Icon, useDialog } from '../ui';

const errMsg = (e: unknown) =>
  e instanceof Error ? e.message : 'Erreur inconnue.';

export function Users() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ApiUser | 'new' | null>(null);
  const [onlyInactive, setOnlyInactive] = useState(false);
  const [showAdmins, setShowAdmins] = useState(false);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const dlg = useDialog();

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
    setBusyId(u.id);
    try {
      await api(`/admin/users/${u.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ disabled }),
      });
      await reload();
    } catch (e) {
      await dlg.alert({
        title: 'Action impossible',
        message: errMsg(e),
        tone: 'error',
      });
    } finally {
      setBusyId(null);
    }
  };

  const regenerate = async (u: ApiUser) => {
    const ok = await dlg.confirm({
      title: 'Nouveau numéro de connexion',
      message: `Générer un nouveau numéro pour ${u.firstName} ${u.lastName} ?\nL'ancien numéro cessera immédiatement de fonctionner.`,
      confirmLabel: 'Générer',
    });
    if (!ok) return;
    setBusyId(u.id);
    try {
      const res = await api<ApiUser>(`/admin/users/${u.id}/regenerate-code`, {
        method: 'POST',
      });
      await reload();
      await dlg.alert({
        title: 'Nouveau numéro',
        message: `${u.firstName} ${u.lastName}\n\n${res.loginCode}`,
        tone: 'success',
      });
    } catch (e) {
      await dlg.alert({
        title: 'Action impossible',
        message: errMsg(e),
        tone: 'error',
      });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (u: ApiUser) => {
    const ok = await dlg.confirm({
      title: 'Supprimer le compte',
      message: `Supprimer définitivement le compte de ${u.firstName} ${u.lastName} ?\nCette action est irréversible.`,
      confirmLabel: 'Supprimer',
      tone: 'error',
    });
    if (!ok) return;
    setBusyId(u.id);
    try {
      await api(`/admin/users/${u.id}`, { method: 'DELETE' });
      await reload();
    } catch (e) {
      await dlg.alert({
        title: 'Suppression impossible',
        message: errMsg(e),
        tone: 'error',
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Utilisateurs</h1>
          <p className="mt-1 text-sm text-base-content/60">
            Comptes des personnes accompagnées et administrateurs.
          </p>
        </div>
        <button
          className="btn btn-primary gap-2"
          onClick={() => setEditing('new')}
        >
          <Icon name="plus" className="h-4 w-4" />
          Créer un compte
        </button>
      </header>

      {error && (
        <div className="alert alert-error">
          <Icon name="warning" className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      <section className="rounded-xl border border-base-300 bg-base-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-base-300 p-4">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40"
            />
            <input
              type="search"
              className="input input-sm w-full pl-9"
              placeholder="Rechercher un nom, un numéro…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-base-content/70">
            <input
              type="checkbox"
              className="toggle toggle-sm"
              checked={onlyInactive}
              onChange={(e) => setOnlyInactive(e.target.checked)}
            />
            Inactifs&nbsp;&gt;&nbsp;30&nbsp;j
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-base-content/70">
            <input
              type="checkbox"
              className="toggle toggle-sm"
              checked={showAdmins}
              onChange={(e) => setShowAdmins(e.target.checked)}
            />
            Voir les admins
          </label>
          <span className="ml-auto text-sm text-base-content/45">
            {shown.length} compte(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-base-content/50">
                <th>Personne</th>
                <th>Numéro</th>
                <th>Âge</th>
                <th>Langue</th>
                <th>Dernière activité</th>
                <th className="text-center">Actif</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <span className="loading loading-spinner text-primary" />
                  </td>
                </tr>
              )}
              {!loading && shown.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-16 text-center text-sm text-base-content/45"
                  >
                    Aucun compte ne correspond.
                  </td>
                </tr>
              )}
              {!loading &&
                shown.map((u) => {
                  const dot = activityDot(u.lastSeenAt);
                  const initials =
                    `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase();
                  return (
                    <tr key={u.id} className="hover:bg-base-200/50">
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                            {initials}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 font-medium">
                              <span className="truncate">
                                {u.firstName} {u.lastName}
                              </span>
                              {u.role === 'admin' && (
                                <span className="badge badge-primary badge-sm">
                                  admin
                                </span>
                              )}
                            </div>
                            {(u.phone || u.email) && (
                              <div className="truncate text-xs text-base-content/50">
                                {u.phone ?? u.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="rounded-md bg-base-200 px-2 py-1 font-mono text-sm tracking-wider">
                          {u.loginCode}
                        </span>
                      </td>
                      <td className="tabular-nums text-base-content/70">
                        {u.age ?? '—'}
                      </td>
                      <td className="text-base-content/70">
                        {LANGS[u.language] ?? u.language}
                      </td>
                      <td>
                        <span
                          className="flex items-center gap-2"
                          title={dot.label}
                        >
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${dot.cls}`}
                          />
                          <span className="text-sm text-base-content/70">
                            {relativeTime(u.lastSeenAt)}
                          </span>
                        </span>
                      </td>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          className="toggle toggle-success toggle-sm align-middle"
                          checked={!u.disabled}
                          disabled={busyId === u.id}
                          onChange={(e) =>
                            void setDisabled(u, !e.target.checked)
                          }
                          aria-label={
                            u.disabled
                              ? 'Réactiver le compte'
                              : 'Désactiver le compte'
                          }
                          title={
                            u.disabled ? 'Compte désactivé' : 'Compte actif'
                          }
                        />
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="btn btn-square btn-ghost btn-sm hover:text-primary"
                            onClick={() => setEditing(u)}
                            aria-label="Modifier"
                            title="Modifier"
                          >
                            <Icon name="edit" />
                          </button>
                          <button
                            className="btn btn-square btn-ghost btn-sm"
                            disabled={busyId === u.id}
                            onClick={() => void regenerate(u)}
                            aria-label="Nouveau numéro"
                            title="Nouveau numéro"
                          >
                            <Icon name="code" />
                          </button>
                          <button
                            className="btn btn-square btn-ghost btn-sm hover:text-error"
                            disabled={busyId === u.id}
                            onClick={() => void remove(u)}
                            aria-label="Supprimer"
                            title="Supprimer"
                          >
                            <Icon name="trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

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
    <div
      className="modal modal-open modal-bottom sm:modal-middle"
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-box border border-base-300 sm:max-w-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {user ? 'Modifier le compte' : 'Nouveau compte'}
          </h3>
          <button
            type="button"
            className="btn btn-square btn-ghost btn-sm"
            onClick={onClose}
            aria-label="Fermer"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>

        {createdCode ? (
          <div className="space-y-4 py-6 text-center">
            <p className="text-sm text-base-content/70">
              Compte créé. Communiquez ce numéro de connexion à la personne :
            </p>
            <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-6">
              <div className="select-all font-mono text-4xl font-semibold tracking-[0.35em] text-base-content">
                {createdCode}
              </div>
            </div>
            <button className="btn btn-primary btn-block" onClick={onSaved}>
              Terminé
            </button>
          </div>
        ) : (
          <form className="space-y-5 pt-4" onSubmit={submit}>
            {!user && (
              <div>
                <span className="mb-1.5 block text-sm font-medium text-base-content/80">
                  Type de compte
                </span>
                <div className="join w-full">
                  <button
                    type="button"
                    className={`btn join-item flex-1 ${
                      f.role === 'user'
                        ? 'btn-primary'
                        : 'btn-ghost border border-base-300'
                    }`}
                    onClick={() => set('role', 'user')}
                    aria-pressed={f.role === 'user'}
                  >
                    Utilisateur
                  </button>
                  <button
                    type="button"
                    className={`btn join-item flex-1 ${
                      f.role === 'admin'
                        ? 'btn-primary'
                        : 'btn-ghost border border-base-300'
                    }`}
                    onClick={() => set('role', 'admin')}
                    aria-pressed={f.role === 'admin'}
                  >
                    Administrateur
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Prénom"
                required
                value={f.firstName}
                onChange={(v) => set('firstName', v)}
              />
              <Field
                label="Nom"
                required
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
                <label className="mb-1.5 block text-sm font-medium text-base-content/80">
                  Langue
                </label>
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
              <label className="mb-1.5 block text-sm font-medium text-base-content/80">
                Notes
              </label>
              <textarea
                className="textarea w-full"
                rows={3}
                value={f.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="Informations utiles (facultatif)"
              />
            </div>

            {error && (
              <div className="alert alert-error py-2 text-sm">
                <Icon name="warning" className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-base-200 pt-4">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
              >
                Annuler
              </button>
              <button
                className="btn btn-primary"
                disabled={busy || !f.firstName.trim() || !f.lastName.trim()}
              >
                {busy && (
                  <span className="loading loading-spinner loading-sm" />
                )}
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
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-base-content/80">
        {label}
        {required && <span className="text-error"> *</span>}
      </label>
      <input
        type={type}
        required={required}
        className="input w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
