import { useLocationInfo } from "../hooks/useLocationInfo";
import type { LocationInfo } from "../lib/contactSheet";
import { getConfigurationStatus } from "../lib/siteLinks";

interface LocationCardProps {
  readonly initialLocation: LocationInfo;
  readonly sheetUrl?: string | undefined;
}

export function LocationCard({ initialLocation, sheetUrl }: LocationCardProps) {
  const location = useLocationInfo(initialLocation, sheetUrl);
  const status = getConfigurationStatus(location.placeholder);

  return (
    <article className="info-card info-card--clay">
      <span className="info-icon" aria-hidden="true">
        ⌖
      </span>
      <p className="card-kicker">Dónde</p>
      <h3>{location.label}</h3>
      <p>{location.detail}</p>
      <p className="status-copy">{status.description}</p>
      <span
        className={`placeholder-chip${!location.placeholder ? " placeholder-chip--confirmed" : ""}`}
      >
        {status.label}
      </span>
    </article>
  );
}
