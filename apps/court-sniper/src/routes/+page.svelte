<script lang="ts">
	import {
		Zap,
		Bell,
		MapPin,
		Users,
		CreditCard,
		BarChart3,
		Clock,
		Ban,
		AlarmClock,
		Target,
		Star,
		Shield,
		CheckCircle2,
		ArrowRight,
		ArrowLeft,
		Navigation,
		CalendarDays,
		X,
		Wifi,
		Car,
		Droplets,
		Lightbulb,
		Share2,
		CalendarPlus,
		Copy,
		Smartphone,
		Landmark,
		Store,
		PartyPopper,
		ChevronRight,
		ChevronDown,
		Search,
		Crosshair,
		Locate,
		CalendarCheck,
		Trophy,
		Crosshair as TargetIcon,
		UserPlus,
		Building2
	} from 'lucide-svelte';

	// ==========================================
	// TYPE DEFINITIONS
	// ==========================================
	interface Court {
		id: string;
		name: string;
		type: 'Indoor' | 'Outdoor' | 'Covered';
		pricePerHour: number;
		availableSlots: string[];
	}

	interface Session {
		id: string;
		type: 'Open Play' | 'Tournament' | 'Drill Session' | 'Clinic' | 'Mixer';
		name: string;
		date: string;
		time: string;
		level: string;
		pricePerPerson: number;
		spotsTotal: number;
		spotsFilled: number;
		host: string;
		courtName?: string;
	}

	interface Venue {
		id: string;
		name: string;
		address: string;
		area: string;
		distance: string;
		distanceKm: number;
		rating: number;
		amenities: string[];
		courts: Court[];
		sessions: Session[];
	}

	// ==========================================
	// MOCK DATA: 6 VENUES
	// ==========================================
	const venues: Venue[] = [
		{
			id: 'v1',
			name: 'Pickleball Philippines BGC',
			address: '5th Ave, BGC, Taguig',
			area: 'BGC, Taguig',
			distance: '2.8 km',
			distanceKm: 2.8,
			rating: 4.9,
			amenities: ['Parking', 'Aircon', 'Pro Shop', 'Showers', 'Cafe'],
			courts: [
				{ id: 'c1', name: 'Court 1', type: 'Indoor', pricePerHour: 800, availableSlots: ['6:00 AM', '7:00 AM', '2:00 PM'] },
				{ id: 'c2', name: 'Court 2', type: 'Indoor', pricePerHour: 800, availableSlots: ['8:00 AM', '9:00 AM'] },
				{ id: 'c3', name: 'Court 3', type: 'Indoor', pricePerHour: 800, availableSlots: ['6:00 AM', '10:00 AM'] },
				{ id: 'c4', name: 'Outdoor Court', type: 'Outdoor', pricePerHour: 500, availableSlots: ['6:00 AM', '7:00 AM', '4:00 PM', '5:00 PM'] }
			],
			sessions: [
				{ id: 's1', type: 'Open Play', name: 'Morning Rec Play', date: 'Today', time: '6:00 AM - 8:00 AM', level: 'All Levels', pricePerPerson: 200, spotsTotal: 12, spotsFilled: 8, host: 'Coach Rey', courtName: 'Courts 1-2' },
				{ id: 's2', type: 'Drill Session', name: 'Dink & Drop Clinic', date: 'Tomorrow', time: '9:00 AM - 11:00 AM', level: 'Intermediate', pricePerPerson: 350, spotsTotal: 8, spotsFilled: 5, host: 'Coach Rey' },
				{ id: 's3', type: 'Tournament', name: 'BGC Weekend Round Robin', date: 'Mar 29', time: '8:00 AM - 4:00 PM', level: 'Intermediate', pricePerPerson: 500, spotsTotal: 16, spotsFilled: 12, host: 'Pickleball PH' }
			]
		},
		{
			id: 'v2',
			name: 'Circuit Makati Sports Hub',
			address: 'Circuit Lane, Makati City',
			area: 'Makati',
			distance: '1.2 km',
			distanceKm: 1.2,
			rating: 4.9,
			amenities: ['Parking', 'Showers', 'Pro Shop', 'Water Station', 'Lockers'],
			courts: [
				{ id: 'c5', name: 'Court A', type: 'Indoor', pricePerHour: 600, availableSlots: ['6:00 AM', '7:00 AM', '8:00 AM'] },
				{ id: 'c6', name: 'Court B', type: 'Indoor', pricePerHour: 600, availableSlots: ['9:00 AM', '10:00 AM'] },
				{ id: 'c7', name: 'Court C', type: 'Indoor', pricePerHour: 700, availableSlots: ['5:00 PM', '6:00 PM', '7:00 PM'] }
			],
			sessions: [
				{ id: 's4', type: 'Open Play', name: 'After-Work Rally', date: 'Today', time: '5:00 PM - 7:00 PM', level: 'Intermediate+', pricePerPerson: 250, spotsTotal: 16, spotsFilled: 10, host: 'Manila Picklers Club', courtName: 'Courts A-B' },
				{ id: 's5', type: 'Tournament', name: 'Makati Singles Championship', date: 'Apr 5', time: '8:00 AM - 5:00 PM', level: 'Advanced', pricePerPerson: 800, spotsTotal: 32, spotsFilled: 24, host: 'Circuit Makati' }
			]
		},
		{
			id: 'v3',
			name: 'Kapitolyo Sports Complex',
			address: 'Kapitolyo, Pasig City',
			area: 'Pasig',
			distance: '3.5 km',
			distanceKm: 3.5,
			rating: 4.6,
			amenities: ['Parking', 'Water Station', 'Lights', 'Benches'],
			courts: [
				{ id: 'c8', name: 'Covered Court A', type: 'Covered', pricePerHour: 500, availableSlots: ['8:00 AM', '2:00 PM', '4:00 PM'] },
				{ id: 'c9', name: 'Covered Court B', type: 'Covered', pricePerHour: 500, availableSlots: ['6:00 AM', '7:00 AM', '3:00 PM'] }
			],
			sessions: [
				{ id: 's6', type: 'Mixer', name: 'Kapitolyo Friday Mixer', date: 'Mar 28', time: '6:00 PM - 8:00 PM', level: 'All Levels', pricePerPerson: 180, spotsTotal: 20, spotsFilled: 14, host: 'Kapitolyo Pickle Gang' },
				{ id: 's7', type: 'Clinic', name: 'Serve & Return Basics', date: 'Mar 30', time: '9:00 AM - 11:00 AM', level: 'Beginner', pricePerPerson: 300, spotsTotal: 10, spotsFilled: 3, host: 'Coach Mika' }
			]
		},
		{
			id: 'v4',
			name: 'SM Aura Pickle Courts',
			address: 'SM Aura Premier, BGC, Taguig',
			area: 'BGC, Taguig',
			distance: '3.1 km',
			distanceKm: 3.1,
			rating: 4.7,
			amenities: ['Parking', 'Aircon', 'Cafe', 'Lockers'],
			courts: [
				{ id: 'c10', name: 'Court 1', type: 'Indoor', pricePerHour: 750, availableSlots: ['7:00 AM', '8:00 AM', '11:00 AM'] },
				{ id: 'c11', name: 'Court 2', type: 'Indoor', pricePerHour: 750, availableSlots: ['9:00 AM', '3:00 PM'] },
				{ id: 'c12', name: 'Rooftop Court', type: 'Outdoor', pricePerHour: 450, availableSlots: ['6:00 AM', '7:00 AM', '4:00 PM', '5:00 PM'] }
			],
			sessions: [
				{ id: 's8', type: 'Drill Session', name: 'Beginner Bootcamp', date: 'Tomorrow', time: '7:00 AM - 9:00 AM', level: 'Beginner', pricePerPerson: 150, spotsTotal: 8, spotsFilled: 4, host: 'Pickle PH Beginners' }
			]
		},
		{
			id: 'v5',
			name: 'Rizal Park Paddle Center',
			address: 'Rizal Park, Ermita, Manila',
			area: 'Manila',
			distance: '4.1 km',
			distanceKm: 4.1,
			rating: 4.5,
			amenities: ['Water Station', 'Benches', 'Lights'],
			courts: [
				{ id: 'c13', name: 'Open Court 1', type: 'Outdoor', pricePerHour: 350, availableSlots: ['6:30 AM', '7:30 AM', '10:00 AM', '11:00 AM'] },
				{ id: 'c14', name: 'Open Court 2', type: 'Outdoor', pricePerHour: 350, availableSlots: ['6:30 AM', '8:00 AM', '4:00 PM'] },
				{ id: 'c15', name: 'Open Court 3', type: 'Outdoor', pricePerHour: 350, availableSlots: ['9:00 AM', '5:00 PM'] },
				{ id: 'c16', name: 'Covered Court', type: 'Covered', pricePerHour: 450, availableSlots: ['7:00 AM', '2:00 PM'] }
			],
			sessions: [
				{ id: 's9', type: 'Open Play', name: 'Sunset Open Play', date: 'Tomorrow', time: '4:00 PM - 6:00 PM', level: 'Beginner-Intermediate', pricePerPerson: 0, spotsTotal: 12, spotsFilled: 6, host: 'Pasig Picklers' },
				{ id: 's10', type: 'Mixer', name: 'Sunday Community Mixer', date: 'Mar 30', time: '7:00 AM - 10:00 AM', level: 'All Levels', pricePerPerson: 100, spotsTotal: 24, spotsFilled: 18, host: 'Manila Pickle Community' }
			]
		},
		{
			id: 'v6',
			name: 'Alabang Padel & Pickle Club',
			address: 'Filinvest Ave, Alabang, Muntinlupa',
			area: 'Alabang, Muntinlupa',
			distance: '6.3 km',
			distanceKm: 6.3,
			rating: 4.9,
			amenities: ['Parking', 'Aircon', 'Pro Shop', 'Showers', 'Cafe', 'Lockers'],
			courts: [
				{ id: 'c17', name: 'Premium Court 1', type: 'Indoor', pricePerHour: 900, availableSlots: ['5:00 PM', '6:00 PM', '7:00 PM'] },
				{ id: 'c18', name: 'Premium Court 2', type: 'Indoor', pricePerHour: 900, availableSlots: ['8:00 PM', '9:00 PM'] },
				{ id: 'c19', name: 'Standard Court', type: 'Indoor', pricePerHour: 700, availableSlots: ['6:00 AM', '7:00 AM', '8:00 AM'] },
				{ id: 'c20', name: 'Outdoor Court', type: 'Outdoor', pricePerHour: 500, availableSlots: ['6:00 AM', '7:00 AM', '4:00 PM'] }
			],
			sessions: [
				{ id: 's11', type: 'Tournament', name: 'Alabang Beginner Friendly', date: 'Mar 30', time: '8:00 AM - 2:00 PM', level: 'Beginner', pricePerPerson: 350, spotsTotal: 12, spotsFilled: 6, host: 'Alabang Pickle Club' },
				{ id: 's12', type: 'Open Play', name: 'Evening Competitive Play', date: 'Today', time: '7:00 PM - 9:00 PM', level: 'Advanced', pricePerPerson: 300, spotsTotal: 8, spotsFilled: 7, host: 'Alabang Pickle Club', courtName: 'Premium Courts 1-2' }
			]
		}
	];

	// ==========================================
	// BOOKING FLOW STATE
	// ==========================================
	type BookingStep = 'browse' | 'detail' | 'payment' | 'confirmed';

	let bookingStep = $state<BookingStep>('browse');
	let selectedVenue = $state<Venue | null>(null);
	let selectedCourt = $state<Court | null>(null);
	let selectedSlot = $state<string | null>(null);
	let selectedPayment = $state<string | null>(null);
	let isProcessing = $state(false);
	let bookingRef = $state('');

	// Session join flow
	let joiningSession = $state<Session | null>(null);
	let joiningVenue = $state<Venue | null>(null);
	let showSessionModal = $state(false);

	function openBookCourt(venue: Venue) {
		selectedVenue = venue;
		selectedCourt = null;
		selectedSlot = null;
		bookingStep = 'detail';
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function selectCourtFromVenue(court: Court) {
		selectedCourt = court;
		selectedSlot = null;
	}

	function selectSlotAndProceed(slot: string) {
		selectedSlot = slot;
	}

	function goToPayment() {
		if (!selectedSlot || !selectedCourt) return;
		selectedPayment = null;
		bookingStep = 'payment';
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function confirmBooking() {
		if (!selectedPayment) return;
		isProcessing = true;
		setTimeout(() => {
			isProcessing = false;
			bookingRef = 'CS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
			bookingStep = 'confirmed';
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}, 2000);
	}

	function goBack() {
		if (bookingStep === 'detail') {
			bookingStep = 'browse';
			selectedVenue = null;
			selectedCourt = null;
			selectedSlot = null;
		} else if (bookingStep === 'payment') {
			bookingStep = 'detail';
			selectedPayment = null;
		}
	}

	function resetBooking() {
		bookingStep = 'browse';
		selectedVenue = null;
		selectedCourt = null;
		selectedSlot = null;
		selectedPayment = null;
		bookingRef = '';
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function openSessionJoin(session: Session, venue: Venue) {
		joiningSession = session;
		joiningVenue = venue;
		showSessionModal = true;
	}

	function closeSessionModal() {
		showSessionModal = false;
		joiningSession = null;
		joiningVenue = null;
	}

	let showBookingFlow = $derived(bookingStep !== 'browse');

	// ==========================================
	// ACTIVITY TAB STATE
	// ==========================================
	type ActivityTab = 'venues' | 'find-players';

	const tabs: { key: ActivityTab; label: string; emoji: string }[] = [
		{ key: 'venues', label: 'Venues', emoji: '\u{1F3E2}' },
		{ key: 'find-players', label: 'Find Players', emoji: '\u{1F465}' }
	];

	let activeTab = $state<ActivityTab>('venues');

	// ==========================================
	// COURT FINDER STATE (time-based)
	// ==========================================
	type TimeRange = 'next-1h' | 'next-2h' | 'next-4h' | 'today' | 'tomorrow';

	const timeRangeLabels: Record<TimeRange, string> = {
		'next-1h': 'Next hr',
		'next-2h': '2 hrs',
		'next-4h': '4 hrs',
		today: 'Today',
		tomorrow: 'Tomorrow'
	};

	const timeOptions: { label: string; value: TimeRange }[] = [
		{ label: 'Next hour', value: 'next-1h' },
		{ label: 'Next 2 hours', value: 'next-2h' },
		{ label: 'Next 4 hours', value: 'next-4h' },
		{ label: 'Today', value: 'today' },
		{ label: 'Tomorrow', value: 'tomorrow' }
	];

	let selectedTime = $state<TimeRange>('today');
	let showTimeDropdown = $state(false);

	// ==========================================
	// SEARCH STATE
	// ==========================================
	let venueSearch = $state('');
	let showSearchResults = $state(false);

	let searchFilteredVenues = $derived(
		venueSearch.trim().length > 0
			? venues.filter(
					(v) =>
						v.name.toLowerCase().includes(venueSearch.toLowerCase()) ||
						v.address.toLowerCase().includes(venueSearch.toLowerCase()) ||
						v.area.toLowerCase().includes(venueSearch.toLowerCase())
				)
			: []
	);

	// ==========================================
	// STICKY MOBILE CTA STATE
	// ==========================================
	let heroRef: HTMLElement | null = $state(null);
	let showStickyMobileCta = $state(false);

	$effect(() => {
		if (!heroRef) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				showStickyMobileCta = !entry.isIntersecting;
			},
			{ threshold: 0 }
		);
		observer.observe(heroRef);
		return () => observer.disconnect();
	});

	function openTimeDropdown() {
		showTimeDropdown = !showTimeDropdown;
		showLocationPicker = false;
		showRadiusPicker = false;
	}

	function openRadiusPicker() {
		showRadiusPicker = !showRadiusPicker;
		showLocationPicker = false;
		showTimeDropdown = false;
	}

	function openLocationDropdown() {
		showLocationPicker = !showLocationPicker;
		showTimeDropdown = false;
		showRadiusPicker = false;
	}

	// ==========================================
	// LOCATION PICKER STATE
	// ==========================================
	const locationOptions = [
		'Makati, Metro Manila',
		'BGC, Taguig',
		'Pasig City',
		'Mandaluyong',
		'Quezon City',
		'Manila',
		'Alabang, Muntinlupa'
	];
	let selectedLocation = $state('Makati, Metro Manila');
	let showLocationPicker = $state(false);
	let locationSearch = $state('');
	let gpsStatus = $state<'idle' | 'locating' | 'granted' | 'denied'>('idle');

	let filteredLocations = $derived(
		locationSearch
			? locationOptions.filter((l) => l.toLowerCase().includes(locationSearch.toLowerCase()))
			: locationOptions
	);

	function requestGPS() {
		gpsStatus = 'locating';
		if ('geolocation' in navigator) {
			navigator.geolocation.getCurrentPosition(
				() => {
					gpsStatus = 'granted';
					selectedLocation = 'Current Location';
					showLocationPicker = false;
				},
				() => {
					gpsStatus = 'denied';
				}
			);
		}
	}

	// ==========================================
	// RADIUS SELECTOR STATE
	// ==========================================
	const radiusOptions = [1, 3, 5, 10, 15, 20];
	let selectedRadius = $state(10);
	let showRadiusPicker = $state(false);

	// ==========================================
	// VENUE TYPE FILTER
	// ==========================================
	type VenueFilter = 'all' | 'has-open-play' | 'has-tournaments' | 'courts-only';
	let venueTypeFilter = $state<VenueFilter>('all');

	let filteredVenues = $derived(
		venues
			.filter((v) => v.distanceKm <= selectedRadius)
			.filter((v) => {
				if (venueTypeFilter === 'all') return true;
				if (venueTypeFilter === 'has-open-play') return v.sessions.some(s => s.type === 'Open Play' || s.type === 'Mixer');
				if (venueTypeFilter === 'has-tournaments') return v.sessions.some(s => s.type === 'Tournament');
				if (venueTypeFilter === 'courts-only') return v.sessions.length === 0;
				return true;
			})
			.sort((a, b) => a.distanceKm - b.distanceKm)
	);

	// ==========================================
	// HELPERS
	// ==========================================
	function formatPrice(price: number): string {
		return `\u20B1${price.toLocaleString()}`;
	}

	function courtTypeColor(type: string): string {
		if (type === 'Indoor') return 'bg-violet-500/10 text-violet-600 border-violet-200';
		if (type === 'Outdoor') return 'bg-amber-500/10 text-amber-600 border-amber-200';
		return 'bg-cyan-500/10 text-cyan-600 border-cyan-200';
	}

	function levelColor(level: string): string {
		if (level.includes('Advanced')) return 'bg-red-500/10 text-red-600 border-red-200';
		if (level.includes('Intermediate')) return 'bg-amber-500/10 text-amber-600 border-amber-200';
		if (level.includes('Beginner')) return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
		return 'bg-violet-500/10 text-violet-600 border-violet-200';
	}

	function levelBadgeColor(level: string): string {
		if (level === 'Advanced') return 'bg-red-500/10 text-red-600';
		if (level === 'Intermediate') return 'bg-amber-500/10 text-amber-600';
		return 'bg-emerald-500/10 text-emerald-600';
	}

	function sessionTypeIcon(type: string): string {
		if (type === 'Open Play') return '\u{1F3AF}';
		if (type === 'Tournament') return '\u{1F3C6}';
		if (type === 'Drill Session') return '\u{1F4AA}';
		if (type === 'Clinic') return '\u{1F393}';
		if (type === 'Mixer') return '\u{1F389}';
		return '\u{1F3AF}';
	}

	function sessionCTA(type: string): string {
		if (type === 'Tournament') return 'Register';
		return 'Join';
	}

	function getVenueMinPrice(venue: Venue): number {
		return Math.min(...venue.courts.map(c => c.pricePerHour));
	}

	function getVenueAllSlots(venue: Venue): string[] {
		const allSlots = new Set<string>();
		for (const court of venue.courts) {
			for (const slot of court.availableSlots) {
				allSlots.add(slot);
			}
		}
		return [...allSlots].sort();
	}

	function getCourtTypeSummary(venue: Venue): string {
		const counts: Record<string, number> = {};
		for (const court of venue.courts) {
			counts[court.type] = (counts[court.type] || 0) + 1;
		}
		return Object.entries(counts).map(([type, count]) => `${count} ${type}`).join(', ');
	}

	// ==========================================
	// FIND PLAYERS DATA
	// ==========================================
	const lookingForGame = [
		{ name: 'Marco P.', level: 'Advanced', style: 'Competitive' as const, looking: 'Doubles partner', when: 'Today evening', area: 'BGC' },
		{ name: 'Rina S.', level: 'Intermediate', style: 'Recreational' as const, looking: 'Open play group', when: 'Tomorrow morning', area: 'Makati' },
		{ name: 'Carlos M.', level: 'Advanced', style: 'Competitive' as const, looking: 'Singles match', when: 'This weekend', area: 'Alabang' },
		{ name: 'Bea T.', level: 'Beginner', style: 'Recreational' as const, looking: 'Drill partner', when: 'Weekday evenings', area: 'Pasig' }
	];

	let selectedLevel = $state('All');
	let playStylePref = $state<'competitive' | 'recreational' | 'either'>('either');

	// Upcoming tournaments (derived from venue sessions)
	let upcomingTournaments = $derived(
		venues.flatMap(v => v.sessions.filter(s => s.type === 'Tournament').map(s => ({ ...s, venueName: v.name })))
	);

	// Tab counts
	let tabCounts = $derived<Record<ActivityTab, number>>({
		venues: filteredVenues.length,
		'find-players': lookingForGame.length
	});

	// ==========================================
	// TESTIMONIALS
	// ==========================================
	let activeTestimonial = $state(0);
	const testimonials = [
		{
			name: 'Miguel Reyes',
			location: 'BGC Pickler',
			rating: 5,
			quote:
				'Finally don\'t have to message 5 venue owners every Saturday morning. Court Sniper finds the open slots for me. More rallies, less Viber.'
		},
		{
			name: 'Joy Manalo',
			location: 'Makati',
			rating: 5,
			quote:
				'The auto-snipe feature is a game changer. Got my regular 6AM Tuesday slot back after weeks of it being full. No more 5AM alarm just to refresh.'
		},
		{
			name: 'Paolo Garcia',
			location: 'Kapitolyo',
			rating: 5,
			quote:
				'Booking for our barkada used to be a nightmare. Now one person books, everyone pays via GCash. So smooth — we just show up and dink.'
		}
	];

	const partnerVenues = [
		'Pickleball Philippines BGC',
		'Circuit Makati Sports Hub',
		'SM Aura Pickle Courts',
		'Kapitolyo Sports Complex',
		'Rizal Park Paddle Center',
		'Clark Pickleball Center'
	];

	$effect(() => {
		const interval = setInterval(() => {
			activeTestimonial = (activeTestimonial + 1) % testimonials.length;
		}, 5000);
		return () => clearInterval(interval);
	});

	// Lock body scroll when booking flow or session modal is open
	$effect(() => {
		if (showBookingFlow || showSessionModal) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	});
</script>

<svelte:head>
	<title>Court Sniper - Find & Book Pickleball Courts Now</title>
	<meta
		name="description"
		content="Find open pickleball courts near you and book instantly. Court Sniper is the Filipino pickler's home court advantage — from BGC to Alabang and beyond."
	/>
</svelte:head>

<!-- ==========================================
     SESSION JOIN MODAL
     ========================================== -->
{#if showSessionModal && joiningSession && joiningVenue}
	<div class="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
		<div class="w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-border bg-background p-6 shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-extrabold">Join Session</h2>
				<button onclick={closeSessionModal} class="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
					<X class="h-4 w-4" />
				</button>
			</div>

			<div class="rounded-xl border border-border bg-muted/30 p-4">
				<div class="flex items-center gap-2 mb-2">
					<span class="text-lg leading-none">{sessionTypeIcon(joiningSession.type)}</span>
					<span class="text-sm font-bold">{joiningSession.name}</span>
				</div>
				<p class="text-xs text-muted-foreground">{joiningVenue.name}</p>
				{#if joiningSession.courtName}
					<p class="text-xs text-muted-foreground">{joiningSession.courtName}</p>
				{/if}

				<div class="mt-3 flex flex-wrap gap-1.5">
					<span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
						{joiningSession.date} &middot; {joiningSession.time}
					</span>
					<span class="rounded-full border px-2.5 py-0.5 text-[11px] font-bold {levelColor(joiningSession.level)}">
						{joiningSession.level}
					</span>
				</div>

				<div class="mt-3 flex items-center justify-between text-sm">
					<span class="text-muted-foreground">Hosted by <span class="font-medium text-foreground">{joiningSession.host}</span></span>
				</div>

				<div class="mt-3">
					<div class="flex items-center justify-between text-xs mb-1">
						<span class="text-muted-foreground">{joiningSession.spotsFilled}/{joiningSession.spotsTotal} spots filled</span>
						<span class="font-bold text-primary">{joiningSession.spotsTotal - joiningSession.spotsFilled} left</span>
					</div>
					<div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
						<div
							class="h-full rounded-full bg-primary transition-all"
							style="width: {(joiningSession.spotsFilled / joiningSession.spotsTotal) * 100}%"
						></div>
					</div>
				</div>
			</div>

			<div class="mt-4 rounded-xl border border-border p-4">
				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">Price per person</span>
					<span class="text-2xl font-extrabold text-primary">
						{joiningSession.pricePerPerson === 0 ? 'Free' : formatPrice(joiningSession.pricePerPerson)}
					</span>
				</div>
			</div>

			<button
				class="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
			>
				{joiningSession.pricePerPerson === 0 ? 'Join Session' : `Join & Pay ${formatPrice(joiningSession.pricePerPerson)}`}
			</button>
		</div>
	</div>
{/if}

<!-- ==========================================
     BOOKING FLOW OVERLAY
     ========================================== -->
{#if showBookingFlow}
	<div class="fixed inset-0 z-[100] flex flex-col bg-background">
		<!-- Booking Header -->
		<header class="shrink-0 border-b border-border bg-background">
			<div class="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
				{#if bookingStep !== 'confirmed'}
					<button
						onclick={goBack}
						class="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
					>
						<ArrowLeft class="h-4 w-4" />
						Back
					</button>
				{:else}
					<div></div>
				{/if}

				<div class="flex items-center gap-1.5">
					{#each ['detail', 'payment', 'confirmed'] as step, i}
						<div
							class="h-1.5 rounded-full transition-all {bookingStep === step
								? 'w-6 bg-primary'
								: i <
									  ['detail', 'payment', 'confirmed'].indexOf(bookingStep)
									? 'w-4 bg-primary/40'
									: 'w-4 bg-border'}"
						></div>
					{/each}
				</div>

				{#if bookingStep !== 'confirmed'}
					<button
						onclick={resetBooking}
						class="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						<X class="h-4 w-4" />
					</button>
				{:else}
					<div></div>
				{/if}
			</div>
		</header>

		<!-- Booking Content -->
		<div class="flex-1 overflow-y-auto">
			<!-- STEP: Venue Detail / Court Selection -->
			{#if bookingStep === 'detail' && selectedVenue}
				<div class="mx-auto max-w-2xl px-4 py-6">
					<!-- Venue photo placeholder -->
					<div
						class="flex h-48 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 via-muted to-secondary/10 sm:h-56"
					>
						<div class="text-center">
							<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20">
								<Building2 class="h-8 w-8 text-primary" />
							</div>
							<p class="mt-3 text-sm font-medium text-muted-foreground">Venue photos coming soon</p>
						</div>
					</div>

					<!-- Venue info -->
					<div class="mt-6">
						<div class="flex items-start justify-between gap-3">
							<div>
								<h1 class="text-2xl font-extrabold">{selectedVenue.name}</h1>
								<p class="mt-1 text-sm text-muted-foreground">{selectedVenue.address}</p>
							</div>
							<div class="flex shrink-0 items-center gap-1 rounded-xl bg-amber-50 px-3 py-1.5">
								<Star class="h-4 w-4 fill-amber-400 text-amber-400" />
								<span class="text-sm font-bold text-amber-700">{selectedVenue.rating}</span>
							</div>
						</div>

						<div class="mt-4 flex flex-wrap gap-3">
							<span class="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-bold text-muted-foreground">
								{selectedVenue.courts.length} courts
							</span>
							<span class="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-bold text-muted-foreground">
								{selectedVenue.distance} away
							</span>
						</div>
					</div>

					<!-- Amenities -->
					<div class="mt-6">
						<h3 class="text-sm font-bold uppercase tracking-wider text-muted-foreground">Amenities</h3>
						<div class="mt-3 flex flex-wrap gap-2">
							{#each selectedVenue.amenities as amenity}
								<span class="flex items-center gap-1.5 rounded-lg bg-muted/60 px-3 py-2 text-xs font-medium">
									<CheckCircle2 class="h-3.5 w-3.5 text-primary" />
									{amenity}
								</span>
							{/each}
						</div>
					</div>

					<!-- Select Court -->
					<div class="mt-8">
						<h3 class="text-sm font-bold uppercase tracking-wider text-muted-foreground">Select a court</h3>
						<div class="mt-3 space-y-3">
							{#each selectedVenue.courts as court (court.id)}
								<button
									onclick={() => selectCourtFromVenue(court)}
									class="w-full rounded-xl border-2 p-4 text-left transition-all active:scale-[0.98] {selectedCourt?.id === court.id
										? 'border-primary bg-primary/5 shadow-md'
										: 'border-border hover:border-primary/40'}"
								>
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-2">
											<p class="text-sm font-bold">{court.name}</p>
											<span class="rounded-md border px-2 py-0.5 text-[10px] font-bold {courtTypeColor(court.type)}">{court.type}</span>
										</div>
										<span class="text-sm font-extrabold text-primary">{formatPrice(court.pricePerHour)}/hr</span>
									</div>
									<div class="mt-2 flex flex-wrap gap-1.5">
										{#each court.availableSlots as slot}
											<span class="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{slot}</span>
										{/each}
									</div>
								</button>
							{/each}
						</div>
					</div>

					<!-- Select time slot (if court selected) -->
					{#if selectedCourt}
						<div class="mt-8">
							<h3 class="text-sm font-bold uppercase tracking-wider text-muted-foreground">
								Select a time slot for {selectedCourt.name}
							</h3>
							<div class="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
								{#each selectedCourt.availableSlots as slot}
									<button
										onclick={() => selectSlotAndProceed(slot)}
										class="rounded-xl border-2 px-4 py-3 text-center text-sm font-bold transition-all active:scale-95 {selectedSlot === slot
											? 'border-primary bg-primary/5 text-primary shadow-md'
											: 'border-border hover:border-primary/40'}"
									>
										{slot}
									</button>
								{/each}
							</div>
						</div>

						<!-- Price + Book button -->
						<div class="mt-8 rounded-2xl border-2 border-border bg-muted/30 p-5">
							<div class="flex items-center justify-between">
								<div>
									<p class="text-sm text-muted-foreground">Price per hour</p>
									<p class="text-3xl font-extrabold text-primary">{formatPrice(selectedCourt.pricePerHour)}</p>
								</div>
								{#if selectedSlot}
									<div class="text-right">
										<p class="text-sm text-muted-foreground">Selected</p>
										<p class="text-lg font-bold">{selectedSlot}</p>
									</div>
								{/if}
							</div>
							<button
								onclick={goToPayment}
								disabled={!selectedSlot}
								class="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold transition-all {selectedSlot
									? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:-translate-y-0.5 hover:shadow-xl active:scale-95'
									: 'cursor-not-allowed bg-muted text-muted-foreground'}"
							>
								{selectedSlot ? 'Continue to Payment' : 'Select a time slot first'}
								{#if selectedSlot}
									<ArrowRight class="h-5 w-5" />
								{/if}
							</button>
						</div>
					{/if}
				</div>

			<!-- STEP: Payment -->
			{:else if bookingStep === 'payment' && selectedVenue && selectedCourt && selectedSlot}
				<div class="mx-auto max-w-2xl px-4 py-6">
					<h2 class="text-2xl font-extrabold">Choose payment method</h2>
					<p class="mt-1 text-muted-foreground">Secure payment via PayMongo</p>

					<!-- Booking summary card -->
					<div class="mt-6 rounded-2xl border-2 border-border bg-muted/30 p-5">
						<div class="flex items-start gap-4">
							<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
								<Building2 class="h-6 w-6 text-primary" />
							</div>
							<div class="min-w-0">
								<p class="truncate font-bold">{selectedVenue.name}</p>
								<p class="text-sm text-muted-foreground">
									{selectedCourt.name} &middot; {selectedCourt.type}
								</p>
								<div class="mt-2 flex items-center gap-3">
									<span class="rounded-lg bg-primary/5 px-2.5 py-1 text-xs font-bold text-primary">{selectedSlot}</span>
									<span class="text-sm font-medium text-muted-foreground">1 hour</span>
								</div>
							</div>
						</div>
						<div class="mt-4 flex items-center justify-between border-t border-border pt-4">
							<span class="text-sm font-medium text-muted-foreground">Total</span>
							<span class="text-2xl font-extrabold text-primary">{formatPrice(selectedCourt.pricePerHour)}</span>
						</div>
					</div>

					<!-- Payment methods -->
					<div class="mt-6 space-y-3">
						<button
							onclick={() => (selectedPayment = 'gcash')}
							class="flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all {selectedPayment === 'gcash'
								? 'border-primary bg-primary/5 shadow-md'
								: 'border-border hover:border-primary/40'}"
						>
							<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
								<Smartphone class="h-6 w-6 text-blue-500" />
							</div>
							<div>
								<p class="font-bold">GCash</p>
								<p class="text-sm text-muted-foreground">Pay with your GCash wallet</p>
							</div>
							{#if selectedPayment === 'gcash'}
								<CheckCircle2 class="ml-auto h-6 w-6 shrink-0 text-primary" />
							{/if}
						</button>

						<button
							onclick={() => (selectedPayment = 'card')}
							class="flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all {selectedPayment === 'card'
								? 'border-primary bg-primary/5 shadow-md'
								: 'border-border hover:border-primary/40'}"
						>
							<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
								<CreditCard class="h-6 w-6 text-violet-500" />
							</div>
							<div>
								<p class="font-bold">Credit / Debit Card</p>
								<p class="text-sm text-muted-foreground">Visa, Mastercard, or JCB</p>
							</div>
							{#if selectedPayment === 'card'}
								<CheckCircle2 class="ml-auto h-6 w-6 shrink-0 text-primary" />
							{/if}
						</button>

						<button
							onclick={() => (selectedPayment = 'venue')}
							class="flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all {selectedPayment === 'venue'
								? 'border-primary bg-primary/5 shadow-md'
								: 'border-border hover:border-primary/40'}"
						>
							<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
								<Store class="h-6 w-6 text-amber-500" />
							</div>
							<div>
								<p class="font-bold">Pay at Venue</p>
								<p class="text-sm text-muted-foreground">Cash or card when you arrive</p>
							</div>
							{#if selectedPayment === 'venue'}
								<CheckCircle2 class="ml-auto h-6 w-6 shrink-0 text-primary" />
							{/if}
						</button>
					</div>

					<!-- Confirm button -->
					<button
						onclick={confirmBooking}
						disabled={!selectedPayment || isProcessing}
						class="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold transition-all {selectedPayment && !isProcessing
							? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:-translate-y-0.5 hover:shadow-xl active:scale-95'
							: 'cursor-not-allowed bg-muted text-muted-foreground'}"
					>
						{#if isProcessing}
							<div class="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
							Processing...
						{:else if selectedPayment}
							Confirm Booking &middot; {formatPrice(selectedCourt.pricePerHour)}
						{:else}
							Select a payment method
						{/if}
					</button>

					<!-- Trust signals -->
					<div class="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
						<div class="flex items-center gap-1">
							<Shield class="h-3.5 w-3.5" />
							<span>Secure payment</span>
						</div>
						<div class="flex items-center gap-1">
							<CheckCircle2 class="h-3.5 w-3.5" />
							<span>Instant confirmation</span>
						</div>
					</div>
				</div>

			<!-- STEP: Confirmed -->
			{:else if bookingStep === 'confirmed' && selectedVenue && selectedCourt && selectedSlot}
				<div class="mx-auto max-w-2xl px-4 py-8">
					<!-- Success animation -->
					<div class="relative text-center">
						<div class="confetti-container">
							{#each Array(12) as _, i}
								<div
									class="confetti-piece"
									style="--delay: {i * 0.1}s; --angle: {i * 30}deg; --color: {['#22c55e', '#8b5cf6', '#f59e0b', '#06b6d4', '#ef4444', '#ec4899'][i % 6]}"
								></div>
							{/each}
						</div>

						<div class="success-check mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
							<CheckCircle2 class="h-10 w-10 text-primary" />
						</div>
						<h1 class="mt-6 text-3xl font-extrabold sm:text-4xl">Court Booked!</h1>
						<p class="mt-2 text-muted-foreground">You are all set. See you on the court.</p>
					</div>

					<!-- Booking details card -->
					<div class="mt-8 rounded-2xl border-2 border-primary/30 bg-primary/5 p-6">
						<div class="flex items-center justify-between">
							<span class="text-xs font-bold uppercase tracking-wider text-muted-foreground">Booking Reference</span>
							<span class="font-mono text-sm font-bold text-primary">{bookingRef}</span>
						</div>
						<div class="mt-5 space-y-4">
							<div class="flex items-start gap-3">
								<Building2 class="mt-0.5 h-5 w-5 shrink-0 text-primary" />
								<div>
									<p class="font-bold">{selectedVenue.name}</p>
									<p class="text-sm text-muted-foreground">{selectedCourt.name} &middot; {selectedVenue.address}</p>
								</div>
							</div>
							<div class="flex items-start gap-3">
								<CalendarDays class="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
								<div>
									<p class="font-bold">Today at {selectedSlot}</p>
									<p class="text-sm text-muted-foreground">1 hour session</p>
								</div>
							</div>
							<div class="flex items-start gap-3">
								<CreditCard class="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
								<div>
									<p class="font-bold">{formatPrice(selectedCourt.pricePerHour)}</p>
									<p class="text-sm text-muted-foreground">
										{selectedPayment === 'gcash' ? 'Paid via GCash' : selectedPayment === 'card' ? 'Paid via Card' : 'Pay at venue'}
									</p>
								</div>
							</div>
						</div>
					</div>

					<!-- Barkada Share Section -->
					<div class="mt-6 rounded-2xl border-2 border-border bg-background p-6">
						<div class="flex items-center gap-2 mb-4">
							<UserPlus class="h-5 w-5 text-primary" />
							<h3 class="text-base font-bold">Share with your Barkada</h3>
						</div>
						<p class="text-sm text-muted-foreground mb-4">
							Invite friends to join this session. 4 players needed -- 1 confirmed.
						</p>

						<div class="flex items-center gap-2 rounded-xl border border-border bg-muted/50 p-3 mb-4">
							<span class="flex-1 truncate text-sm font-mono text-muted-foreground">
								courtsniper.ph/join/{bookingRef}
							</span>
							<button class="shrink-0 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-colors">
								<Copy class="inline h-3.5 w-3.5 mr-1" />
								Copy
							</button>
						</div>

						<div class="grid grid-cols-2 gap-2 mb-5">
							<button class="flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-bold hover:bg-muted transition-colors">
								<Smartphone class="h-4 w-4 text-blue-500" />
								Messenger
							</button>
							<button class="flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-bold hover:bg-muted transition-colors">
								<Smartphone class="h-4 w-4 text-violet-500" />
								Viber
							</button>
						</div>

						<div class="space-y-2">
							<p class="text-xs font-bold uppercase tracking-wider text-muted-foreground">Player Slots</p>
							<div class="rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-center gap-3">
								<div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">J</div>
								<div class="flex-1 min-w-0">
									<p class="text-sm font-bold">Juan (You)</p>
								</div>
								<span class="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">Paid</span>
							</div>
							{#each [1, 2] as _}
								<div class="rounded-xl border border-dashed border-border p-3 flex items-center gap-3">
									<div class="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">?</div>
									<div class="flex-1">
										<p class="text-sm text-muted-foreground">Waiting for player...</p>
									</div>
									<span class="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Pending</span>
								</div>
							{/each}
						</div>
					</div>

					<!-- Action buttons -->
					<div class="mt-6 grid grid-cols-2 gap-3">
						<button class="flex items-center justify-center gap-2 rounded-2xl border-2 border-border py-3.5 text-sm font-bold transition-all hover:border-primary/40 hover:bg-primary/5 active:scale-95">
							<CalendarPlus class="h-4 w-4" />
							Add to Calendar
						</button>
						<a
							href="/bookings"
							class="flex items-center justify-center gap-2 rounded-2xl border-2 border-border py-3.5 text-sm font-bold transition-all hover:border-primary/40 hover:bg-primary/5 active:scale-95"
						>
							<CalendarCheck class="h-4 w-4" />
							View My Bookings
						</a>
					</div>

					<button
						onclick={resetBooking}
						class="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
					>
						Find Another Court
						<ArrowRight class="h-5 w-5" />
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<!-- ==========================================
     LANDING PAGE (visible when browsing)
     ========================================== -->

<!-- Header -->
<header class="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg">
	<div class="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
		<a href="/" class="flex items-center gap-2">
			<div class="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
				<Target class="h-4 w-4 text-primary-foreground" />
			</div>
			<span class="text-base font-extrabold tracking-tight">Court Sniper</span>
		</a>
		<nav class="flex items-center gap-2">
			<a href="#features" class="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block">Features</a>
			<a href="#pricing" class="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block">Pricing</a>
			<a href="/venue/dashboard" class="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block">For Venues</a>
			<a href="/community" class="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block">Community</a>
			<a href="/login" class="ml-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-all hover:-translate-y-0.5 active:scale-95">Sign In</a>
		</nav>
	</div>
</header>

<!-- Hero: Activity Hub -->
<section bind:this={heroRef} class="relative flex min-h-screen flex-col items-center overflow-hidden pt-12">
	<!-- OpenStreetMap Background -->
	<iframe
		src="https://www.openstreetmap.org/export/embed.html?bbox=120.95,14.52,121.10,14.62&layer=mapnik&marker=14.5547,121.0244"
		class="pointer-events-none absolute inset-0 h-full w-full opacity-[0.15]"
		style="border:none"
		title="Map background"
		loading="lazy"
	></iframe>

	<!-- Content -->
	<div class="relative z-10 mx-auto flex w-full max-w-lg flex-col px-4 pt-16">

		<!-- Headline -->
		<div class="text-center">
			<h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl">
				Find open courts<br />near you
			</h1>
			<p class="mt-2 text-base text-muted-foreground">Where PH picklers find their next rally.</p>
		</div>

		<!-- ACTIVITY TABS -->
		<div class="mt-6 -mx-4 px-4 overflow-x-auto scrollbar-hide">
			<div class="flex gap-2 min-w-max">
				{#each tabs as tab (tab.key)}
					<button
						onclick={() => { activeTab = tab.key; }}
						class="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all whitespace-nowrap active:scale-95 {activeTab === tab.key
							? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-2 ring-primary/30 ring-offset-2 ring-offset-background'
							: 'bg-background/90 text-muted-foreground border border-border backdrop-blur-sm hover:border-primary/40 hover:text-foreground'}"
					>
						<span class="text-base leading-none">{tab.emoji}</span>
						{tab.label}
						<span class="ml-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold leading-none {activeTab === tab.key
							? 'bg-primary-foreground/20 text-primary-foreground'
							: 'bg-muted text-muted-foreground'}"
						>
							{tabCounts[tab.key]}
						</span>
					</button>
				{/each}
			</div>
		</div>

		<!-- SEARCH BAR -->
		<div class="relative mt-4">
			<div class="relative">
				<Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<input
					type="text"
					placeholder={activeTab === 'venues' ? 'Search by area, venue name...' : 'Search players...'}
					bind:value={venueSearch}
					onfocus={() => { showSearchResults = true; }}
					onblur={() => { setTimeout(() => { showSearchResults = false; }, 200); }}
					class="w-full rounded-xl border border-border bg-background/90 py-3 pl-10 pr-4 text-sm shadow-sm backdrop-blur-md placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
				/>
			</div>
			{#if showSearchResults && venueSearch.trim().length > 0 && activeTab === 'venues'}
				<div class="absolute left-0 top-full z-50 mt-1 w-full rounded-xl border border-border bg-background shadow-xl animate-fade-in">
					{#if searchFilteredVenues.length === 0}
						<div class="px-4 py-3 text-center text-sm text-muted-foreground">No venues found</div>
					{:else}
						<div class="max-h-60 overflow-y-auto py-1">
							{#each searchFilteredVenues as venue (venue.id)}
								<button
									onmousedown={() => openBookCourt(venue)}
									class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60"
								>
									<Building2 class="h-4 w-4 shrink-0 text-primary" />
									<div class="min-w-0">
										<p class="truncate text-sm font-bold">{venue.name}</p>
										<p class="text-xs text-muted-foreground">{venue.area} &middot; from {formatPrice(getVenueMinPrice(venue))}/hr</p>
									</div>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- FILTERS -->
		{#if activeTab === 'venues'}
			<div class="mt-3 -mx-4 px-4 overflow-x-auto scrollbar-hide">
			<div class="flex items-center gap-2 min-w-max">
				<!-- Location Filter -->
				<div class="relative">
					<button
						onclick={openLocationDropdown}
						class="inline-flex items-center gap-2 rounded-xl border border-border bg-background/90 px-4 py-2.5 text-sm font-medium backdrop-blur-sm transition-colors hover:border-primary/40 active:scale-95"
					>
						<MapPin class="h-3.5 w-3.5 text-primary" />
						<span class="max-w-[120px] truncate">{selectedLocation.split(',')[0]}</span>
						<ChevronDown class="h-3.5 w-3.5 text-muted-foreground transition-transform {showLocationPicker ? 'rotate-180' : ''}" />
					</button>

					{#if showLocationPicker}
						<div class="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border border-border bg-background shadow-xl animate-fade-in">
							<button
								onclick={requestGPS}
								disabled={gpsStatus === 'locating'}
								class="flex w-full items-center gap-2.5 border-b border-border px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
							>
								<Locate class="h-4 w-4" />
								{#if gpsStatus === 'locating'}
									Locating...
								{:else if gpsStatus === 'denied'}
									GPS denied - try again
								{:else}
									Use GPS location
								{/if}
							</button>

							<div class="border-b border-border px-3 py-2">
								<div class="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
									<Search class="h-4 w-4 text-muted-foreground" />
									<input
										type="text"
										placeholder="Search area..."
										bind:value={locationSearch}
										class="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
									/>
								</div>
							</div>

							<div class="max-h-48 overflow-y-auto py-1">
								{#each filteredLocations as loc}
									<button
										onclick={() => { selectedLocation = loc; showLocationPicker = false; locationSearch = ''; }}
										class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted/60 {selectedLocation === loc ? 'font-bold text-primary' : ''}"
									>
										<MapPin class="h-3.5 w-3.5 shrink-0 text-primary" />
										{loc}
									</button>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				<!-- Time Filter -->
				<div class="relative">
					<button
						onclick={openTimeDropdown}
						class="inline-flex items-center gap-2 rounded-xl border border-border bg-background/90 px-4 py-2.5 text-sm font-medium backdrop-blur-sm transition-colors hover:border-primary/40 active:scale-95"
					>
						<Clock class="h-3.5 w-3.5 text-primary" />
						{timeRangeLabels[selectedTime]}
						<ChevronDown class="h-3.5 w-3.5 text-muted-foreground transition-transform {showTimeDropdown ? 'rotate-180' : ''}" />
					</button>

					{#if showTimeDropdown}
						<div class="absolute left-0 top-full z-50 mt-1 w-44 rounded-xl border border-border bg-background p-1 shadow-xl animate-fade-in">
							{#each timeOptions as opt}
								<button
									onclick={() => { selectedTime = opt.value; showTimeDropdown = false; }}
									class="flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted/60 {selectedTime === opt.value ? 'font-bold text-primary bg-primary/5' : ''}"
								>
									{opt.label}
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Radius Filter -->
				<div class="relative">
					<button
						onclick={openRadiusPicker}
						class="inline-flex items-center gap-2 rounded-xl border border-border bg-background/90 px-4 py-2.5 text-sm font-medium backdrop-blur-sm transition-colors hover:border-primary/40 active:scale-95"
					>
						<Navigation class="h-3.5 w-3.5 text-primary" />
						{selectedRadius}km
						<ChevronDown class="h-3.5 w-3.5 text-muted-foreground transition-transform {showRadiusPicker ? 'rotate-180' : ''}" />
					</button>

					{#if showRadiusPicker}
						<div class="absolute left-0 top-full z-50 mt-1 w-28 rounded-xl border border-border bg-background p-1 shadow-xl animate-fade-in">
							{#each radiusOptions as r}
								<button
									onclick={() => { selectedRadius = r; showRadiusPicker = false; }}
									class="flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted/60 {selectedRadius === r ? 'font-bold text-primary bg-primary/5' : ''}"
								>
									{r} km
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Type Filter -->
				{#each [
					{ key: 'all', label: 'All' },
					{ key: 'has-open-play', label: 'Has Open Play' },
					{ key: 'has-tournaments', label: 'Has Tournaments' }
				] as filter}
					<button
						onclick={() => { venueTypeFilter = filter.key as VenueFilter; }}
						class="rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors active:scale-95 whitespace-nowrap {venueTypeFilter === filter.key
							? 'border-primary bg-primary/10 text-primary'
							: 'border-border bg-background/90 text-muted-foreground backdrop-blur-sm hover:border-primary/40'}"
					>
						{filter.label}
					</button>
				{/each}
			</div>
			</div>
		{:else if activeTab === 'find-players'}
			<div class="mt-3 -mx-4 px-4 overflow-x-auto scrollbar-hide">
			<div class="flex items-center gap-2 min-w-max">
				{#each ['All', 'Beginner', 'Intermediate', 'Advanced'] as lvl}
					<button
						onclick={() => { selectedLevel = lvl; }}
						class="rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors active:scale-95 {selectedLevel === lvl
							? 'border-primary bg-primary/10 text-primary'
							: 'border-border bg-background/90 text-muted-foreground backdrop-blur-sm hover:border-primary/40'}"
					>
						{lvl}
					</button>
				{/each}
				{#each (['competitive', 'recreational', 'either'] as const) as style}
					<button
						onclick={() => { playStylePref = style; }}
						class="rounded-xl border px-4 py-2.5 text-sm font-medium capitalize transition-colors active:scale-95 {playStylePref === style
							? 'border-primary bg-primary/10 text-primary'
							: 'border-border bg-background/90 text-muted-foreground backdrop-blur-sm hover:border-primary/40'}"
					>
						{style}
					</button>
				{/each}
			</div>
			</div>
		{/if}

		<!-- ==========================================
		     TAB CONTENT
		     ========================================== -->

		<!-- TAB: Venues -->
		{#if activeTab === 'venues'}
			{#if filteredVenues.length > 0}
				<div class="mt-6 space-y-4 pb-4">
					{#each filteredVenues as venue (venue.id)}
						<div class="rounded-xl border border-border bg-background/90 p-4 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-sm">
							<!-- Venue Header -->
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0 flex-1">
									<p class="text-sm font-bold">{venue.name}</p>
									<p class="mt-0.5 text-xs text-muted-foreground">{venue.area} &middot; {venue.distance}</p>
								</div>
								<div class="flex shrink-0 items-center gap-1 rounded-lg bg-amber-50 px-2 py-1">
									<Star class="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
									<span class="text-xs font-bold text-amber-700">{venue.rating}</span>
								</div>
							</div>

							<!-- Courts summary -->
							<div class="mt-3">
								<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
									<Building2 class="h-3.5 w-3.5 text-primary" />
									<span class="font-medium">{venue.courts.length} courts ({getCourtTypeSummary(venue)})</span>
								</div>
								<p class="mt-1 text-xs font-bold text-primary">Available: from {formatPrice(getVenueMinPrice(venue))}/hr</p>

								<!-- Available time slot chips -->
								<div class="mt-2 flex flex-wrap gap-1.5">
									{#each getVenueAllSlots(venue).slice(0, 5) as slot}
										<span class="rounded-md border border-primary/20 bg-primary/5 px-2 py-0.5 text-[11px] font-bold text-primary">{slot}</span>
									{/each}
									{#if getVenueAllSlots(venue).length > 5}
										<span class="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">+{getVenueAllSlots(venue).length - 5} more</span>
									{/if}
								</div>
							</div>

							<!-- Sessions -->
							{#if venue.sessions.length > 0}
								<div class="mt-3 pt-3 border-t border-border">
									<p class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Sessions</p>
									<div class="space-y-2">
										{#each venue.sessions as session (session.id)}
											<div class="rounded-lg border border-border bg-muted/30 p-2.5">
												<div class="flex items-start justify-between gap-2">
													<div class="min-w-0 flex-1">
														<div class="flex items-center gap-1.5">
															<span class="text-sm leading-none">{sessionTypeIcon(session.type)}</span>
															<span class="text-xs font-bold truncate">{session.name}</span>
															{#if session.date !== 'Today' && session.date !== 'Tomorrow'}
																<span class="shrink-0 text-[10px] text-muted-foreground">{session.date}</span>
															{:else}
																<span class="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">{session.date}</span>
															{/if}
														</div>
														<div class="mt-1 flex flex-wrap items-center gap-1">
															<span class="text-[10px] text-muted-foreground">{session.time}</span>
															<span class="rounded-full border px-1.5 py-0.5 text-[10px] font-bold {levelColor(session.level)}">{session.level}</span>
															<span class="text-[10px] text-muted-foreground">&middot; {session.pricePerPerson === 0 ? 'Free' : `${formatPrice(session.pricePerPerson)}/person`}</span>
															<span class="text-[10px] text-muted-foreground">&middot; {session.spotsFilled}/{session.spotsTotal}</span>
														</div>
													</div>
													<button
														onclick={() => openSessionJoin(session, venue)}
														class="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 active:scale-95"
													>
														{sessionCTA(session.type)}
													</button>
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/if}

							<!-- CTAs -->
							<div class="mt-3 flex items-center gap-2">
								<button
									onclick={() => openBookCourt(venue)}
									class="flex-1 flex items-center justify-center gap-1.5 rounded-xl border-2 border-border py-2.5 text-xs font-bold transition-all hover:border-primary/40 hover:bg-primary/5 active:scale-95"
								>
									<Building2 class="h-3.5 w-3.5" />
									View Venue
								</button>
								<button
									onclick={() => openBookCourt(venue)}
									class="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95"
								>
									<CalendarCheck class="h-3.5 w-3.5" />
									Book Court
								</button>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="mt-6 rounded-2xl border border-dashed border-border bg-muted/30 py-10 text-center">
					<p class="text-sm text-muted-foreground">No venues found within {selectedRadius}km</p>
					<p class="mt-1 text-xs text-muted-foreground/60">Try a wider radius or different filters</p>
				</div>
			{/if}

		<!-- TAB: Find Players -->
		{:else if activeTab === 'find-players'}
			<div class="mt-6 space-y-3">
				<!-- Post a game request CTA -->
				<button class="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 px-5 py-4 text-sm font-bold text-primary transition-all hover:border-primary/50 hover:bg-primary/10 active:scale-95">
					<UserPlus class="h-5 w-5" />
					Post a Game Request
				</button>

				{#each lookingForGame as player (player.name)}
					<div class="rounded-xl border border-border bg-background/90 p-4 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-sm">
						<div class="flex items-start gap-3">
							<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
								{player.name.split(' ').map((n) => n[0]).join('')}
							</div>
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<p class="text-sm font-bold">{player.name}</p>
									<span class="rounded-full px-2 py-0.5 text-[11px] font-bold {levelBadgeColor(player.level)}">
										{player.level}
									</span>
								</div>
								<p class="mt-0.5 text-xs text-muted-foreground">
									Looking for: {player.looking}
								</p>
								<div class="mt-2 flex flex-wrap items-center gap-1.5">
									<span class="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">{player.style}</span>
									<span class="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">{player.when}</span>
									<span class="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">{player.area}</span>
								</div>
							</div>
							<button class="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95">
								Connect
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- AUTO-SNIPE CTA -->
		<div class="mt-6 rounded-2xl border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 p-5 backdrop-blur-sm">
			<div class="flex items-center gap-3">
				<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15">
					<Zap class="h-6 w-6 text-primary" />
				</div>
				<div class="min-w-0 flex-1">
					<p class="text-sm font-bold">Can't find an open slot?</p>
					<p class="mt-0.5 text-xs text-muted-foreground">Auto-Snipe books the moment a court frees up -- no manual refreshing.</p>
				</div>
			</div>
			<a
				href="#features"
				class="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95"
			>
				<Zap class="h-4 w-4" />
				Set Up Auto-Snipe
			</a>
		</div>

		<!-- UPCOMING TOURNAMENTS STRIP -->
		{#if upcomingTournaments.length > 0}
			<div class="mt-8">
				<div class="flex items-center justify-between">
					<h3 class="text-sm font-bold uppercase tracking-wider text-muted-foreground">
						<Trophy class="mr-1.5 inline h-4 w-4 text-primary" />
						{upcomingTournaments.length} Upcoming Tournaments
					</h3>
					<a href="#features" class="text-xs font-bold text-primary transition-colors hover:text-primary/80">
						View All
						<ChevronRight class="inline h-3.5 w-3.5" />
					</a>
				</div>
				<div class="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
					{#each upcomingTournaments as t (t.id)}
						<div class="w-56 shrink-0 rounded-xl border border-border bg-background/90 p-3.5 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-sm">
							<p class="truncate text-sm font-bold">{t.name}</p>
							<p class="mt-0.5 truncate text-[11px] text-muted-foreground">{t.venueName}</p>
							<div class="mt-2 flex flex-wrap items-center gap-1">
								<span class="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{t.date}</span>
								<span class="rounded-full border px-2 py-0.5 text-[10px] font-bold {levelColor(t.level)}">{t.level}</span>
							</div>
							<div class="mt-2.5 flex items-center justify-between">
								<span class="text-xs font-extrabold text-primary">{formatPrice(t.pricePerPerson)}</span>
								<span class="text-[10px] text-muted-foreground">{t.spotsFilled}/{t.spotsTotal} filled</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

	</div>
</section>

<!-- Social Proof Strip -->
<section class="border-t border-border bg-background py-6">
	<div class="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-3 px-4 text-sm font-semibold text-muted-foreground">
		<div class="flex items-center gap-1.5">
			<MapPin class="h-4 w-4 text-primary" />
			<span>50+ Pickle Venues</span>
		</div>
		<span class="hidden text-border sm:inline">&middot;</span>
		<div class="flex items-center gap-1.5">
			<CalendarCheck class="h-4 w-4 text-primary" />
			<span>1,200+ Bookings</span>
		</div>
		<span class="hidden text-border sm:inline">&middot;</span>
		<div class="flex items-center gap-1.5">
			<Navigation class="h-4 w-4 text-primary" />
			<span>Metro Manila & Beyond</span>
		</div>
		<span class="hidden text-border sm:inline">&middot;</span>
		<div class="flex items-center gap-1.5">
			<Target class="h-4 w-4 text-primary" />
			<span>98% Snipe Rate</span>
		</div>
	</div>
</section>

<!-- Pain Points -->
<section class="relative border-t border-border bg-muted/40 py-20 sm:py-28">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-2xl text-center">
			<h2 class="text-3xl font-extrabold tracking-tight sm:text-4xl">Sound familiar?</h2>
			<p class="mt-4 text-lg text-muted-foreground">
				Every pickler in the Philippines knows the struggle.
			</p>
		</div>
		<div class="mt-16 grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
			{#each [
				{
					icon: AlarmClock,
					title: '"5AM Viber message just to reserve"',
					desc: 'Wake up before sunrise, message the venue owner on Viber, send GCash payment, then pray they confirm before someone else snipes your slot.'
				},
				{
					icon: Clock,
					title: '"Every evening slot is taken"',
					desc: 'Your barkada wants to play after work but every 6-9PM court is fully booked. Weekend open play? Gone by Monday. The same groups lock it down every week.'
				},
				{
					icon: Ban,
					title: '"Ghost bookings stole our court"',
					desc: 'Courts sitting empty because someone booked and never showed. No-shows waste prime court time while your group is stuck waiting, paddles in hand, ready to rally.'
				}
			] as pain}
				<div class="group rounded-2xl border-2 border-border bg-background p-8 transition-all hover:border-destructive/30 hover:shadow-lg">
					<div class="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive transition-transform group-hover:scale-110">
						<pain.icon class="h-7 w-7" />
					</div>
					<h3 class="text-xl font-bold">{pain.title}</h3>
					<p class="mt-3 leading-relaxed text-muted-foreground">{pain.desc}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- How It Works -->
<section id="how-it-works" class="relative border-t border-border py-20 sm:py-28">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-2xl text-center">
			<h2 class="text-3xl font-extrabold tracking-tight sm:text-4xl">
				From search to serve in 3 steps
			</h2>
			<p class="mt-4 text-lg text-muted-foreground">
				Set your paddle preferences, find open courts, and rally on.
			</p>
		</div>
		<div class="relative mt-20">
			<div class="absolute left-1/2 top-7 hidden h-px w-[60%] -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/30 to-transparent md:block"></div>
			<div class="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
				{#each [
					{
						num: 1,
						title: 'Set Your Paddle Preferences',
						desc: 'Pick your area — BGC, Makati, Kapitolyo — choose indoor or outdoor, and set your preferred play times. Morning rec play or after-work drill session, we got you.',
						anim: 'animate-pulse-slow'
					},
					{
						num: 2,
						title: 'Find Open Courts Instantly',
						desc: 'See real-time availability across every pickle court near you. No more Viber messages. No more waiting for replies.',
						anim: 'animate-pulse-slow-delayed'
					},
					{
						num: 3,
						title: 'Rally On',
						desc: 'Booking confirmed via app and GCash. Grab your paddle, show up, and play. It is that simple.',
						anim: 'animate-pulse-slow-delayed-2'
					}
				] as step}
					<div class="relative text-center">
						<div class="{step.anim} relative mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-3xl font-extrabold text-primary-foreground shadow-xl shadow-primary/25">
							{step.num}
						</div>
						<h3 class="text-xl font-bold">{step.title}</h3>
						<p class="mx-auto mt-3 max-w-xs leading-relaxed text-muted-foreground">{step.desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>

<!-- Features Grid -->
<section id="features" class="relative border-t border-border bg-muted/40 py-20 sm:py-28">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-2xl text-center">
			<h2 class="text-3xl font-extrabold tracking-tight sm:text-4xl">
				Everything a pickler needs to play more
			</h2>
			<p class="mt-4 text-lg text-muted-foreground">
				Built by Filipino picklers, for Filipino picklers. Every feature solves a real court-booking headache.
			</p>
		</div>
		<div class="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each [
				{
					icon: MapPin,
					title: 'Court Finder',
					desc: 'From BGC to Alabang, find every pickle court near you. Filter by indoor, outdoor, covered — and see real-time slot availability.',
					color: 'bg-amber-500/10 text-amber-500'
				},
				{
					icon: Zap,
					title: 'Auto-Snipe',
					desc: 'Set it and forget it — we book the second a slot opens at your favorite court. Like a third shot drop: precise and perfectly timed.',
					color: 'bg-primary/10 text-primary'
				},
				{
					icon: Bell,
					title: 'Smart Alerts',
					desc: 'Get pinged when your usual 6AM court has a cancellation. Price drops, new venues, open play sessions — never miss a chance to rally.',
					color: 'bg-violet-500/10 text-violet-500'
				},
				{
					icon: Users,
					title: 'Barkada Booking',
					desc: 'Book for your whole group in one tap. Split payments via GCash so nobody has to chase anyone for their share. Laro tayo!',
					color: 'bg-cyan-500/10 text-cyan-500'
				},
				{
					icon: CreditCard,
					title: 'GCash & Card',
					desc: 'Pay instantly with GCash, Maya, or card. No more bank transfers, no more "sent na, check mo" screenshots. Secure via PayMongo.',
					color: 'bg-rose-500/10 text-rose-500'
				},
				{
					icon: BarChart3,
					title: 'Play Stats',
					desc: 'Track your sessions, favorite courts, and playing frequency. See when courts are least busy and find the best value slots.',
					color: 'bg-emerald-500/10 text-emerald-500'
				}
			] as feature}
				<div class="group rounded-2xl border-2 border-border bg-background p-8 transition-all hover:border-primary/30 hover:shadow-lg">
					<div class="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl {feature.color} transition-transform group-hover:scale-110">
						<feature.icon class="h-7 w-7" />
					</div>
					<h3 class="text-lg font-bold">{feature.title}</h3>
					<p class="mt-2 leading-relaxed text-muted-foreground">{feature.desc}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Social Proof -->
<section class="relative border-t border-border py-20 sm:py-28">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-2xl text-center">
			<h2 class="text-3xl font-extrabold tracking-tight sm:text-4xl">
				Trusted by picklers nationwide
			</h2>
			<p class="mt-4 text-lg text-muted-foreground">
				Hear from players who stopped chasing courts and started playing more.
			</p>
		</div>

		<div class="relative mx-auto mt-16 max-w-2xl">
			{#each testimonials as testimonial, i}
				<div
					class="absolute inset-0 transition-all duration-500 {i === activeTestimonial
						? 'relative opacity-100 translate-y-0'
						: 'pointer-events-none opacity-0 translate-y-4'}"
				>
					<div class="rounded-3xl border-2 border-border bg-background p-8 shadow-lg sm:p-12">
						<div class="flex items-center gap-1">
							{#each Array(testimonial.rating) as _}
								<Star class="h-5 w-5 fill-amber-400 text-amber-400" />
							{/each}
						</div>
						<blockquote class="mt-6 text-xl font-medium leading-relaxed sm:text-2xl">
							"{testimonial.quote}"
						</blockquote>
						<div class="mt-8 flex items-center gap-4">
							<div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
								{testimonial.name.split(' ').map((n) => n[0]).join('')}
							</div>
							<div>
								<p class="font-bold">{testimonial.name}</p>
								<p class="text-sm text-muted-foreground">{testimonial.location}</p>
							</div>
						</div>
					</div>
				</div>
			{/each}
			<div class="mt-8 flex justify-center gap-2">
				{#each testimonials as _, i}
					<button
						onclick={() => (activeTestimonial = i)}
						class="h-2.5 rounded-full transition-all {i === activeTestimonial
							? 'w-8 bg-primary'
							: 'w-2.5 bg-border hover:bg-muted-foreground/30'}"
						aria-label="View testimonial {i + 1}"
					></button>
				{/each}
			</div>
		</div>

		<div class="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-8 rounded-3xl border-2 border-border bg-muted/40 p-8 sm:p-12 md:grid-cols-4">
			{#each [
				{ value: '50+', label: 'Partner Venues' },
				{ value: '2,400+', label: 'Courts Available' },
				{ value: '15K+', label: 'Bookings Made' },
				{ value: '98%', label: 'Snipe Success Rate' }
			] as stat}
				<div class="text-center">
					<p class="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-4xl font-extrabold text-transparent sm:text-5xl">{stat.value}</p>
					<p class="mt-2 text-sm font-medium text-muted-foreground">{stat.label}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Pricing -->
<section id="pricing" class="relative border-t border-border bg-muted/40 py-20 sm:py-28">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-2xl text-center">
			<h2 class="text-3xl font-extrabold tracking-tight sm:text-4xl">
				Simple, honest pricing
			</h2>
			<p class="mt-4 text-lg text-muted-foreground">
				Start with Rec Play for free. Go Tournament Ready when you want the full advantage.
			</p>
		</div>
		<div class="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
			<div class="rounded-3xl border-2 border-border bg-background p-8 sm:p-10">
				<h3 class="text-lg font-bold text-muted-foreground">Rec Play</h3>
				<div class="mt-4 flex items-baseline gap-1">
					<span class="text-5xl font-extrabold">&#8369;0</span>
					<span class="text-muted-foreground">/month</span>
				</div>
				<p class="mt-4 text-muted-foreground">Perfect for casual picklers finding their first courts.</p>
				<ul class="mt-8 space-y-4">
					{#each ['Browse all venues & courts', 'Instant booking via GCash or card', '1 active snipe at a time', 'Email notifications', 'Booking history'] as item}
						<li class="flex items-center gap-3">
							<CheckCircle2 class="h-5 w-5 shrink-0 text-primary" />
							<span class="text-sm">{item}</span>
						</li>
					{/each}
				</ul>
				<a
					href="/login"
					class="mt-10 block w-full rounded-2xl border-2 border-border py-3.5 text-center font-bold transition-all hover:border-primary/50 hover:bg-primary/5 active:scale-95"
				>
					Get Started Free
				</a>
			</div>
			<div class="relative rounded-3xl border-2 border-primary bg-background p-8 shadow-xl shadow-primary/10 sm:p-10">
				<div class="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground">
					MOST POPULAR
				</div>
				<h3 class="text-lg font-bold text-primary">Tournament Ready</h3>
				<div class="mt-4 flex items-baseline gap-1">
					<span class="text-5xl font-extrabold">&#8369;299</span>
					<span class="text-muted-foreground">/month</span>
				</div>
				<p class="mt-4 text-muted-foreground">For serious picklers who never want to miss a rally.</p>
				<ul class="mt-8 space-y-4">
					{#each [
						'Everything in Rec Play',
						'Unlimited active snipes',
						'Priority booking speed',
						'Barkada booking & GCash split',
						'Play stats & court analytics',
						'Push notifications',
						'Recurring weekly snipes',
						'Early access to new venues'
					] as item}
						<li class="flex items-center gap-3">
							<CheckCircle2 class="h-5 w-5 shrink-0 text-primary" />
							<span class="text-sm">{item}</span>
						</li>
					{/each}
				</ul>
				<a
					href="/login"
					class="mt-10 block w-full rounded-2xl bg-primary py-3.5 text-center font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 active:scale-95"
				>
					Start Pro Trial
				</a>
			</div>
		</div>
	</div>
</section>

<!-- Venue Partners -->
<section class="border-t border-border py-16 sm:py-20">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<p class="mb-10 text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
			Partnered with top pickleball venues across the Philippines
		</p>
		<div class="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
			{#each partnerVenues as venue}
				<div class="rounded-2xl border-2 border-border bg-muted/40 px-6 py-3 text-sm font-bold text-muted-foreground transition-all hover:border-primary/30 hover:text-foreground sm:px-8 sm:py-4 sm:text-base">
					{venue}
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Final CTA -->
<section class="relative overflow-hidden border-t border-border py-20 sm:py-28">
	<div class="absolute inset-0">
		<div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>
		<div class="animate-float absolute -right-10 top-10 h-64 w-64 rounded-full bg-primary/5 blur-3xl"></div>
		<div class="animate-float-delayed absolute -left-10 bottom-10 h-64 w-64 rounded-full bg-secondary/5 blur-3xl"></div>
	</div>

	<div class="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
		<div class="mb-8 inline-flex items-center gap-2 rounded-full border border-destructive/20 bg-destructive/5 px-4 py-2 text-sm font-semibold text-destructive">
			<span class="relative flex h-2 w-2">
				<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
				<span class="relative inline-flex h-2 w-2 rounded-full bg-destructive"></span>
			</span>
			Courts are filling up right now
		</div>

		<h2 class="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
			Your barkada is already playing.
			<span class="bg-gradient-to-r from-primary via-emerald-400 to-primary bg-clip-text text-transparent">
				Don't get left in the kitchen.
			</span>
		</h2>
		<p class="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
			Join 15,000+ picklers who stopped fighting for courts and started playing more. Find a
			court and book it in under 30 seconds.
		</p>
		<div class="mt-10">
			<a
				href="#"
				onclick={(e) => {
					e.preventDefault();
					window.scrollTo({ top: 0, behavior: 'smooth' });
				}}
				class="group inline-flex items-center gap-2 rounded-2xl bg-primary px-10 py-5 text-lg font-bold text-primary-foreground shadow-xl shadow-primary/25 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/30 active:scale-95"
			>
				Find a Court Now
				<ArrowRight class="h-5 w-5 transition-transform group-hover:translate-x-1" />
			</a>
		</div>
		<div class="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-6">
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<Shield class="h-4 w-4 text-primary" />
				<span>No credit card required</span>
			</div>
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<CheckCircle2 class="h-4 w-4 text-primary" />
				<span>Rec Play free forever</span>
			</div>
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<Zap class="h-4 w-4 text-primary" />
				<span>Pay via GCash in 30 seconds</span>
			</div>
		</div>
	</div>
</section>

<!-- Sticky Mobile CTA -->
{#if showStickyMobileCta && !showBookingFlow}
	<div class="fixed bottom-0 left-0 right-0 z-50 border-t border-primary/20 bg-background/95 px-4 pb-[env(safe-area-inset-bottom,8px)] pt-3 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] backdrop-blur-lg md:hidden">
		<button
			onclick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}
			class="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 active:scale-95 transition-all"
		>
			{#if activeTab === 'venues'}
				<Building2 class="h-4 w-4" />
				{filteredVenues.length} venues near you -- Browse Venues
			{:else}
				<Users class="h-4 w-4" />
				{lookingForGame.length} players looking for games
			{/if}
		</button>
	</div>
{/if}

<!-- Footer -->
<footer class="border-t border-border bg-muted/40">
	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
		<div class="flex flex-col items-center gap-8 md:flex-row md:justify-between">
			<div class="flex items-center gap-2.5">
				<div class="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
					<Target class="h-4 w-4 text-primary-foreground" />
				</div>
				<span class="text-lg font-extrabold tracking-tight">Court Sniper</span>
			</div>
			<nav class="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
				<a href="#features" class="transition-colors hover:text-foreground">Features</a>
				<a href="#pricing" class="transition-colors hover:text-foreground">Pricing</a>
				<a href="#how-it-works" class="transition-colors hover:text-foreground">How It Works</a>
				<a href="/venue" class="transition-colors hover:text-foreground">List Your Venue</a>
				<a href="/login" class="transition-colors hover:text-foreground">Sign In</a>
			</nav>
			<p class="text-sm text-muted-foreground">
				Built by <span class="font-semibold text-foreground">MidCodes</span>
			</p>
		</div>
	</div>
</footer>

<style>
	@keyframes float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-20px);
		}
	}
	@keyframes float-delayed {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-15px);
		}
	}
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	@keyframes fade-in-up {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	@keyframes pulse-slow {
		0%,
		100% {
			box-shadow: 0 10px 25px -5px rgba(34, 197, 94, 0.25);
		}
		50% {
			box-shadow: 0 10px 25px -5px rgba(34, 197, 94, 0.5);
		}
	}
	@keyframes confetti-burst {
		0% {
			transform: rotate(var(--angle)) translateY(0) scale(1);
			opacity: 1;
		}
		100% {
			transform: rotate(var(--angle)) translateY(-120px) scale(0);
			opacity: 0;
		}
	}
	@keyframes success-pop {
		0% {
			transform: scale(0);
			opacity: 0;
		}
		50% {
			transform: scale(1.2);
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}
	:global(.animate-float) {
		animation: float 6s ease-in-out infinite;
	}
	:global(.animate-float-delayed) {
		animation: float-delayed 8s ease-in-out infinite;
	}
	:global(.animate-fade-in) {
		animation: fade-in 0.6s ease-out;
	}
	:global(.animate-fade-in-up) {
		animation: fade-in-up 0.6s ease-out;
	}
	:global(.animate-fade-in-up-delayed) {
		animation: fade-in-up 0.6s ease-out 0.15s both;
	}
	:global(.animate-fade-in-up-delayed-2) {
		animation: fade-in-up 0.6s ease-out 0.3s both;
	}
	:global(.animate-fade-in-up-delayed-3) {
		animation: fade-in-up 0.6s ease-out 0.45s both;
	}
	:global(.animate-pulse-slow) {
		animation: pulse-slow 3s ease-in-out infinite;
	}
	:global(.animate-pulse-slow-delayed) {
		animation: pulse-slow 3s ease-in-out infinite 1s;
	}
	:global(.animate-pulse-slow-delayed-2) {
		animation: pulse-slow 3s ease-in-out infinite 2s;
	}

	.confetti-container {
		position: relative;
		display: inline-block;
	}
	.confetti-piece {
		position: absolute;
		width: 8px;
		height: 8px;
		background: var(--color);
		border-radius: 2px;
		left: 50%;
		top: 50%;
		animation: confetti-burst 0.8s ease-out var(--delay) both;
	}
	.success-check {
		animation: success-pop 0.5s ease-out both;
	}

	@keyframes radius-pulse {
		0%, 100% {
			opacity: 0.6;
			transform: scale(1);
		}
		50% {
			opacity: 0.3;
			transform: scale(1.05);
		}
	}
	.radius-pulse {
		animation: radius-pulse 3s ease-in-out infinite;
	}

	/* Hide scrollbar for tab overflow */
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>
