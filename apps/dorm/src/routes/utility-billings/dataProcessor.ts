// Data processing function for utility billings
export function processUtilityBillingsData(
	properties: any[],
	meters: any[],
	readings: any[],
	billings: any[],
	availableReadingDates: any[],
	tenantCounts: any[],
	leasesData: any[],
	allReadings: any[]
) {
	console.log('Processing utility billings data...');

	// Get meter data separately since there's no foreign key relationship
	const meterIds = [...new Set(readings?.map((r) => r.meter_id) || [])];

	// Create a map of meter data for easy lookup
	const meterMap = new Map(meters?.map((m) => [m.id, m]) || []);

	// Join readings with meter data
	const readingsWithMeters =
		readings?.map((reading) => ({
			...reading,
			meters: meterMap.get(reading.meter_id) || null
		})) || [];

	// Group by meter_id
	const grouped = readingsWithMeters.reduce(
		(acc, r) => {
			acc[r.meter_id] = [...(acc[r.meter_id] || []), r];
			return acc;
		},
		{} as Record<number, typeof readingsWithMeters>
	);

	// Create a map of the LAST billing date for each meter
	const meterLastBilledDates: Record<string, string> = {};
	billings?.forEach((b) => {
		const key = String(b.meter_id);
		// Ensure we are always storing the most recent billing date
		if (!meterLastBilledDates[key] || b.billing_date > meterLastBilledDates[key]) {
			meterLastBilledDates[key] = b.billing_date;
		}
	});

	// IMPLEMENT THE NEW MONTHLY BILLING PERIOD LOGIC
	const displayedReadings = [];

	console.log('Processing billing periods for meters:', Object.keys(grouped));
	console.log('Meter last billed dates:', meterLastBilledDates);

	// Process each meter's readings
	for (const [meterId, meterReadings] of Object.entries(grouped)) {
		// Filter out unapproved readings from consolidated data
		// Only include readings that are explicitly approved or have no review status (legacy data)
		const approvedReadings = (meterReadings as any[]).filter(
			(r: any) => r.review_status === 'APPROVED' || r.review_status === null || r.review_status === undefined
		);

		const sorted = approvedReadings.sort(
			(a: any, b: any) => new Date(a.reading_date).getTime() - new Date(b.reading_date).getTime()
		);

		console.log(`Processing meter ${meterId} with new monthly logic:`, {
			totalReadings: sorted.length,
			readingDates: sorted.map((r: any) => r.reading_date),
			lastBilledDate: meterLastBilledDates[meterId]
		});

		// 1. Group all readings by month (e.g., "2024-08", "2024-09")
		const readingsByMonth = sorted.reduce(
			(acc: any, reading: any) => {
				const monthKey = reading.reading_date.slice(0, 7); // "YYYY-MM"
				if (!acc[monthKey]) {
					acc[monthKey] = [];
				}
				acc[monthKey].push(reading);
				return acc;
			},
			{} as Record<string, typeof sorted>
		);

		console.log(`Meter ${meterId} readings by month:`, Object.keys(readingsByMonth));

		// 2. Get a sorted list of the months that have readings
		const sortedMonths = Object.keys(readingsByMonth).sort();

		// 3. Iterate through the months to create billing periods
		for (let i = 1; i < sortedMonths.length; i++) {
			const currentMonthKey = sortedMonths[i];
			const previousMonthKey = sortedMonths[i - 1];

			// Get the last reading from the previous month
			const prevMonthReadings = readingsByMonth[previousMonthKey];
			const prev = prevMonthReadings[prevMonthReadings.length - 1];

			// Get the last reading from the current month
			const currentMonthReadings = readingsByMonth[currentMonthKey];
			const curr = currentMonthReadings[currentMonthReadings.length - 1];

			// This check is to ensure we have both readings to compare
			if (prev && curr) {
				const daysDiff =
					(new Date(curr.reading_date).getTime() - new Date(prev.reading_date).getTime()) /
					(1000 * 60 * 60 * 24);
				const consumption = curr.reading - prev.reading;
				const cost = consumption * (curr.rate_at_reading || 0);

				displayedReadings.push({
					...curr,
					previous_reading: prev.reading, // Calculated from window function, not stored in DB
					previous_reading_date: prev.reading_date,
					consumption,
					cost,
					days_diff: Math.round(daysDiff),
					// The period is now the current month's key
					period: currentMonthKey
				});

				console.log(
					`✅ Generated period for ${currentMonthKey}. From ${prev.reading_date} to ${curr.reading_date} (${Math.round(daysDiff)} days).`
				);
			}
		}

		// Fallback: if only one approved reading exists, show it without consumption
		if (sorted.length === 1) {
			const r = sorted[0];
			// Double-check that this single reading is approved or has no review status (legacy data)
			if (r.review_status === 'APPROVED' || r.review_status === null || r.review_status === undefined) {
				displayedReadings.push({
					...r,
					previous_reading: null,
					consumption: null,
					cost: null,
					days_diff: null,
					period: r.reading_date.slice(0, 7)
				});
				console.log(`📝 Single approved reading fallback for meter ${meterId}`);
			} else {
				console.log(`⚠️ Skipping unapproved single reading for meter ${meterId}`);
			}
		}
	}

	console.log(`Total billing periods found: ${displayedReadings.length}`);

	// Process tenant counts
	const rental_unitTenantCounts = tenantCounts.reduce(
		(acc, lease) => {
			if (!lease.rental_unit_id) return acc;
			acc[lease.rental_unit_id] = lease.tenants?.length || 0;
			return acc;
		},
		{} as Record<number, number>
	);

	// Get unique reading dates (ensure they are Date objects for comparison)
	const uniqueDates = [...new Set(availableReadingDates?.map((d) => d.reading_date))].sort();

	console.log('Final data payload:', {
		propertiesCount: properties?.length || 0,
		metersCount: meters?.length || 0,
		readingsCount: displayedReadings.length || 0,
		readingDatesCount: uniqueDates.length || 0,
		sampleProperties: properties?.slice(0, 3) || []
	});

	// Process leases data
	const leases = leasesData?.map((lease) => ({
		...lease,
		tenants: lease.lease_tenants
			.filter((lt: any) => lt.tenants !== null)
			.map((lt: any) => lt.tenants),
		roomName: lease.rental_unit
			? `${(lease.rental_unit as any).name} (${(lease.rental_unit as any).type})`
			: 'Unknown Room'
	}));

	// Get last billed date for each lease-meter combination with more accurate tracking
	const leaseMeterBilledDates: Record<string, string> = {};
	const meterBilledDates: Record<string, string[]> = {}; // Track all billing dates per meter

	if (billings) {
		for (const billing of billings) {
			if (billing.meter_id && billing.lease_id) {
				const key = `${billing.meter_id}-${billing.lease_id}`;
				const newDate = billing.billing_date;

				if (
					!leaseMeterBilledDates[key] ||
					new Date(newDate) > new Date(leaseMeterBilledDates[key])
				) {
					leaseMeterBilledDates[key] = newDate;
				}

				// Track all billing dates for each meter
				const meterKey = String(billing.meter_id);
				if (!meterBilledDates[meterKey]) {
					meterBilledDates[meterKey] = [];
				}
				meterBilledDates[meterKey].push(newDate);
			}
		}
	}

	// Update meterLastBilledDates to only show dates where bills were actually created
	// This will be used to show "✓ Billed" indicator in the UI
	const actualBilledDates: Record<string, string[]> = {};
	for (const [meterKey, dates] of Object.entries(meterBilledDates)) {
		actualBilledDates[meterKey] = [...new Set(dates)].sort();
	}

	// Group readings by month instead of individual dates
	const readingGroups = (allReadings || []).reduce(
		(acc, reading) => {
			const date = new Date(reading.reading_date);
			const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // "2025-06"

			if (!acc[monthKey]) {
				acc[monthKey] = [];
			}
			acc[monthKey].push(reading);
			return acc;
		},
		{} as Record<string, any[]>
	);

	const previousReadingGroups = Object.entries(readingGroups)
		.map(([monthKey, readings]) => ({
			date: monthKey, // Use month key as date
			readings,
			monthName: new Date(monthKey + '-01').toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long'
			}) // "June 2025"
		}))
		.sort((a, b) => new Date(b.date + '-01').getTime() - new Date(a.date + '-01').getTime());

	// Return all the data needed for the page
	return {
		properties,
		meters,
		readings: displayedReadings, // Use the new grouped readings (only approved)
		allReadings, // Include ALL readings for pending review functionality
		availableReadingDates: uniqueDates,
		rental_unitTenantCounts,
		leases,
		meterLastBilledDates,
		leaseMeterBilledDates,
		actualBilledDates, // Add actual billed dates for accurate tracking
		previousReadingGroups
	};
}
