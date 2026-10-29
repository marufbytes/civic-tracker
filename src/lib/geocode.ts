// Turns map coordinates into a short readable place name, using free OpenStreetMap reverse geocoding.
export async function getPlaceName(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&zoom=16&lat=${lat}&lon=${lng}`;
    const response = await fetch(url);
    const data = await response.json();

    const address = data.address;
    if (!address) return null;

    const area = address.suburb || address.neighbourhood || address.quarter || address.village || address.road;
    const city = address.city || address.town || address.city_district || address.county || address.state_district;
    const parts = [area, city].filter(Boolean);

    if (parts.length > 0) return parts.join(', ');
    return data.display_name ? data.display_name.split(',').slice(0, 2).join(',').trim() : null;
  } catch {
    return null;
  }
}

