<script lang="ts">
	import { FileText, Plus, Search, X, Copy, Pencil, Check } from 'lucide-svelte';

	interface Template {
		id: string;
		name: string;
		content: string;
		category: string;
		tags: string[];
	}

	const categoryConfig: Record<string, { bg: string; text: string }> = {
		Greeting: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
		Pricing: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
		Booking: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
		Aftercare: { bg: 'bg-purple-500/10', text: 'text-purple-500' },
		Hours: { bg: 'bg-cyan-500/10', text: 'text-cyan-500' },
		Fallback: { bg: 'bg-red-500/10', text: 'text-red-500' }
	};

	let templates = $state<Template[]>([
		{
			id: 't1',
			name: 'Welcome Message',
			content: "Hey there! Thanks for reaching out. I'm the studio's booking assistant. How can I help you today? You can ask about bookings, pricing, our portfolio, or aftercare.",
			category: 'Greeting',
			tags: ['welcome', 'intro', 'first-message']
		},
		{
			id: 't2',
			name: 'Price Estimate',
			content: "Our pricing depends on the style, size, and complexity of the design. Small pieces (2-4 inches) start around P2,000-P5,000. Medium (5-7 inches) range from P5,000-P12,000. Large pieces and sleeves are quoted after consultation. A 30% deposit is required to secure your slot.",
			category: 'Pricing',
			tags: ['cost', 'rates', 'deposit']
		},
		{
			id: 't3',
			name: 'Booking Confirmation',
			content: "Your booking request has been received! Here's what happens next:\n\n1. Our artist will review your design concept\n2. You'll receive a quote within 24 hours\n3. Once approved, a 30% deposit secures your slot\n4. We'll confirm your final date and time\n\nFeel free to reach out if you have any questions!",
			category: 'Booking',
			tags: ['confirm', 'next-steps', 'deposit']
		},
		{
			id: 't4',
			name: 'Aftercare Instructions',
			content: "Congrats on your new ink! Here's how to take care of it:\n\n- Keep the wrap on for 2-4 hours\n- Wash gently with mild soap and lukewarm water\n- Apply a thin layer of unscented moisturizer 2-3 times daily\n- Avoid sunlight, swimming, and soaking for 2 weeks\n- Never pick or scratch the healing skin\n\nHealing takes 2-4 weeks. If you notice unusual redness or swelling, reach out immediately.",
			category: 'Aftercare',
			tags: ['healing', 'post-session', 'instructions']
		},
		{
			id: 't5',
			name: 'Studio Hours',
			content: "We're open:\nTuesday - Sunday: 11:00 AM - 9:00 PM\nMonday: Closed\n\nWalk-ins are welcome but we recommend booking in advance to guarantee your preferred time slot and artist.",
			category: 'Hours',
			tags: ['schedule', 'open', 'walk-in']
		},
		{
			id: 't6',
			name: 'Fallback Response',
			content: "Thanks for your message! I'm not quite sure how to help with that. Let me connect you with one of our artists who can assist you better. Someone will get back to you shortly!",
			category: 'Fallback',
			tags: ['unknown', 'handoff', 'default']
		},
		{
			id: 't7',
			name: 'Cancellation Policy',
			content: "We understand plans change! Here's our cancellation policy:\n\n- 48+ hours notice: Full deposit refund\n- 24-48 hours notice: 50% deposit retained\n- Less than 24 hours or no-show: Deposit forfeited\n\nTo reschedule, just let us know at least 48 hours in advance and we'll find a new slot for you.",
			category: 'Booking',
			tags: ['cancel', 'reschedule', 'no-show', 'refund']
		},
		{
			id: 't8',
			name: 'Consultation Invite',
			content: "We'd love to discuss your design idea in more detail! We offer free 15-minute consultations where you can:\n\n- Discuss your concept with the artist\n- Get size and placement advice\n- See similar work from our portfolio\n- Get an accurate quote\n\nWould you like to schedule a consultation? Just let me know your preferred date!",
			category: 'Booking',
			tags: ['consult', 'free', 'design-discussion']
		}
	]);

	let searchQuery = $state('');
	let selectedCategory = $state<string | null>(null);
	let editingId = $state<string | null>(null);
	let copiedId = $state<string | null>(null);
	let showCreateForm = $state(false);
	let newName = $state('');
	let newContent = $state('');
	let newCategory = $state('Greeting');
	let newTags = $state('');

	const categories = Object.keys(categoryConfig);

	let filteredTemplates = $derived(
		templates.filter((t) => {
			const matchesSearch = !searchQuery ||
				t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				t.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
				t.tags.some((tag) => tag.includes(searchQuery.toLowerCase()));
			const matchesCategory = !selectedCategory || t.category === selectedCategory;
			return matchesSearch && matchesCategory;
		})
	);

	function copyToClipboard(id: string, content: string) {
		navigator.clipboard.writeText(content);
		copiedId = id;
		setTimeout(() => { copiedId = null; }, 2000);
	}

	function createTemplate() {
		if (!newName.trim() || !newContent.trim()) return;
		templates = [
			...templates,
			{
				id: `t-${Date.now()}`,
				name: newName.trim(),
				content: newContent.trim(),
				category: newCategory,
				tags: newTags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
			}
		];
		newName = '';
		newContent = '';
		newTags = '';
		showCreateForm = false;
	}
</script>

<div class="p-6 lg:p-8">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
		<div>
			<h1 class="text-3xl lg:text-4xl font-display font-bold text-foreground uppercase tracking-wider">Templates</h1>
			<p class="text-muted-foreground mt-1">Reply templates for common tattoo studio conversations</p>
		</div>
		<button
			onclick={() => (showCreateForm = !showCreateForm)}
			class="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition shadow-lg shadow-primary/20"
		>
			<Plus class="w-4 h-4" />
			Create Template
		</button>
	</div>

	<!-- Search + Filter -->
	<div class="flex flex-col sm:flex-row gap-3 mb-6">
		<div class="relative flex-1">
			<Search class="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
			<input
				type="text"
				placeholder="Search templates..."
				bind:value={searchQuery}
				class="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition font-mono text-sm"
			/>
		</div>
		<div class="flex flex-wrap gap-1.5">
			<button
				onclick={() => (selectedCategory = null)}
				class="px-3 py-1.5 rounded-lg text-xs font-medium transition {!selectedCategory ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}"
			>
				All
			</button>
			{#each categories as cat (cat)}
				<button
					onclick={() => (selectedCategory = selectedCategory === cat ? null : cat)}
					class="px-3 py-1.5 rounded-lg text-xs font-medium transition {selectedCategory === cat ? categoryConfig[cat].bg + ' ' + categoryConfig[cat].text + ' ring-1 ring-current' : 'bg-muted text-muted-foreground hover:text-foreground'}"
				>
					{cat}
				</button>
			{/each}
		</div>
	</div>

	<!-- Create Form -->
	{#if showCreateForm}
		<div class="bg-card border border-primary/30 rounded-xl p-5 mb-6">
			<h3 class="font-display font-semibold text-foreground text-sm uppercase tracking-wide mb-4">New Template</h3>
			<div class="space-y-4">
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Template Name</label>
						<input
							type="text"
							bind:value={newName}
							placeholder="e.g. Follow-up Message"
							class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
						/>
					</div>
					<div>
						<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Category</label>
						<select
							bind:value={newCategory}
							class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
						>
							{#each categories as cat (cat)}
								<option value={cat}>{cat}</option>
							{/each}
						</select>
					</div>
				</div>
				<div>
					<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Content</label>
					<textarea
						bind:value={newContent}
						rows={4}
						placeholder="Write your template message..."
						class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono resize-none"
					></textarea>
				</div>
				<div>
					<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Tags (comma separated)</label>
					<input
						type="text"
						bind:value={newTags}
						placeholder="e.g. follow-up, reminder, check-in"
						class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
					/>
				</div>
				<div class="flex justify-end gap-2 pt-2">
					<button
						onclick={() => { showCreateForm = false; }}
						class="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition"
					>
						Cancel
					</button>
					<button
						onclick={createTemplate}
						disabled={!newName.trim() || !newContent.trim()}
						class="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Save Template
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Template Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
		{#each filteredTemplates as template (template.id)}
			<div class="bg-card border border-border rounded-xl p-4 lg:p-5 hover:border-primary/30 transition-all group">
				<div class="flex items-start justify-between gap-3 mb-3">
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 mb-1">
							<h3 class="font-medium text-foreground text-sm group-hover:text-primary transition-colors truncate">{template.name}</h3>
							<span class="shrink-0 text-[10px] font-mono font-semibold px-2 py-0.5 rounded {categoryConfig[template.category]?.bg || 'bg-muted'} {categoryConfig[template.category]?.text || 'text-muted-foreground'}">
								{template.category}
							</span>
						</div>
					</div>
					<div class="flex items-center gap-1 shrink-0">
						<button
							onclick={() => copyToClipboard(template.id, template.content)}
							class="p-1.5 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"
							title="Copy"
						>
							{#if copiedId === template.id}
								<Check class="w-4 h-4 text-emerald-500" />
							{:else}
								<Copy class="w-4 h-4" />
							{/if}
						</button>
						<button
							onclick={() => (editingId = editingId === template.id ? null : template.id)}
							class="p-1.5 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"
							title="Edit"
						>
							<Pencil class="w-4 h-4" />
						</button>
					</div>
				</div>

				{#if editingId === template.id}
					<textarea
						bind:value={template.content}
						rows={5}
						class="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono resize-none mb-3"
					></textarea>
				{:else}
					<p class="text-xs text-muted-foreground font-mono line-clamp-3 mb-3 whitespace-pre-line">{template.content}</p>
				{/if}

				<div class="flex flex-wrap gap-1">
					{#each template.tags as tag (tag)}
						<span class="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
							{tag}
						</span>
					{/each}
				</div>
			</div>
		{/each}

		{#if filteredTemplates.length === 0}
			<div class="col-span-full text-center py-12 text-muted-foreground">
				<FileText class="w-10 h-10 mx-auto mb-3 opacity-30" />
				<p class="font-mono text-sm">No templates found</p>
			</div>
		{/if}
	</div>
</div>
