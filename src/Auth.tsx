import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Auth({ onSignIn }: { onSignIn?: (user: any) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [message, setMessage] = useState('');

  const signIn = async () => {
    if (!supabase) return setMessage('Supabase nicht konfiguriert');
    setLoading(true);
    setMessage('');
    try {
      const res = await supabase.auth.signInWithPassword({ email, password });
      if (res.error) setMessage(res.error.message || 'Fehler beim Einloggen');
      else if (res.data?.user) onSignIn?.(res.data.user);
    } catch (err: any) {
      setMessage(err.message || 'Fehler');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async () => {
    if (!supabase) return setMessage('Supabase nicht konfiguriert');
    setLoading(true);
    setMessage('');
    try {
      const res = await supabase.auth.signUp({ email, password });
      if (res.error) setMessage(res.error.message || 'Fehler beim Registrieren');
      else setMessage('Registrierung erfolgreich — prüfe deine E-Mails oder melde dich an.');
    } catch (err: any) {
      setMessage(err.message || 'Fehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-6 rounded-2xl shadow">
      <h2 className="text-xl font-bold mb-4">{mode === 'signin' ? 'Anmelden' : 'Registrieren'}</h2>
      <input
        className="w-full mb-3 px-3 py-2 border rounded"
        placeholder="E-Mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        className="w-full mb-3 px-3 py-2 border rounded"
        placeholder="Passwort"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {message && <div className="mb-3 text-sm text-red-600">{message}</div>}

      <div className="flex gap-2">
        {mode === 'signin' ? (
          <button onClick={signIn} disabled={loading} className="px-4 py-2 bg-orange-500 text-white rounded">
            {loading ? '...' : 'Anmelden'}
          </button>
        ) : (
          <button onClick={signUp} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded">
            {loading ? '...' : 'Registrieren'}
          </button>
        )}

        <button
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="px-4 py-2 bg-gray-100 rounded"
        >
          {mode === 'signin' ? 'Registrieren' : 'Zurück'}
        </button>
      </div>
    </div>
  );
}
