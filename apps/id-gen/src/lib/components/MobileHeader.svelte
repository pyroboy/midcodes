<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import ThemeToggle from './ThemeToggle.svelte';

	interface Props {
		user?: any;
		onMenuToggle?: () => void;
		class?: string;
	}

	let { user, onMenuToggle, class: className = '' }: Props = $props();

	// State for dropdown menu
	let isDropdownOpen = $state(false);

	function getUserInitials(user: any): string {
		if (!user?.email) return 'U';
		return user.email.substring(0, 2).toUpperCase();
	}

	function getUserRole(user: any): string {
		if (!user?.role) return 'User';
		return user.role
			.split('_')
			.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	function isAdmin(user: any): boolean {
		return user?.role && ['super_admin', 'org_admin', 'id_gen_admin'].includes(user.role);
	}

	function toggleDropdown() {
		isDropdownOpen = !isDropdownOpen;
	}

	function closeDropdown() {
		isDropdownOpen = false;
	}

	// Handle clicks outside dropdown to close it
	function handleClickOutside(event: Event) {
		if (isDropdownOpen) {
			const target = event.target as HTMLElement;
			const dropdown = document.querySelector('.dropdown-container');
			if (dropdown && !dropdown.contains(target)) {
				closeDropdown();
			}
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<!-- Mobile Header -->
<header
	class="bg-background border-b border-border sticky top-0 z-50 transition-colors duration-200 {className}"
>
	<div class="px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between items-center h-16">
			<!-- Left: Hamburger Menu + Logo -->
			<div class="flex items-center gap-3">
				<Button
					variant="ghost"
					size="icon"
					class="lg:hidden text-muted-foreground hover:text-foreground"
					onclick={() => onMenuToggle?.()}
					aria-label="Open menu"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
				</Button>

				<a href="/" class="flex items-center gap-2">
					<div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 text-primary-foreground"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-4 0V4a2 2 0 014 0v2"
							/>
						</svg>
					</div>
					<span class="text-xl font-bold text-foreground hidden sm:block"> ID Generator </span>
				</a>
			</div>

			<!-- Right: Theme Toggle + Credits + User Account -->
			{#if user}
				<div class="flex items-center gap-2">
					<!-- Theme Toggle -->
					<ThemeToggle size="sm" variant="ghost" />

					<!-- Credits Display -->
					<div
						class="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20"
					>
						<svg class="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
							<path
								d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"
							/>
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
								clip-rule="evenodd"
							/>
						</svg>
						<span class="text-sm font-medium text-foreground">
							{user.credits ?? '---'}
						</span>
						<span class="text-xs text-muted-foreground hidden sm:inline"> credits </span>
					</div>

					<!-- User Account -->
					<div class="relative dropdown-container">
						<Button
							variant="ghost"
							class="relative h-10 w-10 rounded-full p-0"
							aria-label="User account menu"
							onclick={toggleDropdown}
						>
							<Avatar class="h-8 w-8 border border-border">
								<AvatarImage src={user?.avatar_url} alt={user?.email || 'User avatar'} />
								<AvatarFallback class="bg-primary text-primary-foreground text-sm font-medium">
									<span class="sr-only">{getUserInitials(user)}</span>
									{getUserInitials(user)}
								</AvatarFallback>
							</Avatar>
						</Button>

						{#if isDropdownOpen}
							<div
								class="absolute right-0 top-full mt-2 w-64 bg-popover text-popover-foreground rounded-lg shadow-lg border border-border z-50 py-2"
							>
								<!-- User Info -->
								<div class="px-4 py-3 border-b border-border">
									<p class="text-sm font-medium text-foreground truncate">
										{user.email}
									</p>
									<p class="text-xs text-muted-foreground truncate">
										{getUserRole(user)}
									</p>
								</div>

								<!-- Menu Items -->
								<div class="space-y-1 p-1">
									<a
										href="/profile"
										class="flex items-center px-3 py-2 text-sm rounded-md hover:bg-muted hover:text-foreground transition-colors"
										onclick={closeDropdown}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-4 w-4 mr-2 text-muted-foreground"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
											/>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
											/>
										</svg>
										Profile Settings
									</a>

									{#if isAdmin(user)}
										<a
											href="/admin"
											class="flex items-center px-3 py-2 text-sm rounded-md hover:bg-muted hover:text-foreground transition-colors"
											onclick={closeDropdown}
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-4 w-4 mr-2 text-muted-foreground"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
												/>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
												/>
											</svg>
											Admin Panel
										</a>

										{#if user?.role === 'super_admin'}
											<a
												href="/admin/credits"
												class="flex items-center px-3 py-2 text-sm rounded-md hover:bg-muted hover:text-foreground transition-colors"
												onclick={closeDropdown}
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="h-4 w-4 mr-2 text-muted-foreground"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
													/>
												</svg>
												Manage Credits
											</a>
										{/if}
									{/if}
								</div>

								<!-- Sign Out -->
								<div class="border-t border-border my-1 p-1">
									<form method="POST" action="/auth/signout" class="w-full">
										<button
											type="submit"
											class="flex w-full items-center px-3 py-2 text-sm rounded-md text-destructive hover:bg-destructive/10 transition-colors"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-4 w-4 mr-2"
												role="img"
												aria-label="Sign out"
												stroke="currentColor"
												fill="none"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
												/>
											</svg>
											Sign Out
										</button>
									</form>
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
</header>
