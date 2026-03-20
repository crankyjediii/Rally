import { NextRequest } from 'next/server';
import { fetchOverpassPlaces } from '@/lib/overpass';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius') || '2000'; // meters

  if (!lat || !lng) {
    return Response.json({ error: 'Missing lat/lng parameters' }, { status: 400 });
  }

  try {
    const places = await fetchOverpassPlaces(
      parseFloat(lat),
      parseFloat(lng),
      parseInt(radius, 10),
    );
    return Response.json({ places, count: places.length });
  } catch (error) {
    console.error('Places API error:', error);
    return Response.json({ places: [], count: 0, error: 'Failed to fetch places' });
  }
}
