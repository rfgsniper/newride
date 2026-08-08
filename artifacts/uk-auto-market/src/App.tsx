import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Fuel,
  Heart,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
  Gauge,
  CarFront,
  CalendarDays,
  ExternalLink,
} from "lucide-react";
import {
  useListings,
  redirectUrl,
  type ApiListing,
  type ListingFilters,
} from "./lib/useListings";

type Filters = {
  postcode: string;
  maxDistance: string;
  make: string;
  model: string;
  minPrice: string;
  maxPrice: string;
  maxMileage: string;
  fuelType: string;
};

const queryClient = new QueryClient();
const initialFilters: Filters = {
  postcode: "",
  maxDistance: "",
  make: "",
  model: "",
  minPrice: "",
  maxPrice: "",
  maxMileage: "",
  fuelType: "",
};

const money = (value: number | null) =>
  value != null ? `£${value.toLocaleString("en-GB")}` : "POA";
const mileageFmt = (value: number | null) =>
  value != null ? `${value.toLocaleString("en-GB")} miles` : "—";

function ListingCard({
  listing,
  saved,
  onSave,
  onOpen,
}: {
  listing: ApiListing;
  saved: boolean;
  onSave: () => void;
  onOpen: () => void;
}) {
  return (
    <article
      className="listing-card"
      data-testid={`card-vehicle-${listing.id}`}
    >
      <div
        className="card-image"
        onClick={onOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onOpen()}
      >
        {listing.imageUrl ? (
          <img src={listing.imageUrl} alt={listing.title} />
        ) : (
          <div className="image-placeholder">
            <CarFront size={32} />
          </div>
        )}
        <div className="image-wash" />
        <button
          className={`heart-button ${saved ? "is-saved" : ""}`}
          aria-label={
            saved
              ? `Remove ${listing.title} from saved`
              : `Save ${listing.title}`
          }
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
          data-testid={`button-favorite-${listing.id}`}
        >
          <Heart size={16} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="card-body">
        {listing.location && (
          <div className="card-location">
            <MapPin size={12} /> {listing.location}
          </div>
        )}
        <h3
          className="card-title"
          onClick={onOpen}
          data-testid={`text-vehicle-${listing.id}`}
        >
          {listing.title}
        </h3>
        <p className="card-variant">{listing.sourceName}</p>
        <div className="spec-row">
          {listing.year && (
            <span>
              <CalendarDays size={13} /> {listing.year}
            </span>
          )}
          <span>
            <Gauge size={13} /> {mileageFmt(listing.mileage)}
          </span>
          {listing.fuelType && (
            <span>
              <Fuel size={13} /> {listing.fuelType}
            </span>
          )}
          {listing.horsepower && <span>{listing.horsepower} bhp</span>}
          {listing.distance !== undefined && (
            <span>{listing.distance.toFixed(1)} mi away</span>
          )}
        </div>
        <div className="price-row">
          <strong className="price">{money(listing.price)}</strong>
        </div>
      </div>
    </article>
  );
}

function FiltersPanel({
  filters,
  setFilters,
  onReset,
  drawerOpen,
  onClose,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  onReset: () => void;
  drawerOpen: boolean;
  onClose: () => void;
}) {
  const update = (key: keyof Filters, value: string) =>
    setFilters((c) => ({ ...c, [key]: value }));
  return (
    <aside
      className={`filters ${drawerOpen ? "drawer-open" : ""}`}
      aria-label="Filter vehicles"
      data-testid="panel-filters"
    >
      <div className="filters-heading">
        <strong>Refine your search</strong>
        <button
          className="reset-button"
          onClick={onReset}
          data-testid="button-reset-filters"
        >
          Reset
        </button>
      </div>
      <div className="filter-group">
        <label className="field-label" htmlFor="filter-postcode">
          Your postcode
        </label>
        <input
          className="control"
          id="filter-postcode"
          value={filters.postcode}
          onChange={(e) => update("postcode", e.target.value)}
          placeholder="e.g. SW1A 1AA"
          data-testid="input-postcode"
        />
      </div>
      <div className="filter-group">
        <label className="field-label" htmlFor="filter-max-distance">
          Maximum distance (miles)
        </label>
        <input
          className="control"
          id="filter-max-distance"
          type="number"
          min="0"
          value={filters.maxDistance}
          onChange={(e) => update("maxDistance", e.target.value)}
          placeholder="Default: 15 miles"
          data-testid="input-max-distance"
        />
      </div>
      <div className="filter-group">
        <label className="field-label" htmlFor="filter-make">
          Make
        </label>
        <input
          className="control"
          id="filter-make"
          value={filters.make}
          onChange={(e) => update("make", e.target.value)}
          placeholder="e.g. BMW"
          data-testid="input-filter-make"
        />
      </div>
      <div className="filter-group">
        <label className="field-label" htmlFor="filter-model">
          Model
        </label>
        <input
          className="control"
          id="filter-model"
          value={filters.model}
          onChange={(e) => update("model", e.target.value)}
          placeholder="e.g. 3 Series"
          data-testid="input-filter-model"
        />
      </div>
      <div className="filter-group">
        <span className="field-label">Price</span>
        <div className="two-fields">
          <input
            className="control"
            type="number"
            min="0"
            placeholder="From £"
            value={filters.minPrice}
            onChange={(e) => update("minPrice", e.target.value)}
            data-testid="input-min-price"
          />
          <input
            className="control"
            type="number"
            min="0"
            placeholder="To £"
            value={filters.maxPrice}
            onChange={(e) => update("maxPrice", e.target.value)}
            data-testid="input-max-price"
          />
        </div>
      </div>
      <div className="filter-group">
        <label className="field-label" htmlFor="filter-mileage">
          Maximum mileage
        </label>
        <input
          className="control"
          id="filter-mileage"
          type="number"
          min="0"
          value={filters.maxMileage}
          onChange={(e) => update("maxMileage", e.target.value)}
          placeholder="e.g. 40000"
          data-testid="input-max-mileage"
        />
      </div>
      <div className="filter-group">
        <label className="field-label" htmlFor="filter-fuel">
          Fuel type
        </label>
        <div className="select-wrap">
          <select
            id="filter-fuel"
            className="control"
            value={filters.fuelType}
            onChange={(e) => update("fuelType", e.target.value)}
            data-testid="select-filter-fuel"
          >
            <option value="">Any fuel type</option>
            <option value="Petrol">Petrol</option>
            <option value="Diesel">Diesel</option>
            <option value="Electric">Electric</option>
            <option value="Hybrid">Hybrid</option>
          </select>
          <ChevronDown size={15} />
        </div>
      </div>
      {drawerOpen && (
        <button
          className="primary-button"
          onClick={onClose}
          data-testid="button-apply-mobile-filters"
        >
          Show vehicles
        </button>
      )}
    </aside>
  );
}

function DetailView({
  listing,
  onClose,
  onContact,
}: {
  listing: ApiListing;
  onClose: () => void;
  onContact: () => void;
}) {
  return (
    <div
      className="detail-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${listing.title} details`}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="detail-panel">
        <button
          className="detail-close"
          onClick={onClose}
          aria-label="Close"
          data-testid="button-close-detail"
        >
          <X size={18} />
        </button>
        <div className="detail-gallery">
          <div className="gallery-main">
            {listing.imageUrl ? (
              <img src={listing.imageUrl} alt={listing.title} />
            ) : (
              <div className="image-placeholder">
                <CarFront size={40} />
              </div>
            )}
          </div>
        </div>
        <div className="detail-content">
          <main>
            <h2 className="detail-title" data-testid="text-detail-title">
              {listing.title}
            </h2>
            <p className="detail-variant">
              {listing.sourceName}{" "}
              {listing.location ? `· ${listing.location}` : ""}
            </p>
            <div className="detail-specs">
              {listing.year && (
                <div className="detail-spec">
                  <span>Year</span>
                  <strong>{listing.year}</strong>
                </div>
              )}
              <div className="detail-spec">
                <span>Mileage</span>
                <strong>{mileageFmt(listing.mileage)}</strong>
              </div>
              {listing.registration && (
                <div className="detail-spec">
                  <span>Registration</span>
                  <strong>{listing.registration}</strong>
                </div>
              )}
            </div>
            <p className="detail-note">
              Full details, photos and history are available on the original
              listing.
            </p>
          </main>
          <aside className="detail-side">
            <div className="finance-box">
              <span className="field-label">Asking price</span>
              <div className="finance-price">{money(listing.price)}</div>
            </div>
            <div className="seller-box">
              <span className="seller-heading">Listed by</span>
              <div className="seller-name">
                {listing.sourceName || "Seller"}
              </div>
              <a
                className="primary-button"
                href={redirectUrl(listing.id)}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="button-view-full-listing"
              >
                <ExternalLink size={16} /> View full listing
              </a>
              <button
                className="secondary-button"
                onClick={onContact}
                data-testid="button-contact-seller"
              >
                Contact seller directly
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function ContactSellerModal({
  listing,
  onClose,
}: {
  listing: ApiListing;
  onClose: () => void;
}) {
  return (
    <div
      className="detail-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Contact seller"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="enquiry-modal">
        <div className="modal-header">
          <div>
            <h2>Contact seller directly</h2>
            <p>
              {listing.sourceName} handles enquiries for this listing on the
              original site.
            </p>
          </div>
          <button
            className="modal-close"
            type="button"
            onClick={onClose}
            aria-label="Close"
            data-testid="button-close-enquiry"
          >
            <X size={18} />
          </button>
        </div>
        <div className="form-stack">
          <p>
            You'll be taken to the original listing on{" "}
            {listing.sourceName || "the seller's site"} to get in touch about
            the {listing.title}.
          </p>
          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              data-testid="button-cancel-enquiry"
            >
              Cancel
            </button>
            <a
              className="primary-button"
              href={redirectUrl(listing.id)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              data-testid="button-submit-enquiry"
            >
              Go to listing <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [sort, setSort] = useState<
    "price-asc" | "price-desc" | "mileage-asc" | "mileage-desc" | "recommended"
  >("recommended");
  const [saved, setSaved] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("uk-auto-saved") || "[]");
    } catch {
      return [];
    }
  });
  const [detail, setDetail] = useState<ApiListing | null>(null);
  const [contact, setContact] = useState<ApiListing | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    localStorage.setItem("uk-auto-saved", JSON.stringify(saved));
  }, [saved]);
  useEffect(() => {
    if (toast) {
      const t = window.setTimeout(() => setToast(""), 2700);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [toast]);

  const apiFilters: ListingFilters = {
    postcode: filters.postcode || undefined,
    maxDistance: filters.maxDistance ? Number(filters.maxDistance) : undefined,
    make: filters.make || undefined,
    model: filters.model || undefined,
    minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    maxMileage: filters.maxMileage ? Number(filters.maxMileage) : undefined,
    fuelType: filters.fuelType || undefined,
    sortBy: sort,
  };

  const { data: listings = [], isLoading, isError } = useListings(apiFilters);

  const resetFilters = () => {
    setFilters(initialFilters);
    setToast("Filters reset");
  };
  const toggleSave = (id: number) => {
    setSaved((c) => (c.includes(id) ? c.filter((i) => i !== id) : [...c, id]));
  };

  const viewListings = showSaved
    ? listings.filter((l) => saved.includes(l.id))
    : listings;

  return (
    <div className="market-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <button
            className="brand-mark"
            onClick={() => setShowSaved(false)}
            aria-label="Home"
            data-testid="button-brand-home"
          >
            <span className="brand-symbol">
              <CarFront size={18} />
            </span>
            <span className="brand-name">UK Auto Market</span>
          </button>
          <button
            className="saved-link"
            onClick={() => setShowSaved((c) => !c)}
            data-testid="button-saved-vehicles"
          >
            <Heart size={15} fill={showSaved ? "currentColor" : "none"} /> Saved{" "}
            <span className="saved-count">{saved.length}</span>
          </button>
        </div>
      </header>

      <main className="content-wrap" id="browse">
        {showSaved ? (
          <section className="saved-view">
            <div className="saved-heading">
              <div>
                <h1>Saved vehicles</h1>
              </div>
              <button
                className="secondary-button"
                onClick={() => setShowSaved(false)}
              >
                <ArrowLeft size={15} /> Browse all cars
              </button>
            </div>
            {viewListings.length ? (
              <div className="listing-grid">
                {viewListings.map((l) => (
                  <ListingCard
                    key={l.id}
                    listing={l}
                    saved
                    onSave={() => toggleSave(l.id)}
                    onOpen={() => setDetail(l)}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Heart size={22} />
                <h3>Your shortlist is waiting</h3>
              </div>
            )}
          </section>
        ) : (
          <>
            <div className="browse-toolbar">
              <h2 className="browse-title" data-testid="text-results-heading">
                {isLoading
                  ? "Loading cars…"
                  : `${listings.length.toLocaleString()} cars available`}
              </h2>
              <div className="toolbar-actions">
                <select
                  className="control sort-select"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                  aria-label="Sort vehicles"
                  data-testid="select-sort"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                  <option value="mileage-asc">Mileage: low to high</option>
                  <option value="mileage-desc">Mileage: high to low</option>
                </select>
                <button
                  className="filter-trigger"
                  onClick={() => setDrawerOpen(true)}
                  data-testid="button-open-filters"
                >
                  <SlidersHorizontal size={15} /> Filters
                </button>
              </div>
            </div>
            <div className="results-layout">
              <FiltersPanel
                filters={filters}
                setFilters={setFilters}
                onReset={resetFilters}
                drawerOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
              />
              <section className="listing-grid" aria-label="Vehicle results">
                {isError ? (
                  <div className="empty-state">
                    <h3>Couldn't load listings</h3>
                    <p>Please try again shortly.</p>
                  </div>
                ) : viewListings.length ? (
                  viewListings.map((l) => (
                    <ListingCard
                      key={l.id}
                      listing={l}
                      saved={saved.includes(l.id)}
                      onSave={() => toggleSave(l.id)}
                      onOpen={() => setDetail(l)}
                    />
                  ))
                ) : !isLoading ? (
                  <div className="empty-state">
                    <Search size={22} />
                    <h3>Nothing quite fits yet</h3>
                    <button className="secondary-button" onClick={resetFilters}>
                      Clear all filters
                    </button>
                  </div>
                ) : null}
              </section>
            </div>
          </>
        )}
      </main>

      {detail && (
        <DetailView
          listing={detail}
          onClose={() => setDetail(null)}
          onContact={() => setContact(detail)}
        />
      )}
      {contact && (
        <ContactSellerModal
          listing={contact}
          onClose={() => setContact(null)}
        />
      )}
      {toast && (
        <div className="toast-message" role="status">
          <Check size={15} /> {toast}
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
