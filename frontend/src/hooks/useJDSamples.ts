import { useState, useEffect } from 'react';
import axios from 'axios';

interface JDSampleMetadata {
  company: string;
  experience: string;
  location: string;
  industry_preference: string;
}

interface JDSample {
  id: string;
  day_number: number;
  role: string;
  description: string;
  metadata: JDSampleMetadata;
}

interface UseJDSamplesReturn {
  samples: JDSample[];
  loading: boolean;
  error: string | null;
  totalCount: number;
}

export function useJDSamples(limit: number = 50): UseJDSamplesReturn {
  const [samples, setSamples] = useState<JDSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchSamples = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch samples
        const samplesResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/jd-samples?limit=${limit}`
        );
        setSamples(samplesResponse.data);

        // Fetch count
        const countResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/jd-samples/count/total`
        );
        setTotalCount(countResponse.data.total);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch JD samples';
        setError(message);
        console.error('Error fetching JD samples:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSamples();
  }, [limit]);

  return { samples, loading, error, totalCount };
}
