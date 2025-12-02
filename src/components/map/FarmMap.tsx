'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Farm } from '@/types';

interface FarmMapProps {
  farms: Farm[];
  selectedFarmId: string | null;
  onFarmSelect: (farmId: string) => void;
  onPolygonDraw?: (polygon: GeoJSON.Polygon) => void;
  showNDVIHeatmap?: boolean;
  showForestChange?: boolean;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const GUATEMALA_CENTER: [number, number] = [-90.5, 14.8];
const GUATEMALA_ZOOM = 7;

export default function FarmMap({
  farms,
  selectedFarmId,
  onFarmSelect,
  showNDVIHeatmap = false,
  showForestChange = false,
}: FarmMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: GUATEMALA_CENTER,
      zoom: GUATEMALA_ZOOM,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const updateFarmLayers = useCallback(() => {
    if (!map.current || !mapLoaded) return;

    const sourceId = 'farms-source';
    const layerId = 'farms-fill';
    const outlineLayerId = 'farms-outline';
    const selectedLayerId = 'farms-selected';

    if (map.current.getLayer(selectedLayerId)) {
      map.current.removeLayer(selectedLayerId);
    }
    if (map.current.getLayer(outlineLayerId)) {
      map.current.removeLayer(outlineLayerId);
    }
    if (map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId);
    }
    if (map.current.getSource(sourceId)) {
      map.current.removeSource(sourceId);
    }

    const geojsonData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: farms.map((farm) => ({
        type: 'Feature',
        id: farm.id,
        properties: {
          id: farm.id,
          name: farm.name,
          area_ha: farm.area_ha,
          region: farm.region,
        },
        geometry: farm.polygon,
      })),
    };

    map.current.addSource(sourceId, {
      type: 'geojson',
      data: geojsonData,
    });

    map.current.addLayer({
      id: layerId,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': showNDVIHeatmap
          ? [
              'interpolate',
              ['linear'],
              ['get', 'ndvi'],
              0, '#d73027',
              0.3, '#fc8d59',
              0.5, '#fee08b',
              0.7, '#d9ef8b',
              0.9, '#1a9850',
            ]
          : '#3b82f6',
        'fill-opacity': 0.4,
      },
    });

    map.current.addLayer({
      id: outlineLayerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#1e40af',
        'line-width': 2,
      },
    });

    if (selectedFarmId) {
      map.current.addLayer({
        id: selectedLayerId,
        type: 'line',
        source: sourceId,
        filter: ['==', ['get', 'id'], selectedFarmId],
        paint: {
          'line-color': '#fbbf24',
          'line-width': 4,
        },
      });
    }

    map.current.on('click', layerId, (e) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const farmId = feature.properties?.id;
        if (farmId) {
          onFarmSelect(farmId);
        }
      }
    });

    map.current.on('mouseenter', layerId, () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = 'pointer';
      }
    });

    map.current.on('mouseleave', layerId, () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = '';
      }
    });
  }, [farms, selectedFarmId, onFarmSelect, mapLoaded, showNDVIHeatmap]);

  useEffect(() => {
    updateFarmLayers();
  }, [updateFarmLayers]);

  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedFarmId) return;

    const selectedFarm = farms.find((f) => f.id === selectedFarmId);
    if (selectedFarm) {
      map.current.flyTo({
        center: [selectedFarm.centroid.lng, selectedFarm.centroid.lat],
        zoom: 14,
        duration: 1500,
      });
    }
  }, [selectedFarmId, farms, mapLoaded]);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const forestSourceId = 'forest-change-source';
    const forestLayerId = 'forest-change-layer';

    if (map.current.getLayer(forestLayerId)) {
      map.current.removeLayer(forestLayerId);
    }
    if (map.current.getSource(forestSourceId)) {
      map.current.removeSource(forestSourceId);
    }

    if (showForestChange) {
      map.current.addSource(forestSourceId, {
        type: 'raster',
        tiles: [
          'https://tiles.globalforestwatch.org/umd_tree_cover_loss/v1.10/tcd_30/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
      });

      map.current.addLayer({
        id: forestLayerId,
        type: 'raster',
        source: forestSourceId,
        paint: {
          'raster-opacity': 0.7,
        },
      });
    }
  }, [showForestChange, mapLoaded]);

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
      {!MAPBOX_TOKEN && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center p-4">
            <p className="text-gray-600 mb-2">Mapbox token not configured</p>
            <p className="text-sm text-gray-500">
              Set NEXT_PUBLIC_MAPBOX_TOKEN in your environment variables
            </p>
          </div>
        </div>
      )}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <h3 className="font-semibold text-sm mb-2">Legend</h3>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 opacity-60 rounded" />
            <span>Farm Parcels</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-yellow-400 rounded" />
            <span>Selected Farm</span>
          </div>
          {showForestChange && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 opacity-70 rounded" />
              <span>Forest Loss</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
