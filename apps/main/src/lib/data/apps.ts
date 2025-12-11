export interface App {
	id: string;
	name: string;
	displayName: string;
	version: string;
	description: string;
	category: 'core' | 'document' | 'utility';
	techStack: string[];
	features: string[];
	status: 'active' | 'minimal' | 'development';
	complexity: 'low' | 'medium' | 'high';
	path: string;
	packageName: string;
}

export const apps: App[] = [
	{
		id: 'dorm',
		name: 'Dorm',
		displayName: 'Dorm Management System',
		version: '0.0.1',
		description: 'Comprehensive dormitory management system with role-based authentication, caching, and performance optimizations.',
		category: 'core',
		techStack: ['SvelteKit', 'Supabase', 'Tailwind CSS', 'TypeScript', 'Three.js', 'Threlte'],
		features: [
			'Role-based authentication',
			'Comprehensive caching system',
			'Profile picture management',
			'Security deposit tracking',
			'Optimized performance with HMR',
			'PostgreSQL database with complex schema'
		],
		status: 'active',
		complexity: 'high',
		path: '/apps/dorm',
		packageName: 'dorm'
	},
	{
		id: 'events',
		name: 'Events',
		displayName: 'Event Management Platform',
		version: '2',
		description: 'Event management platform with 3D visualizations and QR code integration.',
		category: 'core',
		techStack: ['SvelteKit', 'Supabase', 'Tailwind CSS', 'Three.js', 'HTML5 QRCode'],
		features: [
			'Event creation and management',
			'3D visualizations with Three.js',
			'QR code integration',
			'Date management with internationalized dates',
			'File compression with JSZip'
		],
		status: 'active',
		complexity: 'medium',
		path: '/apps/events',
		packageName: 'events'
	},
	{
		id: 'id-gen',
		name: 'ID Generator',
		displayName: 'Professional ID Card Generator',
		version: '2',
		description: 'Professional ID card generation system with advanced UI components and multi-font support.',
		category: 'core',
		techStack: ['SvelteKit', 'Supabase', 'Tailwind CSS', 'TanStack Table', 'Formsnap', 'CMDK'],
		features: [
			'Command palette interface (cmdk-sv)',
			'Multi-font support (Lato, Montserrat, Open Sans, Roboto)',
			'Advanced table controls with TanStack',
			'Form handling with Formsnap',
			'Toast notifications with Svelte Sonner',
			'Professional ID card templates'
		],
		status: 'active',
		complexity: 'high',
		path: '/apps/id-gen',
		packageName: 'id-gen'
	},
	{
		id: 'marchoffaith',
		name: 'March of Faith Inc',
		displayName: 'March of Faith Inc Website',
		version: '0.0.1',
		description: 'Organization/corporate website with 3D elements and animations.',
		category: 'core',
		techStack: ['SvelteKit', 'Supabase', 'Tailwind CSS', 'Three.js', 'Threlte'],
		features: [
			'Corporate presentation',
			'3D elements and animations',
			'Content management',
			'Professional corporate design'
		],
		status: 'active',
		complexity: 'medium',
		path: '/apps/marchoffaith',
		packageName: 'marchoffaithinc'
	},
	{
		id: 'ubytes',
		name: 'UBytes Project',
		displayName: 'Data Visualization & Analytics',
		version: '1.0.0',
		description: 'Advanced data visualization and analytics platform with comprehensive charting capabilities.',
		category: 'core',
		techStack: ['SvelteKit', 'Supabase', 'Chart.js', 'Recharts', 'Fuse.js', 'CMDK'],
		features: [
			'Advanced data visualization',
			'Search and filtering with Fuse.js',
			'Command interface with cmdk-sv',
			'Authentication with Supabase',
			'Toast notifications',
			'Multiple charting libraries integration'
		],
		status: 'active',
		complexity: 'high',
		path: '/apps/ubytes-project',
		packageName: 'ubytes-project'
	},
	{
		id: 'schooldocs',
		name: 'School Docs',
		displayName: 'Academic Document Management',
		version: '0.0.1',
		description: 'Academic document management system for transcripts and records with data visualization.',
		category: 'document',
		techStack: ['SvelteKit', 'Supabase', 'ECharts', 'Class Variance Authority'],
		features: [
			'Document processing and management',
			'Data visualization with ECharts',
			'Clean minimal interface',
			'Academic record tracking'
		],
		status: 'active',
		complexity: 'medium',
		path: '/apps/schooldocs',
		packageName: 'transripts'
	},
	{
		id: 'sideprojects',
		name: 'Side Projects',
		displayName: 'Project Portfolio Showcase',
		version: '1.0.0',
		description: 'Portfolio website to showcase side projects with markdown-based content.',
		category: 'document',
		techStack: ['SvelteKit', 'MDSvex', 'Tailwind CSS', 'Lucide Icons'],
		features: [
			'Markdown-based content with MDSvex',
			'Portfolio presentation',
			'Clean, minimal design',
			'Project documentation'
		],
		status: 'active',
		complexity: 'low',
		path: '/apps/sideprojects',
		packageName: 'sideprojects'
	},
	{
		id: 'dokmutya',
		name: 'Dokmutya',
		displayName: 'Simple Documentation App',
		version: '1.0.0',
		description: 'Lightweight documentation and content management application.',
		category: 'utility',
		techStack: ['SvelteKit', 'Tailwind CSS', 'Lucide Icons', 'Svelte Preprocess'],
		features: [
			'Lightweight design',
			'Icon integration with Lucide',
			'Quick documentation',
			'Simple content management'
		],
		status: 'active',
		complexity: 'low',
		path: '/apps/dokmutya',
		packageName: 'dokmutya'
	},
	{
		id: 'travel',
		name: 'Travel',
		displayName: 'Cabilao Travel Website',
		version: '0.5.0',
		description: 'Travel website with markdown content and interactive animations.',
		category: 'utility',
		techStack: ['SvelteKit', 'MDSvex', 'Tailwind CSS', 'Neoconfetti'],
		features: [
			'Travel content management',
			'Markdown support',
			'Interactive animations with Neoconfetti',
			'Tourism information'
		],
		status: 'active',
		complexity: 'low',
		path: '/apps/travel',
		packageName: 'cabilao-travel'
	},
	{
		id: 'web',
		name: 'Web',
		displayName: 'Basic Web Application',
		version: '1.0.0',
		description: 'Basic web application with minimal structure - development in progress.',
		category: 'utility',
		techStack: ['TBD'],
		features: ['Basic structure only'],
		status: 'minimal',
		complexity: 'low',
		path: '/apps/web',
		packageName: 'web'
	}
];