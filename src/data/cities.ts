// Città per i rimbalzi del tracker: [nome, longitudine, latitudine].

export type City = { name: string; lon: number; lat: number };

const c = (name: string, lon: number, lat: number): City => ({ name, lon, lat });

export const WORLD_CITIES: City[] = [
  c('Reykjavík', -21.9, 64.1),
  c('New York', -74.0, 40.7),
  c('Los Angeles', -118.2, 34.1),
  c('Città del Messico', -99.1, 19.4),
  c('San Paolo', -46.6, -23.5),
  c('Buenos Aires', -58.4, -34.6),
  c('Toronto', -79.4, 43.7),
  c('Anchorage', -149.9, 61.2),
  c('Londra', -0.1, 51.5),
  c('Parigi', 2.35, 48.9),
  c('Berlino', 13.4, 52.5),
  c('Stoccolma', 18.1, 59.3),
  c('Mosca', 37.6, 55.8),
  c('Il Cairo', 31.2, 30.0),
  c('Lagos', 3.4, 6.5),
  c('Nairobi', 36.8, -1.3),
  c('Città del Capo', 18.4, -33.9),
  c('Dubai', 55.3, 25.2),
  c('Mumbai', 72.9, 19.1),
  c('Singapore', 103.8, 1.35),
  c('Hong Kong', 114.2, 22.3),
  c('Pechino', 116.4, 39.9),
  c('Tokyo', 139.7, 35.7),
  c('Seul', 127.0, 37.6),
  c('Sydney', 151.2, -33.9),
  c('Auckland', 174.8, -36.8),
  c('Honolulu', -157.9, 21.3),
  c('Antartide (base pinguini)', 166.7, -77.8),
];

export const ITALIAN_CITIES: City[] = [
  c('Milano', 9.19, 45.46),
  c('Roma', 12.5, 41.9),
  c('Napoli', 14.27, 40.85),
  c('Torino', 7.69, 45.07),
  c('Bologna', 11.34, 44.49),
  c('Firenze', 11.26, 43.77),
  c('Palermo', 13.36, 38.12),
  c('Bari', 16.87, 41.12),
  c('Venezia', 12.33, 45.44),
  c('Catania', 15.09, 37.5),
  c('Genova', 8.93, 44.41),
  c('Cagliari', 9.11, 39.22),
];
