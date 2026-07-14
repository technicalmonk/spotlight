'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ChartModel {
  name: string;
  inputPrice: number;
  outputPrice: number;
}

interface PriceChartProps {
  models: ChartModel[];
}

export function PriceChart({ models }: PriceChartProps) {
  const data = models.map((m) => ({
    name: m.name.length > 20 ? m.name.substring(0, 20) + "..." : m.name,
    "Input $/1M": m.inputPrice,
    "Output $/1M": m.outputPrice,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            fontSize: "12px",
          }}
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
        <Bar dataKey="Input $/1M" fill="#0066ff" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Output $/1M" fill="#94a3b8" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
