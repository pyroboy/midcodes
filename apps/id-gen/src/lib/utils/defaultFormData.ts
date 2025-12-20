/**
 * Default Form Data Generator
 *
 * Generates human-readable sample values from template element variable names.
 * Used to populate sample/preview variants of templates.
 */

import type { TemplateElement } from '$lib/stores/templateStore';

/**
 * Common variable name mappings to realistic sample values
 */
const KNOWN_MAPPINGS: Record<string, string> = {
	// Personal info
	firstname: 'John',
	first_name: 'John',
	lastName: 'Doe',
	lastname: 'Doe',
	last_name: 'Doe',
	fullname: 'John Doe',
	full_name: 'John Doe',
	name: 'John Doe',
	middlename: 'Michael',
	middle_name: 'Michael',
	suffix: 'Jr.',
	prefix: 'Mr.',
	nickname: 'Johnny',

	// Contact
	email: 'john.doe@example.com',
	phone: '+1 (555) 123-4567',
	phonenumber: '+1 (555) 123-4567',
	phone_number: '+1 (555) 123-4567',
	mobile: '+1 (555) 987-6543',
	address: '123 Main Street',
	city: 'New York',
	state: 'NY',
	zip: '10001',
	zipcode: '10001',
	zip_code: '10001',
	country: 'United States',

	// Employment
	employeeid: 'EMP-12345',
	employee_id: 'EMP-12345',
	employeenumber: 'EMP-12345',
	employee_number: 'EMP-12345',
	department: 'Engineering',
	position: 'Software Developer',
	title: 'Senior Engineer',
	jobtitle: 'Senior Engineer',
	job_title: 'Senior Engineer',
	role: 'Team Lead',
	team: 'Product Development',
	division: 'Technology',
	company: 'Acme Corporation',
	companyname: 'Acme Corporation',
	company_name: 'Acme Corporation',
	office: 'Building A, Floor 3',
	manager: 'Jane Smith',
	supervisor: 'Jane Smith',

	// ID/Credentials
	id: 'ID-2024-001',
	idnumber: 'ID-2024-001',
	id_number: 'ID-2024-001',
	cardnumber: 'CARD-78901',
	card_number: 'CARD-78901',
	badge: 'BADGE-456',
	badgenumber: 'BADGE-456',
	badge_number: 'BADGE-456',
	memberid: 'MEM-789',
	member_id: 'MEM-789',
	studentid: 'STU-2024-123',
	student_id: 'STU-2024-123',
	ssn: '***-**-1234',
	license: 'DL-987654321',
	licensenumber: 'DL-987654321',
	license_number: 'DL-987654321',

	// Dates
	date: '2024-01-15',
	issuedate: 'January 15, 2024',
	issue_date: 'January 15, 2024',
	expirydate: 'January 15, 2026',
	expiry_date: 'January 15, 2026',
	expirationdate: 'January 15, 2026',
	expiration_date: 'January 15, 2026',
	validuntil: 'January 15, 2026',
	valid_until: 'January 15, 2026',
	birthdate: 'March 20, 1990',
	birth_date: 'March 20, 1990',
	dob: '03/20/1990',
	hiredate: 'June 1, 2020',
	hire_date: 'June 1, 2020',
	startdate: 'June 1, 2020',
	start_date: 'June 1, 2020',

	// Education
	school: 'State University',
	university: 'State University',
	college: 'College of Engineering',
	degree: 'Bachelor of Science',
	major: 'Computer Science',
	minor: 'Mathematics',
	graduationyear: '2024',
	graduation_year: '2024',
	gpa: '3.75',
	class: 'Class of 2024',
	course: 'Software Engineering',
	grade: 'A',
	level: 'Senior',

	// Medical/Emergency
	bloodtype: 'O+',
	blood_type: 'O+',
	allergies: 'None',
	emergencycontact: 'Jane Doe',
	emergency_contact: 'Jane Doe',
	emergencyphone: '+1 (555) 111-2222',
	emergency_phone: '+1 (555) 111-2222',
	medicalconditions: 'None',
	medical_conditions: 'None',

	// Misc
	notes: 'Additional information',
	comments: 'No special requirements',
	description: 'Standard access level',
	status: 'Active',
	type: 'Full-time',
	category: 'Employee',
	accesslevel: 'Level 3',
	access_level: 'Level 3',
	clearance: 'Confidential',
	barcode: '1234567890',
	qrcode: 'https://example.com/verify/12345',
	qr_code: 'https://example.com/verify/12345',
	website: 'www.example.com',
	url: 'https://example.com'
};

/**
 * Convert camelCase or snake_case to Title Case for display
 */
function formatVariableName(name: string): string {
	// Handle snake_case
	let formatted = name.replace(/_/g, ' ');

	// Handle camelCase - insert space before capital letters
	formatted = formatted.replace(/([a-z])([A-Z])/g, '$1 $2');

	// Title case each word
	return formatted
		.split(' ')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');
}

/**
 * Get sample value for a single variable name
 */
export function getSampleValue(variableName: string): string {
	// Check known mappings (case-insensitive)
	const lowerName = variableName.toLowerCase();
	if (KNOWN_MAPPINGS[lowerName]) {
		return KNOWN_MAPPINGS[lowerName];
	}

	// Fallback: format the variable name as a readable placeholder
	return formatVariableName(variableName);
}

/**
 * Generate sample form data for all template elements
 */
export function generateSampleFormData(elements: TemplateElement[]): Record<string, string> {
	const formData: Record<string, string> = {};

	for (const element of elements) {
		// Only generate data for elements that have variable names
		if (!element.variableName) continue;

		// Skip elements that don't need text data (like photos/signatures)
		if (element.type === 'photo' || element.type === 'signature') {
			// These use placeholder images, not text
			continue;
		}

		// For selection elements, use the first option or default
		if (element.type === 'selection') {
			formData[element.variableName] = element.options?.[0] || 'Option 1';
			continue;
		}

		// For text, qr, image elements - generate sample value
		formData[element.variableName] = getSampleValue(element.variableName);
	}

	return formData;
}

/**
 * Generate placeholder labels for elements (used in blank variants)
 * Returns the placeholder text to show in element boxes
 */
export function getPlaceholderLabel(element: TemplateElement): string {
	switch (element.type) {
		case 'photo':
			return 'Photo';
		case 'signature':
			return 'Signature';
		case 'qr':
			return 'QR Code';
		case 'selection':
			return 'Selection';
		case 'image':
		case 'graphic':
			return 'Image';
		case 'text':
		default:
			return formatVariableName(element.variableName);
	}
}
