import { useCallback, useEffect, useRef, useState } from 'react';
import {
  api,
  relativeTime,
  type ChatMessage,
  type MessageThread,
} from '../lib';
import { Icon } from '../ui';

export function Messages() {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const loadThreads = useCallback(async () => {
    try {
      const list = await api<MessageThread[]>('/admin/messages');
      setThreads(list);
      setActive((cur) => cur ?? list[0]?.userId ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement.');
    } finally {
      setLoadingThreads(false);
    }
  }, []);

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

  const activeThread = threads.find((t) => t.userId === active);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="mt-1 text-sm text-base-content/60">
          Discussions avec les personnes accompagnées.
        </p>
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
          {!activeThread ? (
            <div className="flex flex-1 items-center justify-center text-sm text-base-content/45">
              Choisissez une conversation.
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
                <span className="font-semibold">{activeThread.userName}</span>
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
    </div>
  );
}
