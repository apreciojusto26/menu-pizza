import { useScheduleInfo } from "../hooks/useScheduleInfo";
import type { ScheduleInfo } from "../lib/contactSheet";
import { getConfigurationStatus } from "../lib/siteLinks";

interface ScheduleCardProps {
  readonly initialSchedule: ScheduleInfo;
  readonly sheetUrl?: string | undefined;
}

export function ScheduleCard({ initialSchedule, sheetUrl }: ScheduleCardProps) {
  const schedule = useScheduleInfo(initialSchedule, sheetUrl);
  const status = getConfigurationStatus(schedule.placeholder);

  return (
    <article className="info-card info-card--dark">
      <span className="info-icon" aria-hidden="true">
        ◷
      </span>
      <p className="card-kicker">Cuándo</p>
      <h3>{schedule.label}</h3>
      <p>{schedule.detail}</p>
      <p className="status-copy">{status.description}</p>
      <span
        className={`placeholder-chip${!schedule.placeholder ? " placeholder-chip--confirmed" : ""}`}
      >
        {status.label}
      </span>
    </article>
  );
}
