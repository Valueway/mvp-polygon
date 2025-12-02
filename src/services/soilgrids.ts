import axios from 'axios';
import type { Polygon, SOCData, Coordinates } from '@/types';
import { calculateCentroid } from '@/lib/utils';

const SOILGRIDS_API_URL = 'https://rest.isric.org/soilgrids/v2.0';

interface SoilGridsResponse {
  properties: {
    layers: Array<{
      name: string;
      depths: Array<{
        label: string;
        range: { top_depth: number; bottom_depth: number };
        values: { mean: number; uncertainty: number };
      }>;
    }>;
  };
}

export async function fetchSOCBaseline(polygon: Polygon): Promise<SOCData> {
  const centroid = calculateCentroid(polygon);
  
  try {
    const response = await axios.get<SoilGridsResponse>(
      `${SOILGRIDS_API_URL}/properties/query`,
      {
        params: {
          lon: centroid.lng,
          lat: centroid.lat,
          property: 'soc',
          depth: '0-30cm',
          value: 'mean',
        },
      }
    );
    
    const socLayer = response.data.properties.layers.find(l => l.name === 'soc');
    if (!socLayer) {
      throw new Error('SOC data not found in response');
    }
    
    const depth0_30 = socLayer.depths.find(d => d.label === '0-30cm');
    if (!depth0_30) {
      throw new Error('0-30cm depth data not found');
    }
    
    const baseline = depth0_30.values.mean / 10;
    const uncertainty = depth0_30.values.uncertainty / 10;
    
    return {
      baseline_0_30cm: baseline,
      projected: baseline,
      delta: 0,
      uncertainty: uncertainty,
    };
  } catch (error) {
    console.error('Error fetching SoilGrids data:', error);
    return generateMockSOCData(centroid);
  }
}

export function generateMockSOCData(centroid: Coordinates): SOCData {
  const latFactor = Math.abs(centroid.lat - 15) / 10;
  const baseSOC = 25 + latFactor * 10 + (Math.random() - 0.5) * 10;
  
  const delta = (Math.random() - 0.3) * 5;
  
  return {
    baseline_0_30cm: Math.round(baseSOC * 10) / 10,
    projected: Math.round((baseSOC + delta) * 10) / 10,
    delta: Math.round(delta * 10) / 10,
    uncertainty: Math.round((baseSOC * 0.15) * 10) / 10,
  };
}

export function estimateSOCChange(
  baseline: number,
  ndviTrend: number,
  rainfallAnomaly: number,
  yearsProjected: number = 5
): SOCData {
  const vegetationFactor = ndviTrend > 0 ? 0.5 : -0.3;
  const climateFactor = rainfallAnomaly > 0 ? 0.2 : -0.1;
  
  const annualChange = baseline * (vegetationFactor + climateFactor) * 0.02;
  const totalDelta = annualChange * yearsProjected;
  
  return {
    baseline_0_30cm: baseline,
    projected: Math.round((baseline + totalDelta) * 10) / 10,
    delta: Math.round(totalDelta * 10) / 10,
    uncertainty: Math.round((Math.abs(totalDelta) * 0.3) * 10) / 10,
  };
}

export async function fetchBulkDensity(polygon: Polygon): Promise<number> {
  const centroid = calculateCentroid(polygon);
  
  try {
    const response = await axios.get<SoilGridsResponse>(
      `${SOILGRIDS_API_URL}/properties/query`,
      {
        params: {
          lon: centroid.lng,
          lat: centroid.lat,
          property: 'bdod',
          depth: '0-30cm',
          value: 'mean',
        },
      }
    );
    
    const bdodLayer = response.data.properties.layers.find(l => l.name === 'bdod');
    if (!bdodLayer) {
      return 1.3;
    }
    
    const depth0_30 = bdodLayer.depths.find(d => d.label === '0-30cm');
    return depth0_30 ? depth0_30.values.mean / 100 : 1.3;
  } catch (error) {
    console.error('Error fetching bulk density:', error);
    return 1.3 + (Math.random() - 0.5) * 0.2;
  }
}
