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
    <div className="grid min-h-full place-items-center bg-base-200 p-4">
      <div className="card w-full max-w-sm bg-base-100 shadow-xl">
        <form className="card-body gap-4" onSubmit={submit}>
          <div>
            <h1 className="text-xl font-bold">O'Facilit — Administration</h1>
            <p className="text-sm text-base-content/60">
              Entrez votre numéro d'administrateur.
            </p>
          </div>

          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            aria-label="Numéro"
            className="input input-lg input-bordered w-full tracking-widest"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, '').slice(0, 16))
            }
            placeholder="Numéro"
          />

          {error && (
            <div className="alert alert-error py-2 text-sm">{error}</div>
          )}

          <button
            className="btn btn-primary btn-block"
            disabled={busy || code.length < 4}
          >
            {busy && <span className="loading loading-spinner loading-sm" />}
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}
