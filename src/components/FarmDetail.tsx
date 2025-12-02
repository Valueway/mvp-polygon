'use client';

import React from 'react';
import {
  Download,
  Leaf,
  CloudRain,
  Thermometer,
  Mountain,
  TreePine,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  User,
  Phone,
  Building,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import NDVIChart from '@/components/charts/NDVIChart';
import RainfallChart from '@/components/charts/RainfallChart';
import type { FarmDetailData } from '@/types';
import { cn, downloadJSON, downloadCSV } from '@/lib/utils';

interface FarmDetailProps {
  data: FarmDetailData;
}

export default function FarmDetail({ data }: FarmDetailProps) {
  const { farm, vegetation, climate, soc, forest_change, terrain, alerts, mrv_summary } = data;

  const handleExportJSON = () => {
    downloadJSON(mrv_summary, `${farm.name.replace(/\s+/g, '_')}_mrv_report.json`);
  };

  const handleExportCSV = () => {
    const csvData = [
      {
        farm_id: mrv_summary.farm_id,
        farm_name: farm.name,
        area_ha: mrv_summary.area_ha,
        ndvi_current: mrv_summary.ndvi.current,
        ndvi_trend: mrv_summary.ndvi.trend,
        evi_current: mrv_summary.evi.current,
        rainfall_anomaly: mrv_summary.rainfall_anomaly,
        temperature_anomaly: mrv_summary.temperature_anomaly,
        soc_baseline: mrv_summary.soc_baseline,
        forest_loss: mrv_summary.forest_change.loss,
        forest_gain: mrv_summary.forest_change.gain,
        alerts_count: mrv_summary.alerts.length,
        last_updated: mrv_summary.last_updated,
      },
    ];
    downloadCSV(csvData, `${farm.name.replace(/\s+/g, '_')}_mrv_report.csv`);
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0.001) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend < -0.001) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return null;
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{farm.name}</h2>
          <p className="text-gray-500">{farm.region}, {farm.country}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportJSON}>
            <Download className="w-4 h-4 mr-2" />
            JSON
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Farmer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm">{farm.farmer_info.name}</span>
            </div>
            {farm.farmer_info.contact && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{farm.farmer_info.contact}</span>
              </div>
            )}
            {farm.farmer_info.organization && (
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{farm.farmer_info.organization}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {alerts.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              Active Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-2 bg-white rounded-lg">
                  <span className="text-sm">{alert.message}</span>
                  <Badge variant={getAlertSeverityColor(alert.severity) as 'default' | 'secondary' | 'destructive' | 'outline'}>
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">NDVI</p>
                <p className="text-2xl font-bold">{vegetation.current_ndvi.toFixed(3)}</p>
              </div>
              <div className="flex flex-col items-end">
                <Leaf className="w-8 h-8 text-green-500" />
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(vegetation.ndvi_trend)}
                  <span className="text-xs text-gray-500">
                    {vegetation.ndvi_trend > 0 ? '+' : ''}{(vegetation.ndvi_trend * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Rainfall Anomaly</p>
                <p className={cn(
                  'text-2xl font-bold',
                  climate.rainfall_anomaly < -1 ? 'text-red-600' : climate.rainfall_anomaly > 1 ? 'text-blue-600' : ''
                )}>
                  {climate.rainfall_anomaly > 0 ? '+' : ''}{climate.rainfall_anomaly.toFixed(2)}
                </p>
              </div>
              <CloudRain className={cn(
                'w-8 h-8',
                climate.rainfall_anomaly < -1 ? 'text-red-500' : 'text-blue-500'
              )} />
            </div>
            <p className="text-xs text-gray-500 mt-2">SPI (Standardized Precipitation Index)</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">SOC Baseline</p>
                <p className="text-2xl font-bold">{soc.baseline_0_30cm.toFixed(1)}</p>
              </div>
              <Mountain className="w-8 h-8 text-amber-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">t C/ha (0-30cm)</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Forest Status</p>
                <p className={cn(
                  'text-lg font-bold',
                  forest_change.loss_detected ? 'text-red-600' : 'text-green-600'
                )}>
                  {forest_change.loss_detected ? 'Loss Detected' : forest_change.gain_detected ? 'Gain Detected' : 'Stable'}
                </p>
              </div>
              <TreePine className={cn(
                'w-8 h-8',
                forest_change.loss_detected ? 'text-red-500' : 'text-green-500'
              )} />
            </div>
            {(forest_change.loss_area_ha > 0 || forest_change.gain_area_ha > 0) && (
              <p className="text-xs text-gray-500 mt-2">
                {forest_change.loss_area_ha > 0 && `Loss: ${forest_change.loss_area_ha.toFixed(2)} ha`}
                {forest_change.gain_area_ha > 0 && ` Gain: ${forest_change.gain_area_ha.toFixed(2)} ha`}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm text-gray-500">Temperature Anomaly</p>
                <p className={cn(
                  'text-xl font-bold',
                  Math.abs(climate.temperature_anomaly) > 1.5 ? 'text-red-600' : ''
                )}>
                  {climate.temperature_anomaly > 0 ? '+' : ''}{climate.temperature_anomaly.toFixed(2)} SD
                </p>
              </div>
              <Thermometer className="w-6 h-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm text-gray-500">Terrain</p>
                <p className="text-xl font-bold">{terrain.elevation_m}m</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Slope: {terrain.slope_degrees.toFixed(1)}°</p>
                <p className="text-sm text-gray-500">Aspect: {terrain.aspect}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vegetation Index Time Series</CardTitle>
        </CardHeader>
        <CardContent>
          <NDVIChart data={vegetation.time_series} showEVI={true} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rainfall History</CardTitle>
        </CardHeader>
        <CardContent>
          <RainfallChart data={climate.rainfall_time_series} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>MRV Summary (Protocol-Agnostic)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto">
            {JSON.stringify(mrv_summary, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
