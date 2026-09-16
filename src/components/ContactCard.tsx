import { useContactInfo } from "../hooks/useContactInfo";
import type { ContactInfo } from "../lib/contactSheet";
import { createWhatsAppUrl, getConfigurationStatus } from "../lib/siteLinks";

interface ContactCardProps {
  readonly initialContact: ContactInfo;
  readonly sheetUrl?: string | undefined;
}

export function ContactCard({ initialContact, sheetUrl }: ContactCardProps) {
  const contact = useContactInfo(initialContact, sheetUrl);
  const whatsappUrl = createWhatsAppUrl({
    number: contact.number,
    display: contact.display,
    message: contact.message,
    placeholder: contact.placeholder,
  });
  const ready = whatsappUrl !== null;
  const status = getConfigurationStatus(!ready);

  return (
    <article className="info-card info-card--light">
      <span className="info-icon" aria-hidden="true">
        ✆
      </span>
      <p className="card-kicker">Contacto</p>
      <h3>{contact.display || "Contacto por confirmar"}</h3>
      <p>
        {ready
          ? "Canal de pedidos preparado y validado."
          : "El número y el mensaje se configuran con variables de entorno o la hoja de contacto."}
      </p>
      <p className="status-copy">{status.description}</p>
      <span
        className={`placeholder-chip${ready ? " placeholder-chip--confirmed" : ""}`}
      >
        {status.label}
      </span>
    </article>
  );
}
