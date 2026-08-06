import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, BadgeCheck, Check, ChevronDown, CircleHelp, Clock3, Fuel, Heart,
  KeyRound, MapPin, Menu, MessageCircle, RotateCcw, Search, Settings2, ShieldCheck,
  SlidersHorizontal, Sparkles, Tag, Trash2, X, Gauge, CarFront, CalendarDays,
} from 'lucide-react';

type Vehicle = {
  id: number;
  make: string;
  model: string;
  variant: string;
  year: number;
  mileage: number;
  price: number;
  monthly: number;
  body: string;
  fuel: string;
  transmission: string;
  location: string;
  milesAway: number;
  seller: string;
  sellerType: 'Dealer' | 'Private';
  image: string;
  gallery: string[];
  badge?: string;
  colour: string;
  owners: number;
  mot: string;
  description: string;
  features: string[];
};

type Filters = {
  make: string;
  model: string;
  minPrice: string;
  maxPrice: string;
  minMonthly: string;
  maxMonthly: string;
  body: string;
  fuel: string;
  transmission: string;
  minYear: string;
  maxYear: string;
  maxMileage: string;
  radius: string;
  sellerType: string;
  features: string[];
  postcode: string;
};

const queryClient = new QueryClient();

const vehicles: Vehicle[] = [
  {
    id: 1, make: 'Volvo', model: 'XC40', variant: 'B4 mild hybrid Plus Dark 5dr Auto',
    year: 2021, mileage: 24180, price: 24980, monthly: 412, body: 'SUV', fuel: 'Hybrid',
    transmission: 'Automatic', location: 'Cambridge', milesAway: 18, seller: 'Fen Road Motors',
    sellerType: 'Dealer', image: '/volvo-xc40.jpg', gallery: ['/volvo-xc40.jpg', '/volvo-xc40.jpg', '/volvo-xc40.jpg'],
    badge: 'Thoughtfully priced', colour: 'Forest green', owners: 1, mot: 'May 2025',
    description: 'A calm, capable family SUV with a beautifully considered cabin. This one-owner XC40 has been prepared by an independent dealer and comes with a clear history.',
    features: ['Heated seats', 'Pilot Assist', 'Panoramic roof', 'Apple CarPlay', '360 camera'],
  },
  {
    id: 2, make: 'BMW', model: '3 Series', variant: '320d M Sport Touring 5dr Auto',
    year: 2019, mileage: 39210, price: 19890, monthly: 329, body: 'Estate', fuel: 'Diesel',
    transmission: 'Automatic', location: 'Reading', milesAway: 31, seller: 'Oak & Motor',
    sellerType: 'Dealer', image: '/bmw-3-series.jpg', gallery: ['/bmw-3-series.jpg', '/bmw-3-series.jpg', '/bmw-3-series.jpg'],
    badge: 'One owner', colour: 'Mineral silver', owners: 1, mot: 'November 2025',
    description: 'A properly useful touring car, mixing long-distance comfort with the precise feel that makes the 3 Series so enjoyable. Full service history included.',
    features: ['M Sport styling', 'Heated seats', 'Adaptive cruise control', 'Parking sensors', 'LED headlights'],
  },
  {
    id: 3, make: 'MINI', model: 'Countryman', variant: 'Cooper S Exclusive ALL4 5dr Auto',
    year: 2022, mileage: 14870, price: 27950, monthly: 461, body: 'SUV', fuel: 'Petrol',
    transmission: 'Automatic', location: 'Brighton', milesAway: 52, seller: 'Harbour Cars',
    sellerType: 'Dealer', image: '/mini-countryman.jpg', gallery: ['/mini-countryman.jpg', '/mini-countryman.jpg', '/mini-countryman.jpg'],
    badge: 'Low mileage', colour: 'Island blue', owners: 1, mot: 'February 2026',
    description: 'Distinctive without shouting. This low-mileage Countryman has the ALL4 confidence for weekend escapes and a bright, practical interior for everyday life.',
    features: ['Panoramic glass roof', 'Harman Kardon audio', 'Heated front seats', 'Navigation', 'Keyless entry'],
  },
  {
    id: 4, make: 'Toyota', model: 'Yaris', variant: '1.5 VVT-h Design 5dr CVT',
    year: 2020, mileage: 28750, price: 16995, monthly: 282, body: 'Hatchback', fuel: 'Hybrid',
    transmission: 'Automatic', location: 'Bristol', milesAway: 64, seller: 'West Country Auto',
    sellerType: 'Dealer', image: '/mini-countryman.jpg', gallery: ['/mini-countryman.jpg', '/mini-countryman.jpg', '/mini-countryman.jpg'],
    colour: 'Warm white', owners: 2, mot: 'August 2025',
    description: 'Small footprint, big sense. A refined hybrid hatchback with a quiet drive, excellent visibility and the easy ownership the Yaris is known for.',
    features: ['Reversing camera', 'Lane departure alert', 'Cruise control', 'DAB radio'],
  },
  {
    id: 5, make: 'Audi', model: 'A4', variant: '35 TFSI Sport Edition 5dr S Tronic',
    year: 2021, mileage: 31620, price: 22490, monthly: 371, body: 'Saloon', fuel: 'Petrol',
    transmission: 'Automatic', location: 'Leicester', milesAway: 77, seller: 'Motorhaus Leicester',
    sellerType: 'Dealer', image: '/bmw-3-series.jpg', gallery: ['/bmw-3-series.jpg', '/bmw-3-series.jpg', '/bmw-3-series.jpg'],
    colour: 'Daytona grey', owners: 2, mot: 'October 2025',
    description: 'Quietly assured and beautifully finished. The A4 remains a lovely place to spend time, with a smooth automatic gearbox and plenty of everyday polish.',
    features: ['Virtual cockpit', 'Heated seats', 'Audi smartphone interface', 'Rear parking sensors'],
  },
  {
    id: 6, make: 'Kia', model: 'Niro', variant: '2 1.6 GDi Hybrid 5dr DCT',
    year: 2022, mileage: 18440, price: 21590, monthly: 356, body: 'SUV', fuel: 'Hybrid',
    transmission: 'Automatic', location: 'Manchester', milesAway: 119, seller: 'Northline Select',
    sellerType: 'Dealer', image: '/volvo-xc40.jpg', gallery: ['/volvo-xc40.jpg', '/volvo-xc40.jpg', '/volvo-xc40.jpg'],
    badge: 'Nearly new', colour: 'Steel blue', owners: 1, mot: 'March 2026',
    description: 'A smart, efficient crossover with generous equipment and a reassuringly easy drive. Recently serviced and ready for its next chapter.',
    features: ['Android Auto', 'Reversing camera', 'Adaptive cruise control', 'Heated steering wheel'],
  },
  {
    id: 7, make: 'Ford', model: 'Puma', variant: '1.0 EcoBoost mHEV ST-Line X 5dr',
    year: 2020, mileage: 33200, price: 18490, monthly: 305, body: 'SUV', fuel: 'Hybrid',
    transmission: 'Manual', location: 'Oxford', milesAway: 42, seller: 'Private seller', sellerType: 'Private',
    image: '/volvo-xc40.jpg', gallery: ['/volvo-xc40.jpg', '/volvo-xc40.jpg', '/volvo-xc40.jpg'],
    colour: 'Agate black', owners: 2, mot: 'June 2025',
    description: 'A lively, practical little SUV with a clever boot and a great driving position. A straightforward private sale with two keys.',
    features: ['Heated seats', 'Bang & Olufsen audio', 'Cruise control', 'Parking sensors'],
  },
  {
    id: 8, make: 'Mercedes-Benz', model: 'A-Class', variant: 'A 200 AMG Line Premium 5dr Auto',
    year: 2019, mileage: 42100, price: 19250, monthly: 318, body: 'Hatchback', fuel: 'Petrol',
    transmission: 'Automatic', location: 'Guildford', milesAway: 25, seller: 'Surrey Car Co.', sellerType: 'Dealer',
    image: '/bmw-3-series.jpg', gallery: ['/bmw-3-series.jpg', '/bmw-3-series.jpg', '/bmw-3-series.jpg'],
    colour: 'Cosmos black', owners: 2, mot: 'December 2025',
    description: 'A polished, city-sized hatchback with the right amount of theatre inside. Premium trim, a bright display and a well-documented history.',
    features: ['Apple CarPlay', 'LED headlights', 'Reversing camera', 'Ambient lighting'],
  },
];

const initialFilters: Filters = {
  make: '', model: '', minPrice: '', maxPrice: '', minMonthly: '', maxMonthly: '', body: '',
  fuel: '', transmission: '', minYear: '', maxYear: '', maxMileage: '', radius: 'Any distance',
  sellerType: '', features: [], postcode: 'CB1',
};

const money = (value: number) => `£${value.toLocaleString('en-GB')}`;
const mileage = (value: number) => `${value.toLocaleString('en-GB')} miles`;

function SelectControl({ label, value, onChange, options, testId }: { label: string; value: string; onChange: (value: string) => void; options: string[]; testId: string }) {
  return (
    <div>
      <label className="field-label" htmlFor={testId}>{label}</label>
      <div className="select-wrap">
        <select id={testId} data-testid={testId} className="control" value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">Any {label.toLowerCase()}</option>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <ChevronDown size={15} />
      </div>
    </div>
  );
}

function ListingCard({ vehicle, saved, onSave, onOpen }: { vehicle: Vehicle; saved: boolean; onSave: () => void; onOpen: () => void }) {
  return (
    <article className="listing-card" data-testid={`card-vehicle-${vehicle.id}`}>
      <div className="card-image" onClick={onOpen} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && onOpen()}>
        <img src={vehicle.image} alt={`${vehicle.make} ${vehicle.model}`} />
        <div className="image-wash" />
        {vehicle.badge && <span className="listing-badge" data-testid={`badge-vehicle-${vehicle.id}`}>{vehicle.badge}</span>}
        <button className={`heart-button ${saved ? 'is-saved' : ''}`} aria-label={saved ? `Remove ${vehicle.make} ${vehicle.model} from saved vehicles` : `Save ${vehicle.make} ${vehicle.model}`} onClick={(event) => { event.stopPropagation(); onSave(); }} data-testid={`button-favorite-${vehicle.id}`}>
          <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="card-body">
        <div className="card-location"><MapPin size={12} /> {vehicle.location} · {vehicle.milesAway} miles away</div>
        <h3 className="card-title" onClick={onOpen} data-testid={`text-vehicle-${vehicle.id}`}>{vehicle.make} {vehicle.model}</h3>
        <p className="card-variant">{vehicle.variant}</p>
        <div className="spec-row">
          <span><CalendarDays size={13} /> {vehicle.year}</span>
          <span><Gauge size={13} /> {mileage(vehicle.mileage)}</span>
          <span><Fuel size={13} /> {vehicle.fuel}</span>
        </div>
        <div className="price-row">
          <strong className="price">{money(vehicle.price)}</strong>
          <span className="monthly"><strong>{money(vehicle.monthly)} / month</strong> representative finance</span>
        </div>
      </div>
    </article>
  );
}

function FiltersPanel({ filters, setFilters, onReset, drawerOpen, onClose }: { filters: Filters; setFilters: React.Dispatch<React.SetStateAction<Filters>>; onReset: () => void; drawerOpen: boolean; onClose: () => void }) {
  const update = (key: keyof Filters, value: string) => setFilters((current) => ({ ...current, [key]: value }));
  const toggleFeature = (feature: string) => setFilters((current) => ({ ...current, features: current.features.includes(feature) ? current.features.filter((item) => item !== feature) : [...current.features, feature] }));
  return (
    <aside className={`filters ${drawerOpen ? 'drawer-open' : ''}`} aria-label="Filter vehicles" data-testid="panel-filters">
      <div className="filters-heading"><strong>Refine your search</strong><button className="reset-button" onClick={onReset} data-testid="button-reset-filters"><RotateCcw size={12} /> Reset</button></div>
      <div className="filter-group">
        <SelectControl label="Make" value={filters.make} onChange={(value) => update('make', value)} options={['Audi', 'BMW', 'Ford', 'Kia', 'Mercedes-Benz', 'MINI', 'Toyota', 'Volvo']} testId="select-filter-make" />
      </div>
      <div className="filter-group">
        <SelectControl label="Model" value={filters.model} onChange={(value) => update('model', value)} options={filters.make === 'Volvo' ? ['XC40'] : filters.make === 'BMW' ? ['3 Series'] : ['XC40', '3 Series', 'Countryman', 'Yaris', 'A4', 'Niro', 'Puma', 'A-Class']} testId="select-filter-model" />
      </div>
      <div className="filter-group">
        <span className="field-label">Price <span className="range-output">{filters.maxPrice ? `up to £${Number(filters.maxPrice).toLocaleString()}` : 'Any budget'}</span></span>
        <div className="two-fields">
          <input className="control" type="number" min="0" placeholder="From £" value={filters.minPrice} onChange={(event) => update('minPrice', event.target.value)} aria-label="Minimum price" data-testid="input-min-price" />
          <input className="control" type="number" min="0" placeholder="To £" value={filters.maxPrice} onChange={(event) => update('maxPrice', event.target.value)} aria-label="Maximum price" data-testid="input-max-price" />
        </div>
      </div>
      <div className="filter-group">
        <span className="field-label">Monthly payment <span className="range-output">{filters.maxMonthly ? `up to £${filters.maxMonthly}` : 'Any'}</span></span>
        <div className="two-fields">
          <input className="control" type="number" min="0" placeholder="From £" value={filters.minMonthly} onChange={(event) => update('minMonthly', event.target.value)} aria-label="Minimum monthly payment" data-testid="input-min-monthly" />
          <input className="control" type="number" min="0" placeholder="To £" value={filters.maxMonthly} onChange={(event) => update('maxMonthly', event.target.value)} aria-label="Maximum monthly payment" data-testid="input-max-monthly" />
        </div>
      </div>
      <div className="filter-group"><SelectControl label="Body type" value={filters.body} onChange={(value) => update('body', value)} options={['Hatchback', 'SUV', 'Estate', 'Saloon']} testId="select-filter-body" /></div>
      <div className="filter-group"><SelectControl label="Fuel type" value={filters.fuel} onChange={(value) => update('fuel', value)} options={['Petrol', 'Diesel', 'Hybrid', 'Electric']} testId="select-filter-fuel" /></div>
      <div className="filter-group"><SelectControl label="Transmission" value={filters.transmission} onChange={(value) => update('transmission', value)} options={['Automatic', 'Manual']} testId="select-filter-transmission" /></div>
      <div className="filter-group">
        <span className="field-label">Year</span>
        <div className="two-fields">
          <input className="control" type="number" placeholder="From" value={filters.minYear} onChange={(event) => update('minYear', event.target.value)} aria-label="Minimum year" data-testid="input-min-year" />
          <input className="control" type="number" placeholder="To" value={filters.maxYear} onChange={(event) => update('maxYear', event.target.value)} aria-label="Maximum year" data-testid="input-max-year" />
        </div>
      </div>
      <div className="filter-group"><SelectControl label="Maximum mileage" value={filters.maxMileage} onChange={(value) => update('maxMileage', value)} options={['10,000', '20,000', '30,000', '40,000', '50,000']} testId="select-filter-mileage" /></div>
      <div className="filter-group"><SelectControl label="Location radius" value={filters.radius} onChange={(value) => update('radius', value)} options={['5 miles', '10 miles', '25 miles', '50 miles', '100 miles', 'Any distance']} testId="select-filter-radius" /></div>
      <div className="filter-group"><SelectControl label="Seller type" value={filters.sellerType} onChange={(value) => update('sellerType', value)} options={['Dealer', 'Private']} testId="select-filter-seller" /></div>
      <div className="filter-group">
        <span className="field-label">Features</span>
        <div className="check-list">
          {['Heated seats', 'Apple CarPlay', 'Panoramic roof', 'Reversing camera'].map((feature) => (
            <label className="check-item" key={feature}><input type="checkbox" checked={filters.features.includes(feature)} onChange={() => toggleFeature(feature)} data-testid={`checkbox-feature-${feature.toLowerCase().replaceAll(' ', '-')}`} />{feature}</label>
          ))}
        </div>
      </div>
      {drawerOpen && <button className="primary-button" onClick={onClose} data-testid="button-apply-mobile-filters">Show vehicles</button>}
    </aside>
  );
}

function DetailView({ vehicle, onClose, onEnquire }: { vehicle: Vehicle; onClose: () => void; onEnquire: () => void }) {
  return (
    <div className="detail-overlay" role="dialog" aria-modal="true" aria-label={`${vehicle.make} ${vehicle.model} details`} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="detail-panel">
        <button className="detail-close" onClick={onClose} aria-label="Close vehicle details" data-testid="button-close-detail"><X size={18} /></button>
        <div className="detail-gallery">
          <div className="gallery-main"><img src={vehicle.gallery[0]} alt={`${vehicle.make} ${vehicle.model} exterior`} /></div>
          <div className="gallery-side"><img src={vehicle.gallery[1]} alt={`${vehicle.make} ${vehicle.model} detail`} /><img src={vehicle.gallery[2]} alt={`${vehicle.make} ${vehicle.model} rear view`} /></div>
        </div>
        <div className="detail-content">
          <main>
            <span className="detail-label">{vehicle.badge || 'Verified listing'}</span>
            <h2 className="detail-title" data-testid="text-detail-title">{vehicle.make} {vehicle.model}</h2>
            <p className="detail-variant">{vehicle.variant} · {vehicle.location}</p>
            <div className="detail-specs">
              <div className="detail-spec"><span>Year</span><strong>{vehicle.year}</strong></div>
              <div className="detail-spec"><span>Mileage</span><strong>{mileage(vehicle.mileage)}</strong></div>
              <div className="detail-spec"><span>Fuel</span><strong>{vehicle.fuel}</strong></div>
              <div className="detail-spec"><span>Gearbox</span><strong>{vehicle.transmission}</strong></div>
            </div>
            <p className="detail-description">{vehicle.description}</p>
            <div className="feature-pills">{vehicle.features.map((feature) => <span className="feature-pill" key={feature}>{feature}</span>)}</div>
          </main>
          <aside className="detail-side">
            <div className="finance-box">
              <span className="field-label">Representative finance</span>
              <div className="finance-price">{money(vehicle.monthly)} <small>/ month</small></div>
              <div className="finance-note">Based on a representative 9.9% APR. Personalised quote available from the seller.</div>
            </div>
            <div className="seller-box">
              <span className="seller-heading">Seller</span>
              <div className="seller-name">{vehicle.seller}</div>
              <div className="seller-meta"><BadgeCheck size={13} /> {vehicle.sellerType === 'Dealer' ? 'Verified dealer' : 'Private seller'}<br />MOT until {vehicle.mot} · {vehicle.owners} owner{vehicle.owners > 1 ? 's' : ''}</div>
              <button className="primary-button enquire-button" onClick={onEnquire} data-testid="button-enquire"><MessageCircle size={16} /> Enquire about this car</button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function EnquiryForm({ vehicle, onClose, onSubmitted }: { vehicle: Vehicle; onClose: () => void; onSubmitted: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(`Hello, I'm interested in the ${vehicle.make} ${vehicle.model}. Is it still available?`);
  const submit = (event: React.FormEvent) => { event.preventDefault(); if (name.trim() && email.trim() && message.trim()) onSubmitted(); };
  return (
    <div className="detail-overlay" role="dialog" aria-modal="true" aria-label="Enquire about vehicle" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="enquiry-modal" onSubmit={submit}>
        <div className="modal-header"><div><h2>Start a conversation</h2><p>Ask {vehicle.seller} about the {vehicle.make} {vehicle.model}.</p></div><button className="modal-close" type="button" onClick={onClose} aria-label="Close enquiry form" data-testid="button-close-enquiry"><X size={18} /></button></div>
        <div className="form-stack">
          <div><label className="field-label" htmlFor="enquiry-name">Your name</label><input className="control" id="enquiry-name" value={name} onChange={(event) => setName(event.target.value)} required placeholder="e.g. Alex Morgan" data-testid="input-enquiry-name" /></div>
          <div><label className="field-label" htmlFor="enquiry-email">Email address</label><input className="control" id="enquiry-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@example.com" data-testid="input-enquiry-email" /></div>
          <div><label className="field-label" htmlFor="enquiry-message">Message</label><textarea className="control" id="enquiry-message" value={message} onChange={(event) => setMessage(event.target.value)} required data-testid="input-enquiry-message" /></div>
          <div className="form-actions"><button type="button" className="secondary-button" onClick={onClose} data-testid="button-cancel-enquiry">Cancel</button><button type="submit" className="primary-button" data-testid="button-submit-enquiry">Send enquiry</button></div>
        </div>
      </form>
    </div>
  );
}

function AppContent() {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [sort, setSort] = useState('recommended');
  const [saved, setSaved] = useState<number[]>(() => { try { return JSON.parse(localStorage.getItem('uk-auto-saved') || '[]'); } catch { return []; } });
  const [savedSearch, setSavedSearch] = useState(() => localStorage.getItem('uk-auto-search') === 'true');
  const [postcode, setPostcode] = useState('CB1');
  const [detail, setDetail] = useState<Vehicle | null>(null);
  const [enquiry, setEnquiry] = useState<Vehicle | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => { localStorage.setItem('uk-auto-saved', JSON.stringify(saved)); }, [saved]);
  useEffect(() => { if (toast) { const timer = window.setTimeout(() => setToast(''), 2700); return () => window.clearTimeout(timer); } return undefined; }, [toast]);

  const filtered = useMemo(() => {
    const result = vehicles.filter((vehicle) => {
      const maxPrice = Number(filters.maxPrice) || Infinity;
      const minPrice = Number(filters.minPrice) || 0;
      const minMonthly = Number(filters.minMonthly) || 0;
      const maxMonthly = Number(filters.maxMonthly) || Infinity;
      const minYear = Number(filters.minYear) || 0;
      const maxYear = Number(filters.maxYear) || Infinity;
      const maxMileage = filters.maxMileage ? Number(filters.maxMileage.replace(',', '')) : Infinity;
      const radius = filters.radius && filters.radius !== 'Any distance' ? Number(filters.radius.split(' ')[0]) : Infinity;
      return (!filters.make || vehicle.make === filters.make)
        && (!filters.model || vehicle.model === filters.model)
        && vehicle.price >= minPrice && vehicle.price <= maxPrice
        && vehicle.monthly >= minMonthly && vehicle.monthly <= maxMonthly
        && (!filters.body || vehicle.body === filters.body)
        && (!filters.fuel || vehicle.fuel === filters.fuel)
        && (!filters.transmission || vehicle.transmission === filters.transmission)
        && vehicle.year >= minYear && vehicle.year <= maxYear
        && vehicle.mileage <= maxMileage && vehicle.milesAway <= radius
        && (!filters.sellerType || vehicle.sellerType === filters.sellerType)
        && filters.features.every((feature) => vehicle.features.includes(feature));
    });
    return [...result].sort((a, b) => sort === 'price-low' ? a.price - b.price : sort === 'price-high' ? b.price - a.price : sort === 'mileage' ? a.mileage - b.mileage : b.year - a.year);
  }, [filters, sort]);

  const resetFilters = () => { setFilters({ ...initialFilters, postcode }); setToast('Filters reset'); };
  const toggleSave = (id: number) => { setSaved((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); setToast(saved.includes(id) ? 'Removed from saved vehicles' : 'Saved to your shortlist'); };
  const saveCurrentSearch = () => { const next = !savedSearch; setSavedSearch(next); localStorage.setItem('uk-auto-search', String(next)); setToast(next ? 'Search saved — we’ll keep this shortlist close' : 'Saved search removed'); };
  const openEnquiry = (vehicle: Vehicle) => { setEnquiry(vehicle); };

  const viewVehicles = showSaved ? vehicles.filter((vehicle) => saved.includes(vehicle.id)) : filtered;

  return (
    <div className="market-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <button className="brand-mark" onClick={() => { setShowSaved(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-label="Go to home" data-testid="button-brand-home">
            <span className="brand-symbol"><CarFront size={18} /></span><span className="brand-name">roam<span>.</span></span>
          </button>
          <nav className="topnav" aria-label="Main navigation">
            <button onClick={() => { setShowSaved(false); document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' }); }} data-testid="button-nav-browse">Browse cars</button>
            <button onClick={() => setToast('Buying guides are coming soon')} data-testid="button-nav-guides">Buying guides</button>
            <button onClick={() => setToast('Every listing is checked against our care standards')} data-testid="button-nav-how-it-works">How it works</button>
          </nav>
          <button className="saved-link" onClick={() => setShowSaved((current) => !current)} data-testid="button-saved-vehicles"><Heart size={15} fill={showSaved ? 'currentColor' : 'none'} /> Saved <span className="saved-count" data-testid="text-saved-count">{saved.length}</span></button>
        </div>
      </header>

      {!showSaved && <section className="hero">
        <div className="hero-inner">
          <div className="hero-kicker">Cars chosen with care</div>
          <h1>A better way to find your <em>next car.</em></h1>
          <p className="hero-copy">Browse a considered collection of good cars, from people who know them well. Less noise, more confidence in what comes next.</p>
          <div className="hero-stats"><div className="hero-stat"><strong>2,400+</strong><span>cars worth your time</span></div><div className="hero-stat"><strong>4.8 / 5</strong><span>buyer experience</span></div><div className="hero-stat"><strong>7 days</strong><span>to change your mind</span></div></div>
        </div>
      </section>}

      {!showSaved && <section className="search-panel" aria-label="Search for a car">
        <div className="search-row">
          <div><label className="field-label" htmlFor="search-make">I'm looking for</label><div className="select-wrap"><select id="search-make" className="control" value={filters.make} onFocus={() => setSearchFocused(true)} onChange={(event) => setFilters((current) => ({ ...current, make: event.target.value, model: '' }))} data-testid="select-search-make"><option value="">Any make</option>{['Audi', 'BMW', 'Ford', 'Kia', 'Mercedes-Benz', 'MINI', 'Toyota', 'Volvo'].map((make) => <option key={make}>{make}</option>)}</select><ChevronDown size={15} /></div></div>
          <div><label className="field-label" htmlFor="search-model">Model</label><div className="select-wrap"><select id="search-model" className="control" value={filters.model} onChange={(event) => setFilters((current) => ({ ...current, model: event.target.value }))} data-testid="select-search-model"><option value="">Any model</option>{['XC40', '3 Series', 'Countryman', 'Yaris', 'A4', 'Niro', 'Puma', 'A-Class'].map((model) => <option key={model}>{model}</option>)}</select><ChevronDown size={15} /></div></div>
          <div><label className="field-label" htmlFor="search-budget">Budget</label><div className="select-wrap"><select id="search-budget" className="control" value={filters.maxPrice} onChange={(event) => setFilters((current) => ({ ...current, maxPrice: event.target.value }))} data-testid="select-search-budget"><option value="">Any budget</option><option value="15000">Up to £15k</option><option value="20000">Up to £20k</option><option value="25000">Up to £25k</option><option value="30000">Up to £30k</option></select><ChevronDown size={15} /></div></div>
          <div><label className="field-label" htmlFor="search-location">Near</label><input id="search-location" className="control" value={postcode} onChange={(event) => { setPostcode(event.target.value); setFilters((current) => ({ ...current, postcode: event.target.value })); }} onFocus={() => setSearchFocused(true)} data-testid="input-search-location" /></div>
          <button className="search-button" onClick={() => { setSearchFocused(false); document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' }); setToast(`${filtered.length} cars found near ${postcode.toUpperCase()}`); }} data-testid="button-search"><Search size={16} /> Search</button>
        </div>
        <div className="quick-row"><span className="quick-label">Try a shortcut</span>{['Automatic', 'Hybrid', 'Under £20k', 'SUV'].map((shortcut) => <button className="quick-chip" key={shortcut} onClick={() => shortcut === 'Under £20k' ? setFilters((current) => ({ ...current, maxPrice: '20000' })) : shortcut === 'SUV' ? setFilters((current) => ({ ...current, body: 'SUV' })) : shortcut === 'Hybrid' ? setFilters((current) => ({ ...current, fuel: 'Hybrid' })) : setFilters((current) => ({ ...current, transmission: 'Automatic' }))} data-testid={`button-shortcut-${shortcut.toLowerCase().replaceAll(' ', '-')}`}>{shortcut}</button>)}</div>
        {searchFocused && <span style={{ display: 'none' }} />}
      </section>}

      <main className="content-wrap" id="browse">
        {showSaved ? <section className="saved-view">
          <div className="saved-heading"><div><div className="section-eyebrow">Your shortlist</div><h1>Saved vehicles</h1><p>Keep the cars that made you pause in one considered place.</p></div><button className="secondary-button" onClick={() => setShowSaved(false)} data-testid="button-back-to-browse"><ArrowLeft size={15} /> Browse all cars</button></div>
          {viewVehicles.length ? <div className="listing-grid">{viewVehicles.map((vehicle) => <ListingCard key={vehicle.id} vehicle={vehicle} saved onSave={() => toggleSave(vehicle.id)} onOpen={() => setDetail(vehicle)} />)}</div> : <div className="empty-state"><div className="empty-icon"><Heart size={22} /></div><h3>Your shortlist is waiting</h3><p>Save a car when it feels like it could be the one. We’ll keep it here for you.</p><button className="primary-button" onClick={() => setShowSaved(false)} data-testid="button-find-vehicles">Find your next car</button></div>}
        </section> : <>
          <div className="browse-toolbar">
            <div><div className="section-eyebrow">The considered collection</div><h2 className="browse-title" data-testid="text-results-heading">{filtered.length.toLocaleString()} cars near {postcode.toUpperCase()}</h2><p className="browse-subtitle">Thoughtfully selected for a more confident shortlist.</p></div>
            <div className="toolbar-actions"><button className="filter-trigger" onClick={() => setDrawerOpen(true)} data-testid="button-open-filters"><SlidersHorizontal size={15} /> Filters</button><button className="save-search" onClick={saveCurrentSearch} data-testid="button-save-search"><Heart size={14} fill={savedSearch ? 'currentColor' : 'none'} /> {savedSearch ? 'Search saved' : 'Save this search'}</button><div className="select-wrap"><select className="control sort-select" value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort vehicles" data-testid="select-sort"><option value="recommended">Recommended</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="mileage">Lowest mileage</option></select><ChevronDown size={15} /></div></div>
          </div>
          <div className="results-layout">
            <FiltersPanel filters={filters} setFilters={setFilters} onReset={resetFilters} drawerOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
            <section className="listing-grid" aria-label="Vehicle results">
              {viewVehicles.length ? viewVehicles.map((vehicle) => <ListingCard key={vehicle.id} vehicle={vehicle} saved={saved.includes(vehicle.id)} onSave={() => toggleSave(vehicle.id)} onOpen={() => setDetail(vehicle)} />) : <div className="empty-state"><div className="empty-icon"><Search size={22} /></div><h3>Nothing quite fits yet</h3><p>Try widening your budget, location or preferences. The right car may be one small adjustment away.</p><button className="secondary-button" onClick={resetFilters} data-testid="button-empty-reset">Clear all filters</button></div>}
            </section>
          </div>
        </>}
      </main>

      {!showSaved && <div className="mobile-actions"><button className={drawerOpen ? 'active' : ''} onClick={() => setDrawerOpen(true)} data-testid="button-mobile-filters"><SlidersHorizontal size={15} /> Filters</button><button className={savedSearch ? 'active' : ''} onClick={saveCurrentSearch} data-testid="button-mobile-save-search"><Heart size={15} fill={savedSearch ? 'currentColor' : 'none'} /> Save search</button><button onClick={() => setShowSaved(true)} data-testid="button-mobile-saved"><Heart size={15} /> Saved ({saved.length})</button></div>}
      {detail && <DetailView vehicle={detail} onClose={() => setDetail(null)} onEnquire={() => openEnquiry(detail)} />}
      {enquiry && <EnquiryForm vehicle={enquiry} onClose={() => setEnquiry(null)} onSubmitted={() => { setEnquiry(null); setDetail(null); setToast('Enquiry sent — the seller will be in touch soon'); }} />}
      {toast && <div className="toast-message" role="status" data-testid="status-toast"><Check size={15} /> {toast}</div>}
    </div>
  );
}

function App() {
  return <QueryClientProvider client={queryClient}><AppContent /></QueryClientProvider>;
}

export default App;