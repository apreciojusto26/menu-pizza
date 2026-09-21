import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import {
  CART_ENABLED,
  formatAllergens,
  formatPrice,
  type MenuSection,
  type MenuSectionId,
} from "../data/menu";
import { addLine } from "../lib/cart/store";
import { fetchMenuFromSheet } from "../lib/menuSheet";
import { DishThumb } from "./DishThumb";

interface MenuExplorerProps {
  readonly sections: readonly MenuSection[];
  readonly sheetUrl?: string | undefined;
}

type ActiveCategory = "all" | MenuSectionId;

const normalize = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");

const INGREDIENT_SPLIT_PATTERN = /(tomate|mozzarella|orégano)/gi;
const INGREDIENT_MATCH_PATTERN = /^(tomate|mozzarella|orégano)$/i;

function highlightIngredients(description: string) {
  return description
    .split(INGREDIENT_SPLIT_PATTERN)
    .map((part, index) =>
      INGREDIENT_MATCH_PATTERN.test(part) ? (
        <strong key={index} className="ingredient-highlight">
          {part}
        </strong>
      ) : (
        part
      ),
    );
}

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
                  {section.description && <p>{section.description}</p>}
                  {section.placeholder && (
                    <p className="section-draft-note">
                      Sabores de demostración pendientes de confirmar.
                    </p>
                  )}
                  {section.id === "pizzas" && (
                    <p className="section-callout">
                      {highlightIngredients(
                        "Todas nuestras pizzas llevan tomate, mozzarella y orégano de base — si preferís sin alguno de los tres, avisanos, el precio no cambia. También podemos hacerlas con mozzarella sin lactosa, solo avisanos al pedir.",
                      )}
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
                        {item.allergens && item.allergens.length > 0 && (
                          <p className="dish-allergens">
                            Alérgenos: {formatAllergens(item.allergens)}
                          </p>
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
                            {CART_ENABLED &&
                              !item.placeholder &&
                              !price.placeholder && (
                                <button
                                  type="button"
                                  className="add-to-cart-button"
                                  onClick={() =>
                                    addLine(item.id, price.label, 1)
                                  }
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
