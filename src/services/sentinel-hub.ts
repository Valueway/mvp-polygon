import axios from 'axios';
import type { Polygon, VegetationIndex } from '@/types';
import { formatDate, getBoundingBox } from '@/lib/utils';

const SENTINEL_HUB_URL = process.env.SENTINEL_HUB_URL || 'https://services.sentinel-hub.com';
const SENTINEL_HUB_CLIENT_ID = process.env.SENTINEL_HUB_CLIENT_ID || '';
const SENTINEL_HUB_CLIENT_SECRET = process.env.SENTINEL_HUB_CLIENT_SECRET || '';

interface SentinelHubToken {
  access_token: string;
  expires_in: number;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  if (!SENTINEL_HUB_CLIENT_ID || !SENTINEL_HUB_CLIENT_SECRET) {
    throw new Error('Sentinel Hub credentials not configured');
  }

  const response = await axios.post<SentinelHubToken>(
    'https://services.sentinel-hub.com/oauth/token',
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: SENTINEL_HUB_CLIENT_ID,
      client_secret: SENTINEL_HUB_CLIENT_SECRET,
    }),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  );

  cachedToken = {
    token: response.data.access_token,
    expiresAt: Date.now() + (response.data.expires_in - 60) * 1000,
  };

  return cachedToken.token;
}

const NDVI_EVALSCRIPT = `
//VERSION=3
function setup() {
  return {
    input: [{
      bands: ["B04", "B08", "SCL"],
      units: "DN"
    }],
    output: {
      bands: 3,
      sampleType: "FLOAT32"
    }
  };
}

function evaluatePixel(sample) {
  let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
  let cloudMask = (sample.SCL == 3 || sample.SCL == 8 || sample.SCL == 9 || sample.SCL == 10) ? 1 : 0;
  return [ndvi, cloudMask, sample.SCL];
}
`;

const EVI_EVALSCRIPT = `
//VERSION=3
function setup() {
  return {
    input: [{
      bands: ["B02", "B04", "B08", "SCL"],
      units: "DN"
    }],
    output: {
      bands: 2,
      sampleType: "FLOAT32"
    }
  };
}

function evaluatePixel(sample) {
  let evi = 2.5 * ((sample.B08 - sample.B04) / (sample.B08 + 6 * sample.B04 - 7.5 * sample.B02 + 1));
  let cloudMask = (sample.SCL == 3 || sample.SCL == 8 || sample.SCL == 9 || sample.SCL == 10) ? 1 : 0;
  return [evi, cloudMask];
}
`;

export async function fetchNDVITimeSeries(
  polygon: Polygon,
  startDate: Date,
  endDate: Date
): Promise<VegetationIndex[]> {
  const token = await getAccessToken();
  const bbox = getBoundingBox(polygon);

  const request = {
    input: {
      bounds: {
        bbox: bbox,
        properties: { crs: 'http://www.opengis.net/def/crs/EPSG/0/4326' },
      },
      data: [
        {
          type: 'sentinel-2-l2a',
          dataFilter: {
            timeRange: {
              from: formatDate(startDate) + 'T00:00:00Z',
              to: formatDate(endDate) + 'T23:59:59Z',
            },
            maxCloudCoverage: 50,
          },
        },
      ],
    },
    aggregation: {
      timeRange: {
        from: formatDate(startDate) + 'T00:00:00Z',
        to: formatDate(endDate) + 'T23:59:59Z',
      },
      aggregationInterval: { of: 'P7D' },
      evalscript: NDVI_EVALSCRIPT,
      resx: 10,
      resy: 10,
    },
    output: {
      responses: [{ identifier: 'default', format: { type: 'application/json' } }],
    },
  };

  try {
    const response = await axios.post(
      `${SENTINEL_HUB_URL}/api/v1/statistics`,
      request,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.data.map((item: { interval: { from: string }; outputs: { default: { bands: { B0: { stats: { mean: number } } } } } }) => ({
      date: item.interval.from.split('T')[0],
      ndvi: item.outputs.default.bands.B0.stats.mean || 0,
      evi: 0,
      cloud_cover: 0,
    }));
  } catch (error) {
    console.error('Error fetching NDVI time series:', error);
    throw error;
  }
}

export async function fetchEVITimeSeries(
  polygon: Polygon,
  startDate: Date,
  endDate: Date
): Promise<VegetationIndex[]> {
  const token = await getAccessToken();
  const bbox = getBoundingBox(polygon);

  const request = {
    input: {
      bounds: {
        bbox: bbox,
        properties: { crs: 'http://www.opengis.net/def/crs/EPSG/0/4326' },
      },
      data: [
        {
          type: 'sentinel-2-l2a',
          dataFilter: {
            timeRange: {
              from: formatDate(startDate) + 'T00:00:00Z',
              to: formatDate(endDate) + 'T23:59:59Z',
            },
            maxCloudCoverage: 50,
          },
        },
      ],
    },
    aggregation: {
      timeRange: {
        from: formatDate(startDate) + 'T00:00:00Z',
        to: formatDate(endDate) + 'T23:59:59Z',
      },
      aggregationInterval: { of: 'P7D' },
      evalscript: EVI_EVALSCRIPT,
      resx: 10,
      resy: 10,
    },
    output: {
      responses: [{ identifier: 'default', format: { type: 'application/json' } }],
    },
  };

  try {
    const response = await axios.post(
      `${SENTINEL_HUB_URL}/api/v1/statistics`,
      request,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.data.map((item: { interval: { from: string }; outputs: { default: { bands: { B0: { stats: { mean: number } } } } } }) => ({
      date: item.interval.from.split('T')[0],
      ndvi: 0,
      evi: item.outputs.default.bands.B0.stats.mean || 0,
      cloud_cover: 0,
    }));
  } catch (error) {
    console.error('Error fetching EVI time series:', error);
    throw error;
  }
}

export function generateMockVegetationData(
  startDate: Date,
  endDate: Date,
  baseNDVI: number = 0.65,
  baseEVI: number = 0.45
): VegetationIndex[] {
  const data: VegetationIndex[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const seasonalVariation = Math.sin((currentDate.getMonth() / 12) * 2 * Math.PI) * 0.1;
    const randomVariation = (Math.random() - 0.5) * 0.1;
    
    data.push({
      date: formatDate(currentDate),
      ndvi: Math.max(0, Math.min(1, baseNDVI + seasonalVariation + randomVariation)),
      evi: Math.max(0, Math.min(1, baseEVI + seasonalVariation * 0.8 + randomVariation * 0.8)),
      cloud_cover: Math.random() * 30,
    });
    
    currentDate.setDate(currentDate.getDate() + 7);
  }
  
  return data;
}
