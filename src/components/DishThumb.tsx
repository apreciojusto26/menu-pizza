import { useState, type ReactElement } from "react";

import type { MenuSectionId } from "../data/menu";

const PLACEHOLDER_THUMB_LABEL =
  "Ilustración de muestra, no es una foto real del plato";

function PizzaThumb() {
  return (
    <svg
      className="dish-thumb-art"
      viewBox="0 0 48 48"
      role="img"
      aria-label={PLACEHOLDER_THUMB_LABEL}
    >
      <path
        d="M24 5 43 39A22 22 0 0 1 5 39Z"
        fill="var(--sun)"
        stroke="var(--clay-dark)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="17" r="2.6" fill="var(--clay)" />
      <circle cx="18" cy="27" r="2.6" fill="var(--clay)" />
      <circle cx="30" cy="29" r="2.6" fill="var(--clay)" />
    </svg>
  );
}

function EmpanadaThumb() {
  return (
    <svg
      className="dish-thumb-art"
      viewBox="0 0 48 48"
      role="img"
      aria-label={PLACEHOLDER_THUMB_LABEL}
    >
      <path
        d="M6 27Q6 10 24 10Q42 10 42 27Q42 35 24 39Q6 35 6 27Z"
        fill="var(--sun)"
        stroke="var(--clay-dark)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <g fill="var(--clay-dark)">
        <circle cx="11" cy="25" r="1.6" />
        <circle cx="17" cy="17" r="1.6" />
        <circle cx="24" cy="13" r="1.6" />
        <circle cx="31" cy="17" r="1.6" />
        <circle cx="37" cy="25" r="1.6" />
      </g>
    </svg>
  );
}

function GenericThumb() {
  return (
    <svg
      className="dish-thumb-art"
      viewBox="0 0 48 48"
      role="img"
      aria-label={PLACEHOLDER_THUMB_LABEL}
    >
      <circle
        cx="24"
        cy="24"
        r="17"
        fill="var(--sun)"
        stroke="var(--clay-dark)"
        strokeWidth="2"
      />
      <circle cx="24" cy="24" r="6" fill="var(--paper)" />
    </svg>
  );
}

const SECTION_THUMBS: Record<string, () => ReactElement> = {
  pizzas: PizzaThumb,
  empanadas: EmpanadaThumb,
};

export const renderSectionThumb = (sectionId: MenuSectionId): ReactElement => {
  const Thumb = SECTION_THUMBS[sectionId] ?? GenericThumb;
  return <Thumb />;
};

interface DishThumbProps {
  readonly imageUrl?: string | undefined;
  readonly sectionId: MenuSectionId;
}

export function DishThumb({ imageUrl, sectionId }: DishThumbProps) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!imageUrl || imageFailed) {
    return renderSectionThumb(sectionId);
  }

  return (
    <img
      src={imageUrl}
      alt=""
      loading="lazy"
      onError={() => setImageFailed(true)}
    />
  );
}
