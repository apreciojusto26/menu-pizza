import { useContactInfo } from "../hooks/useContactInfo";
import type { ContactInfo } from "../lib/contactSheet";
import { WhatsAppButtonView } from "./WhatsAppButtonView";

interface WhatsAppOrderButtonProps {
  readonly initialContact: ContactInfo;
  readonly sheetUrl?: string | undefined;
}

export function WhatsAppOrderButton({
  initialContact,
  sheetUrl,
}: WhatsAppOrderButtonProps) {
  const contact = useContactInfo(initialContact, sheetUrl);
  return <WhatsAppButtonView contact={contact} />;
}
