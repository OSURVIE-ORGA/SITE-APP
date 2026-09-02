import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth';

export function Login() {
  const { login } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(code.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de la connexion.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-base-200 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-content">
            O
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight">O'Facilit</h1>
            <p className="text-sm text-base-content/55">Espace administration</p>
          </div>
        </div>

        <div className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm">
          <form className="space-y-4" onSubmit={submit}>
            <div>
              <label
                htmlFor="code"
                className="mb-1.5 block text-sm font-medium text-base-content/80"
              >
                Numéro d'administrateur
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                autoFocus
                className="input input-lg w-full text-center text-lg tracking-[0.3em]"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 16))
                }
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="alert alert-error py-2 text-sm">
                <span>{error}</span>
              </div>
            )}

            <button
              className="btn btn-primary btn-lg btn-block"
              disabled={busy || code.length < 4}
            >
              {busy && <span className="loading loading-spinner loading-sm" />}
              Se connecter
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-base-content/40">
          Accès réservé aux administrateurs des associations partenaires.
        </p>
      </div>
    </div>
  );
}
