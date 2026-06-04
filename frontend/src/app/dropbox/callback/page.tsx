"use client";
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { API_BASE } from "@/utils/apiConfig";

function DropboxCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const codeVerifier = localStorage.getItem('dropbox_code_verifier');

    if (!code || !codeVerifier || !state) {
      setStatus('error');
      setErrorMsg('Authorization code, state, or verifier missing.');
      return;
    }

    const completeAuth = async () => {
      try {
        await axios.get(`${API_BASE}/dropbox/callback`, {
          params: { code, code_verifier: codeVerifier, state }
        });
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
  }, [searchParams, router]);

  return (
    <div className="container layout-conversational">
      <div className="glass-panel text-center" style={{ maxWidth: '400px' }}>
        {status === 'loading' && (
          <>
            <Loader2 className="animate-spin" size={48} style={{ margin: '0 auto 1.5rem', color: 'var(--primary)' }} />
            <h2>Connecting Dropbox...</h2>
            <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Finalizing secure handshake.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 size={48} style={{ margin: '0 auto 1.5rem', color: 'var(--accent)' }} />
            <h2>Success!</h2>
            <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Your account is connected. Redirecting...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={48} style={{ margin: '0 auto 1.5rem', color: 'var(--danger)' }} />
            <h2>Connection Failed</h2>
            <p style={{ color: '#ef4444', marginTop: '0.5rem' }}>{errorMsg}</p>
            <button onClick={() => router.push('/')} className="secondary" style={{ marginTop: '1.5rem' }}>
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
