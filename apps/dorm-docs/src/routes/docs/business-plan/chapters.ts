export interface Chapter {
	number: string;
	title: string;
	slug: string;
}

export const chapters: Chapter[] = [
	{ number: '01', title: 'Executive Summary', slug: '01-executive-summary' },
	{ number: '02', title: 'Company Profile', slug: '02-company-profile' },
	{ number: '03', title: 'Property Overview', slug: '03-property-overview' },
	{ number: '04', title: 'Market Analysis', slug: '04-market-analysis' },
	{ number: '05', title: 'Services & Amenities', slug: '05-services-amenities' },
	{ number: '06', title: 'Operations', slug: '06-operations' },
	{ number: '07', title: 'Organization', slug: '07-organization' },
	{ number: '08', title: 'Financials', slug: '08-financials' },
	{ number: '09', title: 'Marketing', slug: '09-marketing' },
	{ number: '10', title: 'Risk Management', slug: '10-risk-management' },
	{ number: '11', title: 'Growth Strategy', slug: '11-growth-strategy' },
	{ number: '12', title: 'Appendices', slug: '12-appendices' },
	{ number: '13', title: 'Printable Logs', slug: '13-printable-logs' },
	{ number: '14', title: 'Inventory & Assets', slug: '14-inventory-assets' },
	{ number: '15', title: 'Daily Checklists', slug: '15-daily-checklists' },
	{ number: '16', title: 'Contingency & Emergency', slug: '16-contingency-emergency' },
	{ number: '17', title: 'Complaint Handling', slug: '17-complaint-handling' }
];
