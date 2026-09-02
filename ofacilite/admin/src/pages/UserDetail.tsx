import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  activityDot,
  api,
  LANGS,
  relativeTime,
  type ApiUser,
  type CareAppointment,
  type CareMedication,
  type CareMedicationEvent,
} from '../lib';
import { Icon } from '../ui';

const pad = (n: number) => String(n).padStart(2, '0');
const hhmm = (t: { hour: number; minute: number }) =>
  `${pad(t.hour)}:${pad(t.minute)}`;

const frDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '—';

const frDateTime = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

export function UserDetail() {
  const { id = '' } = useParams();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [meds, setMeds] = useState<CareMedication[]>([]);
  const [appts, setAppts] = useState<CareAppointment[]>([]);
  const [events, setEvents] = useState<CareMedicationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api<ApiUser>(`/admin/users/${id}`),
      api<CareMedication[]>(`/admin/users/${id}/medications`),
      api<CareAppointment[]>(`/admin/users/${id}/appointments`),
      api<CareMedicationEvent[]>(`/admin/users/${id}/medication-events`),
    ])
      .then(([u, m, a, e]) => {
        setUser(u);
        setMeds(m);
        setAppts(a);
        setEvents(e);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Erreur de chargement.'),
      )
      .finally(() => setLoading(false));
  }, [id]);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    return {
      upcoming: appts.filter((a) => new Date(a.scheduledAt).getTime() >= now),
      past: appts
        .filter((a) => new Date(a.scheduledAt).getTime() < now)
        .reverse(),
    };
  }, [appts]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <span className="loading loading-spinner text-primary" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="alert alert-error">
          <Icon name="warning" className="h-5 w-5" />
          <span>{error ?? 'Compte introuvable.'}</span>
        </div>
      </div>
    );
  }

  const dot = activityDot(user.lastSeenAt);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <BackLink />
        <header className="flex flex-wrap items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-base font-semibold text-primary">
            {`${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()}
          </span>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              {user.firstName} {user.lastName}
              {user.role === 'admin' && (
                <span className="badge badge-primary badge-sm">admin</span>
              )}
              {user.disabled && (
                <span className="badge badge-error badge-sm">désactivé</span>
              )}
            </h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-base-content/60">
              <span className={`h-2 w-2 rounded-full ${dot.cls}`} />
              {dot.label} · vu {relativeTime(user.lastSeenAt)}
            </p>
          </div>
        </header>
      </div>

      {/* Profil */}
      <Panel title="Profil" icon="users">
        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          <Field label="Numéro de connexion">
            <span className="rounded-md bg-base-200 px-2 py-1 font-mono tracking-wider">
              {user.loginCode}
            </span>
          </Field>
          <Field label="Rôle">
            {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
          </Field>
          <Field label="Téléphone">{user.phone || '—'}</Field>
          <Field label="Email">{user.email || '—'}</Field>
          <Field label="Date de naissance">
            {frDate(user.birthDate)}
            {user.age != null && (
              <span className="text-base-content/50"> ({user.age} ans)</span>
            )}
          </Field>
          <Field label="Langue">{LANGS[user.language] ?? user.language}</Field>
          <Field label="Compte créé le">{frDate(user.createdAt)}</Field>
          <Field label="Dernière connexion">
            {user.lastLoginAt ? frDateTime(user.lastLoginAt) : 'jamais'}
          </Field>
          {user.notes && (
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-base-content/50">
                Notes
              </dt>
              <dd className="mt-1 whitespace-pre-line text-sm">{user.notes}</dd>
            </div>
          )}
        </dl>
      </Panel>

      {/* Traitements */}
      <Panel title={`Traitements (${meds.length})`} icon="check">
        {meds.length === 0 ? (
          <Empty>Aucun traitement enregistré.</Empty>
        ) : (
          <ul className="divide-y divide-base-200">
            {meds.map((m) => (
              <li key={m.id} className="flex flex-wrap gap-x-6 gap-y-2 py-3">
                <div className="min-w-40 flex-1">
                  <p className="font-medium">{m.name}</p>
                  <p className="text-xs text-base-content/55">
                    {m.startDate
                      ? `Depuis le ${frDate(m.startDate)}`
                      : 'Début non renseigné'}
                    {m.durationDays ? ` · ${m.durationDays} j` : ''}
                    {m.endDate ? ` · fin prévue le ${frDate(m.endDate)}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-start gap-1.5">
                  {m.times.length === 0 ? (
                    <span className="text-xs text-base-content/45">
                      Pas d'horaire
                    </span>
                  ) : (
                    m.times.map((t, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-sm text-primary"
                      >
                        {hhmm(t)}
                      </span>
                    ))
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* Rendez-vous */}
      <Panel title={`Rendez-vous (${appts.length})`} icon="bell">
        {appts.length === 0 ? (
          <Empty>Aucun rendez-vous enregistré.</Empty>
        ) : (
          <div className="space-y-4">
            <ApptList label="À venir" items={upcoming} tone="text-base-content" />
            <ApptList label="Passés" items={past} tone="text-base-content/45" />
          </div>
        )}
      </Panel>

      {/* Prises de médicaments */}
      <Panel title="Prises récentes" icon="info">
        {events.length === 0 ? (
          <Empty>Aucune réponse au rappel pour l'instant.</Empty>
        ) : (
          <ul className="divide-y divide-base-200">
            {events.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-3 py-2.5 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      e.status === 'missed' ? 'bg-error' : 'bg-success'
                    }`}
                  />
                  <span className="font-medium">{e.medicationName}</span>
                  <span
                    className={
                      e.status === 'missed'
                        ? 'text-error'
                        : 'text-base-content/60'
                    }
                  >
                    {e.status === 'missed' ? 'non pris' : 'pris'}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-base-content/40">
                  {frDateTime(e.reportedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/users"
      className="inline-flex items-center gap-1 text-sm text-base-content/60 hover:text-primary"
    >
      <span aria-hidden>←</span> Retour à la liste
    </Link>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: 'users' | 'check' | 'bell' | 'info';
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-base-300 bg-base-100 shadow-sm">
      <div className="flex items-center gap-2 border-b border-base-300 p-4 text-sm font-semibold">
        <Icon name={icon} className="h-4 w-4 text-base-content/50" />
        {title}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-base-content/50">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm">{children}</dd>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="py-6 text-center text-sm text-base-content/45">{children}</p>
  );
}

function ApptList({
  label,
  items,
  tone,
}: {
  label: string;
  items: CareAppointment[];
  tone: string;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-wide text-base-content/50">
        {label}
      </p>
      <ul className="divide-y divide-base-200">
        {items.map((a) => (
          <li
            key={a.id}
            className={`flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5 ${tone}`}
          >
            <span className="font-medium">
              {a.title}
              {a.doctorName && (
                <span className="font-normal text-base-content/55">
                  {' '}
                  — {a.doctorName}
                </span>
              )}
            </span>
            <span className="text-sm tabular-nums">
              {frDateTime(a.scheduledAt)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
