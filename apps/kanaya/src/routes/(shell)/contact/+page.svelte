<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import { Mail, Phone, MapPin, Send, Building2 } from '@lucide/svelte';

	let name = $state('');
	let email = $state('');
	let organization = $state('');
	let phone = $state('');
	let message = $state('');
	let inquiryType = $state<string | undefined>(undefined);
	let submitted = $state(false);
	let submitting = $state(false);

	const inquiryTypes = ['General', 'Sales', 'Support', 'Partnership'];

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		submitting = true;

		// Contact form endpoint not yet connected — show honest confirmation
		setTimeout(() => {
			submitting = false;
			submitted = true;
		}, 400);
	}

	function resetForm() {
		name = '';
		email = '';
		organization = '';
		phone = '';
		message = '';
		inquiryType = undefined;
		submitted = false;
	}
</script>

<svelte:head>
	<title>Contact | Kanaya</title>
	<meta
		name="description"
		content="Get in touch with Kanaya Identity Solutions. Contact us for sales inquiries, support, or partnership opportunities."
	/>
</svelte:head>

<div class="container mx-auto max-w-6xl px-4 py-8 lg:py-12">
	<!-- Page Header -->
	<div class="mb-10 text-center">
		<h1 class="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Contact Us</h1>
		<p class="mt-3 text-lg text-muted-foreground">
			Have questions about Kanaya Identity Solutions? We'd love to hear from you.
		</p>
	</div>

	<div class="grid gap-8 lg:grid-cols-5">
		<!-- Contact Form (3 cols) -->
		<div class="lg:col-span-3">
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2 text-xl">
						<Send class="h-5 w-5 text-primary" />
						Send us a message
					</CardTitle>
				</CardHeader>
				<CardContent>
					{#if submitted}
						<div class="flex flex-col items-center justify-center py-12 text-center">
							<div
								class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
							>
								<Mail class="h-8 w-8 text-green-600 dark:text-green-400" />
							</div>
							<h3 class="text-xl font-semibold text-foreground">Thank you!</h3>
							<p class="mt-2 max-w-sm text-muted-foreground">
								Your message has been noted. Please also email us directly at <a href="mailto:hello@kanaya.app" class="text-primary hover:underline">hello@kanaya.app</a> to ensure we receive it.
							</p>
							<Button variant="outline" class="mt-6" onclick={resetForm}>
								Send Another Message
							</Button>
						</div>
					{:else}
						<form onsubmit={handleSubmit} class="space-y-5">
							<div class="grid gap-5 sm:grid-cols-2">
								<div class="space-y-2">
									<Label for="name">Full Name *</Label>
									<Input
										id="name"
										placeholder="Juan Dela Cruz"
										bind:value={name}
										required
									/>
								</div>
								<div class="space-y-2">
									<Label for="email">Email Address *</Label>
									<Input
										id="email"
										type="email"
										placeholder="juan@example.com"
										bind:value={email}
										required
									/>
								</div>
							</div>

							<div class="grid gap-5 sm:grid-cols-2">
								<div class="space-y-2">
									<Label for="organization">Organization</Label>
									<div class="relative">
										<Building2
											class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
										/>
										<Input
											id="organization"
											placeholder="Company or School"
											bind:value={organization}
											class="pl-10"
										/>
									</div>
								</div>
								<div class="space-y-2">
									<Label for="phone">Phone Number</Label>
									<Input
										id="phone"
										type="tel"
										placeholder="+63 XXX XXX XXXX"
										bind:value={phone}
									/>
								</div>
							</div>

							<div class="space-y-2">
								<Label>Inquiry Type *</Label>
								<Select.Root
									type="single"
									value={inquiryType}
									onValueChange={(value) => (inquiryType = value)}
								>
									<Select.Trigger class="w-full">
										{inquiryType || 'Select inquiry type'}
									</Select.Trigger>
									<Select.Content>
										{#each inquiryTypes as type}
											<Select.Item value={type}>
												{type}
											</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</div>

							<div class="space-y-2">
								<Label for="message">Message *</Label>
								<Textarea
									id="message"
									placeholder="Tell us how we can help..."
									bind:value={message}
									rows={5}
									required
								/>
							</div>

							<Button type="submit" class="w-full sm:w-auto" disabled={submitting || !inquiryType}>
								{#if submitting}
									Sending...
								{:else}
									<Send class="mr-2 h-4 w-4" />
									Send Message
								{/if}
							</Button>
						</form>
					{/if}
				</CardContent>
			</Card>
		</div>

		<!-- Contact Info Cards (2 cols) -->
		<div class="space-y-4 lg:col-span-2">
			<Card>
				<CardHeader class="pb-3">
					<CardTitle class="flex items-center gap-2 text-base">
						<div
							class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"
						>
							<Mail class="h-4 w-4" />
						</div>
						Email
					</CardTitle>
				</CardHeader>
				<CardContent>
					<a
						href="mailto:hello@kanaya.app"
						class="text-sm font-medium text-primary hover:underline"
					>
						hello@kanaya.app
					</a>
					<p class="mt-1 text-xs text-muted-foreground">We respond within 1-2 business days</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="pb-3">
					<CardTitle class="flex items-center gap-2 text-base">
						<div
							class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"
						>
							<Phone class="h-4 w-4" />
						</div>
						Phone
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="text-sm font-medium text-foreground">+63 (XXX) XXX-XXXX</p>
					<p class="mt-1 text-xs text-muted-foreground">Mon - Fri, 9AM - 5PM PHT</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="pb-3">
					<CardTitle class="flex items-center gap-2 text-base">
						<div
							class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"
						>
							<MapPin class="h-4 w-4" />
						</div>
						Location
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="text-sm font-medium text-foreground">Bohol, Philippines</p>
					<p class="mt-1 text-xs text-muted-foreground">
						Kanaya Identity Solutions is proudly based in Bohol
					</p>
				</CardContent>
			</Card>

			<!-- Additional Info -->
			<Card class="border-primary/20 bg-primary/5">
				<CardContent class="pt-6">
					<h3 class="font-semibold text-foreground">Looking for pricing?</h3>
					<p class="mt-1 text-sm text-muted-foreground">
						Check out our flexible credit-based plans for organizations of all sizes.
					</p>
					<Button variant="outline" size="sm" class="mt-3" href="/pricing">
						View Pricing
					</Button>
				</CardContent>
			</Card>
		</div>
	</div>
</div>
