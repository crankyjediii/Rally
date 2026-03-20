import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return Response.json({ error: 'Missing lat/lng parameters' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Rally-App/1.0 (contact@rally.app)',
        },
      }
    );

    if (!res.ok) throw new Error('Nominatim API error');

    const data = await res.json();
    const address = data.address || {};

    return Response.json({
      city: address.city || address.town || address.village || address.hamlet || 'Unknown City',
      neighborhood: address.suburb || address.neighbourhood || address.quarter || undefined,
      state: address.state || undefined,
      country: address.country || undefined,
      displayName: data.display_name || undefined,
    });
  } catch {
    return Response.json({ city: 'Your City' });
  }
}
