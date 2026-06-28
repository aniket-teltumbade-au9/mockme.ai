"use client";
import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

interface SkillHeatmapProps {
  data: { category: string; score: number }[];
}

export const SkillHeatmap: React.FC<SkillHeatmapProps> = ({ data }) => {
  // Normalize score to 0-100 if it's 0-10, just to be safe
  const chartData = data.map((d) => ({
    category: d.category,
    score: d.score > 10 ? d.score : d.score * 10,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
        <PolarGrid stroke="#ffffff20" />
        <PolarAngleAxis dataKey="category" tick={{ fill: "#ffffff", fontSize: 12 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
        <Radar
          name="Skills"
          dataKey="score"
          stroke="var(--primary)"
          fill="var(--primary)"
          fillOpacity={0.6}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};


