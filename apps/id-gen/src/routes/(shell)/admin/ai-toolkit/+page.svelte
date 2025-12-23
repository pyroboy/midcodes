<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { analyzeIDCard, extractBackground, synthesizeTemplate } from '$lib/remote/ai.remote';
	import {
		Wand2,
		Image as ImageIcon,
		Layers,
		Sparkles,
		Loader2,
		Check,
		AlertCircle
	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';

	let fileInput: HTMLInputElement;
	let selectedImageBase64 = $state<string | null>(null);
	let isAnalyzing = $state(false);
	let isSeparating = $state(false);
	let isSynthesizing = $state(false);

	let detectedElements = $state<any[]>([]);
	let backgroundUrl = $state<string | null>(null);
	let error = $state<string | null>(null);
	let dimensions = $state({ width: 0, height: 0 });

	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				selectedImageBase64 = e.target?.result as string;

				// Get dimensions
				const img = new Image();
				img.onload = () => {
					dimensions = { width: img.width, height: img.height };
				};
				img.src = selectedImageBase64;

				// Reset state
				detectedElements = [];
				backgroundUrl = null;
				error = null;
			};
			reader.readAsDataURL(file);
		}
	}

	async function runAnalysis() {
		if (!selectedImageBase64) return;
		isAnalyzing = true;
		error = null;

		try {
			const result = await analyzeIDCard({ imageBase64: selectedImageBase64 });
			if (result.success) {
				detectedElements = result.elements;
				toast.success(`Detected ${result.elements.length} elements`);
			} else {
				error = result.error || 'Failed to analyze ID card';
			}
		} catch (e: any) {
			error = e.message;
		} finally {
			isAnalyzing = false;
		}
	}

	async function runLayering() {
		if (!selectedImageBase64) return;
		isSeparating = true;

		try {
			const result = await extractBackground({ imageBase64: selectedImageBase64 });
			if (result.success) {
				backgroundUrl = result.imageUrl || null;
				toast.success('Background separated successfully');
			} else {
				toast.error(result.error || 'Failed to separate layers');
			}
		} catch (e: any) {
			toast.error(e.message);
		} finally {
			isSeparating = false;
		}
	}

	async function convertToTemplate() {
		if (detectedElements.length === 0 || !backgroundUrl) {
			toast.error('Need both detected elements and a separated background');
			return;
		}

		isSynthesizing = true;
		try {
			const result = await synthesizeTemplate({
				name: `AI Template - ${new Date().toLocaleTimeString()}`,
				elements: detectedElements,
				backgroundUrl,
				width: dimensions.width,
				height: dimensions.height
			});

			if (result.success) {
				toast.success('Template synthesized!');
				goto(`/templates?id=${result.templateId}`);
			}
		} catch (e: any) {
			toast.error(e.message);
		} finally {
			isSynthesizing = false;
		}
	}
</script>

<div class="container mx-auto py-8 space-y-8">
	<div class="flex flex-col gap-2">
		<h1 class="text-3xl font-bold flex items-center gap-3">
			<Sparkles class="w-8 h-8 text-primary" />
			AI Layout Toolkit
		</h1>
		<p class="text-muted-foreground">
			Automate template creation by detecting elements and separating background layers from
			existing ID cards.
		</p>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
		<!-- Left: Input & Source -->
		<div class="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Source Image</CardTitle>
					<CardDescription
						>Upload an existing ID card to start the automation process.</CardDescription
					>
				</CardHeader>
				<CardContent class="space-y-4">
					<button
						type="button"
						class="w-full aspect-video bg-muted rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden relative"
						onclick={() => fileInput.click()}
					>
						{#if selectedImageBase64}
							<img src={selectedImageBase64} alt="Source" class="w-full h-full object-contain" />
						{:else}
							<ImageIcon class="w-12 h-12 text-muted-foreground mb-4" />
							<p class="text-sm text-muted-foreground">Click to upload or drag and drop</p>
						{/if}
						<input
							type="file"
							accept="image/*"
							class="hidden"
							bind:this={fileInput}
							onchange={handleFileChange}
						/>
					</button>

					<div class="flex gap-4">
						<Button
							class="flex-1"
							disabled={!selectedImageBase64 || isAnalyzing}
							onclick={runAnalysis}
						>
							{#if isAnalyzing}
								<Loader2 class="w-4 h-4 mr-2 animate-spin" />
								Detecting...
							{:else}
								<Wand2 class="w-4 h-4 mr-2" />
								Analyze Elements
							{/if}
						</Button>
						<Button
							variant="outline"
							class="flex-1"
							disabled={!selectedImageBase64 || isSeparating}
							onclick={runLayering}
						>
							{#if isSeparating}
								<Loader2 class="w-4 h-4 mr-2 animate-spin" />
								Processing...
							{:else}
								<Layers class="w-4 h-4 mr-2" />
								Separate Layers
							{/if}
						</Button>
					</div>
				</CardContent>
			</Card>

			{#if error}
				<div
					class="bg-destructive/10 text-destructive p-4 rounded-lg flex items-start gap-3 border border-destructive/20"
				>
					<AlertCircle class="w-5 h-5 mt-0.5" />
					<p class="text-sm font-medium">{error}</p>
				</div>
			{/if}
		</div>

		<!-- Right: Analysis Output -->
		<div class="space-y-6">
			<Card class="h-full">
				<CardHeader>
					<CardTitle>AI Analysis Results</CardTitle>
					<CardDescription>Visualizing detected elements and processed layers.</CardDescription>
				</CardHeader>
				<CardContent class="space-y-6">
					<!-- Detected Layers -->
					<div>
						<h3 class="text-sm font-semibold mb-3 flex items-center gap-2">
							<Check class="w-4 h-4 text-green-500" />
							Found Elements ({detectedElements.length})
						</h3>
						<div class="bg-muted rounded-md p-4 min-h-[100px] max-h-[300px] overflow-auto">
							{#if detectedElements.length > 0}
								<ul class="space-y-2">
									{#each detectedElements as el}
										<li
											class="p-2 bg-background rounded border text-xs flex items-center justify-between"
										>
											<span class="font-mono">{el.variableName}</span>
											<span
												class="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] uppercase font-bold"
											>
												{el.type}
											</span>
										</li>
									{/each}
								</ul>
							{:else}
								<p class="text-muted-foreground text-sm italic">
									Run analysis to see detected elements...
								</p>
							{/if}
						</div>
					</div>

					<!-- Background Layer -->
					<div>
						<h3 class="text-sm font-semibold mb-3">Background Asset</h3>
						<div
							class="aspect-video bg-muted rounded-lg border flex items-center justify-center overflow-hidden"
						>
							{#if backgroundUrl}
								<img src={backgroundUrl} alt="Background" class="w-full h-full object-contain" />
							{:else}
								<p class="text-muted-foreground text-xs">Waiting for layering processing...</p>
							{/if}
						</div>
					</div>

					<Button
						class="w-full"
						size="lg"
						variant="secondary"
						disabled={detectedElements.length === 0 || !backgroundUrl || isSynthesizing}
						onclick={convertToTemplate}
					>
						{#if isSynthesizing}
							<Loader2 class="w-4 h-4 mr-2 animate-spin" />
							Synthesizing...
						{:else}
							Synthesize into Template
						{/if}
					</Button>
				</CardContent>
			</Card>
		</div>
	</div>
</div>
