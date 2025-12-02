import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Farm } from '@/types';
import { fetchFarmDetailData } from '@/services/farm-data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    let farm: Farm | null = null;
    
    if (supabase) {
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!error && data) {
        farm = data;
      }
    }
    
    if (!farm) {
      const farmsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/farms`
      );
      const farmsData = await farmsResponse.json();
      farm = farmsData.farms?.find((f: Farm) => f.id === id) || null;
    }
    
    if (!farm) {
      return NextResponse.json({ error: 'Farm not found' }, { status: 404 });
    }
    
    const farmData = await fetchFarmDetailData(farm);
    
    return NextResponse.json({ data: farmData });
  } catch (error) {
    console.error('Error fetching farm data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch farm data' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    let farm: Farm | null = null;
    
    if (supabase) {
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!error && data) {
        farm = data;
      }
    }
    
    if (!farm) {
      const farmsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/farms`
      );
      const farmsData = await farmsResponse.json();
      farm = farmsData.farms?.find((f: Farm) => f.id === id) || null;
    }
    
    if (!farm) {
      return NextResponse.json({ error: 'Farm not found' }, { status: 404 });
    }
    
    const farmData = await fetchFarmDetailData(farm);
    
    if (supabase) {
      await supabase
        .from('farm_data')
        .upsert({
          farm_id: id,
          data: farmData,
          updated_at: new Date().toISOString(),
        });
    }
    
    return NextResponse.json({ 
      data: farmData,
      message: 'Farm data updated successfully' 
    });
  } catch (error) {
    console.error('Error updating farm data:', error);
    return NextResponse.json(
      { error: 'Failed to update farm data' },
      { status: 500 }
    );
  }
}
