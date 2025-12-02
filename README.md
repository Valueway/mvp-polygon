# RCW dMRV Platform

A Regenerative Coffee Way (RCW) Digital MRV (Monitoring, Reporting, and Verification) Platform for coffee-producing regions, starting with Guatemala as the first target country.

## Overview

This platform tracks coffee farm parcels at the polygon level and provides comprehensive satellite-based monitoring for regenerative agriculture protocols including Biochar, Nitrogen Management (NMP), Soil Enrichment (SEP), ARR, IFM, and ALM.

## Features

- Farm/Parcel Management: Upload or draw polygons on Mapbox, store farm data with geospatial indexing
- Satellite Data Integration: Sentinel-2, Landsat-8/9, CHIRPS, ERA5, SoilGrids, SRTM, Global Forest Watch
- Vegetation Index Processing: Weekly NDVI/EVI computation with cloud masking
- Climate Anomaly Detection: Rainfall (SPI) and temperature anomaly analysis
- SOC Estimation: Soil Organic Carbon baseline from SoilGrids with projected changes
- Forest Change Detection: Land-use change monitoring via GFW and NDVI analysis
- Protocol-Agnostic Data Output: Unified JSON schema compatible with multiple carbon protocols
- Interactive Dashboard: Map view, farm list, detailed analytics, and export functionality

## Tech Stack

- Next.js 16 with TypeScript and App Router
- Tailwind CSS for styling
- Mapbox GL for map visualization
- Recharts for data visualization
- Zustand for state management
- Supabase for database (optional, falls back to in-memory storage)

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/Valueway/mvp-polygon.git
cd mvp-polygon
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:
- `NEXT_PUBLIC_MAPBOX_TOKEN`: Your Mapbox access token (required for map display)
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL (optional)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key (optional)
- `SENTINEL_HUB_CLIENT_ID`: Sentinel Hub client ID (optional, for real satellite data)
- `SENTINEL_HUB_CLIENT_SECRET`: Sentinel Hub client secret (optional)

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

- `GET /api/farms` - List all farms
- `POST /api/farms` - Create a new farm
- `GET /api/farm/:id` - Get farm details
- `PUT /api/farm/:id` - Update farm
- `DELETE /api/farm/:id` - Delete farm
- `GET /api/farm/:id/data` - Get farm satellite/MRV data
- `POST /api/farm/:id/update` - Trigger data refresh for a farm

## Data Sources

| Data | Source | Frequency | Use |
|------|--------|-----------|-----|
| Sentinel-2 | Sentinel Hub API | Weekly | NDVI/EVI, vegetation health |
| Landsat-8/9 | Sentinel Hub API | Bi-weekly | Long-term baseline |
| CHIRPS | Climate Hazard Center | Daily | Rainfall anomalies |
| ERA5 | Copernicus | Daily | Temperature, ET0 |
| SoilGrids | ISRIC | Static | SOC baseline |
| SRTM/DEM | NASA | Static | Slope (ARR/IFM) |
| GFW | WRI | Monthly | Forest loss detection |

## MRV Output Schema

The platform outputs protocol-agnostic JSON data compatible with Biochar, NMP, SEP, ARR, IFM, and ALM protocols:

```json
{
  "farm_id": "",
  "area_ha": 0,
  "ndvi": { "current": 0.72, "trend": -0.03 },
  "evi": { "current": 0.51 },
  "rainfall_anomaly": -1.2,
  "temperature_anomaly": 0.8,
  "soc_baseline": 32.1,
  "forest_change": { "loss": false, "gain": false },
  "alerts": []
}
```

## Demo Data

The platform includes 10 demo farms in Guatemala for testing purposes, covering regions like Huehuetenango, Antigua Guatemala, Sololá, Alta Verapaz, San Marcos, and Guatemala.

## Deployment

Deploy to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Valueway/mvp-polygon)

## License

MIT
