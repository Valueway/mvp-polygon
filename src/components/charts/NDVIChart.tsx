'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { VegetationIndex } from '@/types';

interface NDVIChartProps {
  data: VegetationIndex[];
  showEVI?: boolean;
}

export default function NDVIChart({ data, showEVI = true }: NDVIChartProps) {
  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    ndvi: Math.round(item.ndvi * 1000) / 1000,
    evi: Math.round(item.evi * 1000) / 1000,
  }));

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#9ca3af' }}
          />
          <YAxis
            domain={[0, 1]}
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#9ca3af' }}
            label={{
              value: 'Index Value',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 12 },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          />
          <Legend />
          <ReferenceLine
            y={0.5}
            stroke="#9ca3af"
            strokeDasharray="5 5"
            label={{ value: 'Healthy threshold', position: 'right', fontSize: 10 }}
          />
          <Line
            type="monotone"
            dataKey="ndvi"
            name="NDVI"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ fill: '#22c55e', strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5 }}
          />
          {showEVI && (
            <Line
              type="monotone"
              dataKey="evi"
              name="EVI"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
