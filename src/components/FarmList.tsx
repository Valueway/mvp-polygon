'use client';

import React from 'react';
import { MapPin, Leaf, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Farm, FarmDetailData } from '@/types';
import { cn } from '@/lib/utils';

interface FarmListProps {
  farms: Farm[];
  farmData: Record<string, FarmDetailData>;
  selectedFarmId: string | null;
  onFarmSelect: (farmId: string) => void;
}

export default function FarmList({
  farms,
  farmData,
  selectedFarmId,
  onFarmSelect,
}: FarmListProps) {
  const getHealthStatus = (ndvi: number) => {
    if (ndvi >= 0.6) return { label: 'Healthy', variant: 'success' as const };
    if (ndvi >= 0.4) return { label: 'Moderate', variant: 'warning' as const };
    return { label: 'Stressed', variant: 'destructive' as const };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Farm Parcels</h2>
        <span className="text-sm text-gray-500">{farms.length} farms</span>
      </div>
      
      <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
        {farms.map((farm) => {
          const data = farmData[farm.id];
          const ndvi = data?.vegetation.current_ndvi || 0;
          const healthStatus = getHealthStatus(ndvi);
          const hasAlerts = data?.alerts && data.alerts.length > 0;

          return (
            <Card
              key={farm.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                selectedFarmId === farm.id
                  ? 'ring-2 ring-blue-500 bg-blue-50'
                  : 'hover:bg-gray-50'
              )}
              onClick={() => onFarmSelect(farm.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm truncate">{farm.name}</h3>
                      {hasAlerts && (
                        <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <MapPin className="w-3 h-3" />
                      <span>{farm.region}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-600">
                        {farm.area_ha.toFixed(1)} ha
                      </span>
                      <span className="text-xs text-gray-400">|</span>
                      <span className="text-xs text-gray-600">
                        {farm.altitude_m}m
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={healthStatus.variant} className="text-xs">
                      {healthStatus.label}
                    </Badge>
                    {data && (
                      <div className="flex items-center gap-1 text-xs">
                        <Leaf className="w-3 h-3 text-green-600" />
                        <span className="font-medium">{ndvi.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
                {data && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">SOC</span>
                        <p className="font-medium">{data.soc.baseline_0_30cm.toFixed(1)} t/ha</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Rain</span>
                        <p className={cn(
                          'font-medium',
                          data.climate.rainfall_anomaly < -1 ? 'text-red-600' : ''
                        )}>
                          {data.climate.rainfall_anomaly > 0 ? '+' : ''}
                          {data.climate.rainfall_anomaly.toFixed(1)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Forest</span>
                        <p className={cn(
                          'font-medium',
                          data.forest_change.loss_detected ? 'text-red-600' : 'text-green-600'
                        )}>
                          {data.forest_change.loss_detected ? 'Loss' : 'Stable'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
