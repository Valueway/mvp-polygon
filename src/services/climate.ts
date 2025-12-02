import axios from 'axios';
import type { Polygon, RainfallData, ClimateData } from '@/types';
import { formatDate, getBoundingBox, calculateSPI } from '@/lib/utils';

const CHIRPS_BASE_URL = 'https://data.chc.ucsb.edu/products/CHIRPS-2.0';
const ERA5_CDS_URL = 'https://cds.climate.copernicus.eu/api/v2';

export async function fetchCHIRPSData(
  polygon: Polygon,
  startDate: Date,
  endDate: Date
): Promise<RainfallData[]> {
  const bbox = getBoundingBox(polygon);
  
  try {
    const response = await axios.get(`${CHIRPS_BASE_URL}/global_daily/netcdf/p05`, {
      params: {
        bbox: bbox.join(','),
        start: formatDate(startDate),
        end: formatDate(endDate),
      },
    });
    
    return response.data.map((item: { date: string; precipitation: number }) => ({
      date: item.date,
      precipitation_mm: item.precipitation,
      anomaly: 0,
    }));
  } catch (error) {
    console.error('Error fetching CHIRPS data:', error);
    return generateMockRainfallData(startDate, endDate);
  }
}

export async function fetchERA5Data(
  polygon: Polygon,
  startDate: Date,
  endDate: Date
): Promise<{ date: string; temp_c: number; anomaly: number }[]> {
  const bbox = getBoundingBox(polygon);
  const cdsApiKey = process.env.CDS_API_KEY;
  
  if (!cdsApiKey) {
    console.warn('CDS API key not configured, using mock data');
    return generateMockTemperatureData(startDate, endDate);
  }
  
  try {
    const response = await axios.post(
      `${ERA5_CDS_URL}/resources/reanalysis-era5-single-levels`,
      {
        product_type: 'reanalysis',
        variable: ['2m_temperature'],
        year: startDate.getFullYear().toString(),
        month: Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')),
        day: Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')),
        time: '12:00',
        area: [bbox[3], bbox[0], bbox[1], bbox[2]],
        format: 'json',
      },
      {
        headers: {
          Authorization: `Bearer ${cdsApiKey}`,
        },
      }
    );
    
    return response.data.map((item: { date: string; temperature: number }) => ({
      date: item.date,
      temp_c: item.temperature - 273.15,
      anomaly: 0,
    }));
  } catch (error) {
    console.error('Error fetching ERA5 data:', error);
    return generateMockTemperatureData(startDate, endDate);
  }
}

export function generateMockRainfallData(
  startDate: Date,
  endDate: Date,
  meanPrecipitation: number = 150
): RainfallData[] {
  const data: RainfallData[] = [];
  const currentDate = new Date(startDate);
  const stdDev = meanPrecipitation * 0.3;
  
  while (currentDate <= endDate) {
    const month = currentDate.getMonth();
    const isRainySeason = month >= 4 && month <= 10;
    const seasonalFactor = isRainySeason ? 1.5 : 0.5;
    
    const precipitation = Math.max(0, 
      (meanPrecipitation * seasonalFactor) + (Math.random() - 0.5) * stdDev * 2
    );
    
    const anomaly = calculateSPI(precipitation, meanPrecipitation, stdDev);
    
    data.push({
      date: formatDate(currentDate),
      precipitation_mm: Math.round(precipitation * 10) / 10,
      anomaly: Math.round(anomaly * 100) / 100,
    });
    
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return data;
}

export function generateMockTemperatureData(
  startDate: Date,
  endDate: Date,
  meanTemp: number = 22
): { date: string; temp_c: number; anomaly: number }[] {
  const data: { date: string; temp_c: number; anomaly: number }[] = [];
  const currentDate = new Date(startDate);
  const stdDev = 3;
  
  while (currentDate <= endDate) {
    const month = currentDate.getMonth();
    const seasonalVariation = Math.sin((month / 12) * 2 * Math.PI) * 3;
    const randomVariation = (Math.random() - 0.5) * 4;
    
    const temp = meanTemp + seasonalVariation + randomVariation;
    const anomaly = (temp - meanTemp) / stdDev;
    
    data.push({
      date: formatDate(currentDate),
      temp_c: Math.round(temp * 10) / 10,
      anomaly: Math.round(anomaly * 100) / 100,
    });
    
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return data;
}

export function calculateClimateAnomalies(
  rainfallData: RainfallData[],
  temperatureData: { date: string; temp_c: number; anomaly: number }[]
): ClimateData {
  const recentRainfall = rainfallData.slice(-3);
  const recentTemperature = temperatureData.slice(-3);
  
  const rainfallAnomaly = recentRainfall.length > 0
    ? recentRainfall.reduce((sum, d) => sum + d.anomaly, 0) / recentRainfall.length
    : 0;
  
  const temperatureAnomaly = recentTemperature.length > 0
    ? recentTemperature.reduce((sum, d) => sum + d.anomaly, 0) / recentTemperature.length
    : 0;
  
  const et0 = calculateET0(
    recentTemperature.length > 0 ? recentTemperature[recentTemperature.length - 1].temp_c : 22
  );
  
  return {
    rainfall_anomaly: Math.round(rainfallAnomaly * 100) / 100,
    temperature_anomaly: Math.round(temperatureAnomaly * 100) / 100,
    et0: Math.round(et0 * 10) / 10,
    rainfall_time_series: rainfallData,
    temperature_time_series: temperatureData,
  };
}

function calculateET0(tempC: number): number {
  return 0.0023 * (tempC + 17.8) * Math.sqrt(Math.abs(tempC)) * 0.408;
}
