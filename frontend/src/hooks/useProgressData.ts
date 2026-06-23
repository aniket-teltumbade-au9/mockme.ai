import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE, authHeaders } from '@/utils/apiConfig';

interface SessionData {
  session_id: string;
  created_at: string;
  gaps: string[];
  resolved_gaps: string[];
  performance_score: number;
  hire_verdict?: string;
}

interface ProgressData {
  total_interviews: number;
  sessions: SessionData[];
  average_performance_score: number;
  gaps_resolved_count: number;
  total_gaps_identified: number;
}

interface UseProgressDataReturn {
  data: ProgressData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProgressData(): UseProgressDataReturn {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_BASE}/user/progress/detailed`, {
        headers: authHeaders(),
      });
      setData(res.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch progress data';
      setError(message);
      console.error('Error fetching progress data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchData();
    };
    loadData();
  }, []);

  return { data, loading, error, refetch: fetchData };
}
