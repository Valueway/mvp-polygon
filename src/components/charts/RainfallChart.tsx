'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { RainfallData } from '@/types';

interface RainfallChartProps {
  data: RainfallData[];
}

export default function RainfallChart({ data }: RainfallChartProps) {
  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit',
    }),
    precipitation: Math.round(item.precipitation_mm),
    anomaly: Math.round(item.anomaly * 100) / 100,
  }));

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
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
            yAxisId="left"
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#9ca3af' }}
            label={{
              value: 'Precipitation (mm)',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 12 },
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[-3, 3]}
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#9ca3af' }}
            label={{
              value: 'SPI',
              angle: 90,
              position: 'insideRight',
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
            formatter={(value: number, name: string) => {
              if (name === 'precipitation') return [`${value} mm`, 'Precipitation'];
              return [value.toFixed(2), 'SPI Anomaly'];
            }}
          />
          <Legend />
          <ReferenceLine
            yAxisId="right"
            y={0}
            stroke="#9ca3af"
            strokeDasharray="5 5"
          />
          <ReferenceLine
            yAxisId="right"
            y={-1.5}
            stroke="#ef4444"
            strokeDasharray="3 3"
            label={{ value: 'Drought', position: 'right', fontSize: 10, fill: '#ef4444' }}
          />
          <Bar
            yAxisId="left"
            dataKey="precipitation"
            name="Precipitation"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
