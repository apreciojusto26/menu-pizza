import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
} from "react";

import {
  formatPrice,
  type MenuSection,
  type MenuSectionId,
} from "../data/menu";
import { addLine } from "../lib/cart/store";
import { fetchMenuFromSheet } from "../lib/menuSheet";

interface MenuExplorerProps {
  readonly sections: readonly MenuSection[];
  readonly sheetUrl?: string | undefined;
}

type ActiveCategory = "all" | MenuSectionId;

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

const renderSectionThumb = (sectionId: MenuSectionId): ReactElement => {
  const Thumb = SECTION_THUMBS[sectionId] ?? GenericThumb;
  return <Thumb />;
};

interface DishThumbProps {
  readonly imageUrl?: string | undefined;
  readonly sectionId: MenuSectionId;
}

function DishThumb({ imageUrl, sectionId }: DishThumbProps) {
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

const normalize = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");

export function MenuExplorer({
  sections: initialSections,
  sheetUrl,
}: MenuExplorerProps) {
  const [sections, setSections] = useState(initialSections);
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>("all");
  const [query, setQuery] = useState("");
  const [openPhoto, setOpenPhoto] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const closePhotoButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!openPhoto) return;

    lastFocusedElementRef.current = document.activeElement as HTMLElement;
    closePhotoButtonRef.current?.focus();
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpenPhoto(null);
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      lastFocusedElementRef.current?.focus();
    };
  }, [openPhoto]);

  useEffect(() => {
    if (!sheetUrl) return;

    let cancelled = false;
    fetchMenuFromSheet(sheetUrl).then((liveSections) => {
      if (!cancelled && liveSections) setSections(liveSections);
    });

    return () => {
      cancelled = true;
    };
  }, [sheetUrl]);

  const filteredSections = useMemo(() => {
    const normalizedQuery = normalize(query.trim());

    return sections
      .filter(
        (section) => activeCategory === "all" || section.id === activeCategory,
      )
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (!normalizedQuery) return true;
          const searchableText = normalize(
            [
              item.name,
              item.description,
              ...item.badges.map((badge) => badge.label),
            ].join(" "),
          );
          return searchableText.includes(normalizedQuery);
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [activeCategory, query, sections]);

  const visibleCount = filteredSections.reduce(
    (total, section) => total + section.items.length,
    0,
  );

  const selectCategory = (category: ActiveCategory) => {
    setActiveCategory(category);
  };

  const isActiveCategory = (
    category: string | undefined,
  ): category is ActiveCategory =>
    category === "all" || sections.some((section) => section.id === category);

  const handleCategoryKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;

    const tabs = Array.from(
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]',
      ) ?? [],
    );
    const currentIndex = tabs.indexOf(event.currentTarget);
    if (currentIndex < 0) return;

    event.preventDefault();
    const lastIndex = tabs.length - 1;
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? lastIndex
          : event.key === "ArrowRight"
            ? (currentIndex + 1) % tabs.length
            : (currentIndex - 1 + tabs.length) % tabs.length;
    const nextTab = tabs[nextIndex];
    const nextCategory = nextTab?.dataset.category;

    if (nextTab && isActiveCategory(nextCategory)) {
      nextTab.focus();
      setActiveCategory(nextCategory);
    }
  };

  return (
    <section className="menu-explorer" aria-labelledby="carta-heading">
      <div className="menu-heading">
        <div>
          <p className="eyebrow">Elige a tu gusto</p>
          <h2 id="carta-heading">Nuestra carta</h2>
        </div>
        <p className="menu-count" aria-live="polite">
          {visibleCount} {visibleCount === 1 ? "opción" : "opciones"}
        </p>
      </div>

      <div className="menu-toolbar" aria-label="Herramientas de la carta">
        <div
          className="category-tabs"
          role="tablist"
          aria-label="Filtrar por categoría"
        >
          <button
            className="category-tab"
            id="filter-all"
            type="button"
            role="tab"
            aria-selected={activeCategory === "all"}
            aria-controls="menu-results"
            data-category="all"
            tabIndex={activeCategory === "all" ? 0 : -1}
            onClick={() => selectCategory("all")}
            onKeyDown={handleCategoryKeyDown}
          >
            Todo
          </button>
          {sections.map((section) => (
            <button
              className="category-tab"
              id={`filter-${section.id}`}
              type="button"
              role="tab"
              aria-selected={activeCategory === section.id}
              aria-controls="menu-results"
              data-category={section.id}
              tabIndex={activeCategory === section.id ? 0 : -1}
              key={section.id}
              onClick={() => selectCategory(section.id)}
              onKeyDown={handleCategoryKeyDown}
            >
              {section.shortLabel}
            </button>
          ))}
        </div>

        <label className="search-field">
          <span className="sr-only">Buscar en la carta</span>
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="m21 21-4.35-4.35m2.35-5.4A7.75 7.75 0 1 1 3.5 11.25a7.75 7.75 0 0 1 15.5 0Z" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Buscar sabor o ingrediente"
          />
        </label>
      </div>

      <div
        className="menu-results"
        id="menu-results"
        role="tabpanel"
        aria-labelledby={`filter-${activeCategory}`}
        tabIndex={0}
      >
        {filteredSections.length > 0 ? (
          filteredSections.map((section) => (
            <section
              className="menu-section"
              aria-labelledby={`${section.id}-heading`}
              key={section.id}
            >
              <header className="section-intro">
                <p className="eyebrow">{section.eyebrow}</p>
                <h3 id={`${section.id}-heading`}>{section.label}</h3>
                <div className="section-copy">
                  <p>{section.description}</p>
                  {section.placeholder && (
                    <p className="section-draft-note">
                      Sabores de demostración pendientes de confirmar.
                    </p>
                  )}
                  {section.id === "pizzas" && (
                    <p className="section-callout">
                      Todas nuestras pizzas llevan tomate y mozzarella de base —
                      si preferís sin alguno de los dos, avisanos, el precio no
                      cambia. También podemos hacerlas con mozzarella sin
                      lactosa, solo avisanos al pedir.
                    </p>
                  )}
                </div>
              </header>

              <div className="menu-grid">
                {section.items.map((item) => {
                  return (
                    <article className="menu-card" key={item.id}>
                      {item.imageUrl ? (
                        <button
                          type="button"
                          className="dish-thumb dish-thumb--button"
                          onClick={() =>
                            setOpenPhoto({
                              url: item.imageUrl!,
                              name: item.name,
                            })
                          }
                          aria-label={`Ver foto grande de ${item.name}`}
                        >
                          <DishThumb
                            imageUrl={item.imageUrl}
                            sectionId={section.id}
                          />
                        </button>
                      ) : (
                        <div className="dish-thumb">
                          <DishThumb
                            imageUrl={item.imageUrl}
                            sectionId={section.id}
                          />
                        </div>
                      )}
                      <div className="dish-body">
                        <div className="dish-title-row">
                          <h4>{item.name}</h4>
                          {item.placeholder && (
                            <span className="draft-label">Muestra</span>
                          )}
                        </div>
                        <p>
                          {item.description}
                          {item.placeholder && (
                            <span className="item-draft-copy">
                              {" "}
                              Composición de muestra.
                            </span>
                          )}
                        </p>
                        {item.badges.length > 0 && (
                          <ul className="badges" aria-label="Características">
                            {item.badges.map((badge) => (
                              <li
                                className={`badge badge--${badge.tone}`}
                                key={badge.label}
                              >
                                {badge.label}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <dl className="price-list">
                        {item.prices.map((price) => (
                          <div key={price.label}>
                            <dt>{price.label}</dt>
                            <dd>
                              {formatPrice(price)}
                              {price.placeholder && (
                                <span className="sr-only">
                                  , precio de muestra
                                </span>
                              )}
                            </dd>
                            {!item.placeholder && !price.placeholder && (
                              <button
                                type="button"
                                className="add-to-cart-button"
                                onClick={() => addLine(item.id, price.label, 1)}
                                aria-label={`Agregar ${item.name}, ${price.label}, al carrito`}
                              >
                                Agregar
                              </button>
                            )}
                          </div>
                        ))}
                      </dl>
                    </article>
                  );
                })}
              </div>
            </section>
          ))
        ) : (
          <div className="empty-state" role="status">
            <span aria-hidden="true">⌕</span>
            <h3>No encontramos platos</h3>
            <p>Prueba con otro ingrediente o vuelve a ver la carta completa.</p>
            <button type="button" onClick={() => setQuery("")}>
              Limpiar búsqueda
            </button>
          </div>
        )}
      </div>

      {openPhoto && (
        <div
          className="photo-modal"
          role="dialog"
          aria-modal="true"
          aria-label={openPhoto.name}
          onClick={() => setOpenPhoto(null)}
        >
          <button
            type="button"
            className="photo-modal-close"
            onClick={() => setOpenPhoto(null)}
            aria-label="Cerrar"
            ref={closePhotoButtonRef}
          >
            ✕
          </button>
          <img
            src={openPhoto.url}
            alt={openPhoto.name}
            className="photo-modal-img"
            onClick={(event) => event.stopPropagation()}
          />
          <p className="photo-modal-caption">{openPhoto.name}</p>
        </div>
      )}
    </section>
  );
}
