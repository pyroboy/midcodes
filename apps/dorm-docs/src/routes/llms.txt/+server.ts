import type { RequestHandler } from './$types';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Import JSON data
import electricityData from '$lib/data/electricity.json';
import waterData from '$lib/data/water.json';
import populationData from '$lib/data/population.json';
import contractsData from '$lib/data/contracts.json';
import revenueData from '$lib/data/revenue.json';
import rentsData from '$lib/data/rents.json';
import monthlyData from '$lib/data/monthly.json';
import projectsData from '$lib/data/projects.json';

export const GET: RequestHandler = async () => {
	// Generate Business Plan Content
	const docsPath = join(process.cwd(), 'src', 'routes', 'docs', 'business-plan');
	let businessPlanContent = '';

	try {
		const entries = readdirSync(docsPath);
		// Filter for directories that start with a number (canonical chapters)
		const chapters = entries.filter(entry => {
			const fullPath = join(docsPath, entry);
			return statSync(fullPath).isDirectory() && /^\d{2}-/.test(entry);
		}).sort();

		for (const chapter of chapters) {
			const pagePath = join(docsPath, chapter, '+page.svelte');
			try {
				let content = readFileSync(pagePath, 'utf-8');
				
				// Strip Svelte/HTML specific tags that aren't content
				content = content.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
				content = content.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '');
				content = content.replace(/<svelte:head[\s\S]*?>[\s\S]*?<\/svelte:head>/gi, '');
				
				// Replace block-level closing tags with newlines to ensure separation
				content = content.replace(/<\/(div|p|h\d|li|tr|ul|ol|table|section|article|header)>/gi, '\n');
				
				// Replace <br> with newline
				content = content.replace(/<br\s*\/?>/gi, '\n');

				// Strip all remaining HTML tags
				content = content.replace(/<[^>]+>/g, '');
				
				// Decode basics (optional, but helps readability)
				content = content.replace(/&nbsp;/g, ' ');
				content = content.replace(/&amp;/g, '&');
				content = content.replace(/&lt;/g, '<');
				content = content.replace(/&gt;/g, '>');

				// Clean extra whitespace (collapse multiple newlines)
				content = content.replace(/\n\s*\n/g, '\n\n').trim();

				businessPlanContent += `\n\n## Chapter: ${chapter}\n\n${content}`;
			} catch (err) {
				console.warn(`Could not read chapter ${chapter}:`, err);
			}
		}
	} catch (err) {
		console.error('Error scanning docs directory:', err);
		businessPlanContent = 'Error loading documentation content.';
	}

	const content = `# Dorm-Docs

> Dormitory Management Knowledge Base & Reports Hub

Dorm-Docs is a documentation and reporting application for dormitory/boarding house management. It provides structured documentation for business planning and data-driven reports for operations.

## Business Plan Documentation

The business plan is organized into multiple chapters. Below is the full content of the documentation:

${businessPlanContent}

## Data Reports

The application provides 8 types of data-driven reports based on the dormitory management database schema.
Below is the actual JSON data used to generate these reports.

### Utility Reports

#### Electricity Report Data
\`\`\`json
${JSON.stringify(electricityData, null, 2)}
\`\`\`

#### Water Report Data
\`\`\`json
${JSON.stringify(waterData, null, 2)}
\`\`\`

### Tenant Reports

#### Population Report Data
\`\`\`json
${JSON.stringify(populationData, null, 2)}
\`\`\`

#### Contracts Report Data
\`\`\`json
${JSON.stringify(contractsData, null, 2)}
\`\`\`

### Financial Reports

#### Revenue Report Data
\`\`\`json
${JSON.stringify(revenueData, null, 2)}
\`\`\`

#### Rents Report Data
\`\`\`json
${JSON.stringify(rentsData, null, 2)}
\`\`\`

#### Monthly Report Data
\`\`\`json
${JSON.stringify(monthlyData, null, 2)}
\`\`\`

### Project Reports

#### Projects Report Data
\`\`\`json
${JSON.stringify(projectsData, null, 2)}
\`\`\`

## Data Types

Reports are backed by TypeScript interfaces derived from the PostgreSQL database schema:

### Enums
- UtilityType: ELECTRICITY, WATER, INTERNET
- PaymentStatus: PENDING, PARTIAL, PAID, OVERDUE, PENALIZED
- PaymentMethod: CASH, BANK, GCASH, OTHER, SECURITY_DEPOSIT
- LeaseStatus: ACTIVE, INACTIVE, EXPIRED, TERMINATED, PENDING, ARCHIVED
- TenantStatus: ACTIVE, INACTIVE, PENDING, BLACKLISTED
- BillingType: RENT, UTILITY, PENALTY, MAINTENANCE, SERVICE, SECURITY_DEPOSIT

### Key Entities
- Meters - Utility meter registration (electricity/water)
- Readings - Meter reading records with consumption calculations
- Tenants - Tenant information and status
- Leases - Lease agreements with terms and amounts
- Billings - All billing records (rent, utilities, penalties)
- Payments - Payment transactions with method and allocation
- Projects - Capital and maintenance project tracking

## Technology Stack

- **Framework**: SvelteKit 2.x with Svelte 5
- **Language**: TypeScript
- **Styling**: CSS with CSS Variables
- **Design**: Brutalist-inspired, clean documentation style

## Optional

This documentation is designed for AI consumption.

---

Generated by Dorm-Docs Knowledge Base
`;

	return new Response(content, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8'
		}
	});
};
