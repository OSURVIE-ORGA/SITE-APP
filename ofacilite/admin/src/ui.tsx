import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from './auth';

/* ═══════════════════════════ Icônes (SVG inline) ═══════════════════════════ */

const ICONS = {
  home: 'M2.25 12 11.2 3.045c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
  users:
    'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z',
  bell: 'M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0',
  logout:
    'M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75',
  menu: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5',
  search:
    'm21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z',
  plus: 'M12 4.5v15m7.5-7.5h-15',
  check: 'm4.5 12.75 6 6 9-13.5',
  warning:
    'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z',
  info: 'M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z',
  close: 'M6 18 18 6M6 6l12 12',
  external:
    'M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25',
  edit: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z',
  code: 'M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5',
  trash:
    'm14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0',
};

export function Icon({
  name,
  className = 'h-5 w-5',
}: {
  name: keyof typeof ICONS;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.7}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={ICONS[name]} />
    </svg>
  );
}

/* ═════════════════ Boîtes de dialogue (vraies modales centrées) ════════════ */

interface DialogOpts {
  title: string;
  message?: string;
  tone?: 'primary' | 'error' | 'success';
  confirmLabel?: string;
  cancelLabel?: string;
}
interface DialogInternal extends DialogOpts {
  kind: 'confirm' | 'alert';
  resolve: (ok: boolean) => void;
}

const TONE_META: Record<
  string,
  { btn: string; text: string; icon: keyof typeof ICONS }
> = {
  primary: { btn: 'btn-primary', text: 'text-primary', icon: 'info' },
  error: { btn: 'btn-error', text: 'text-error', icon: 'warning' },
  success: { btn: 'btn-success', text: 'text-success', icon: 'check' },
};

const DialogCtx = createContext<{
  confirm: (o: DialogOpts) => Promise<boolean>;
  alert: (o: DialogOpts) => Promise<boolean>;
} | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [d, setD] = useState<DialogInternal | null>(null);

  const value = useMemo(
    () => ({
      confirm: (o: DialogOpts) =>
        new Promise<boolean>((resolve) =>
          setD({ ...o, kind: 'confirm', resolve }),
        ),
      alert: (o: DialogOpts) =>
        new Promise<boolean>((resolve) =>
          setD({ ...o, kind: 'alert', resolve }),
        ),
    }),
    [],
  );

  const done = (ok: boolean) => {
    d?.resolve(ok);
    setD(null);
  };

  const meta = TONE_META[d?.tone ?? 'primary'];

  return (
    <DialogCtx.Provider value={value}>
      {children}
      {d && (
        <div
          className="modal modal-open modal-bottom sm:modal-middle"
          role="alertdialog"
          aria-modal="true"
        >
          <div className="modal-box border border-base-300 sm:max-w-md">
            <div className="flex items-start gap-3.5">
              <span
                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-base-200 ${meta.text}`}
              >
                <Icon name={meta.icon} className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold">{d.title}</h3>
                {d.message && (
                  <p className="mt-1 whitespace-pre-line text-sm text-base-content/70">
                    {d.message}
                  </p>
                )}
              </div>
            </div>
            <div className="modal-action mt-6">
              {d.kind === 'confirm' && (
                <button
                  className="btn btn-ghost"
                  onClick={() => done(false)}
                >
                  {d.cancelLabel ?? 'Annuler'}
                </button>
              )}
              <button
                className={`btn ${meta.btn}`}
                autoFocus
                onClick={() => done(true)}
              >
                {d.confirmLabel ?? 'OK'}
              </button>
            </div>
          </div>
          <button
            type="button"
            className="modal-backdrop"
            aria-label="Fermer"
            onClick={() => done(false)}
          />
        </div>
      )}
    </DialogCtx.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogCtx);
  if (!ctx) throw new Error('useDialog hors DialogProvider');
  return ctx;
}

/* ═══════════════════════════════ Layout ═══════════════════════════════════ */

const NAV = [
  { to: '/', label: "Vue d'ensemble", end: true, icon: 'home' as const },
  { to: '/users', label: 'Utilisateurs', end: false, icon: 'users' as const },
  { to: '/alerts', label: 'Alertes', end: false, icon: 'bell' as const },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-content">
        O
      </span>
      <div className="leading-tight">
        <p className="font-bold tracking-tight">O'Facilit</p>
        {!compact && (
          <p className="text-xs text-base-content/50">Administration</p>
        )}
      </div>
    </div>
  );
}

export function Layout({ unread = 0 }: { unread?: number }) {
  const { user, logout } = useAuth();
  const initials =
    `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() ||
    'A';

  return (
    <div className="drawer lg:drawer-open">
      <input id="nav" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-base-300 bg-base-100/95 px-4 py-2.5 backdrop-blur lg:hidden">
          <label
            htmlFor="nav"
            className="btn btn-square btn-ghost btn-sm"
            aria-label="Ouvrir le menu"
          >
            <Icon name="menu" />
          </label>
          <Brand compact />
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <Outlet />
        </main>
      </div>

      <div className="drawer-side z-30">
        <label
          htmlFor="nav"
          className="drawer-overlay"
          aria-label="Fermer le menu"
        />
        <aside className="flex min-h-screen w-64 flex-col border-r border-base-300 bg-base-100">
          <div className="px-5 py-5">
            <Brand />
          </div>

          <nav className="flex-1 space-y-1 px-3">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-base-content/70 hover:bg-base-200 hover:text-base-content',
                  ].join(' ')
                }
              >
                <Icon name={n.icon} className="h-5 w-5 shrink-0" />
                <span className="flex-1">{n.label}</span>
                {n.to === '/alerts' && unread > 0 && (
                  <span className="badge badge-error badge-sm font-semibold">
                    {unread}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-base-300 p-3">
            <div className="flex items-center gap-3 px-2 py-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-base-content/50">Administrateur</p>
              </div>
            </div>
            <button
              className="btn btn-ghost btn-sm mt-1 w-full justify-start gap-2 text-base-content/70"
              onClick={() => void logout()}
            >
              <Icon name="logout" className="h-4 w-4" />
              Se déconnecter
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ════════════════ Carte + graphes (SVG/CSS, zéro dépendance) ═══════════════ */

export function Card({
  title,
  children,
  className = '',
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-base-300 bg-base-100 shadow-sm ${className}`}
    >
      <header className="border-b border-base-300 px-5 py-3.5">
        <h3 className="text-sm font-semibold text-base-content/80">{title}</h3>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function VBars({
  data,
  height = 170,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <div className="mb-1.5 text-xs tabular-nums text-base-content/45">
        max&nbsp;{max}
      </div>
      <div className="relative" style={{ height }}>
        {[0, 0.5, 1].map((f) => (
          <div
            key={f}
            className="absolute inset-x-0 border-t border-dashed border-base-300/70"
            style={{ top: `${f * 100}%` }}
          />
        ))}
        <div className="absolute inset-0 flex items-end gap-2 pt-5">
          {data.map((d, i) => (
            <div
              key={i}
              className="group relative flex h-full flex-1 items-end justify-center"
            >
              <div
                className="relative w-full max-w-9 rounded-t-md bg-primary/75 transition-colors group-hover:bg-primary"
                style={{ height: `${(d.value / max) * 100}%` }}
                title={`${d.label} : ${d.value}`}
              >
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 -translate-y-full text-xs font-medium tabular-nums text-base-content/55">
                  {d.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex gap-2">
        {data.map((d, i) => (
          <span
            key={i}
            className="flex-1 truncate text-center text-xs text-base-content/45"
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function HBars({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div
          key={i}
          className="grid grid-cols-[7rem_1fr_2.5rem] items-center gap-3 text-sm"
        >
          <span className="truncate text-base-content/70" title={d.label}>
            {d.label}
          </span>
          <span className="h-2.5 overflow-hidden rounded-full bg-base-200">
            <span
              className="block h-full rounded-full bg-accent"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </span>
          <span className="text-right font-medium tabular-nums text-base-content/70">
            {d.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Donut({
  segments,
  size = 168,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const stroke = 18;
  const r = (size - stroke) / 2 - 2;
  const c = 2 * Math.PI * r;
  const gap = 3;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-base-200)"
            strokeWidth={stroke}
          />
          {segments.map((s, i) => {
            if (s.value <= 0) return null;
            const len = (s.value / total) * c;
            const dash = Math.max(len - gap, 0.001);
            const el = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeLinecap={dash > stroke ? 'round' : 'butt'}
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums">{total}</span>
          <span className="text-xs text-base-content/50">comptes</span>
        </div>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {segments.map((s, i) => (
          <li key={i} className="flex items-center gap-2.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: s.color }}
            />
            <span className="flex-1 text-base-content/70">{s.label}</span>
            <span className="font-medium tabular-nums">{s.value}</span>
            <span className="w-9 text-right text-xs tabular-nums text-base-content/45">
              {Math.round((s.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Line({
  points,
  height = 200,
}: {
  points: { label: string; value: number }[];
  height?: number;
}) {
  if (!points.length) {
    return <p className="text-sm text-base-content/45">Aucune donnée.</p>;
  }

  const max = Math.max(1, ...points.map((p) => p.value));
  const n = points.length;
  const coords = points.map((p, i) => ({
    x: n <= 1 ? 50 : (i / (n - 1)) * 100,
    y: 100 - (p.value / max) * 100,
  }));
  const line = coords.map((c, i) => `${i ? 'L' : 'M'}${c.x},${c.y}`).join(' ');
  const area = `${line} L100,100 L0,100 Z`;
  const last = coords[coords.length - 1];
  const labelIdx =
    n <= 4
      ? points.map((_, i) => i)
      : [0, Math.floor((n - 1) / 2), n - 1];

  return (
    <div>
      <div className="mb-1 text-xs tabular-nums text-base-content/45">
        max&nbsp;{max}
      </div>
      <div className="relative w-full" style={{ height }}>
        {[0, 0.5, 1].map((f) => (
          <div
            key={f}
            className="absolute inset-x-0 border-t border-dashed border-base-300/70"
            style={{ top: `${f * 100}%` }}
          />
        ))}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
        >
          <defs>
            <linearGradient id="ofa-line-fill" x1="0" x2="0" y1="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-primary)"
                stopOpacity="0.22"
              />
              <stop
                offset="100%"
                stopColor="var(--color-primary)"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#ofa-line-fill)" />
          <path
            d={line}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <span
          className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-base-100 bg-primary"
          style={{ left: `${last.x}%`, top: `${last.y}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-base-content/45">
        {labelIdx.map((i) => (
          <span key={i}>{points[i]?.label}</span>
        ))}
      </div>
    </div>
  );
}
