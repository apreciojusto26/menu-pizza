export interface DeliveryTown {
  readonly id: string;
  readonly name: string;
  readonly lat: number;
  readonly lng: number;
  readonly km: number;
}

/** Radio de reparto mostrado en el mapa — coincide con el corte usado para filtrar deliveryTowns. */
export const DELIVERY_RADIUS_KM = 20;

/** Fariza (Plaza la Iglesia 7) — sede del local, centro del mapa de reparto. */
export const DELIVERY_ORIGIN: DeliveryTown = {
  id: "fariza",
  name: "Fariza",
  lat: 41.42082,
  lng: -6.27176,
  km: 0,
};

/**
 * Pueblos de la comarca de Sayago a 20 km o menos de Fariza (línea recta),
 * geocodificados contra OpenStreetMap/Nominatim (no estimados a mano). Incluye
 * las aldeas del propio término municipal de Fariza (Cozcurrita, Mámoles,
 * Badilla, Palazuelo de Sayago, Tudera, Zafara — todas a pocos km).
 * Ordenados de más cerca a más lejos. La distancia real por carretera suele
 * ser mayor a la línea recta — usar esto como referencia, no como tarifa
 * definitiva de envío.
 */
export const deliveryTowns: readonly DeliveryTown[] = [
  {
    id: "cozcurrita",
    name: "Cozcurrita",
    lat: 41.4427265,
    lng: -6.2823841,
    km: 2.6,
  },
  { id: "mamoles", name: "Mámoles", lat: 41.4021439, lng: -6.3066628, km: 3.6 },
  { id: "badilla", name: "Badilla", lat: 41.4504105, lng: -6.2533076, km: 3.6 },
  {
    id: "palazuelo-de-sayago",
    name: "Palazuelo de Sayago",
    lat: 41.3865618,
    lng: -6.2818156,
    km: 3.9,
  },
  { id: "zafara", name: "Zafara", lat: 41.3935415, lng: -6.2377258, km: 4.2 },
  { id: "tudera", name: "Tudera", lat: 41.4178551, lng: -6.208573, km: 5.3 },
  { id: "arganin", name: "Argañín", lat: 41.43963, lng: -6.2087, km: 5.7 },
  {
    id: "muga-de-sayago",
    name: "Muga de Sayago",
    lat: 41.38743,
    lng: -6.19839,
    km: 7.2,
  },
  {
    id: "formariz",
    name: "Formariz",
    lat: 41.3461915,
    lng: -6.2908368,
    km: 8.5,
  },
  { id: "gamones", name: "Gamones", lat: 41.46705, lng: -6.1778, km: 9.4 },
  {
    id: "torregamones",
    name: "Torregamones",
    lat: 41.48813,
    lng: -6.17855,
    km: 10.8,
  },
  { id: "luelmo", name: "Luelmo", lat: 41.43961, lng: -6.13271, km: 11.8 },
  {
    id: "villar-del-buey",
    name: "Villar del Buey",
    lat: 41.32808,
    lng: -6.18744,
    km: 12.5,
  },
  { id: "moralina", name: "Moralina", lat: 41.48906, lng: -6.13756, km: 13.5 },
  {
    id: "villardiegua-de-la-ribera",
    name: "Villardiegua de la Ribera",
    lat: 41.53698,
    lng: -6.18143,
    km: 14.9,
  },
  {
    id: "moral-de-sayago",
    name: "Moral de Sayago",
    lat: 41.47253,
    lng: -6.10108,
    km: 15.3,
  },
  {
    id: "fermoselle",
    name: "Fermoselle",
    lat: 41.31741,
    lng: -6.39492,
    km: 15.4,
  },
  {
    id: "bermillo-de-sayago",
    name: "Bermillo de Sayago",
    lat: 41.35721,
    lng: -6.06566,
    km: 18.6,
  },
];
