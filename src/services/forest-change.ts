import axios from 'axios';
import type { Polygon, ForestChangeData } from '@/types';
import { getBoundingBox, formatDate } from '@/lib/utils';

const GFW_API_URL = 'https://data-api.globalforestwatch.org';

interface GFWTreeCoverLossResponse {
  data: {
    attributes: {
      treeCoverLoss: number;
      treeCoverGain: number;
      treeCoverExtent: number;
    };
  };
}

export async function fetchForestChangeData(
  polygon: Polygon,
  startYear: number = 2020,
  endYear: number = new Date().getFullYear()
): Promise<ForestChangeData> {
  const gfwApiKey = process.env.GFW_API_KEY;
  
  if (!gfwApiKey) {
    console.warn('GFW API key not configured, using mock data');
    return generateMockForestChangeData(polygon);
  }
  
  try {
    const geoJson = {
      type: 'Feature',
      geometry: polygon,
      properties: {},
    };
    
    const response = await axios.post<GFWTreeCoverLossResponse>(
      `${GFW_API_URL}/dataset/umd_tree_cover_loss/latest/query`,
      {
        geometry: geoJson,
        sql: `SELECT SUM(area__ha) as treeCoverLoss FROM data WHERE umd_tree_cover_loss__year >= ${startYear} AND umd_tree_cover_loss__year <= ${endYear}`,
      },
      {
        headers: {
          'x-api-key': gfwApiKey,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const lossArea = response.data.data.attributes.treeCoverLoss || 0;
    const gainArea = response.data.data.attributes.treeCoverGain || 0;
    
    return {
      loss_detected: lossArea > 0.1,
      gain_detected: gainArea > 0.1,
      loss_area_ha: Math.round(lossArea * 100) / 100,
      gain_area_ha: Math.round(gainArea * 100) / 100,
      last_change_date: lossArea > 0 || gainArea > 0 ? formatDate(new Date()) : undefined,
    };
  } catch (error) {
    console.error('Error fetching GFW data:', error);
    return generateMockForestChangeData(polygon);
  }
}

export function generateMockForestChangeData(polygon: Polygon): ForestChangeData {
  const bbox = getBoundingBox(polygon);
  const areaApprox = Math.abs((bbox[2] - bbox[0]) * (bbox[3] - bbox[1])) * 10000;
  
  const hasLoss = Math.random() < 0.15;
  const hasGain = Math.random() < 0.25;
  
  const lossArea = hasLoss ? Math.random() * areaApprox * 0.05 : 0;
  const gainArea = hasGain ? Math.random() * areaApprox * 0.08 : 0;
  
  return {
    loss_detected: hasLoss,
    gain_detected: hasGain,
    loss_area_ha: Math.round(lossArea * 100) / 100,
    gain_area_ha: Math.round(gainArea * 100) / 100,
    last_change_date: hasLoss || hasGain ? formatDate(new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)) : undefined,
  };
}

export function detectForestChangeFromNDVI(
  ndviTimeSeries: { date: string; ndvi: number }[],
  threshold: number = 0.15
): { loss_detected: boolean; gain_detected: boolean; change_magnitude: number } {
  if (ndviTimeSeries.length < 4) {
    return { loss_detected: false, gain_detected: false, change_magnitude: 0 };
  }
  
  const recentValues = ndviTimeSeries.slice(-4).map(d => d.ndvi);
  const historicalValues = ndviTimeSeries.slice(0, -4).map(d => d.ndvi);
  
  const recentMean = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
  const historicalMean = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length;
  
  const changeMagnitude = recentMean - historicalMean;
  
  return {
    loss_detected: changeMagnitude < -threshold,
    gain_detected: changeMagnitude > threshold,
    change_magnitude: Math.round(changeMagnitude * 1000) / 1000,
  };
}

export async function fetchTreeCoverExtent(polygon: Polygon): Promise<number> {
  const gfwApiKey = process.env.GFW_API_KEY;
  
  if (!gfwApiKey) {
    return Math.random() * 80 + 10;
  }
  
  try {
    const geoJson = {
      type: 'Feature',
      geometry: polygon,
      properties: {},
    };
    
    const response = await axios.post(
      `${GFW_API_URL}/dataset/umd_tree_cover_density_2000/latest/query`,
      {
        geometry: geoJson,
        sql: 'SELECT AVG(umd_tree_cover_density_2000__threshold) as treeCoverPercent FROM data',
      },
      {
        headers: {
          'x-api-key': gfwApiKey,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data.data.attributes.treeCoverPercent || 0;
  } catch (error) {
    console.error('Error fetching tree cover extent:', error);
    return Math.random() * 80 + 10;
  }
}
