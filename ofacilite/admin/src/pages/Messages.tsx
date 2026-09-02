import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  api,
  relativeTime,
  type ApiUser,
  type ChatMessage,
  type MessageThread,
} from '../lib';
import { Icon } from '../ui';

export function Messages() {
  const [params, setParams] = useSearchParams();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [active, setActive] = useState<string | null>(params.get('user'));
  const [peerName, setPeerName] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const loadThreads = useCallback(async () => {
    try {
      const list = await api<MessageThread[]>('/admin/messages');
      setThreads(list);
      setPeerName((prev) => {
        const next = { ...prev };
        for (const t of list) next[t.userId] = t.userName;
        return next;
      });
      setActive((cur) => cur ?? list[0]?.userId ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement.');
    } finally {
      setLoadingThreads(false);
    }
  }, []);

  // Résout le nom d'une personne ouverte sans fil existant (bouton + ou ?user=).
  useEffect(() => {
    if (!active || peerName[active]) return;
    void api<ApiUser>(`/admin/users/${active}`)
      .then((u) =>
        setPeerName((prev) => ({
          ...prev,
          [active]: `${u.firstName} ${u.lastName}`,
        })),
      )
      .catch(() => {});
  }, [active, peerName]);

  const openThread = (userId: string, name?: string) => {
    setActive(userId);
    if (name) setPeerName((prev) => ({ ...prev, [userId]: name }));
    setPicking(false);
    if (params.get('user')) setParams({}, { replace: true });
  };

  const loadThread = useCallback(async (userId: string) => {
    try {
      setMessages(await api<ChatMessage[]>(`/admin/users/${userId}/messages`));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement.');
    }
  }, []);

  useEffect(() => {
    void loadThreads();
    const id = setInterval(loadThreads, 15_000);
    return () => clearInterval(id);
  }, [loadThreads]);

  useEffect(() => {
    if (!active) return;
    void loadThread(active);
    const id = setInterval(() => void loadThread(active), 10_000);
    return () => clearInterval(id);
  }, [active, loadThread]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  const send = async () => {
    const body = draft.trim();
    if (!body || !active || sending) return;
    setSending(true);
    setDraft('');
    try {
      const created = await api<ChatMessage>(
        `/admin/users/${active}/messages`,
        { method: 'POST', body: JSON.stringify({ body }) },
      );
      setMessages((prev) => [...prev, created]);
      void loadThreads();
    } catch (err) {
      setDraft(body);
      setError(err instanceof Error ? err.message : 'Envoi impossible.');
    } finally {
      setSending(false);
    }
  };

  const activeName = active
    ? threads.find((t) => t.userId === active)?.userName ?? peerName[active]
    : undefined;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
          <p className="mt-1 text-sm text-base-content/60">
            Discussions avec les personnes accompagnées.
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm gap-2"
          onClick={() => setPicking(true)}
        >
          <Icon name="plus" className="h-4 w-4" />
          Nouvelle conversation
        </button>
      </header>

      {error && (
        <div className="alert alert-error">
          <Icon name="warning" className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
        {/* Liste des fils */}
        <section
          className={`rounded-xl border border-base-300 bg-base-100 shadow-sm ${
            active ? 'hidden lg:block' : ''
          }`}
        >
          {loadingThreads ? (
            <div className="py-16 text-center">
              <span className="loading loading-spinner text-primary" />
            </div>
          ) : threads.length === 0 ? (
            <p className="py-16 text-center text-sm text-base-content/45">
              Aucune conversation.
            </p>
          ) : (
            <ul className="divide-y divide-base-200">
              {threads.map((t) => (
                <li key={t.userId}>
                  <button
                    onClick={() => setActive(t.userId)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-base-200/60 ${
                      active === t.userId ? 'bg-primary/10' : ''
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                      {t.userName
                        .split(' ')
                        .map((p) => p[0] ?? '')
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">
                          {t.userName}
                        </span>
                        <span className="shrink-0 text-xs text-base-content/40">
                          {relativeTime(t.lastAt)}
                        </span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-2">
                        <span className="truncate text-xs text-base-content/55">
                          {t.lastFromAdmin && 'Vous : '}
                          {t.lastMessage}
                        </span>
                        {t.unread > 0 && (
                          <span className="badge badge-primary badge-xs shrink-0">
                            {t.unread}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Conversation */}
        <section
          className={`flex h-[70vh] flex-col rounded-xl border border-base-300 bg-base-100 shadow-sm ${
            active ? '' : 'hidden lg:flex'
          }`}
        >
          {!active ? (
            <div className="flex flex-1 items-center justify-center text-sm text-base-content/45">
              Choisissez une conversation ou démarrez-en une.
            </div>
          ) : (
            <>
              <header className="flex items-center gap-2 border-b border-base-300 px-4 py-3">
                <button
                  className="btn btn-ghost btn-sm btn-square lg:hidden"
                  onClick={() => setActive(null)}
                  aria-label="Retour"
                >
                  ←
                </button>
                <span className="font-semibold">{activeName ?? '…'}</span>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${
                      m.fromAdmin ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[75%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-sm ${
                        m.fromAdmin
                          ? 'rounded-br-sm bg-primary text-primary-content'
                          : 'rounded-bl-sm bg-base-200'
                      }`}
                    >
                      {m.body}
                      <span
                        className={`mt-1 block text-[11px] ${
                          m.fromAdmin
                            ? 'text-primary-content/70'
                            : 'text-base-content/45'
                        }`}
                      >
                        {relativeTime(m.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void send();
                }}
                className="flex items-end gap-2 border-t border-base-300 p-3"
              >
                <textarea
                  className="textarea textarea-bordered flex-1 resize-none"
                  rows={2}
                  placeholder="Votre réponse…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                />
                <button
                  className="btn btn-primary btn-square"
                  disabled={!draft.trim() || sending}
                  aria-label="Envoyer"
                >
                  {sending ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    <Icon name="check" className="h-5 w-5" />
                  )}
                </button>
              </form>
            </>
          )}
        </section>
      </div>

      {picking && (
        <UserPicker
          onClose={() => setPicking(false)}
          onPick={(u) => openThread(u.id, `${u.firstName} ${u.lastName}`)}
        />
      )}
    </div>
  );
}

function UserPicker({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (u: ApiUser) => void;
}) {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<ApiUser[]>('/admin/users')
      .then((list) => setUsers(list.filter((u) => u.role !== 'admin')))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s
      ? users.filter((u) =>
          `${u.firstName} ${u.lastName} ${u.loginCode}`
            .toLowerCase()
            .includes(s),
        )
      : users;
  }, [users, q]);

  return (
    <div className="modal modal-open modal-bottom sm:modal-middle">
      <div className="modal-box flex max-h-[80vh] flex-col border border-base-300 sm:max-w-md">
        <h3 className="text-lg font-bold">Nouvelle conversation</h3>
        <input
          type="search"
          autoFocus
          className="input input-bordered input-sm mt-3 w-full"
          placeholder="Rechercher une personne…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="mt-3 flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-10 text-center">
              <span className="loading loading-spinner text-primary" />
            </div>
          ) : shown.length === 0 ? (
            <p className="py-10 text-center text-sm text-base-content/45">
              Aucune personne.
            </p>
          ) : (
            <ul className="divide-y divide-base-200">
              {shown.map((u) => (
                <li key={u.id}>
                  <button
                    className="flex w-full items-center justify-between gap-3 px-1 py-2.5 text-left text-sm hover:bg-base-200/60"
                    onClick={() => onPick(u)}
                  >
                    <span className="font-medium">
                      {u.firstName} {u.lastName}
                    </span>
                    <span className="font-mono text-xs text-base-content/45">
                      {u.loginCode}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="modal-action">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Annuler
          </button>
        </div>
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
