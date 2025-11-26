// Geocoding utilities using OpenStreetMap Nominatim API

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  address: string;
}

/**
 * Convert address to coordinates using OpenStreetMap Nominatim
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  if (!address.trim()) return null;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (!data || data.length === 0) return null;

    const result = data[0];
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      address: result.display_name,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Reverse geocode - convert coordinates to address
 * Returns a short, readable address format (e.g., "Street Name 123")
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    
    // Build a short address from available components
    const address = data.address;
    if (!address) return data.display_name || null;
    
    // Try to construct a simple "Street Number" format
    const parts = [];
    
    if (address.road) {
      parts.push(address.road);
    }
    
    if (address.house_number) {
      parts.push(address.house_number);
    }
    
    // If we have a good short address, return it
    if (parts.length > 0) {
      return parts.join(' ');
    }
    
    // Fallback to display_name
    return data.display_name || null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}
