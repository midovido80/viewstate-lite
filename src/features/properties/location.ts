const coordinatePatterns = [
  /[?&]query=(-?\d{1,3}(?:\.\d+)?)(?:%2C|,)(-?\d{1,3}(?:\.\d+)?)/i,
  /@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/,
  /[?&]q=(-?\d{1,3}(?:\.\d+)?)(?:%2C|,)(-?\d{1,3}(?:\.\d+)?)/i,
];

export function googleMapsUrl(latitude: number,longitude: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

export function parseCoordinatesFromMapUrl(url: string): {latitude:number;longitude:number}|null {
  for (const pattern of coordinatePatterns) {
    const match=url.match(pattern);
    if (!match) continue;
    const latitude=Number(match[1]);
    const longitude=Number(match[2]);
    if (Number.isFinite(latitude)&&Number.isFinite(longitude)&&Math.abs(latitude)<=90&&Math.abs(longitude)<=180) {
      return {latitude,longitude};
    }
  }
  return null;
}
