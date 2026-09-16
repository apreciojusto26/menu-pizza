import { useEffect, useState } from "react";

import { fetchContactFromSheet, type ContactInfo } from "../lib/contactSheet";

export function useContactInfo(
  initialContact: ContactInfo,
  sheetUrl?: string | undefined,
): ContactInfo {
  const [contact, setContact] = useState(initialContact);

  useEffect(() => {
    if (!sheetUrl) return;

    let cancelled = false;
    fetchContactFromSheet(sheetUrl).then((liveContact) => {
      if (!cancelled && liveContact) setContact(liveContact);
    });

    return () => {
      cancelled = true;
    };
  }, [sheetUrl]);

  return contact;
}
