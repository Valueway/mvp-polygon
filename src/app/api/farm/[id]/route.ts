import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Farm, UpdateFarmInput } from '@/types';
import { calculatePolygonArea, calculateCentroid } from '@/lib/utils';

let inMemoryFarms: Farm[] = [];

async function getInMemoryFarms(): Promise<Farm[]> {
  if (inMemoryFarms.length === 0) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/farms`);
    const data = await response.json();
    inMemoryFarms = data.farms || [];
  }
  return inMemoryFarms;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (supabase) {
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.warn('Supabase error, checking in-memory:', error.message);
        const farms = await getInMemoryFarms();
        const farm = farms.find(f => f.id === id);
        if (!farm) {
          return NextResponse.json({ error: 'Farm not found' }, { status: 404 });
        }
        return NextResponse.json({ farm });
      }
      
      return NextResponse.json({ farm: data });
    }
    
    const farms = await getInMemoryFarms();
    const farm = farms.find(f => f.id === id);
    if (!farm) {
      return NextResponse.json({ error: 'Farm not found' }, { status: 404 });
    }
    return NextResponse.json({ farm });
  } catch (error) {
    console.error('Error fetching farm:', error);
    return NextResponse.json({ error: 'Failed to fetch farm' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateFarmInput = await request.json();
    
    const updates: Partial<Farm> = {
      ...body,
      updated_at: new Date().toISOString(),
    };
    
    if (body.polygon) {
      updates.area_ha = Math.round(calculatePolygonArea(body.polygon) * 100) / 100;
      updates.centroid = calculateCentroid(body.polygon);
    }
    
    if (supabase) {
      const { data, error } = await supabase
        .from('farms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.warn('Supabase error, updating in-memory:', error.message);
        const farms = await getInMemoryFarms();
        const index = farms.findIndex(f => f.id === id);
        if (index === -1) {
          return NextResponse.json({ error: 'Farm not found' }, { status: 404 });
        }
        inMemoryFarms[index] = { ...inMemoryFarms[index], ...updates };
        return NextResponse.json({ farm: inMemoryFarms[index] });
      }
      
      return NextResponse.json({ farm: data });
    }
    
    const farms = await getInMemoryFarms();
    const index = farms.findIndex(f => f.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Farm not found' }, { status: 404 });
    }
    inMemoryFarms[index] = { ...inMemoryFarms[index], ...updates };
    return NextResponse.json({ farm: inMemoryFarms[index] });
  } catch (error) {
    console.error('Error updating farm:', error);
    return NextResponse.json({ error: 'Failed to update farm' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (supabase) {
      const { error } = await supabase
        .from('farms')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.warn('Supabase error, deleting from in-memory:', error.message);
        const farms = await getInMemoryFarms();
        const index = farms.findIndex(f => f.id === id);
        if (index === -1) {
          return NextResponse.json({ error: 'Farm not found' }, { status: 404 });
        }
        inMemoryFarms.splice(index, 1);
        return NextResponse.json({ success: true });
      }
      
      return NextResponse.json({ success: true });
    }
    
    const farms = await getInMemoryFarms();
    const index = farms.findIndex(f => f.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Farm not found' }, { status: 404 });
    }
    inMemoryFarms.splice(index, 1);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting farm:', error);
    return NextResponse.json({ error: 'Failed to delete farm' }, { status: 500 });
  }
}
