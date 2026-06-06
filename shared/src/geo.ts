// Pure geo/projection math. No DOM, no state — shared by display + server.

const DEG = Math.PI / 180;

export interface Meters {
  east: number;
  north: number;
}

export interface Point {
  x: number;
  y: number;
}

/**
 * Flat-earth approximation of lat/lon -> local meters relative to a center.
 * Plenty accurate within a few km.
 */
export function llToMeters(
  lat: number,
  lon: number,
  lat0: number,
  lon0: number,
): Meters {
  const east = (lon - lon0) * Math.cos(lat0 * DEG) * 111320;
  const north = (lat - lat0) * 110540;
  return { east, north };
}

/** Horizontal ground distance (meters) from center. */
export function rangeMeters(m: Meters): number {
  return Math.hypot(m.east, m.north);
}

export function metersToKm(m: number): number {
  return m / 1000;
}

/** Pixels per meter so that `radiusKm` fills half of the smaller screen axis. */
export function pxPerMeter(
  screenW: number,
  screenH: number,
  radiusKm: number,
): number {
  return Math.min(screenW, screenH) / 2 / (radiusKm * 1000);
}

export interface ProjectOpts {
  rotationDeg: number;
  mirrorX: boolean;
  mirrorY: boolean;
  pxPerM: number;
  screenW: number;
  screenH: number;
}

/** Local meters -> screen pixels with rotation + mirror, screen-Y inverted. */
export function project(m: Meters, o: ProjectOpts): Point {
  const t = o.rotationDeg * DEG;
  const cos = Math.cos(t);
  const sin = Math.sin(t);
  let x = m.east * cos - m.north * sin;
  let y = m.east * sin + m.north * cos;
  if (o.mirrorX) x = -x;
  if (o.mirrorY) y = -y;
  return {
    x: o.screenW / 2 + x * o.pxPerM,
    y: o.screenH / 2 - y * o.pxPerM, // screen Y grows downward
  };
}

/**
 * Dead-reckon a position forward along its track at ground speed.
 * Returns new local meters. Used to smooth ~1 Hz updates to 60 fps.
 */
export function deadReckon(
  m: Meters,
  trackDeg: number | undefined,
  gsKmh: number | undefined,
  dtSec: number,
): Meters {
  if (trackDeg == null || gsKmh == null || gsKmh <= 0) return m;
  const dist = (gsKmh / 3.6) * dtSec; // km/h → m/s → meters
  const t = trackDeg * DEG;
  return {
    east: m.east + dist * Math.sin(t),
    north: m.north + dist * Math.cos(t),
  };
}

export const EMERGENCY_SQUAWKS = new Set(["7500", "7600", "7700"]);
