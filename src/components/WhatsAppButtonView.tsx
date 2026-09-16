import type { ContactInfo } from "../lib/contactSheet";
import { createWhatsAppUrl } from "../lib/siteLinks";

interface WhatsAppButtonViewProps {
  readonly contact: ContactInfo;
}

export function WhatsAppButtonView({ contact }: WhatsAppButtonViewProps) {
  const whatsappUrl = createWhatsAppUrl({
    number: contact.number,
    display: contact.display,
    message: contact.message,
    placeholder: contact.placeholder,
  });

  if (!whatsappUrl) {
    return (
      <div className="contact-pending" role="status">
        <strong>Pedidos online pendientes de configurar</strong>
        <span>El enlace aparecerá al confirmar un número válido.</span>
      </div>
    );
  }

  return (
    <a
      className="button button--sun"
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M20.5 11.8a8.5 8.5 0 0 1-12.6 7.5L3 20.6l1.3-4.8A8.5 8.5 0 1 1 20.5 11.8Z" />
        <path d="M8.2 7.4c.2-.4.4-.4.7-.4h.4c.1 0 .3 0 .4.4l.8 1.9c.1.2 0 .4-.1.6l-.6.7c-.2.1-.2.3-.1.5.6 1.2 1.5 2.1 2.7 2.7.2.1.4.1.5-.1l.8-1c.2-.2.4-.2.6-.1l1.8.9c.2.1.3.2.3.4 0 .3-.2 1.5-1.1 2.1-.6.4-1.3.6-2.1.4-1-.2-2.3-.7-4-2.2-1.4-1.3-2.4-2.8-2.7-3.9-.4-1.2 0-2.4.5-2.9.4-.4.8-.5 1.2-.5Z" />
      </svg>
      Pedir por WhatsApp
      <span className="external-link-note">Abre una pestaña nueva</span>
    </a>
  );
}
