import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Farm, CreateFarmInput } from '@/types';
import { calculatePolygonArea, calculateCentroid, generateId } from '@/lib/utils';

const DEMO_FARMS: Farm[] = [
  {
    id: 'farm_demo_001',
    name: 'Finca El Paraíso',
    farmer_info: { name: 'Carlos Mendoza', contact: '+502 5555-1234', organization: 'Cooperativa Huehuetenango' },
    polygon: { type: 'Polygon', coordinates: [[[-91.5123, 15.3245], [-91.5089, 15.3245], [-91.5089, 15.3212], [-91.5123, 15.3212], [-91.5123, 15.3245]]] },
    centroid: { lng: -91.5106, lat: 15.32285 },
    area_ha: 12.5,
    altitude_m: 1650,
    country: 'Guatemala',
    region: 'Huehuetenango',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-11-01T14:30:00Z',
  },
  {
    id: 'farm_demo_002',
    name: 'Finca Santa Rosa',
    farmer_info: { name: 'María García', contact: '+502 5555-2345', organization: 'Cooperativa Antigua' },
    polygon: { type: 'Polygon', coordinates: [[[-90.7234, 14.5567], [-90.7198, 14.5567], [-90.7198, 14.5534], [-90.7234, 14.5534], [-90.7234, 14.5567]]] },
    centroid: { lng: -90.7216, lat: 14.55505 },
    area_ha: 8.3,
    altitude_m: 1520,
    country: 'Guatemala',
    region: 'Antigua Guatemala',
    created_at: '2024-02-20T09:00:00Z',
    updated_at: '2024-10-28T11:15:00Z',
  },
  {
    id: 'farm_demo_003',
    name: 'Finca Los Volcanes',
    farmer_info: { name: 'Pedro Hernández', contact: '+502 5555-3456', organization: 'Asociación Atitlán' },
    polygon: { type: 'Polygon', coordinates: [[[-91.1876, 14.6789], [-91.1834, 14.6789], [-91.1834, 14.6752], [-91.1876, 14.6752], [-91.1876, 14.6789]]] },
    centroid: { lng: -91.1855, lat: 14.67705 },
    area_ha: 15.7,
    altitude_m: 1780,
    country: 'Guatemala',
    region: 'Sololá',
    created_at: '2024-03-10T08:30:00Z',
    updated_at: '2024-11-05T16:45:00Z',
  },
  {
    id: 'farm_demo_004',
    name: 'Finca El Bosque',
    farmer_info: { name: 'Ana López', contact: '+502 5555-4567', organization: 'Cooperativa Cobán' },
    polygon: { type: 'Polygon', coordinates: [[[-90.3654, 15.4723], [-90.3612, 15.4723], [-90.3612, 15.4686], [-90.3654, 15.4686], [-90.3654, 15.4723]]] },
    centroid: { lng: -90.3633, lat: 15.47045 },
    area_ha: 22.1,
    altitude_m: 1340,
    country: 'Guatemala',
    region: 'Alta Verapaz',
    created_at: '2024-04-05T11:00:00Z',
    updated_at: '2024-10-30T09:20:00Z',
  },
  {
    id: 'farm_demo_005',
    name: 'Finca Montaña Verde',
    farmer_info: { name: 'Roberto Castillo', contact: '+502 5555-5678', organization: 'Cooperativa Huehuetenango' },
    polygon: { type: 'Polygon', coordinates: [[[-91.4567, 15.2890], [-91.4523, 15.2890], [-91.4523, 15.2851], [-91.4567, 15.2851], [-91.4567, 15.2890]]] },
    centroid: { lng: -91.4545, lat: 15.28705 },
    area_ha: 18.9,
    altitude_m: 1890,
    country: 'Guatemala',
    region: 'Huehuetenango',
    created_at: '2024-05-12T14:00:00Z',
    updated_at: '2024-11-02T10:30:00Z',
  },
  {
    id: 'farm_demo_006',
    name: 'Finca Agua Dulce',
    farmer_info: { name: 'Elena Morales', contact: '+502 5555-6789', organization: 'Asociación San Marcos' },
    polygon: { type: 'Polygon', coordinates: [[[-91.8234, 14.9567], [-91.8189, 14.9567], [-91.8189, 14.9528], [-91.8234, 14.9528], [-91.8234, 14.9567]]] },
    centroid: { lng: -91.82115, lat: 14.95475 },
    area_ha: 11.2,
    altitude_m: 1720,
    country: 'Guatemala',
    region: 'San Marcos',
    created_at: '2024-06-08T10:30:00Z',
    updated_at: '2024-10-25T15:00:00Z',
  },
  {
    id: 'farm_demo_007',
    name: 'Finca El Cielo',
    farmer_info: { name: 'Jorge Ramírez', contact: '+502 5555-7890', organization: 'Cooperativa Fraijanes' },
    polygon: { type: 'Polygon', coordinates: [[[-90.4876, 14.4234], [-90.4832, 14.4234], [-90.4832, 14.4195], [-90.4876, 14.4195], [-90.4876, 14.4234]]] },
    centroid: { lng: -90.4854, lat: 14.42145 },
    area_ha: 9.8,
    altitude_m: 1480,
    country: 'Guatemala',
    region: 'Guatemala',
    created_at: '2024-07-15T09:00:00Z',
    updated_at: '2024-11-08T12:45:00Z',
  },
  {
    id: 'farm_demo_008',
    name: 'Finca Tierra Fértil',
    farmer_info: { name: 'Lucía Vásquez', contact: '+502 5555-8901', organization: 'Asociación Atitlán' },
    polygon: { type: 'Polygon', coordinates: [[[-91.2123, 14.7456], [-91.2078, 14.7456], [-91.2078, 14.7417], [-91.2123, 14.7417], [-91.2123, 14.7456]]] },
    centroid: { lng: -91.21005, lat: 14.74365 },
    area_ha: 14.3,
    altitude_m: 1620,
    country: 'Guatemala',
    region: 'Sololá',
    created_at: '2024-08-20T13:00:00Z',
    updated_at: '2024-10-22T08:30:00Z',
  },
  {
    id: 'farm_demo_009',
    name: 'Finca Arcoíris',
    farmer_info: { name: 'Miguel Santos', contact: '+502 5555-9012', organization: 'Cooperativa Cobán' },
    polygon: { type: 'Polygon', coordinates: [[[-90.4123, 15.5234], [-90.4078, 15.5234], [-90.4078, 15.5195], [-90.4123, 15.5195], [-90.4123, 15.5234]]] },
    centroid: { lng: -90.41005, lat: 15.52145 },
    area_ha: 20.5,
    altitude_m: 1280,
    country: 'Guatemala',
    region: 'Alta Verapaz',
    created_at: '2024-09-10T11:30:00Z',
    updated_at: '2024-11-10T14:15:00Z',
  },
  {
    id: 'farm_demo_010',
    name: 'Finca Sol Naciente',
    farmer_info: { name: 'Carmen Ortiz', contact: '+502 5555-0123', organization: 'Cooperativa Antigua' },
    polygon: { type: 'Polygon', coordinates: [[[-90.7567, 14.5123], [-90.7522, 14.5123], [-90.7522, 14.5084], [-90.7567, 14.5084], [-90.7567, 14.5123]]] },
    centroid: { lng: -90.75445, lat: 14.51035 },
    area_ha: 7.6,
    altitude_m: 1550,
    country: 'Guatemala',
    region: 'Antigua Guatemala',
    created_at: '2024-10-05T08:00:00Z',
    updated_at: '2024-11-12T10:00:00Z',
  },
];

const inMemoryFarms: Farm[] = [...DEMO_FARMS];

export async function GET() {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('Supabase error, using in-memory data:', error.message);
        return NextResponse.json({ farms: inMemoryFarms });
      }
      
      return NextResponse.json({ farms: data || [] });
    }
    
    return NextResponse.json({ farms: inMemoryFarms });
  } catch (error) {
    console.error('Error fetching farms:', error);
    return NextResponse.json({ farms: inMemoryFarms });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateFarmInput = await request.json();
    
    const { name, farmer_info, polygon, country, region } = body;
    
    if (!name || !polygon || !country || !region) {
      return NextResponse.json(
        { error: 'Missing required fields: name, polygon, country, region' },
        { status: 400 }
      );
    }
    
    const area_ha = calculatePolygonArea(polygon);
    const centroid = calculateCentroid(polygon);
    
    const newFarm: Farm = {
      id: generateId(),
      name,
      farmer_info: farmer_info || { name: 'Unknown' },
      polygon,
      centroid,
      area_ha: Math.round(area_ha * 100) / 100,
      altitude_m: 1500,
      country,
      region,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    if (supabase) {
      const { data, error } = await supabase
        .from('farms')
        .insert([newFarm])
        .select()
        .single();
      
      if (error) {
        console.warn('Supabase error, using in-memory storage:', error.message);
        inMemoryFarms.push(newFarm);
        return NextResponse.json({ farm: newFarm }, { status: 201 });
      }
      
      return NextResponse.json({ farm: data }, { status: 201 });
    }
    
    inMemoryFarms.push(newFarm);
    return NextResponse.json({ farm: newFarm }, { status: 201 });
  } catch (error) {
    console.error('Error creating farm:', error);
    return NextResponse.json(
      { error: 'Failed to create farm' },
      { status: 500 }
    );
  }
}
