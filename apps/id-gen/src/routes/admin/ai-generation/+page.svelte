<script lang="ts">
	import { browser } from '$app/environment';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Bot, Image, Sparkles, Wand2, Upload, X, Check, Loader2 } from 'lucide-svelte';

	// State
	let selectedAssets = $state<string[]>([]);
	let prompt = $state('');
	let isGenerating = $state(false);
	let generatedOutput = $state<string | null>(null);
	let errorMessage = $state('');

	// Mock assets for demo - replace with actual asset fetching
	let assets = $state<{id: string; name: string; url: string; type: string}[]>([
		{ id: '1', name: 'Logo', url: '/placeholder-logo.png', type: 'image' },
		{ id: '2', name: 'Background', url: '/placeholder-bg.png', type: 'image' },
		{ id: '3', name: 'Pattern 1', url: '/placeholder-pattern.png', type: 'pattern' },
		{ id: '4', name: 'Icon Set', url: '/placeholder-icons.png', type: 'icons' },
		{ id: '5', name: 'Border Frame', url: '/placeholder-border.png', type: 'frame' },
		{ id: '6', name: 'Texture', url: '/placeholder-texture.png', type: 'texture' },
	]);

	function toggleAsset(id: string) {
		if (selectedAssets.includes(id)) {
			selectedAssets = selectedAssets.filter(a => a !== id);
		} else {
			selectedAssets = [...selectedAssets, id];
		}
	}

	function clearSelection() {
		selectedAssets = [];
	}

	async function handleGenerate() {
		if (!prompt.trim()) {
			errorMessage = 'Please enter a prompt';
			return;
		}

		errorMessage = '';
		isGenerating = true;
		generatedOutput = null;

		try {
			// TODO: Replace with actual AI generation API call
			// Simulating API call
			await new Promise(resolve => setTimeout(resolve, 2000));
			
			// Mock response - replace with actual AI response
			generatedOutput = `Generated template based on:
- ${selectedAssets.length} selected assets
- Prompt: "${prompt}"

[AI-generated template preview would appear here]`;
		} catch (e: any) {
			errorMessage = e.message || 'Failed to generate template';
		} finally {
			isGenerating = false;
		}
	}

	function clearOutput() {
		generatedOutput = null;
		prompt = '';
		selectedAssets = [];
	}
</script>

<svelte:head>
	<title>AI Generation | Admin Dashboard</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold tracking-tight flex items-center gap-3">
				<Bot class="w-8 h-8 text-primary" />
				AI Template Generation
			</h1>
			<p class="text-muted-foreground mt-1">
				Select assets, write a prompt, and generate ID card templates with AI
			</p>
		</div>
		{#if selectedAssets.length > 0 || prompt || generatedOutput}
			<Button variant="outline" onclick={clearOutput}>
				<X class="w-4 h-4 mr-2" />
				Clear All
			</Button>
		{/if}
	</div>

	<!-- Error Message -->
	{#if errorMessage}
		<div class="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
			{errorMessage}
		</div>
	{/if}

	<!-- Three Column Layout -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- LEFT: Assets Grid -->
		<Card class="lg:col-span-1">
			<CardHeader class="pb-3">
				<CardTitle class="text-lg flex items-center gap-2">
					<Image class="w-5 h-5" />
					Assets
				</CardTitle>
				<CardDescription>
					Select assets to include in your template
					{#if selectedAssets.length > 0}
						<span class="text-primary font-medium">({selectedAssets.length} selected)</span>
					{/if}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
					{#each assets as asset}
						<button
							class="relative group aspect-square rounded-lg border-2 overflow-hidden transition-all hover:scale-105 {selectedAssets.includes(asset.id) ? 'border-primary ring-2 ring-primary/30' : 'border-muted hover:border-primary/50'}"
							onclick={() => toggleAsset(asset.id)}
						>
							<!-- Placeholder image -->
							<div class="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
								<Image class="w-8 h-8 text-muted-foreground/50" />
							</div>
							
							<!-- Selection indicator -->
							{#if selectedAssets.includes(asset.id)}
								<div class="absolute top-1 right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
									<Check class="w-4 h-4 text-white" />
								</div>
							{/if}

							<!-- Asset name -->
							<div class="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
								<p class="text-xs text-white truncate">{asset.name}</p>
							</div>
						</button>
					{/each}
				</div>

				<!-- Upload button -->
				<Button variant="outline" class="w-full mt-4">
					<Upload class="w-4 h-4 mr-2" />
					Upload New Asset
				</Button>

				{#if selectedAssets.length > 0}
					<Button variant="ghost" size="sm" class="w-full mt-2" onclick={clearSelection}>
						Clear Selection
					</Button>
				{/if}
			</CardContent>
		</Card>

		<!-- MIDDLE: Prompt Input -->
		<Card class="lg:col-span-1">
			<CardHeader class="pb-3">
				<CardTitle class="text-lg flex items-center gap-2">
					<Wand2 class="w-5 h-5" />
					Prompt
				</CardTitle>
				<CardDescription>
					Describe the template you want to generate
				</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<textarea
					class="w-full min-h-[200px] p-3 rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
					placeholder="Describe your ID card template...

Example:
- Create a professional employee ID card
- Use a modern blue and white color scheme
- Include space for photo, name, department, and employee ID
- Add a subtle pattern background"
					bind:value={prompt}
				></textarea>

				<!-- Quick prompts -->
				<div class="space-y-2">
					<p class="text-xs text-muted-foreground font-medium">Quick prompts:</p>
					<div class="flex flex-wrap gap-2">
						{#each ['Professional employee ID', 'Student ID card', 'Event badge', 'Membership card'] as quickPrompt}
							<button
								class="text-xs px-2 py-1 rounded-full bg-muted hover:bg-primary/20 transition-colors"
								onclick={() => prompt = quickPrompt}
							>
								{quickPrompt}
							</button>
						{/each}
					</div>
				</div>

				<!-- Generate button -->
				<Button 
					class="w-full" 
					size="lg"
					onclick={handleGenerate}
					disabled={isGenerating || !prompt.trim()}
				>
					{#if isGenerating}
						<Loader2 class="w-4 h-4 mr-2 animate-spin" />
						Generating...
					{:else}
						<Sparkles class="w-4 h-4 mr-2" />
						Generate Template
					{/if}
				</Button>

				<!-- Info -->
				<p class="text-xs text-muted-foreground text-center">
					{selectedAssets.length} asset{selectedAssets.length !== 1 ? 's' : ''} will be used in generation
				</p>
			</CardContent>
		</Card>

		<!-- RIGHT: AI Output -->
		<Card class="lg:col-span-1">
			<CardHeader class="pb-3">
				<CardTitle class="text-lg flex items-center gap-2">
					<Sparkles class="w-5 h-5" />
					AI Output
				</CardTitle>
				<CardDescription>
					Generated template preview
				</CardDescription>
			</CardHeader>
			<CardContent>
				{#if isGenerating}
					<!-- Loading state -->
					<div class="aspect-[3/4] rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
						<div class="text-center">
							<Loader2 class="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
							<p class="text-sm text-muted-foreground">Generating template...</p>
							<p class="text-xs text-muted-foreground mt-1">This may take a moment</p>
						</div>
					</div>
				{:else if generatedOutput}
					<!-- Output preview -->
					<div class="space-y-4">
						<div class="aspect-[3/4] rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-dashed border-primary/30 flex items-center justify-center p-4">
							<div class="text-center">
								<Sparkles class="w-12 h-12 mx-auto text-primary mb-4" />
								<p class="text-sm text-muted-foreground">Template Preview</p>
								<p class="text-xs text-muted-foreground mt-2 max-w-[200px]">
									{generatedOutput.slice(0, 100)}...
								</p>
							</div>
						</div>

						<div class="flex gap-2">
							<Button class="flex-1" variant="default">
								<Check class="w-4 h-4 mr-2" />
								Use Template
							</Button>
							<Button class="flex-1" variant="outline" onclick={handleGenerate}>
								<Wand2 class="w-4 h-4 mr-2" />
								Regenerate
							</Button>
						</div>
					</div>
				{:else}
					<!-- Empty state -->
					<div class="aspect-[3/4] rounded-lg bg-muted/30 border-2 border-dashed border-muted flex items-center justify-center">
						<div class="text-center p-4">
							<Bot class="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
							<p class="text-sm text-muted-foreground">No output yet</p>
							<p class="text-xs text-muted-foreground mt-2">
								Select assets, write a prompt, and click Generate
							</p>
						</div>
					</div>
				{/if}
			</CardContent>
		</Card>
	</div>
</div>
