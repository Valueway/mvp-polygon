export interface Coordinates {
  lng: number;
  lat: number;
}

export interface Polygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface FarmerInfo {
  name: string;
  contact?: string;
  organization?: string;
}

export interface Farm {
  id: string;
  name: string;
  farmer_info: FarmerInfo;
  polygon: Polygon;
  centroid: Coordinates;
  area_ha: number;
  altitude_m: number;
  country: string;
  region: string;
  created_at: string;
  updated_at: string;
}

export interface VegetationIndex {
  date: string;
  ndvi: number;
  evi: number;
  cloud_cover: number;
}

export interface VegetationData {
  current_ndvi: number;
  current_evi: number;
  ndvi_trend: number;
  evi_trend: number;
  stress_index: number;
  time_series: VegetationIndex[];
}

export interface RainfallData {
  date: string;
  precipitation_mm: number;
  anomaly: number;
}

export interface ClimateData {
  rainfall_anomaly: number;
  temperature_anomaly: number;
  et0: number;
  rainfall_time_series: RainfallData[];
  temperature_time_series: { date: string; temp_c: number; anomaly: number }[];
}

export interface SOCData {
  baseline_0_30cm: number;
  projected: number;
  delta: number;
  uncertainty: number;
}

export interface ForestChangeData {
  loss_detected: boolean;
  gain_detected: boolean;
  loss_area_ha: number;
  gain_area_ha: number;
  last_change_date?: string;
}

export interface TerrainData {
  slope_degrees: number;
  aspect: string;
  elevation_m: number;
}

export interface Alert {
  id: string;
  type: 'vegetation_stress' | 'forest_loss' | 'drought' | 'temperature_anomaly';
  severity: 'low' | 'medium' | 'high';
  message: string;
  date: string;
}

export interface FarmMRVData {
  farm_id: string;
  area_ha: number;
  ndvi: {
    current: number;
    trend: number;
  };
  evi: {
    current: number;
  };
  rainfall_anomaly: number;
  temperature_anomaly: number;
  soc_baseline: number;
  forest_change: {
    loss: boolean;
    gain: boolean;
  };
  alerts: Alert[];
  last_updated: string;
}

export interface FarmDetailData {
  farm: Farm;
  vegetation: VegetationData;
  climate: ClimateData;
  soc: SOCData;
  forest_change: ForestChangeData;
  terrain: TerrainData;
  alerts: Alert[];
  mrv_summary: FarmMRVData;
}

export interface CreateFarmInput {
  name: string;
  farmer_info: FarmerInfo;
  polygon: Polygon;
  country: string;
  region: string;
}

export interface UpdateFarmInput {
  name?: string;
  farmer_info?: FarmerInfo;
  polygon?: Polygon;
}
