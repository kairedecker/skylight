import type { Units } from "./config.js";

export function formatAltitude(m: number, units: Units): string {
  if (units === "imperial") return `${Math.round(m / 0.3048).toLocaleString()} ft`;
  return `${Math.round(m).toLocaleString()} m`;
}

export function formatSpeed(kmh: number, units: Units): string {
  if (units === "imperial") return `${Math.round(kmh / 1.852)} kt`;
  return `${Math.round(kmh)} km/h`;
}

export function formatDistance(km: number, units: Units): string {
  if (units === "imperial") return `${Math.round(km * 0.621371).toLocaleString()} mi`;
  return `${Math.round(km).toLocaleString()} km`;
}

export function formatRadius(km: number, units: Units): string {
  if (units === "imperial") return `${(km * 0.621371).toFixed(1)} mi`;
  return `${km.toFixed(1)} km`;
}

export function toDisplayRadius(km: number, units: Units): number {
  return units === "imperial" ? km * 0.621371 : km;
}

export function fromDisplayRadius(v: number, units: Units): number {
  return units === "imperial" ? v / 0.621371 : v;
}

export function toDisplayAltitude(m: number, units: Units): number {
  return units === "imperial" ? m / 0.3048 : m;
}

export function fromDisplayAltitude(v: number, units: Units): number {
  return units === "imperial" ? v * 0.3048 : v;
}
