<script lang="ts">
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	interface Template {
		id: string;
		name: string;
	}

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const templates = data.templates as Template[];

	let selectedTemplateId = $state('');
	let frontImageFile: File | null = $state(null);
	let backImageFile: File | null = $state(null);
	let frontPreview = $state('');
	let backPreview = $state('');
	let isUploading = $state(false);

	function handleFrontImage(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			frontImageFile = file;
			frontPreview = URL.createObjectURL(file);
		}
	}

	function handleBackImage(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			backImageFile = file;
			backPreview = URL.createObjectURL(file);
		}
	}

	function resetForm() {
		selectedTemplateId = '';
		frontImageFile = null;
		backImageFile = null;
		frontPreview = '';
		backPreview = '';

		// Reset file inputs
		const frontInput = document.getElementById('frontImage') as HTMLInputElement;
		const backInput = document.getElementById('backImage') as HTMLInputElement;
		if (frontInput) frontInput.value = '';
		if (backInput) backInput.value = '';
	}

	$effect(() => {
		if (form?.success) {
			resetForm();
		}
	});
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
	<div class="mb-6">
		<h1 class="text-3xl font-bold tracking-tight">Upload Custom ID Card</h1>
		<p class="text-muted-foreground mt-2">Upload pre-made ID card images for a template</p>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Upload Images</CardTitle>
			<CardDescription>
				Select a template and upload the front and back images of the ID card
			</CardDescription>
		</CardHeader>
		<CardContent>
			<form
				method="POST"
				action="?/upload"
				enctype="multipart/form-data"
				use:enhance={() => {
					isUploading = true;
					return async ({ update }) => {
						await update();
						isUploading = false;
					};
				}}
				class="space-y-6"
			>
				<!-- Template Selection -->
				<div class="space-y-2">
					<Label for="templateId">Template</Label>
					<select
						name="templateId"
						bind:value={selectedTemplateId}
						class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						required
					>
						<option value="">Select a template</option>
						{#each templates as template}
							<option value={template.id}>{template.name}</option>
						{/each}
					</select>
				</div>

				<!-- Front Image Upload -->
				<div class="space-y-2">
					<Label for="frontImage">Front Image</Label>
					<Input
						id="frontImage"
						name="frontImage"
						type="file"
						accept="image/*"
						onchange={handleFrontImage}
						disabled={isUploading}
						required
					/>
					{#if frontPreview}
						<div class="mt-2 border rounded-lg overflow-hidden">
							<img
								src={frontPreview}
								alt="Front preview"
								class="w-full h-auto max-h-64 object-contain"
							/>
						</div>
					{/if}
				</div>

				<!-- Back Image Upload -->
				<div class="space-y-2">
					<Label for="backImage">Back Image</Label>
					<Input
						id="backImage"
						name="backImage"
						type="file"
						accept="image/*"
						onchange={handleBackImage}
						disabled={isUploading}
						required
					/>
					{#if backPreview}
						<div class="mt-2 border rounded-lg overflow-hidden">
							<img
								src={backPreview}
								alt="Back preview"
								class="w-full h-auto max-h-64 object-contain"
							/>
						</div>
					{/if}
				</div>

				<!-- Messages -->
				{#if form?.success}
					<div class="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
						{form.message}
					</div>
				{/if}

				{#if form?.error}
					<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
						{form.error}
					</div>
				{/if}

				<!-- Submit Button -->
				<Button
					type="submit"
					class="w-full"
					disabled={isUploading || !selectedTemplateId || !frontImageFile || !backImageFile}
				>
					{isUploading ? 'Uploading...' : 'Upload ID Card'}
				</Button>
			</form>
		</CardContent>
	</Card>
</div>
