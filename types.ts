export interface Coordinates {
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
}

export enum MarkerType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  PLACE = 'PLACE',
  SHOP = 'SHOP'
}

export interface MarkerData {
  id: string;
  coords: Coordinates;
  title: string;
  description: string;
  fullContent?: string; // HTML or Markdown content for the detail page
  type: MarkerType;
  imageUrl?: string;
  createdAt: number;
}

export interface MapConfig {
  imageUrl: string | null;
  name: string;
  width?: number;
  height?: number;
}