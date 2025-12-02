import type { 
  Farm, 
  FarmDetailData, 
  FarmMRVData, 
  VegetationData, 
  Alert
} from '@/types';
import { generateMockVegetationData } from './sentinel-hub';
import { 
  generateMockRainfallData, 
  generateMockTemperatureData, 
  calculateClimateAnomalies 
} from './climate';
import { generateMockSOCData, estimateSOCChange } from './soilgrids';
import { generateMockForestChangeData, detectForestChangeFromNDVI } from './forest-change';
import { generateMockTerrainData } from './terrain';
import { calculateTrend, calculateCentroid, calculateZScore } from '@/lib/utils';

export async function fetchFarmDetailData(farm: Farm): Promise<FarmDetailData> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);
  
  const vegetationTimeSeries = generateMockVegetationData(startDate, endDate);
  
  const ndviValues = vegetationTimeSeries.map(v => v.ndvi);
  const eviValues = vegetationTimeSeries.map(v => v.evi);
  const currentNDVI = ndviValues[ndviValues.length - 1] || 0;
  const currentEVI = eviValues[eviValues.length - 1] || 0;
  const ndviTrend = calculateTrend(ndviValues);
  const eviTrend = calculateTrend(eviValues);
  
  const ndviMean = ndviValues.reduce((a, b) => a + b, 0) / ndviValues.length;
  const ndviStdDev = Math.sqrt(
    ndviValues.reduce((sum, v) => sum + Math.pow(v - ndviMean, 2), 0) / ndviValues.length
  );
  const stressIndex = calculateZScore(currentNDVI, ndviMean, ndviStdDev);
  
  const vegetation: VegetationData = {
    current_ndvi: Math.round(currentNDVI * 1000) / 1000,
    current_evi: Math.round(currentEVI * 1000) / 1000,
    ndvi_trend: Math.round(ndviTrend * 10000) / 10000,
    evi_trend: Math.round(eviTrend * 10000) / 10000,
    stress_index: Math.round(stressIndex * 100) / 100,
    time_series: vegetationTimeSeries,
  };
  
  const rainfallData = generateMockRainfallData(startDate, endDate);
  const temperatureData = generateMockTemperatureData(startDate, endDate);
  const climate = calculateClimateAnomalies(rainfallData, temperatureData);
  
  const centroid = calculateCentroid(farm.polygon);
  const socBaseline = generateMockSOCData(centroid);
  const soc = estimateSOCChange(
    socBaseline.baseline_0_30cm,
    ndviTrend,
    climate.rainfall_anomaly
  );
  
  const gfwForestChange = generateMockForestChangeData(farm.polygon);
  const ndviForestChange = detectForestChangeFromNDVI(
    vegetationTimeSeries.map(v => ({ date: v.date, ndvi: v.ndvi }))
  );
  
  const forest_change = {
    loss_detected: gfwForestChange.loss_detected || ndviForestChange.loss_detected,
    gain_detected: gfwForestChange.gain_detected || ndviForestChange.gain_detected,
    loss_area_ha: gfwForestChange.loss_area_ha,
    gain_area_ha: gfwForestChange.gain_area_ha,
    last_change_date: gfwForestChange.last_change_date,
  };
  
  const terrain = generateMockTerrainData(centroid);
  
  const alerts = generateAlerts(vegetation, climate, forest_change, soc);
  
  const mrv_summary: FarmMRVData = {
    farm_id: farm.id,
    area_ha: farm.area_ha,
    ndvi: {
      current: vegetation.current_ndvi,
      trend: vegetation.ndvi_trend,
    },
    evi: {
      current: vegetation.current_evi,
    },
    rainfall_anomaly: climate.rainfall_anomaly,
    temperature_anomaly: climate.temperature_anomaly,
    soc_baseline: soc.baseline_0_30cm,
    forest_change: {
      loss: forest_change.loss_detected,
      gain: forest_change.gain_detected,
    },
    alerts: alerts,
    last_updated: new Date().toISOString(),
  };
  
  return {
    farm,
    vegetation,
    climate,
    soc,
    forest_change,
    terrain,
    alerts,
    mrv_summary,
  };
}

function generateAlerts(
  vegetation: VegetationData,
  climate: { rainfall_anomaly: number; temperature_anomaly: number },
  forestChange: { loss_detected: boolean; gain_detected: boolean },
  _soc: { delta: number }
): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date().toISOString();
  
  if (vegetation.stress_index < -1.5) {
    alerts.push({
      id: `alert_veg_${Date.now()}`,
      type: 'vegetation_stress',
      severity: vegetation.stress_index < -2 ? 'high' : 'medium',
      message: `Vegetation stress detected. NDVI z-score: ${vegetation.stress_index.toFixed(2)}`,
      date: now,
    });
  }
  
  if (forestChange.loss_detected) {
    alerts.push({
      id: `alert_forest_${Date.now()}`,
      type: 'forest_loss',
      severity: 'high',
      message: 'Forest cover loss detected in the parcel area',
      date: now,
    });
  }
  
  if (climate.rainfall_anomaly < -1.5) {
    alerts.push({
      id: `alert_drought_${Date.now()}`,
      type: 'drought',
      severity: climate.rainfall_anomaly < -2 ? 'high' : 'medium',
      message: `Drought conditions detected. SPI: ${climate.rainfall_anomaly.toFixed(2)}`,
      date: now,
    });
  }
  
  if (Math.abs(climate.temperature_anomaly) > 1.5) {
    alerts.push({
      id: `alert_temp_${Date.now()}`,
      type: 'temperature_anomaly',
      severity: Math.abs(climate.temperature_anomaly) > 2 ? 'high' : 'medium',
      message: `Temperature anomaly detected: ${climate.temperature_anomaly > 0 ? '+' : ''}${climate.temperature_anomaly.toFixed(2)} standard deviations`,
      date: now,
    });
  }
  
  return alerts;
}

export function generateMRVSummary(farm: Farm, detailData: FarmDetailData): FarmMRVData {
  return detailData.mrv_summary;
}

export async function batchFetchFarmData(farms: Farm[]): Promise<Map<string, FarmDetailData>> {
  const results = new Map<string, FarmDetailData>();
  
  for (const farm of farms) {
    try {
      const data = await fetchFarmDetailData(farm);
      results.set(farm.id, data);
    } catch (error) {
      console.error(`Error fetching data for farm ${farm.id}:`, error);
    }
  }
  
  return results;
}
