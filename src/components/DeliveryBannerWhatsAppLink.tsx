import { useContactInfo } from "../hooks/useContactInfo";
import type { ContactInfo } from "../lib/contactSheet";
import { createWhatsAppUrl } from "../lib/siteLinks";

const FREE_SHIPPING_MESSAGE =
  "Hola! Quiero consultar el envio a mi zona. Mi dirección es:";

interface DeliveryBannerWhatsAppLinkProps {
  readonly initialContact: ContactInfo;
  readonly sheetUrl?: string | undefined;
}

export function DeliveryBannerWhatsAppLink({
  initialContact,
  sheetUrl,
}: DeliveryBannerWhatsAppLinkProps) {
  const contact = useContactInfo(initialContact, sheetUrl);
  const whatsappUrl = createWhatsAppUrl({
    number: contact.number,
    display: contact.display,
    message: FREE_SHIPPING_MESSAGE,
    placeholder: contact.placeholder,
  });

  if (!whatsappUrl) {
    return <strong>consultanos por WhatsApp</strong>;
  }

  return (
    <a
      className="delivery-banner-link"
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      <strong>consultanos por WhatsApp</strong>
    </a>
  );
}
