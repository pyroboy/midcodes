<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { Switch } from '$lib/components/ui/switch';
	import { Badge } from '$lib/components/ui/badge';

	interface Props {
		data: PageData & { organization?: any; templates?: any[] };
		form: ActionData;
	}

	let { data, form }: Props = $props();

	// Reactive state using Svelte 5 runes
	let profile = $state({ ...data.profile });
	let preferences = $state({ ...data.preferences });
	let loading = $state(false);
	let successMessage = $state('');
	let errorMessage = $state('');

	// Handle form responses
	$effect(() => {
		if (form?.success) {
			successMessage = form.message || 'Changes saved successfully!';
			errorMessage = '';

			// Update local state if needed
			if (form.updatedProfile) {
				profile = { ...profile, ...form.updatedProfile };
			}
			if (form.updatedPreferences) {
				preferences = { ...preferences, ...form.updatedPreferences };
			}
		} else if (form?.error) {
			errorMessage = form.error;
			successMessage = '';
		}
	});

	// Clear messages after 5 seconds
	$effect(() => {
		if (successMessage || errorMessage) {
			const timer = setTimeout(() => {
				successMessage = '';
				errorMessage = '';
			}, 5000);

			return () => clearTimeout(timer);
		}
	});

	function getRoleBadgeVariant(role: string) {
		switch (role) {
			case 'super_admin':
				return 'destructive';
			case 'org_admin':
				return 'default';
			case 'id_gen_admin':
				return 'secondary';
			default:
				return 'outline';
		}
	}

	function formatRoleName(role: string) {
		return role
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	import { formatDate } from '$lib/utils/dateFormat';
</script>

<div class="space-y-8">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Profile Settings</h1>
			<p class="text-muted-foreground">Manage your account information and preferences.</p>
		</div>
		<div class="mt-4 sm:mt-0">
			<Button href="/" variant="outline">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 mr-2"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 19l-7-7m0 0l7-7m-7 7h18"
					/>
				</svg>
				Back to Dashboard
			</Button>
		</div>
	</div>

	<!-- Messages -->
	{#if successMessage}
		<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
			<div class="flex">
				<svg class="flex-shrink-0 h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
						clip-rule="evenodd"
					/>
				</svg>
				<div class="ml-3">
					<p class="text-sm font-medium">{successMessage}</p>
				</div>
			</div>
		</div>
	{/if}

	{#if errorMessage}
		<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
			<div class="flex">
				<svg class="flex-shrink-0 h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
						clip-rule="evenodd"
					/>
				</svg>
				<div class="ml-3">
					<p class="text-sm font-medium">{errorMessage}</p>
				</div>
			</div>
		</div>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- Left Column: Account Info -->
		<div class="lg:col-span-2 space-y-6">
			<!-- Personal Information -->
			<Card>
				<CardHeader>
					<CardTitle>Personal Information</CardTitle>
					<CardDescription>Update your personal details and contact information</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						method="POST"
						action="?/updateProfile"
						use:enhance={() => {
							loading = true;
							return async ({ update }) => {
								loading = false;
								await update();
							};
						}}
					>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div class="space-y-2">
								<Label for="email">Email Address</Label>
								<Input
									id="email"
									name="email"
									type="email"
									bind:value={profile.email}
									disabled
									class="bg-muted"
								/>
								<p class="text-xs text-muted-foreground">
									Email cannot be changed. Contact your administrator if needed.
								</p>
							</div>

							<div class="space-y-2">
								<Label for="role">Role</Label>
								<div class="flex items-center space-x-2">
									<Badge variant={getRoleBadgeVariant(profile.role)}>
										{formatRoleName(profile.role)}
									</Badge>
								</div>
								<p class="text-xs text-muted-foreground">
									Role is managed by your organization administrator.
								</p>
							</div>

							<div class="space-y-2">
								<Label for="organization">Organization</Label>
								<Input
									id="organization"
									value={data.organization?.name || 'Unknown Organization'}
									disabled
									class="bg-muted"
								/>
							</div>

							<div class="space-y-2">
								<Label for="member_since">Member Since</Label>
								<Input
									id="member_since"
									value={formatDate(profile.created_at, 'date')}
									disabled
									class="bg-muted"
								/>
							</div>
						</div>

						<Separator class="my-6" />

						<div class="flex justify-end">
							<Button type="submit" disabled={loading}>
								{#if loading}
									<svg
										class="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											class="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											stroke-width="4"
										></circle>
										<path
											class="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										></path>
									</svg>
									Saving...
								{:else}
									Save Changes
								{/if}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			<!-- App Preferences -->
			<Card>
				<CardHeader>
					<CardTitle>App Preferences</CardTitle>
					<CardDescription>Customize your experience and notification settings</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						method="POST"
						action="?/updatePreferences"
						use:enhance={() => {
							loading = true;
							return async ({ update }) => {
								loading = false;
								await update();
							};
						}}
					>
						<div class="space-y-6">
							<!-- Theme Settings -->
							<div class="flex items-center justify-between">
								<div class="space-y-0.5">
									<Label class="text-base font-medium">Dark Mode</Label>
									<p class="text-sm text-muted-foreground">Switch between light and dark themes</p>
								</div>
								<Switch
									name="darkMode"
									checked={preferences.darkMode || false}
									onCheckedChange={(checked) => {
										preferences.darkMode = checked;
									}}
								/>
							</div>

							<Separator />

							<!-- Notification Settings -->
							<div class="space-y-4">
								<div class="flex items-center justify-between">
									<div class="space-y-0.5">
										<Label class="text-base font-medium">Email Notifications</Label>
										<p class="text-sm text-muted-foreground">
											Receive emails when ID cards are generated
										</p>
									</div>
									<Switch
										name="emailNotifications"
										checked={preferences.emailNotifications !== false}
										onCheckedChange={(checked) => {
											preferences.emailNotifications = checked;
										}}
									/>
								</div>

								<div class="flex items-center justify-between">
									<div class="space-y-0.5">
										<Label class="text-base font-medium">Admin Notifications</Label>
										<p class="text-sm text-muted-foreground">
											Receive notifications about system updates and admin tasks
										</p>
									</div>
									<Switch
										name="adminNotifications"
										checked={preferences.adminNotifications !== false}
										onCheckedChange={(checked) => {
											preferences.adminNotifications = checked;
										}}
										disabled={!['super_admin', 'org_admin', 'id_gen_admin'].includes(profile.role)}
									/>
								</div>
							</div>

							<Separator />

							<!-- Default Template -->
							<div class="space-y-2">
								<Label for="defaultTemplate">Default Template</Label>
								<select
									id="defaultTemplate"
									name="defaultTemplate"
									bind:value={preferences.defaultTemplate}
									class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								>
									<option value="">Select a default template</option>
									{#each data.templates || [] as template}
										{@const t = template as any}
										<option value={t.id}>{t.name}</option>
									{/each}
								</select>
								<p class="text-xs text-muted-foreground">
									This template will be pre-selected when creating new ID cards.
								</p>
							</div>
						</div>

						<Separator class="my-6" />

						<div class="flex justify-end">
							<Button type="submit" disabled={loading}>
								{#if loading}
									<svg
										class="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											class="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											stroke-width="4"
										></circle>
										<path
											class="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										></path>
									</svg>
									Saving...
								{:else}
									Save Preferences
								{/if}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			<!-- Security Settings -->
			<Card>
				<CardHeader>
					<CardTitle>Security</CardTitle>
					<CardDescription>Manage your password and security settings</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						method="POST"
						action="?/changePassword"
						use:enhance={() => {
							loading = true;
							return async ({ update, formElement }) => {
								loading = false;
								await update();
								// Clear password fields on success
								if (formElement && !formElement.dataset.error) {
									formElement.reset();
								}
							};
						}}
					>
						<div class="space-y-4">
							<div class="space-y-2">
								<Label for="currentPassword">Current Password</Label>
								<Input
									id="currentPassword"
									name="currentPassword"
									type="password"
									required
									autocomplete="current-password"
								/>
							</div>

							<div class="space-y-2">
								<Label for="newPassword">New Password</Label>
								<Input
									id="newPassword"
									name="newPassword"
									type="password"
									required
									autocomplete="new-password"
								/>
							</div>

							<div class="space-y-2">
								<Label for="confirmPassword">Confirm New Password</Label>
								<Input
									id="confirmPassword"
									name="confirmPassword"
									type="password"
									required
									autocomplete="new-password"
								/>
							</div>
						</div>

						<Separator class="my-6" />

						<div class="flex justify-end">
							<Button type="submit" disabled={loading}>
								{#if loading}
									<svg
										class="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											class="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											stroke-width="4"
										></circle>
										<path
											class="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										></path>
									</svg>
									Updating Password...
								{:else}
									Update Password
								{/if}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>

		<!-- Right Column: Account Actions -->
		<div class="space-y-6">
			<!-- Account Overview -->
			<Card>
				<CardHeader>
					<CardTitle>Account Overview</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="flex items-center justify-between">
						<span class="text-sm text-muted-foreground">Status</span>
						<Badge variant="default">Active</Badge>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-muted-foreground">Last Login</span>
						<span class="text-sm">{formatDate(profile.updated_at, 'date')}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-muted-foreground">ID Cards Created</span>
						<span class="text-sm">{data.userStats?.cardsCreated || 0}</span>
					</div>
				</CardContent>
			</Card>

			<!-- Account Actions -->
			<Card>
				<CardHeader>
					<CardTitle>Account Actions</CardTitle>
					<CardDescription>Manage your account data and settings</CardDescription>
				</CardHeader>
				<CardContent class="space-y-3">
					<Button href="/auth/reset-password" variant="outline" class="w-full justify-start">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 mr-2"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 7a2 2 0 012 2m4 0a6 6 0 01-6 6c-3 0-5.197-1.756-6.586-4M7 7a2 2 0 012-2m0 0c0-3-1-5-3-5s-3 2-3 5m3-5v4m-3-1h6m-2-3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						Reset Password via Email
					</Button>

					<form method="POST" action="?/exportData">
						<Button type="submit" variant="outline" class="w-full justify-start">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4 mr-2"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
							Download My Data
						</Button>
					</form>

					<Separator />

					<form method="POST" action="?/deleteAccount">
						<Button type="submit" variant="destructive" class="w-full justify-start">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4 mr-2"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
							Delete Account
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	</div>
</div>
