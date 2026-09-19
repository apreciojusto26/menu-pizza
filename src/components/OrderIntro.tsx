import { useContactInfo } from "../hooks/useContactInfo";
import type { ContactInfo } from "../lib/contactSheet";
import { createWhatsAppUrl } from "../lib/siteLinks";
import { WhatsAppButtonView } from "./WhatsAppButtonView";

interface OrderIntroProps {
  readonly initialContact: ContactInfo;
  readonly sheetUrl?: string | undefined;
}

export function OrderIntro({ initialContact, sheetUrl }: OrderIntroProps) {
  const contact = useContactInfo(initialContact, sheetUrl);
  const ready =
    createWhatsAppUrl({
      number: contact.number,
      display: contact.display,
      message: contact.message,
      placeholder: contact.placeholder,
    }) !== null;

  return (
    <>
      <p className="order-lead">
        {ready
          ? "El flujo convierte una visita desde QR en un pedido directo por WhatsApp."
          : "El flujo desde QR está preparado; confirma un canal de pedido válido antes de activarlo."}
      </p>
      <WhatsAppButtonView contact={contact} />
    </>
  );
}
