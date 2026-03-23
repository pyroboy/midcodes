<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as Accordion from '$lib/components/ui/accordion';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { toast } from 'svelte-sonner';
	import { Pencil, Plus, AlertCircle, User, Phone, Mail, MapPin, Calendar, Building, Camera } from 'lucide-svelte';
	import { superForm } from 'sveltekit-superforms/client';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { tenantFormSchema, TenantStatusEnum, defaultEmergencyContact } from './formSchema';
	import type { z } from 'zod/v3';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import ImageUploadWithCrop from '$lib/components/ui/ImageUploadWithCrop.svelte';
	import BirthdayInput from '$lib/components/ui/birthday-input.svelte';
	import { optimisticUpsertTenant } from '$lib/db/optimistic';
	import { bufferedMutation, CONFLICT_MESSAGE } from '$lib/db/optimistic-utils';
	import { getStatusClasses } from '$lib/utils/format';

	type FormType = z.infer<typeof tenantFormSchema>;

	let {
		tenant = null,
		open,
		onOpenChange,
		editMode = false,
		form: initialForm,
		onTenantUpdate
	} = $props<{
		tenant?: any;
		open: boolean;
		onOpenChange: (open: boolean) => void;
		editMode: boolean;
		form: any;
		onTenantUpdate?: (tenant: any) => void;
	}>();

	// Profile picture state
	let profilePictureFile: File | null = $state(null);
	let profilePicturePreviewUrl: string | null = $state(null);
	let uploadingImage = $state(false);
	let hasSelectedNewImage = $state(false);

	// Current display value for the image component - bindable
	let imageDisplayValue = $state<string | null>(null);

	// Sync imageDisplayValue with form and preview state
	$effect(() => {
		imageDisplayValue = profilePicturePreviewUrl || $form.profile_picture_url || null;
	});

	// Unsaved changes confirmation dialog state
	let showUnsavedDialog = $state(false);
	let scrollProgress = $state(0);
	let scrollAreaRef: HTMLElement | null = $state(null);

	// P0-2: Accordion sections — Personal + Contact open by default
	let openSections = $state<string[]>(['personal', 'contact']);

	$effect(() => {
		if (!open) {
			scrollProgress = 0;
			return;
		}
		const el = scrollAreaRef;
		if (!el) return;
		function onScroll() {
			if (!el) return;
			const maxScroll = el.scrollHeight - el.clientHeight;
			scrollProgress = maxScroll > 0 ? (el.scrollTop / maxScroll) * 100 : 0;
		}
		el.addEventListener('scroll', onScroll, { passive: true });
		return () => el.removeEventListener('scroll', onScroll);
	});

	// Track form changes to prevent accidental exits
	let initialFormData = $state<string>('');
	let hasUnsavedChanges = $derived.by(() => {
		if (!open) return false;
		const currentData = JSON.stringify($form);
		const dataChanged = initialFormData !== '' && currentData !== initialFormData;
		// Include image selection in unsaved changes
		return dataChanged || hasSelectedNewImage;
	});

	// Initialize Superforms
	// Custom submission handler to ensure proper timing
	let isSubmitting = $state(false);

	// Custom submit handler — uses buffered mutation queue for instant UI
	async function handleCustomSubmit(event: Event) {
		event.preventDefault();

		if (isSubmitting) return;
		isSubmitting = true;

		try {
			// STEP 1: Upload image first if there's a selected file (must complete before enqueue)
			if (profilePictureFile && hasSelectedNewImage) {
				uploadingImage = true;
				await uploadProfilePicture();
				toast.success('Image uploaded successfully');
				uploadingImage = false;
			}

			// Wait briefly for DOM to reflect updated form values
			await new Promise(resolve => setTimeout(resolve, 100));

			// Capture form data before closing modal
			const formElement = event.target as HTMLFormElement;
			const formData = new FormData(formElement);
			const actionUrl = formElement.action;

			// Snapshot form values for optimistic write + callback
			const formSnapshot = {
				name: $form.name,
				email: $form.email || null,
				contact_number: $form.contact_number || null,
				tenant_status: $form.tenant_status || 'PENDING',
				emergency_contact: $form.emergency_contact || null,
				profile_picture_url: $form.profile_picture_url || null,
				address: $form.address || null,
				school_or_workplace: $form.school_or_workplace || null,
				facebook_name: $form.facebook_name || null,
				birthday: $form.birthday || null
			};

			const isEdit = editMode;
			const formId = $form.id;
			const tenantRef = tenant;
			const onUpdateCb = onTenantUpdate;

			// STEP 2: For updates — write to RxDB FIRST (instant UI)
			const optimisticWrite = isEdit && formId
				? async () => {
					await optimisticUpsertTenant({
						id: Number(formId),
						...formSnapshot
					});
					// Notify parent of update
					if (onUpdateCb && tenantRef) {
						onUpdateCb({ ...tenantRef, ...formSnapshot });
					}
				}
				: undefined;

			// STEP 3: Close modal + reset immediately
			reset();
			profilePictureFile = null;
			profilePicturePreviewUrl = null;
			hasSelectedNewImage = false;
			onOpenChange(false);
			toast.info(isEdit ? 'Saving changes...' : 'Creating tenant...');

			// STEP 4: Enqueue server action via buffered mutation
			await bufferedMutation({
				label: isEdit
					? `Update Tenant: ${formSnapshot.name}`
					: `Create Tenant: ${formSnapshot.name}`,
				collection: 'tenants',
				type: isEdit ? 'update' : 'create',
				optimisticWrite,
				serverAction: async () => {
					const response = await fetch(actionUrl, {
						method: 'POST',
						body: formData
					});
					if (response.status === 409) {
						throw new Error(CONFLICT_MESSAGE);
					}
					if (!response.ok) {
						const text = await response.text();
						throw new Error(text || `Server returned ${response.status}`);
					}
					return response.text().then((t) => {
						try { return JSON.parse(t); } catch { return t; }
					});
				},
				onSuccess: async (result) => {
					// For creates: write the real doc to RxDB with server-assigned ID
					if (!isEdit) {
						const tenantId = result?.data?.tenantId ?? result?.tenantId;
						if (tenantId) {
							await optimisticUpsertTenant({
								id: Number(tenantId),
								...formSnapshot
							});
						}
					}
					toast.success(isEdit ? 'Tenant updated' : 'Tenant created');
				}
			});

		} catch (error: any) {
			console.error('Form submission failed:', error);
			toast.error(`Failed to ${editMode ? 'update' : 'create'} tenant: ${error.message}`);
		} finally {
			isSubmitting = false;
			uploadingImage = false;
		}
	}

	const { form, errors, enhance, constraints, submitting, reset } = superForm((() => initialForm)(), {
		validators: zodClient(tenantFormSchema),
		validationMethod: 'onblur',
		resetForm: true,
		invalidateAll: false
		// onResult not needed — handleCustomSubmit uses bufferedMutation instead
	});

	// Ensure emergency_contact is always initialized
	$effect(() => {
		if ($form && !$form.emergency_contact) {
			$form.emergency_contact = { ...defaultEmergencyContact };
		}
	});

	// Handle cropped image from ImageUploadWithCrop - DEFERRED MODE
	function handleCropReady(file: File, previewUrl: string) {
		// Clean up previous preview URL
		if (profilePicturePreviewUrl && profilePicturePreviewUrl !== previewUrl) {
			URL.revokeObjectURL(profilePicturePreviewUrl);
		}

		// Store the cropped file and preview URL
		profilePictureFile = file;
		profilePicturePreviewUrl = previewUrl;
		hasSelectedNewImage = true;

		// Manually update the bound value to ensure immediate display
		imageDisplayValue = previewUrl;
	}

	// Legacy handler - not used with onCropReady
	function handleProfilePictureUpload(file: File) {
		// This won't be called when using onCropReady
	}

	// Actual upload function called during form submission
	async function uploadProfilePicture(): Promise<void> {
		if (!profilePictureFile) {
			return;
		}

		const formData = new FormData();
		formData.append('file', profilePictureFile);

		const response = await fetch('/api/upload-image', {
			method: 'POST',
			body: formData
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || 'Upload failed');
		}

		const result = await response.json();

		$form.profile_picture_url = result.secure_url;

		// Force update of the hidden input field
		const hiddenInput = document.querySelector('input[name="profile_picture_url"]') as HTMLInputElement;
		if (hiddenInput) {
			hiddenInput.value = result.secure_url;
		}
	}

	function handleProfilePictureRemove() {
		// Clean up preview URL if exists
		if (profilePicturePreviewUrl) {
			URL.revokeObjectURL(profilePicturePreviewUrl);
			profilePicturePreviewUrl = null;
		}

		$form.profile_picture_url = null;
		profilePictureFile = null;
		hasSelectedNewImage = true; // Mark as changed for unsaved changes detection
	}

	function handleProfilePictureError(error: string) {
		toast.error(error);
	}

	// Convert ZodEnum to array of status options
	let tenantStatusOptions = $derived(Object.values(TenantStatusEnum.Values));

	// Handle modal close with unsaved changes check
	function handleModalClose(shouldClose: boolean) {
		if (!shouldClose && hasUnsavedChanges) {
			showUnsavedDialog = true;
			return;
		}
		onOpenChange(shouldClose);
	}

	function confirmDiscardChanges() {
		showUnsavedDialog = false;
		onOpenChange(false);
	}

	// Reset form when modal opens/closes or tenant changes
	$effect(() => {
		if (open) {
			// Reset accordion sections
			openSections = ['personal', 'contact'];

			if (editMode && tenant) {
				// Edit mode - populate with existing tenant data
				$form = {
					id: tenant.id,
					name: tenant.name || '',
					email: tenant.email || '',
					contact_number: tenant.contact_number || '',
					tenant_status: tenant.tenant_status || 'PENDING',
					emergency_contact: tenant.emergency_contact
						? {
								name: tenant.emergency_contact.name || '',
								relationship: tenant.emergency_contact.relationship || '',
								phone: tenant.emergency_contact.phone || '',
								email: tenant.emergency_contact.email || '',
								address: tenant.emergency_contact.address || ''
							}
						: { ...defaultEmergencyContact },
					'emergency_contact.name': tenant.emergency_contact?.name || '',
					'emergency_contact.relationship': tenant.emergency_contact?.relationship || '',
					'emergency_contact.phone': tenant.emergency_contact?.phone || '',
					'emergency_contact.email': tenant.emergency_contact?.email || '',
					'emergency_contact.address': tenant.emergency_contact?.address || '',
					auth_id: tenant.auth_id || null,
					created_by: tenant.created_by || null,
					lease_status: tenant.lease?.status || '',
					lease_type: tenant.lease?.type || '',
					lease_id: tenant.lease?.id || null,
					location_id: tenant.lease?.location?.id || null,
					start_date: tenant.lease?.start_date || '',
					end_date: tenant.lease?.end_date || '',
					rent_amount: tenant.lease?.rent_amount || 0,
					security_deposit: tenant.lease?.security_deposit || 0,
					outstanding_balance: tenant.lease?.balance || 0,
					notes: tenant.lease?.notes || '',
					last_payment_date: null,
					next_payment_due: null,
					payment_schedules: [],
					status_history: [],
					status_change_reason: null,
					profile_picture_url: tenant?.profile_picture_url || null,
					address: tenant.address || '',
					school_or_workplace: tenant.school_or_workplace || '',
					facebook_name: tenant.facebook_name || '',
					birthday: tenant.birthday || ''
				};
			} else {
				// Create mode - reset to defaults
				$form = {
					id: undefined,
					name: '',
					email: '',
					contact_number: '',
					tenant_status: 'PENDING',
					emergency_contact: { ...defaultEmergencyContact },
					'emergency_contact.name': '',
					'emergency_contact.relationship': '',
					'emergency_contact.phone': '',
					'emergency_contact.email': '',
					'emergency_contact.address': '',
					auth_id: null,
					created_by: null,
					lease_status: '',
					lease_type: '',
					lease_id: null,
					location_id: null,
					start_date: '',
					end_date: '',
					rent_amount: 0,
					security_deposit: 0,
					outstanding_balance: 0,
					notes: '',
					last_payment_date: null,
					next_payment_due: null,
					payment_schedules: [],
					status_history: [],
					status_change_reason: null,
					profile_picture_url: null,
					address: '',
					school_or_workplace: '',
					facebook_name: '',
					birthday: ''
				};
			}

			// Only reset if we don't have a fresh cropped image
			if (!hasSelectedNewImage || !profilePicturePreviewUrl) {
				profilePictureFile = null;
				hasSelectedNewImage = false;
				if (profilePicturePreviewUrl) {
					URL.revokeObjectURL(profilePicturePreviewUrl);
					profilePicturePreviewUrl = null;
				}
			}

			// Set initial form data after form is populated
			setTimeout(() => {
				initialFormData = JSON.stringify($form);
			}, 100);

			// P1-2: Auto-focus name field in create mode (after dialog focus trap settles)
			if (!editMode) {
				setTimeout(() => {
					document.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
				}, 150);
			}
		} else {
			// Clean up when closing modal
			if (profilePicturePreviewUrl) {
				URL.revokeObjectURL(profilePicturePreviewUrl);
				profilePicturePreviewUrl = null;
			}
			profilePictureFile = null;
			hasSelectedNewImage = false;
		}
	});
</script>

<Dialog {open} onOpenChange={handleModalClose}>
	<DialogContent class="sm:max-w-[700px] max-h-[90dvh] flex flex-col overflow-hidden p-0">
		<!-- P0-3: Header outside form, flex-shrink-0 -->
		<DialogHeader class="px-4 pt-3 pb-1.5 sm:px-5 sm:pt-4 flex-shrink-0 border-b">
			<div class="flex items-center gap-2">
				{#if editMode}
					<Pencil class="w-5 h-5 text-primary" />
				{:else}
					<Plus class="w-5 h-5 text-primary" />
				{/if}
				<DialogTitle>{editMode ? 'Edit' : 'Create'} Tenant</DialogTitle>
			</div>
			<DialogDescription>
				{editMode
					? 'Update the tenant information and contact details.'
					: 'Create a new tenant and add their contact information.'} Click save when you're done.
			</DialogDescription>
		</DialogHeader>

		<!-- P3-2: Thicker scroll progress bar -->
		<div class="h-[3px] w-full bg-slate-200 overflow-hidden flex-shrink-0">
			<div
				class="h-full bg-primary transition-[width] duration-150 ease-out"
				style="width: {scrollProgress}%"
			></div>
		</div>

		<form method="POST" action={editMode ? '?/update' : '?/create'} onsubmit={handleCustomSubmit} class="flex flex-col flex-1 min-h-0">
			<!-- P0-3: Scrollable content area -->
			<div class="flex-1 overflow-y-auto px-4 sm:px-5 py-3" bind:this={scrollAreaRef}>
				<!-- Hidden input for tenant ID in edit mode -->
				{#if editMode && $form.id}
					<input type="hidden" name="id" value={$form.id} />
					<input type="hidden" name="_updated_at" value={tenant?.updated_at ?? ''} />
				{/if}

				<!-- P0-2: Accordion sections for progressive disclosure -->
				<Accordion.Root type="multiple" bind:value={openSections} class="space-y-1">
					<!-- Profile Picture (collapsed by default) -->
					<Accordion.Item value="photo">
						<Accordion.Trigger class="flex w-full items-center gap-2 py-3 text-sm font-semibold text-slate-700 hover:text-slate-900">
							<Camera class="w-4 h-4 text-slate-500" />
							<span>Profile Picture (Optional)</span>
						</Accordion.Trigger>
						<Accordion.Content>
							<div class="space-y-4 pb-4">
								<div class="flex flex-col items-center space-y-2">
									<ImageUploadWithCrop
										bind:value={imageDisplayValue}
										disabled={uploadingImage || $submitting}
										onCropReady={handleCropReady}
										onremove={handleProfilePictureRemove}
										onerror={handleProfilePictureError}
										placeholder="Upload profile picture"
										maxSize={10}
										cropSize={{ width: 400, height: 400 }}
									/>

									{#if uploadingImage}
										<div class="flex items-center gap-2 text-sm text-slate-600">
											<div
												class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"
											></div>
											<span>Uploading image...</span>
										</div>
									{/if}
								</div>

								<!-- Hidden input for form submission -->
								<input type="hidden" name="profile_picture_url" bind:value={$form.profile_picture_url} />

								{#if $errors.profile_picture_url}
									<p class="text-sm text-red-500 flex items-center gap-1 justify-center">
										<AlertCircle class="w-4 h-4" />
										{$errors.profile_picture_url}
									</p>
								{/if}
							</div>
						</Accordion.Content>
					</Accordion.Item>

					<!-- Personal Information (open by default) -->
					<Accordion.Item value="personal">
						<Accordion.Trigger class="flex w-full items-center gap-2 py-3 text-sm font-semibold text-slate-700 hover:text-slate-900">
							<User class="w-4 h-4 text-slate-500" />
							<span>Personal Information</span>
						</Accordion.Trigger>
						<Accordion.Content>
							<div class="space-y-4 pb-4">
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div class="space-y-2">
										<Label for="name">Full Name *</Label>
										<div class="relative">
											<User class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
											<Input
												id="name"
												name="name"
												type="text"
												bind:value={$form.name}
												class={`pl-10 ${$errors.name ? 'border-red-500' : ''}`}
												placeholder="Enter tenant's full name"
												{...$constraints.name}
												required
											/>
										</div>
										{#if $errors.name}
											<p class="text-sm text-red-500 flex items-center gap-1">
												<AlertCircle class="w-4 h-4" />
												{$errors.name}
											</p>
										{/if}
									</div>

									<div class="space-y-2">
										<Label for="tenant_status">Status</Label>
										<input type="hidden" name="tenant_status" bind:value={$form.tenant_status} />
										<Select.Root type="single" bind:value={$form.tenant_status}>
											<Select.Trigger>
												<Badge variant="outline" class={getStatusClasses($form.tenant_status)}>
													{$form.tenant_status}
												</Badge>
											</Select.Trigger>
											<Select.Content>
												{#each tenantStatusOptions as status}
													<Select.Item value={status}>
														<Badge variant="outline" class={getStatusClasses(status)}>
															{status}
														</Badge>
													</Select.Item>
												{/each}
											</Select.Content>
										</Select.Root>
									</div>

									<div class="space-y-2">
										<BirthdayInput
											bind:value={$form.birthday}
											label="Birthday (Optional)"
											name="birthday"
											id="birthday"
											error={Array.isArray($errors.birthday) ? $errors.birthday[0] : (typeof $errors.birthday === 'string' ? $errors.birthday : undefined)}
										/>
										{#if $errors.birthday}
											<p class="text-sm text-red-500 flex items-center gap-1">
												<AlertCircle class="w-4 h-4" />
												{$errors.birthday}
											</p>
										{/if}
									</div>

									<div class="space-y-2">
										<Label for="address">Home Address (Optional)</Label>
										<div class="relative">
											<MapPin class="absolute left-3 top-3 w-4 h-4 text-gray-400" />
											<Textarea
												id="address"
												name="address"
												bind:value={$form.address}
												class={`pl-10 ${$errors.address ? 'border-red-500' : ''}`}
												placeholder="Street, City, Province/State, ZIP"
												rows={2}
												{...$constraints.address}
											/>
										</div>
										{#if $errors.address}
											<p class="text-sm text-red-500 flex items-center gap-1">
												<AlertCircle class="w-4 h-4" />
												{$errors.address}
											</p>
										{/if}
									</div>

									<!-- P2-4: School/Workplace merged from Additional Information -->
									<div class="space-y-2 md:col-span-2">
										<Label for="school_or_workplace">School/Workplace (Optional)</Label>
										<div class="relative">
											<Building class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
											<Input
												id="school_or_workplace"
												name="school_or_workplace"
												type="text"
												bind:value={$form.school_or_workplace}
												class={`pl-10 ${$errors.school_or_workplace ? 'border-red-500' : ''}`}
												placeholder="e.g., University of the Philippines / ACME Corporation"
												{...$constraints.school_or_workplace}
											/>
										</div>
										{#if $errors.school_or_workplace}
											<p class="text-sm text-red-500 flex items-center gap-1">
												<AlertCircle class="w-4 h-4" />
												{$errors.school_or_workplace}
											</p>
										{/if}
									</div>
								</div>
							</div>
						</Accordion.Content>
					</Accordion.Item>

					<!-- Contact Information (open by default) -->
					<Accordion.Item value="contact">
						<Accordion.Trigger class="flex w-full items-center gap-2 py-3 text-sm font-semibold text-slate-700 hover:text-slate-900">
							<Phone class="w-4 h-4 text-slate-500" />
							<span>Contact Information</span>
						</Accordion.Trigger>
						<Accordion.Content>
							<div class="space-y-4 pb-4">
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div class="space-y-2">
										<Label for="email">Email Address (Optional)</Label>
										<div class="relative">
											<Mail class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
											<Input
												id="email"
												name="email"
												type="email"
												bind:value={$form.email}
												class={`pl-10 ${$errors.email ? 'border-red-500' : ''}`}
												placeholder="tenant@example.com (optional)"
												{...$constraints.email}
											/>
										</div>
										{#if $errors.email}
											<p class="text-sm text-red-500 flex items-center gap-1">
												<AlertCircle class="w-4 h-4" />
												{$errors.email}
											</p>
										{/if}
									</div>

									<div class="space-y-2">
										<Label for="contact_number">Phone Number (Optional)</Label>
										<div class="relative">
											<Phone class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
											<Input
												id="contact_number"
												name="contact_number"
												type="tel"
												bind:value={$form.contact_number}
												class={`pl-10 ${$errors.contact_number ? 'border-red-500' : ''}`}
												placeholder="+63 912 345 6789 (optional)"
												{...$constraints.contact_number}
											/>
										</div>
										{#if $errors.contact_number}
											<p class="text-sm text-red-500 flex items-center gap-1">
												<AlertCircle class="w-4 h-4" />
												{$errors.contact_number}
											</p>
										{/if}
									</div>

									<div class="space-y-2">
										<Label for="facebook_name">Facebook Profile Name (Optional)</Label>
										<div class="relative">
											<User class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
											<Input
												id="facebook_name"
												name="facebook_name"
												type="text"
												bind:value={$form.facebook_name}
												class={`pl-10 ${$errors.facebook_name ? 'border-red-500' : ''}`}
												placeholder="Exact Facebook profile name"
												{...$constraints.facebook_name}
											/>
										</div>
										{#if $errors.facebook_name}
											<p class="text-sm text-red-500 flex items-center gap-1">
												<AlertCircle class="w-4 h-4" />
												{$errors.facebook_name}
											</p>
										{/if}
									</div>
								</div>
							</div>
						</Accordion.Content>
					</Accordion.Item>

					<!-- Emergency Contact (collapsed by default) -->
					<Accordion.Item value="emergency">
						<Accordion.Trigger class="flex w-full items-center gap-2 py-3 text-sm font-semibold text-slate-700 hover:text-slate-900">
							<AlertCircle class="w-4 h-4 text-slate-500" />
							<span>Emergency Contact (Optional)</span>
						</Accordion.Trigger>
						<Accordion.Content>
							<div class="space-y-4 pb-4">
								<Card>
									<CardContent class="pt-6">
										<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div class="space-y-2">
												<Label for="emergency_contact_name">Contact Name (Optional)</Label>
												<Input
													id="emergency_contact_name"
													name="emergency_contact.name"
													type="text"
													bind:value={$form['emergency_contact.name']}
													class={$errors['emergency_contact.name'] ? 'border-red-500' : ''}
													placeholder="Emergency contact name (optional)"
												/>
												{#if $errors['emergency_contact.name']}
													<p class="text-sm text-red-500 flex items-center gap-1">
														<AlertCircle class="w-4 h-4" />
														{$errors['emergency_contact.name']}
													</p>
												{/if}
											</div>

											<div class="space-y-2">
												<Label for="emergency_contact_relationship">Relationship (Optional)</Label>
												<Input
													id="emergency_contact_relationship"
													name="emergency_contact.relationship"
													type="text"
													bind:value={$form['emergency_contact.relationship']}
													class={$errors['emergency_contact.relationship'] ? 'border-red-500' : ''}
													placeholder="e.g., Spouse, Parent, Friend (optional)"
												/>
												{#if $errors['emergency_contact.relationship']}
													<p class="text-sm text-red-500 flex items-center gap-1">
														<AlertCircle class="w-4 h-4" />
														{$errors['emergency_contact.relationship']}
													</p>
												{/if}
											</div>

											<div class="space-y-2">
												<Label for="emergency_contact_phone">Phone Number (Optional)</Label>
												<div class="relative">
													<Phone
														class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
													/>
													<Input
														id="emergency_contact_phone"
														name="emergency_contact.phone"
														type="tel"
														bind:value={$form['emergency_contact.phone']}
														class={`pl-10 ${$errors['emergency_contact.phone'] ? 'border-red-500' : ''}`}
														placeholder="+63 912 345 6789 (optional)"
													/>
												</div>
												{#if $errors['emergency_contact.phone']}
													<p class="text-sm text-red-500 flex items-center gap-1">
														<AlertCircle class="w-4 h-4" />
														{$errors['emergency_contact.phone']}
													</p>
												{/if}
											</div>

											<div class="space-y-2">
												<Label for="emergency_contact_email">Email Address (Optional)</Label>
												<div class="relative">
													<Mail
														class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
													/>
													<Input
														id="emergency_contact_email"
														name="emergency_contact.email"
														type="email"
														bind:value={$form['emergency_contact.email']}
														class={`pl-10 ${$errors['emergency_contact.email'] ? 'border-red-500' : ''}`}
														placeholder="emergency@example.com (optional)"
													/>
												</div>
												{#if $errors['emergency_contact.email']}
													<p class="text-sm text-red-500 flex items-center gap-1">
														<AlertCircle class="w-4 h-4" />
														{$errors['emergency_contact.email']}
													</p>
												{/if}
											</div>
										</div>

										<!-- Address field - separate row for better mobile layout -->
										<div class="space-y-2 mt-4">
											<Label for="emergency_contact_address">Address (Optional)</Label>
											<div class="relative">
												<MapPin class="absolute left-3 top-3 w-4 h-4 text-gray-400" />
												<Textarea
													id="emergency_contact_address"
													name="emergency_contact.address"
													bind:value={$form['emergency_contact.address']}
													class={`pl-10 ${$errors['emergency_contact.address'] ? 'border-red-500' : ''}`}
													placeholder="Enter emergency contact's full address (optional)"
													rows={3}
												/>
											</div>
											{#if $errors['emergency_contact.address']}
												<p class="text-sm text-red-500 flex items-center gap-1">
													<AlertCircle class="w-4 h-4" />
													{$errors['emergency_contact.address']}
												</p>
											{/if}
										</div>
									</CardContent>
								</Card>
							</div>
						</Accordion.Content>
					</Accordion.Item>
				</Accordion.Root>
			</div>

			<!-- P0-3: Sticky footer — always visible -->
			<div class="border-t flex-shrink-0 py-2.5 px-4 sm:px-5 flex justify-end gap-2 bg-background">
				<Button type="button" variant="outline" onclick={() => handleModalClose(false)}>Cancel</Button>
				<Button type="submit" disabled={isSubmitting || uploadingImage}>
					{uploadingImage
						? 'Uploading Image...'
						: isSubmitting
							? editMode
								? hasSelectedNewImage
									? 'Saving & Uploading...'
									: 'Saving...'
								: hasSelectedNewImage
									? 'Creating & Uploading...'
									: 'Creating...'
							: editMode
								? hasSelectedNewImage
									? 'Save & Upload Image'
									: 'Save Changes'
								: hasSelectedNewImage
									? 'Create & Upload Image'
									: 'Create Tenant'}
				</Button>
			</div>
		</form>
	</DialogContent>
</Dialog>

<!-- Unsaved Changes Confirmation Dialog -->
<AlertDialog.Root bind:open={showUnsavedDialog}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Unsaved Changes</AlertDialog.Title>
			<AlertDialog.Description>
				You have unsaved changes. Are you sure you want to close without saving?
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => (showUnsavedDialog = false)}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={confirmDiscardChanges}>Discard Changes</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
