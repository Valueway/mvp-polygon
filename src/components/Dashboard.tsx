'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Download, Map, List, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FarmMap from '@/components/map/FarmMap';
import FarmList from '@/components/FarmList';
import FarmDetail from '@/components/FarmDetail';
import type { Farm, FarmDetailData, FarmMRVData } from '@/types';
import { downloadJSON, downloadCSV } from '@/lib/utils';

export default function Dashboard() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmData, setFarmData] = useState<Record<string, FarmDetailData>>({});
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNDVIHeatmap, setShowNDVIHeatmap] = useState(false);
  const [showForestChange, setShowForestChange] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');

  const fetchFarms = useCallback(async () => {
    try {
      const response = await fetch('/api/farms');
      const data = await response.json();
      setFarms(data.farms || []);
      return data.farms || [];
    } catch (err) {
      console.error('Error fetching farms:', err);
      setError('Failed to load farms');
      return [];
    }
  }, []);

  const fetchFarmData = useCallback(async (farmId: string) => {
    try {
      const response = await fetch(`/api/farm/${farmId}/data`);
      const result = await response.json();
      if (result.data) {
        setFarmData((prev) => ({
          ...prev,
          [farmId]: result.data,
        }));
      }
    } catch (err) {
      console.error(`Error fetching data for farm ${farmId}:`, err);
    }
  }, []);

  const loadAllFarmData = useCallback(async (farmsList: Farm[]) => {
    setIsRefreshing(true);
    for (const farm of farmsList) {
      await fetchFarmData(farm.id);
    }
    setIsRefreshing(false);
  }, [fetchFarmData]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const farmsList = await fetchFarms();
      if (farmsList.length > 0) {
        await loadAllFarmData(farmsList);
      }
      setIsLoading(false);
    };
    init();
  }, [fetchFarms, loadAllFarmData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const farmsList = await fetchFarms();
    await loadAllFarmData(farmsList);
    setIsRefreshing(false);
  };

  const handleExportAllJSON = () => {
    const summaries: FarmMRVData[] = Object.values(farmData).map(data => data.mrv_summary);
    downloadJSON(
      { farms: summaries, exported_at: new Date().toISOString() },
      'rcw_dmrv_all_farms_report.json'
    );
  };

  const handleExportAllCSV = () => {
    const csvData: Record<string, unknown>[] = Object.entries(farmData).map(([farmId, data]) => {
      const farm = farms.find((f) => f.id === farmId);
      return {
        farm_id: data.mrv_summary.farm_id,
        farm_name: farm?.name || '',
        region: farm?.region || '',
        area_ha: data.mrv_summary.area_ha,
        ndvi_current: data.mrv_summary.ndvi.current,
        ndvi_trend: data.mrv_summary.ndvi.trend,
        evi_current: data.mrv_summary.evi.current,
        rainfall_anomaly: data.mrv_summary.rainfall_anomaly,
        temperature_anomaly: data.mrv_summary.temperature_anomaly,
        soc_baseline: data.mrv_summary.soc_baseline,
        forest_loss: data.mrv_summary.forest_change.loss,
        forest_gain: data.mrv_summary.forest_change.gain,
        alerts_count: data.mrv_summary.alerts.length,
        last_updated: data.mrv_summary.last_updated,
      };
    });
    downloadCSV(csvData, 'rcw_dmrv_all_farms_report.csv');
  };

  const selectedFarmData = selectedFarmId ? farmData[selectedFarmId] : null;

  const farmDataValues = Object.values(farmData);
  const totalArea = farms.reduce((sum, farm) => sum + farm.area_ha, 0);
  const avgNDVI =
    farmDataValues.length > 0
      ? farmDataValues.reduce(
          (sum, data) => sum + data.vegetation.current_ndvi,
          0
        ) / farmDataValues.length
      : 0;
  const alertsCount = farmDataValues.reduce(
    (sum, data) => sum + data.alerts.length,
    0
  );
  const forestLossCount = farmDataValues.filter(
    (data) => data.forest_change.loss_detected
  ).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading farm data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={handleRefresh}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                RCW dMRV Platform
              </h1>
              <p className="text-sm text-gray-500">
                Regenerative Coffee Way - Digital MRV System
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button
                  variant={viewMode === 'split' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('split')}
                >
                  <Layers className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                >
                  <Map className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportAllJSON}>
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportAllCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">Total Farms</p>
              <p className="text-3xl font-bold">{farms.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">Total Area</p>
              <p className="text-3xl font-bold">{totalArea.toFixed(1)} ha</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">Avg NDVI</p>
              <p className="text-3xl font-bold text-green-600">
                {avgNDVI.toFixed(3)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">Active Alerts</p>
              <p className={`text-3xl font-bold ${alertsCount > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                {alertsCount}
              </p>
              {forestLossCount > 0 && (
                <p className="text-xs text-red-500 mt-1">
                  {forestLossCount} farms with forest loss
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mb-4 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showNDVIHeatmap}
              onChange={(e) => setShowNDVIHeatmap(e.target.checked)}
              className="rounded border-gray-300"
            />
            Show NDVI Heatmap
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showForestChange}
              onChange={(e) => setShowForestChange(e.target.checked)}
              className="rounded border-gray-300"
            />
            Show Forest Change Layer
          </label>
        </div>

        <div className={`grid gap-6 ${viewMode === 'split' ? 'grid-cols-12' : 'grid-cols-1'}`}>
          {(viewMode === 'split' || viewMode === 'list') && (
            <div className={viewMode === 'split' ? 'col-span-3' : 'col-span-1'}>
              <Card className="h-full">
                <CardContent className="p-4">
                  <FarmList
                    farms={farms}
                    farmData={farmData}
                    selectedFarmId={selectedFarmId}
                    onFarmSelect={setSelectedFarmId}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {(viewMode === 'split' || viewMode === 'map') && (
            <div className={viewMode === 'split' ? 'col-span-9' : 'col-span-1'}>
              <Card className="h-[600px]">
                <CardContent className="p-0 h-full">
                  <FarmMap
                    farms={farms}
                    selectedFarmId={selectedFarmId}
                    onFarmSelect={setSelectedFarmId}
                    showNDVIHeatmap={showNDVIHeatmap}
                    showForestChange={showForestChange}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {selectedFarmData && (
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Farm Details</CardTitle>
              </CardHeader>
              <CardContent>
                <FarmDetail data={selectedFarmData} />
              </CardContent>
            </Card>
          </div>
        )}

        {!selectedFarmId && (
          <div className="mt-6 text-center py-12 bg-white rounded-lg border border-gray-200">
            <Map className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">
              Select a farm from the list or map to view detailed MRV data
            </p>
          </div>
        )}
      </div>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>RCW dMRV Platform - Guatemala Coffee Region Monitoring</p>
            <p>
              Protocols: Biochar | NMP | SEP | ARR | IFM | ALM
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
