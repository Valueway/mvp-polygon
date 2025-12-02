import axios from 'axios';
import type { Polygon, TerrainData, Coordinates } from '@/types';
import { calculateCentroid, getBoundingBox } from '@/lib/utils';

const OPEN_ELEVATION_API = 'https://api.open-elevation.com/api/v1';

interface ElevationResponse {
  results: Array<{
    latitude: number;
    longitude: number;
    elevation: number;
  }>;
}

export async function fetchTerrainData(polygon: Polygon): Promise<TerrainData> {
  const centroid = calculateCentroid(polygon);
  const bbox = getBoundingBox(polygon);
  
  try {
    const points = [
      { latitude: centroid.lat, longitude: centroid.lng },
      { latitude: bbox[1], longitude: bbox[0] },
      { latitude: bbox[3], longitude: bbox[2] },
      { latitude: bbox[1], longitude: bbox[2] },
      { latitude: bbox[3], longitude: bbox[0] },
    ];
    
    const response = await axios.post<ElevationResponse>(
      `${OPEN_ELEVATION_API}/lookup`,
      { locations: points }
    );
    
    const elevations = response.data.results.map(r => r.elevation);
    const centerElevation = elevations[0];
    const minElevation = Math.min(...elevations);
    const maxElevation = Math.max(...elevations);
    
    const horizontalDistance = Math.sqrt(
      Math.pow((bbox[2] - bbox[0]) * 111000, 2) +
      Math.pow((bbox[3] - bbox[1]) * 111000, 2)
    );
    const verticalDistance = maxElevation - minElevation;
    const slopeDegrees = Math.atan(verticalDistance / horizontalDistance) * (180 / Math.PI);
    
    const aspect = calculateAspect(elevations, bbox);
    
    return {
      slope_degrees: Math.round(slopeDegrees * 10) / 10,
      aspect: aspect,
      elevation_m: Math.round(centerElevation),
    };
  } catch (error) {
    console.error('Error fetching terrain data:', error);
    return generateMockTerrainData(centroid);
  }
}

function calculateAspect(elevations: number[], _bbox: number[]): string {
  const north = elevations[3] || elevations[0];
  const south = elevations[1] || elevations[0];
  const east = elevations[2] || elevations[0];
  const west = elevations[4] || elevations[0];
  
  const nsGradient = north - south;
  const ewGradient = east - west;
  
  const angle = Math.atan2(ewGradient, nsGradient) * (180 / Math.PI);
  
  if (angle >= -22.5 && angle < 22.5) return 'N';
  if (angle >= 22.5 && angle < 67.5) return 'NE';
  if (angle >= 67.5 && angle < 112.5) return 'E';
  if (angle >= 112.5 && angle < 157.5) return 'SE';
  if (angle >= 157.5 || angle < -157.5) return 'S';
  if (angle >= -157.5 && angle < -112.5) return 'SW';
  if (angle >= -112.5 && angle < -67.5) return 'W';
  return 'NW';
}

export function generateMockTerrainData(centroid: Coordinates): TerrainData {
  const baseElevation = 1200 + Math.abs(centroid.lat - 14.5) * 100;
  const elevation = baseElevation + (Math.random() - 0.5) * 400;
  
  const slope = 5 + Math.random() * 25;
  
  const aspects = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const aspect = aspects[Math.floor(Math.random() * aspects.length)];
  
  return {
    slope_degrees: Math.round(slope * 10) / 10,
    aspect: aspect,
    elevation_m: Math.round(elevation),
  };
}

export function classifySlope(slopeDegrees: number): string {
  if (slopeDegrees < 5) return 'Flat';
  if (slopeDegrees < 15) return 'Gentle';
  if (slopeDegrees < 25) return 'Moderate';
  if (slopeDegrees < 35) return 'Steep';
  return 'Very Steep';
}

export function isARRSuitable(terrain: TerrainData): boolean {
  return terrain.slope_degrees < 30 && terrain.elevation_m < 2500;
}

export function isIFMSuitable(terrain: TerrainData): boolean {
  return terrain.slope_degrees < 35;
}
