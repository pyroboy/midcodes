<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import PublicHeader from '$lib/components/PublicHeader.svelte';
	import PublicFooter from '$lib/components/PublicFooter.svelte';
	import { 
		Palette, 
		Users, 
		Zap, 
		Shield, 
		Smartphone, 
		Download,
		Eye,
		CreditCard,
		Building2,
		GraduationCap,
		Ticket,
		Heart,
		Star,
		ArrowRight,
		Check,
		Sparkles,
		Target,
		Globe
	} from 'lucide-svelte';

	const features = [
		{
			icon: Palette,
			title: 'Advanced Template Designer',
			description: 'Drag-and-drop interface with real-time 3D preview. Create professional ID cards with text, images, QR codes, and custom backgrounds.',
			highlight: 'Visual Editor',
			demo: true
		},
		{
			icon: Users,
			title: 'Organization Management',
			description: 'Multi-tenant platform with role-based access control. Perfect for schools, corporations, and organizations of any size.',
			highlight: 'Multi-Tenant',
			demo: false
		},
		{
			icon: Zap,
			title: 'Batch Processing',
			description: 'Generate hundreds of ID cards from CSV data. Bulk operations with progress tracking and ZIP export functionality.',
			highlight: 'Bulk Generation',
			demo: true
		},
		{
			icon: Shield,
			title: 'Enterprise Security',
			description: 'Supabase authentication, row-level security, and admin audit trails. Bank-level security for your sensitive data.',
			highlight: 'Secure',
			demo: false
		},
		{
			icon: Smartphone,
			title: 'Mobile-First Design',
			description: 'Fully responsive interface works perfectly on desktop, tablet, and mobile. Touch-optimized controls and PWA support.',
			highlight: 'Responsive',
			demo: true
		},
		{
			icon: CreditCard,
			title: 'Integrated Payments',
			description: 'Credit-based system with PayMongo integration. Flexible packages and transparent pricing for all usage levels.',
			highlight: 'Pay-as-you-go',
			demo: false
		}
	];

	const useCases = [
		{
			icon: Building2,
			title: 'Corporate Organizations',
			description: 'Employee badges, visitor passes, and access control cards',
			stats: '500+ companies',
			color: 'bg-blue-50 text-blue-700'
		},
		{
			icon: GraduationCap,
			title: 'Educational Institutions',
			description: 'Student IDs, faculty cards, and library access systems',
			stats: '200+ schools',
			color: 'bg-green-50 text-green-700'
		},
		{
			icon: Ticket,
			title: 'Events & Conferences',
			description: 'Attendee badges, speaker cards, and sponsor recognition',
			stats: '1000+ events',
			color: 'bg-purple-50 text-purple-700'
		},
		{
			icon: Heart,
			title: 'Membership Organizations',
			description: 'Club cards, gym memberships, and loyalty programs',
			stats: '300+ organizations',
			color: 'bg-pink-50 text-pink-700'
		}
	];

	const testimonials = [
		{
			quote: "ID-Gen transformed our student card production from a week-long process to just a few hours. The quality is exceptional.",
			author: "Maria Santos",
			role: "Registrar",
			organization: "University of Technology",
			rating: 5
		},
		{
			quote: "The batch processing feature saved us countless hours during new employee onboarding. Professional results every time.",
			author: "John Rivera",
			role: "HR Manager", 
			organization: "Global Tech Corp",
			rating: 5
		},
		{
			quote: "Event badge creation used to be a nightmare. ID-Gen makes it simple and the 3D preview is incredibly helpful.",
			author: "Ana Cruz",
			role: "Event Coordinator",
			organization: "Premier Events",
			rating: 5
		}
	];

	const pricingFeatures = [
		'Unlimited templates',
		'Batch processing',
		'High-resolution output (300 DPI)',
		'Multi-format export (PDF, PNG, JPEG)',
		'Organization management',
		'Role-based access control',
		'Priority support',
		'API access'
	];
</script>

<svelte:head>
	<title>Features - ID-Gen | Professional ID Card Generation Platform</title>
	<meta name="description" content="Discover ID-Gen's powerful features: drag-and-drop template designer, batch processing, enterprise security, and more. Perfect for organizations of all sizes." />
	<meta property="og:title" content="ID-Gen Features - Professional ID Card Generation" />
	<meta property="og:description" content="Create professional ID cards with our advanced template designer, batch processing, and enterprise-grade security features." />
</svelte:head>

<PublicHeader />

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
	<!-- Hero Section -->
	<section class="relative overflow-hidden px-6 py-24 sm:py-32 lg:px-8">
		<div class="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.blue.100),white)] opacity-20"></div>
		<div class="mx-auto max-w-4xl text-center">
			<div class="mb-8 flex justify-center">
				<Badge variant="secondary" class="px-4 py-2 text-sm font-semibold">
					<Sparkles class="mr-2 h-4 w-4" />
					Professional ID Card Generation
				</Badge>
			</div>
			<h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
				Create Professional
				<span class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
					ID Cards
				</span>
				in Minutes
			</h1>
			<p class="mt-6 text-lg leading-8 text-gray-600 sm:text-xl">
				Advanced template designer, batch processing, and enterprise security. 
				Trusted by 1000+ organizations worldwide for professional identification solutions.
			</p>
			<div class="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
				<Button size="lg" class="px-8 py-3 text-lg" href="/auth">
					Start Free Trial
					<ArrowRight class="ml-2 h-5 w-5" />
				</Button>
				<Button variant="outline" size="lg" class="px-8 py-3 text-lg" href="/templates">
					<Eye class="mr-2 h-5 w-5" />
					View Demo
				</Button>
			</div>
			<p class="mt-4 text-sm text-gray-500">
				No credit card required • 30-day free trial • Cancel anytime
			</p>
		</div>
	</section>

	<!-- Stats Section -->
	<section class="py-16 bg-white">
		<div class="mx-auto max-w-7xl px-6 lg:px-8">
			<div class="grid grid-cols-2 gap-8 md:grid-cols-4">
				<div class="text-center">
					<div class="text-3xl font-bold text-blue-600">1000+</div>
					<div class="text-sm text-gray-600">Organizations</div>
				</div>
				<div class="text-center">
					<div class="text-3xl font-bold text-green-600">500K+</div>
					<div class="text-sm text-gray-600">Cards Generated</div>
				</div>
				<div class="text-center">
					<div class="text-3xl font-bold text-purple-600">99.9%</div>
					<div class="text-sm text-gray-600">Uptime</div>
				</div>
				<div class="text-center">
					<div class="text-3xl font-bold text-pink-600">4.9★</div>
					<div class="text-sm text-gray-600">User Rating</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section class="py-24 bg-gray-50">
		<div class="mx-auto max-w-7xl px-6 lg:px-8">
			<div class="mx-auto max-w-2xl text-center">
				<h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
					Powerful Features Built for Professionals
				</h2>
				<p class="mt-6 text-lg leading-8 text-gray-600">
					Everything you need to create, manage, and distribute professional ID cards at scale.
				</p>
			</div>
			<div class="mx-auto mt-16 max-w-6xl">
				<div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
					{#each features as feature}
						<Card class="relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
							<CardHeader>
								<div class="flex items-center justify-between">
									<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
										<feature.icon class="h-6 w-6 text-white" />
									</div>
									{#if feature.demo}
										<Badge variant="secondary" class="text-xs">
											<Target class="mr-1 h-3 w-3" />
											Demo Available
										</Badge>
									{/if}
								</div>
								<CardTitle class="text-xl">{feature.title}</CardTitle>
								<Badge variant="outline" class="w-fit text-xs">
									{feature.highlight}
								</Badge>
							</CardHeader>
							<CardContent>
								<CardDescription class="text-base leading-relaxed">
									{feature.description}
								</CardDescription>
							</CardContent>
						</Card>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<!-- Use Cases Section -->
	<section class="py-24 bg-white">
		<div class="mx-auto max-w-7xl px-6 lg:px-8">
			<div class="mx-auto max-w-2xl text-center">
				<h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
					Perfect for Any Organization
				</h2>
				<p class="mt-6 text-lg leading-8 text-gray-600">
					From startups to enterprises, educational institutions to event organizers.
				</p>
			</div>
			<div class="mx-auto mt-16 max-w-6xl">
				<div class="grid gap-8 md:grid-cols-2">
					{#each useCases as useCase}
						<Card class="relative overflow-hidden">
							<CardHeader>
								<div class="flex items-center space-x-4">
									<div class="flex h-12 w-12 items-center justify-center rounded-lg {useCase.color}">
										<useCase.icon class="h-6 w-6" />
									</div>
									<div>
										<CardTitle class="text-xl">{useCase.title}</CardTitle>
										<Badge variant="secondary" class="mt-1 text-xs">
											{useCase.stats}
										</Badge>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<CardDescription class="text-base">
									{useCase.description}
								</CardDescription>
							</CardContent>
						</Card>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<!-- Testimonials Section -->
	<section class="py-24 bg-gray-50">
		<div class="mx-auto max-w-7xl px-6 lg:px-8">
			<div class="mx-auto max-w-2xl text-center">
				<h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
					Loved by Organizations Worldwide
				</h2>
				<p class="mt-6 text-lg leading-8 text-gray-600">
					See what our customers say about their ID-Gen experience.
				</p>
			</div>
			<div class="mx-auto mt-16 max-w-6xl">
				<div class="grid gap-8 md:grid-cols-3">
					{#each testimonials as testimonial}
						<Card class="relative">
							<CardHeader>
								<div class="flex items-center space-x-1">
									{#each Array(testimonial.rating) as _}
										<Star class="h-4 w-4 fill-yellow-400 text-yellow-400" />
									{/each}
								</div>
							</CardHeader>
							<CardContent>
								<blockquote class="text-base italic text-gray-700">
									"{testimonial.quote}"
								</blockquote>
								<div class="mt-4">
									<div class="font-semibold text-gray-900">{testimonial.author}</div>
									<div class="text-sm text-gray-600">{testimonial.role}</div>
									<div class="text-sm text-gray-500">{testimonial.organization}</div>
								</div>
							</CardContent>
						</Card>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<!-- Pricing Preview Section -->
	<section class="py-24 bg-white">
		<div class="mx-auto max-w-7xl px-6 lg:px-8">
			<div class="mx-auto max-w-2xl text-center">
				<h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
					Simple, Transparent Pricing
				</h2>
				<p class="mt-6 text-lg leading-8 text-gray-600">
					Pay only for what you use. No hidden fees, no long-term contracts.
				</p>
			</div>
			<div class="mx-auto mt-16 max-w-lg">
				<Card class="relative overflow-hidden border-2 border-blue-200">
					<div class="absolute top-0 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-1 text-xs font-semibold text-white rounded-b">
						MOST POPULAR
					</div>
					<CardHeader class="text-center pt-8">
						<CardTitle class="text-2xl">Credit-Based System</CardTitle>
						<div class="mt-4">
							<span class="text-4xl font-bold text-gray-900">₱0.50</span>
							<span class="text-gray-600">per card generated</span>
						</div>
						<CardDescription class="mt-2">
							Perfect for organizations of all sizes
						</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4">
						{#each pricingFeatures as feature}
							<div class="flex items-center space-x-3">
								<Check class="h-4 w-4 text-green-500" />
								<span class="text-sm text-gray-700">{feature}</span>
							</div>
						{/each}
						<div class="pt-6">
							<Button class="w-full" size="lg" href="/pricing">
								View All Pricing Plans
								<ArrowRight class="ml-2 h-4 w-4" />
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
		<div class="mx-auto max-w-7xl px-6 lg:px-8">
			<div class="mx-auto max-w-2xl text-center">
				<h2 class="text-3xl font-bold tracking-tight text-white sm:text-4xl">
					Ready to Create Professional ID Cards?
				</h2>
				<p class="mt-6 text-lg leading-8 text-blue-100">
					Join thousands of organizations already using ID-Gen. Start your free trial today.
				</p>
				<div class="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
					<Button variant="secondary" size="lg" class="px-8 py-3 text-lg" href="/auth">
						Start Free Trial
						<ArrowRight class="ml-2 h-5 w-5" />
					</Button>
					<Button variant="outline" size="lg" class="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 text-lg" href="/contact">
						Contact Sales
						<Globe class="ml-2 h-5 w-5" />
					</Button>
				</div>
				<p class="mt-4 text-sm text-blue-100">
					30-day free trial • No setup fees • Cancel anytime
				</p>
			</div>
		</div>
	</section>
</div>

<PublicFooter />