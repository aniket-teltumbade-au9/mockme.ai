"use client";
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { API_BASE } from "@/utils/apiConfig";
import { useAuth } from "@/context/AuthContext";

function DropboxCallbackContent() {
  const { setDropboxAuth } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const codeVerifier = localStorage.getItem('dropbox_code_verifier');

    if (!code || !codeVerifier || !state) {
      queueMicrotask(() => {
        setStatus('error');
        setErrorMsg('Authorization code, state, or verifier missing.');
      });
      return;
    }

    const completeAuth = async () => {
      try {
        const res = await axios.get(`${API_BASE}/dropbox/callback`, {
          params: { code, code_verifier: codeVerifier, state }
        });

        setDropboxAuth(res.data.user_id, res.data.access_token);

        setStatus('success');
        localStorage.removeItem('dropbox_code_verifier');
        setTimeout(() => router.push('/'), 2000);
      } catch (err) {
        setStatus('error');
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        setErrorMsg(axiosErr.response?.data?.detail || 'Failed to complete authentication.');
      }
    };

    completeAuth();
  }, [searchParams, router, setDropboxAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel text-center max-w-[400px] w-full">
        {status === 'loading' && (
          <>
            <Loader2 className="animate-spin mx-auto mb-6 text-primary" size={48} />
            <h2 className="text-2xl font-bold mb-2">Connecting Dropbox...</h2>
            <p className="text-slate-400 text-sm mt-2">Finalizing secure handshake.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="mx-auto mb-6 text-emerald-400" size={48} />
            <h2 className="text-2xl font-bold mb-2">Success!</h2>
            <p className="text-slate-400 text-sm mt-2">Your account is connected. Redirecting...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="mx-auto mb-6 text-red-400" size={48} />
            <h2 className="text-2xl font-bold mb-2">Connection Failed</h2>
            <p className="text-red-400 text-sm mt-2">{errorMsg}</p>
            <button onClick={() => router.push('/')} className="secondary mt-6">
              Back to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function DropboxCallback() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DropboxCallbackContent />
    </Suspense>
  );
}
