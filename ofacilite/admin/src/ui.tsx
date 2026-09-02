import type { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from './auth';

/* ─────────────────────────── Layout ─────────────────────────── */

const NAV = [
  { to: '/', label: "Vue d'ensemble", end: true, icon: '📊' },
  { to: '/users', label: 'Utilisateurs', end: false, icon: '👥' },
  { to: '/alerts', label: 'Alertes', end: false, icon: '🔔' },
];

export function Layout({ unread = 0 }: { unread?: number }) {
  const { user, logout } = useAuth();

  return (
    <div className="drawer lg:drawer-open">
      <input id="nav" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex min-h-full flex-col bg-base-200">
        <header className="navbar sticky top-0 z-20 border-b border-base-300 bg-base-100 lg:hidden">
          <label htmlFor="nav" className="btn btn-square btn-ghost">
            ☰
          </label>
          <span className="ml-2 font-bold">O'Facilit — Admin</span>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      <div className="drawer-side z-30">
        <label htmlFor="nav" className="drawer-overlay" />
        <aside className="flex min-h-full w-64 flex-col border-r border-base-300 bg-base-100">
          <div className="flex items-center gap-2 p-4 text-lg font-bold">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            O'Facilit
          </div>
          <ul className="menu w-full flex-1 gap-1 px-2">
            {NAV.map((n) => (
              <li key={n.to}>
                <NavLink
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) => (isActive ? 'active' : '')}
                >
                  <span>{n.icon}</span>
                  {n.label}
                  {n.to === '/alerts' && unread > 0 && (
                    <span className="badge badge-error badge-sm ml-auto">
                      {unread}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="border-t border-base-300 p-3 text-sm">
            <div className="mb-2 opacity-60">
              {user?.firstName} {user?.lastName}
            </div>
            <button
              className="btn btn-outline btn-sm btn-block"
              onClick={() => void logout()}
            >
              Se déconnecter
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ──────────────── Cartes + graphes (SVG/CSS, zéro dépendance) ── */

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
    <div className={`card bg-base-100 shadow ${className}`}>
      <div className="card-body gap-3">
        <h3 className="text-sm font-semibold opacity-70">{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function VBars({
  data,
  height = 140,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => (
        <div
          key={i}
          className="group flex flex-1 flex-col items-center justify-end gap-1"
        >
          <span className="text-[10px] opacity-0 transition group-hover:opacity-70">
            {d.value}
          </span>
          <div
            className="w-full rounded-t bg-primary"
            style={{ height: `${(d.value / max) * (height - 24)}px` }}
            title={`${d.label} : ${d.value}`}
          />
          <span className="text-[9px] opacity-50">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function HBars({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3 text-sm">
          <span className="w-28 shrink-0 truncate opacity-70">{d.label}</span>
          <div className="h-3 flex-1 rounded bg-base-200">
            <div
              className="h-3 rounded bg-secondary"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
          <span className="w-8 text-right tabular-nums">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

export function Donut({
  segments,
  size = 150,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {segments.map((s, i) => {
            const len = (s.value / total) * c;
            const el = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={20}
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
        </g>
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-base-content text-lg font-bold"
        >
          {total}
        </text>
      </svg>
      <ul className="space-y-1 text-sm">
        {segments.map((s, i) => (
          <li key={i} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ background: s.color }}
            />
            {s.label}
            <span className="opacity-50">({s.value})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Line({
  points,
  height = 160,
}: {
  points: { label: string; value: number }[];
  height?: number;
}) {
  const w = 600;
  const pad = 24;
  const max = Math.max(1, ...points.map((p) => p.value));
  const step = (w - pad * 2) / Math.max(1, points.length - 1);
  const y = (v: number) => height - pad - (v / max) * (height - pad * 2);
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${pad + i * step} ${y(p.value)}`)
    .join(' ');
  const area = `${path} L ${pad + (points.length - 1) * step} ${height - pad} L ${pad} ${height - pad} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      className="w-full"
      preserveAspectRatio="none"
      style={{ height }}
    >
      <path d={area} className="fill-primary/15" />
      <path d={path} className="fill-none stroke-primary" strokeWidth={2} />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={pad + i * step}
          cy={y(p.value)}
          r={2.5}
          className="fill-primary"
        >
          <title>
            {p.label} : {p.value}
          </title>
        </circle>
      ))}
    </svg>
  );
}
