import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Props {
  data: Array<{ timestamp: string; gapCount: number }>;
}

export const PerformanceMetrics: React.FC<Props> = ({ data }) => {
  return (
    <div className="w-full h-[300px] bg-secondary p-4 rounded-xl">
      <h3 className="text-white mb-4 font-bold">Skill Gap Improvement Trend</h3>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="timestamp" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px' }} />
          <Line type="monotone" dataKey="gapCount" stroke="#818cf8" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
