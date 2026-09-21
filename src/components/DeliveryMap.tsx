import { useEffect, useRef, useState } from "react";

import {
  DELIVERY_ORIGIN,
  DELIVERY_RADIUS_KM,
  deliveryTowns,
  getDeliveryFee,
  getDeliveryFeePerKm,
} from "../data/delivery-towns";
import { formatAmount } from "../lib/cart/format";

type LeafletLib = typeof import("leaflet");
type L = LeafletLib extends { default: infer D } ? D : LeafletLib;

const originIcon = (L: L) =>
  L.divIcon({
    className: "",
    html: `
      <div class="delivery-origin-pin">
        <span class="delivery-origin-pin-badge">
          <img
            src="/logo-italypizza-mark.png"
            alt=""
            style="width:42px;height:42px;object-fit:contain;max-width:none;"
          />
        </span>
        <span class="delivery-origin-pin-tail"></span>
      </div>`,
    iconSize: [56, 68],
    iconAnchor: [28, 68],
  });

const townIcon = (L: L) =>
  L.divIcon({
    className: "",
    html: `<span class="delivery-marker-dot delivery-marker-dot--town"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

export function DeliveryMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<Map<string, import("leaflet").Marker>>(new Map());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const init = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      const map = L.map(mapRef.current!, {
        scrollWheelZoom: true,
        zoomControl: true,
        attributionControl: true,
      });
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      // El bounding box del radio se calcula a mano (no con circle.getBounds())
      // porque ese método necesita que el mapa ya tenga una vista activa, y
      // acá todavía no la tiene.
      const latDelta = DELIVERY_RADIUS_KM / 111.32;
      const lngDelta =
        DELIVERY_RADIUS_KM /
        (111.32 * Math.cos((DELIVERY_ORIGIN.lat * Math.PI) / 180));
      map.fitBounds(
        L.latLngBounds([
          [DELIVERY_ORIGIN.lat + latDelta, DELIVERY_ORIGIN.lng + lngDelta],
          [DELIVERY_ORIGIN.lat - latDelta, DELIVERY_ORIGIN.lng - lngDelta],
        ]),
        { padding: [32, 32] },
      );

      L.circle([DELIVERY_ORIGIN.lat, DELIVERY_ORIGIN.lng], {
        radius: DELIVERY_RADIUS_KM * 1000,
        color: "#be292b",
        weight: 3,
        opacity: 0.85,
        fillColor: "#be292b",
        fillOpacity: 0.07,
      }).addTo(map);

      for (const town of deliveryTowns) {
        L.polyline(
          [
            [DELIVERY_ORIGIN.lat, DELIVERY_ORIGIN.lng],
            [town.lat, town.lng],
          ],
          {
            color: "#be292b",
            weight: 2,
            opacity: 0.5,
            dashArray: "6 7",
            lineCap: "round",
          },
        ).addTo(map);

        const fee = getDeliveryFee(town.km);
        const feePerKm = getDeliveryFeePerKm(town.km);
        const marker = L.marker([town.lat, town.lng], { icon: townIcon(L) })
          .addTo(map)
          .bindPopup(
            `<strong>${town.name}</strong><br />${town.km.toFixed(1)} km desde Fariza${
              fee !== null ? `<br />Envío: ${formatAmount(fee)}` : ""
            }${feePerKm !== null ? `<br />≈ ${formatAmount(feePerKm)}/km` : ""}`,
            { closeButton: false },
          )
          .on("click", () => setSelectedId(town.id));
        markersRef.current.set(town.id, marker);
      }

      L.marker([DELIVERY_ORIGIN.lat, DELIVERY_ORIGIN.lng], {
        icon: originIcon(L),
        zIndexOffset: 1000,
      })
        .addTo(map)
        .bindPopup(`<strong>${DELIVERY_ORIGIN.name}</strong><br />Sede`, {
          closeButton: false,
        });
    };

    void init();

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  const goToTown = (id: string, lat: number, lng: number) => {
    setSelectedId(id);
    mapInstanceRef.current?.flyTo([lat, lng], 13, {
      animate: true,
      duration: 0.8,
    });
    markersRef.current.get(id)?.openPopup();
  };

  return (
    <>
      <div
        ref={mapRef}
        className="delivery-map"
        aria-label={`Mapa de reparto: distancia en km desde ${DELIVERY_ORIGIN.name} a los pueblos cercanos de la comarca de Sayago`}
      />
      <ul
        className="delivery-town-list"
        aria-label="Pueblos cercanos, seleccioná uno para ubicarlo en el mapa"
      >
        {deliveryTowns.map((town) => {
          const fee = getDeliveryFee(town.km);
          const feePerKm = getDeliveryFeePerKm(town.km);
          return (
            <li key={town.id}>
              <button
                type="button"
                className={
                  selectedId === town.id
                    ? "delivery-town-item delivery-town-item--selected"
                    : "delivery-town-item"
                }
                onClick={() => goToTown(town.id, town.lat, town.lng)}
              >
                <span>{town.name}</span>
                <span className="delivery-town-item-meta">
                  <span>{town.km.toFixed(1)} km</span>
                  {fee !== null && (
                    <span className="delivery-town-item-fee">
                      Envío: {formatAmount(fee)}
                    </span>
                  )}
                  {feePerKm !== null && (
                    <span className="delivery-town-item-per-km">
                      ≈ {formatAmount(feePerKm)}/km
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
