import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as turf from '@turf/turf';
import type { Polygon, Coordinates } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculatePolygonArea(polygon: Polygon): number {
  const turfPolygon = turf.polygon(polygon.coordinates);
  const areaM2 = turf.area(turfPolygon);
  return areaM2 / 10000;
}

export function calculateCentroid(polygon: Polygon): Coordinates {
  const turfPolygon = turf.polygon(polygon.coordinates);
  const centroid = turf.centroid(turfPolygon);
  return {
    lng: centroid.geometry.coordinates[0],
    lat: centroid.geometry.coordinates[1],
  };
}

export function getBoundingBox(polygon: Polygon): [number, number, number, number] {
  const turfPolygon = turf.polygon(polygon.coordinates);
  const bbox = turf.bbox(turfPolygon);
  return bbox as [number, number, number, number];
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

export function formatNumber(num: number, decimals: number = 2): string {
  return num.toFixed(decimals);
}

export function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

export function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0;
  
  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - yMean);
    denominator += (i - xMean) ** 2;
  }
  
  return denominator === 0 ? 0 : numerator / denominator;
}

export function calculateSPI(precipitation: number, mean: number, stdDev: number): number {
  return calculateZScore(precipitation, mean, stdDev);
}

export function polygonToWKT(polygon: Polygon): string {
  const coords = polygon.coordinates[0]
    .map(([lng, lat]) => `${lng} ${lat}`)
    .join(', ');
  return `POLYGON((${coords}))`;
}

export function wktToPolygon(wkt: string): Polygon {
  const coordsMatch = wkt.match(/POLYGON\(\((.+)\)\)/);
  if (!coordsMatch) throw new Error('Invalid WKT format');
  
  const coords = coordsMatch[1].split(', ').map(pair => {
    const [lng, lat] = pair.split(' ').map(Number);
    return [lng, lat];
  });
  
  return {
    type: 'Polygon',
    coordinates: [coords],
  };
}

export function generateId(): string {
  return `farm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function downloadJSON(data: object, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
