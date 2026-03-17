<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogFooter,
		DialogDescription
	} from '$lib/components/ui/dialog';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select';
	import {
		Plus,
		Trash2,
		FileText,
		Download,
		Search,
		Check,
		X,
		Building2,
		GraduationCap,
		Landmark,
		Filter,
		Pencil,
		Circle
	} from '@lucide/svelte';
	import { addTarget, updateTarget, deleteTarget } from '$lib/remote/pipeline.remote';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	// --- State ---
	let showAddModal = $state(false);
	let editTarget = $state<(typeof data.targets)[0] | null>(null);
	let filterType = $state<string>('all');
	let filterStatus = $state<string>('all');
	let searchQuery = $state('');
	let submitting = $state(false);
	let deleting = $state(false);

	// Add/Edit target form
	let form = $state({
		name: '',
		org: '',
		type: 'school' as 'school' | 'company' | 'government',
		contactPerson: '',
		contactEmail: '',
		contactPhone: '',
		notes: ''
	});

	// Delete confirmation
	let deleteId = $state<string | null>(null);

	// --- Derived ---
	let filteredTargets = $derived.by(() => {
		let result = data.targets;

		if (filterType !== 'all') {
			result = result.filter((t) => t.type === filterType);
		}

		if (filterStatus === 'needs_research') {
			result = result.filter((t) => !t.researchedAt);
		} else if (filterStatus === 'needs_pdf') {
			result = result.filter((t) => t.researchedAt && !t.pdfPath);
		} else if (filterStatus === 'complete') {
			result = result.filter((t) => t.researchedAt && t.mdPath && t.pdfPath);
		}

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(t) =>
					t.name.toLowerCase().includes(q) ||
					t.org.toLowerCase().includes(q) ||
					(t.contactPerson && t.contactPerson.toLowerCase().includes(q))
			);
		}

		return result;
	});

	let stats = $derived({
		total: data.targets.length,
		researched: data.targets.filter((t) => t.researchedAt).length,
		withMd: data.targets.filter((t) => t.mdPath).length,
		withPdf: data.targets.filter((t) => t.pdfPath).length
	});

	// --- Actions ---
	function resetForm() {
		form = {
			name: '',
			org: '',
			type: 'school',
			contactPerson: '',
			contactEmail: '',
			contactPhone: '',
			notes: ''
		};
	}

	function openEdit(target: (typeof data.targets)[0]) {
		editTarget = target;
		form = {
			name: target.name,
			org: target.org,
			type: target.type,
			contactPerson: target.contactPerson || '',
			contactEmail: target.contactEmail || '',
			contactPhone: target.contactPhone || '',
			notes: target.notes || ''
		};
	}

	function closeEdit() {
		editTarget = null;
		resetForm();
	}

	async function handleAdd() {
		submitting = true;
		try {
			await addTarget(form);
			showAddModal = false;
			resetForm();
			await invalidateAll();
			toast.success('Target added to pipeline');
		} catch (err) {
			console.error('Failed to add target:', err);
			toast.error('Failed to add target. Please try again.');
		} finally {
			submitting = false;
		}
	}

	async function handleEdit() {
		if (!editTarget) return;
		submitting = true;
		try {
			await updateTarget({ id: editTarget.id, ...form });
			editTarget = null;
			resetForm();
			await invalidateAll();
			toast.success('Target updated');
		} catch (err) {
			console.error('Failed to update target:', err);
			toast.error('Failed to update target.');
		} finally {
			submitting = false;
		}
	}

	async function handleDelete(id: string) {
		deleting = true;
		try {
			await deleteTarget(id);
			deleteId = null;
			await invalidateAll();
			toast.success('Target removed from pipeline');
		} catch (err) {
			console.error('Failed to delete target:', err);
			toast.error('Failed to delete target.');
		} finally {
			deleting = false;
		}
	}

	function formatDate(date: string | Date | null): string {
		if (!date) return '—';
		return new Date(date).toLocaleDateString('en-PH', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function getTypeIcon(type: string) {
		switch (type) {
			case 'school':
				return GraduationCap;
			case 'company':
				return Building2;
			case 'government':
				return Landmark;
			default:
				return Building2;
		}
	}

	function getTypeBadgeVariant(type: string): 'default' | 'secondary' | 'outline' | 'destructive' {
		switch (type) {
			case 'school':
				return 'default';
			case 'company':
				return 'secondary';
			case 'government':
				return 'outline';
			default:
				return 'secondary';
		}
	}

	function getProgressDots(target: (typeof data.targets)[0]) {
		return [
			{ done: !!target.researchedAt, label: 'Researched' },
			{ done: !!target.mdPath, label: 'MD' },
			{ done: !!target.pdfPath, label: 'PDF' }
		];
	}
</script>

<svelte:head>
	<title>Sales Pipeline | Kanaya Admin</title>
</svelte:head>

<div class="max-w-7xl mx-auto space-y-6 pb-12">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">Sales Pipeline</h1>
			<p class="text-muted-foreground">Research targets, generate proposals, track pipeline status</p>
		</div>
		<Button onclick={() => (showAddModal = true)}>
			<Plus class="h-4 w-4 mr-2" />
			Add Target
		</Button>
	</div>

	<!-- Stats Row -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
		<div class="border rounded-lg p-4">
			<div class="text-sm text-muted-foreground">Total Targets</div>
			<div class="text-2xl font-bold">{stats.total}</div>
		</div>
		<div class="border rounded-lg p-4">
			<div class="text-sm text-muted-foreground">Researched</div>
			<div class="text-2xl font-bold text-blue-600">{stats.researched}</div>
		</div>
		<div class="border rounded-lg p-4">
			<div class="text-sm text-muted-foreground">MD Generated</div>
			<div class="text-2xl font-bold text-amber-600">{stats.withMd}</div>
		</div>
		<div class="border rounded-lg p-4">
			<div class="text-sm text-muted-foreground">PDF Ready</div>
			<div class="text-2xl font-bold text-green-600">{stats.withPdf}</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="flex flex-wrap items-center gap-3">
		<div class="relative flex-1 min-w-[200px] max-w-sm">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
			<Input
				bind:value={searchQuery}
				placeholder="Search targets..."
				class="pl-9"
			/>
		</div>
		<div class="flex items-center gap-2">
			<Filter class="h-4 w-4 text-muted-foreground" />
			<Select type="single" value={filterType} onValueChange={(v) => { if (v) filterType = v; }}>
				<SelectTrigger class="w-[140px]">
					{filterType === 'all' ? 'All Types' : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All Types</SelectItem>
					<SelectItem value="school">School</SelectItem>
					<SelectItem value="company">Company</SelectItem>
					<SelectItem value="government">Government</SelectItem>
				</SelectContent>
			</Select>
			<Select type="single" value={filterStatus} onValueChange={(v) => { if (v) filterStatus = v; }}>
				<SelectTrigger class="w-[160px]">
					{filterStatus === 'all' ? 'All Status' :
					 filterStatus === 'needs_research' ? 'Needs Research' :
					 filterStatus === 'needs_pdf' ? 'Needs PDF' : 'Complete'}
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All Status</SelectItem>
					<SelectItem value="needs_research">Needs Research</SelectItem>
					<SelectItem value="needs_pdf">Needs PDF</SelectItem>
					<SelectItem value="complete">Complete</SelectItem>
				</SelectContent>
			</Select>
		</div>
	</div>

	<!-- Table -->
	<div class="border rounded-lg overflow-hidden">
		<!-- Desktop table -->
		<div class="hidden md:block overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b bg-muted/50">
						<th class="text-left px-4 py-3 font-medium">Name</th>
						<th class="text-left px-4 py-3 font-medium">Organization</th>
						<th class="text-left px-4 py-3 font-medium">Type</th>
						<th class="text-center px-4 py-3 font-medium">Progress</th>
						<th class="text-left px-4 py-3 font-medium">Added</th>
						<th class="text-right px-4 py-3 font-medium">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#if filteredTargets.length === 0}
						<tr>
							<td colspan="6" class="px-4 py-12 text-center text-muted-foreground">
								{#if data.targets.length === 0}
									No targets yet. Click "Add Target" to get started.
								{:else}
									No targets match your filters.
								{/if}
							</td>
						</tr>
					{/if}
					{#each filteredTargets as target (target.id)}
						{@const TypeIcon = getTypeIcon(target.type)}
						{@const progress = getProgressDots(target)}
						<tr class="border-b hover:bg-muted/30 transition-colors">
							<td class="px-4 py-3">
								<div class="font-medium">{target.name}</div>
								{#if target.contactPerson}
									<div class="text-xs text-muted-foreground">{target.contactPerson}</div>
								{/if}
							</td>
							<td class="px-4 py-3">{target.org}</td>
							<td class="px-4 py-3">
								<Badge variant={getTypeBadgeVariant(target.type)}>
									<TypeIcon class="h-3 w-3 mr-1" />
									{target.type}
								</Badge>
							</td>
							<td class="px-4 py-3">
								<div class="flex items-center justify-center gap-1.5" title={progress.map(p => `${p.label}: ${p.done ? 'Done' : 'Pending'}`).join(' | ')}>
									{#each progress as step}
										{#if step.done}
											<div class="h-2.5 w-2.5 rounded-full bg-green-500" title={step.label}></div>
										{:else}
											<div class="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" title={step.label}></div>
										{/if}
									{/each}
								</div>
							</td>
							<td class="px-4 py-3 text-muted-foreground">
								{formatDate(target.createdAt)}
							</td>
							<td class="px-4 py-3">
								<div class="flex items-center justify-end gap-1">
									{#if target.mdPath}
										<Button variant="ghost" size="sm" href={target.mdPath} target="_blank" title="View Markdown">
											<FileText class="h-4 w-4" />
										</Button>
									{/if}
									{#if target.pdfPath}
										<Button variant="ghost" size="sm" href={target.pdfPath} target="_blank" title="Download PDF">
											<Download class="h-4 w-4" />
										</Button>
									{/if}
									<Button
										variant="ghost"
										size="sm"
										onclick={() => openEdit(target)}
										title="Edit target"
									>
										<Pencil class="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onclick={() => (deleteId = target.id)}
										title="Delete target"
									>
										<Trash2 class="h-4 w-4 text-red-500" />
									</Button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Mobile card view -->
		<div class="md:hidden divide-y">
			{#if filteredTargets.length === 0}
				<div class="px-4 py-12 text-center text-muted-foreground">
					{#if data.targets.length === 0}
						No targets yet. Click "Add Target" to get started.
					{:else}
						No targets match your filters.
					{/if}
				</div>
			{/if}
			{#each filteredTargets as target (target.id)}
				{@const TypeIcon = getTypeIcon(target.type)}
				{@const progress = getProgressDots(target)}
				<div class="p-4 space-y-3">
					<div class="flex items-start justify-between">
						<div>
							<div class="font-medium">{target.name}</div>
							<div class="text-sm text-muted-foreground">{target.org}</div>
							{#if target.contactPerson}
								<div class="text-xs text-muted-foreground">{target.contactPerson}</div>
							{/if}
						</div>
						<Badge variant={getTypeBadgeVariant(target.type)}>
							<TypeIcon class="h-3 w-3 mr-1" />
							{target.type}
						</Badge>
					</div>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<span class="text-xs text-muted-foreground">Progress:</span>
							<div class="flex items-center gap-1.5">
								{#each progress as step}
									{#if step.done}
										<div class="h-2.5 w-2.5 rounded-full bg-green-500" title={step.label}></div>
									{:else}
										<div class="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" title={step.label}></div>
									{/if}
								{/each}
							</div>
						</div>
						<span class="text-xs text-muted-foreground">{formatDate(target.createdAt)}</span>
					</div>
					<div class="flex items-center gap-1">
						{#if target.mdPath}
							<Button variant="ghost" size="sm" href={target.mdPath} target="_blank" title="View MD">
								<FileText class="h-4 w-4 mr-1" /> MD
							</Button>
						{/if}
						{#if target.pdfPath}
							<Button variant="ghost" size="sm" href={target.pdfPath} target="_blank" title="Download PDF">
								<Download class="h-4 w-4 mr-1" /> PDF
							</Button>
						{/if}
						<div class="flex-1"></div>
						<Button variant="ghost" size="sm" onclick={() => openEdit(target)} title="Edit">
							<Pencil class="h-4 w-4" />
						</Button>
						<Button variant="ghost" size="sm" onclick={() => (deleteId = target.id)} title="Delete">
							<Trash2 class="h-4 w-4 text-red-500" />
						</Button>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<!-- Add Target Modal -->
<Dialog bind:open={showAddModal}>
	<DialogContent class="sm:max-w-lg">
		<DialogHeader>
			<DialogTitle>Add Pipeline Target</DialogTitle>
			<DialogDescription>Add a new school, company, or government org to the sales pipeline.</DialogDescription>
		</DialogHeader>
		<form onsubmit={(e) => { e.preventDefault(); handleAdd(); }} class="space-y-4">
			<div class="grid grid-cols-2 gap-4">
				<div class="col-span-2">
					<Label for="add-org">Organization Name</Label>
					<Input id="add-org" bind:value={form.org} placeholder="e.g. Holy Name University" required />
				</div>
				<div>
					<Label for="add-name">Contact / Decision Maker</Label>
					<Input id="add-name" bind:value={form.name} placeholder="e.g. Dr. Francisco Rojas" required />
				</div>
				<div>
					<Label for="add-type">Type</Label>
					<Select type="single" value={form.type} onValueChange={(v) => { if (v) form.type = v as typeof form.type; }}>
						<SelectTrigger class="w-full">
							{form.type.charAt(0).toUpperCase() + form.type.slice(1)}
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="school">School</SelectItem>
							<SelectItem value="company">Company</SelectItem>
							<SelectItem value="government">Government</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>
			<div>
				<Label for="add-contactPerson">Contact Person</Label>
				<Input id="add-contactPerson" bind:value={form.contactPerson} placeholder="e.g. Ma'am Rosie, Registrar" />
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<Label for="add-contactEmail">Email</Label>
					<Input id="add-contactEmail" type="email" bind:value={form.contactEmail} placeholder="registrar@hnu.edu.ph" />
				</div>
				<div>
					<Label for="add-contactPhone">Phone</Label>
					<Input id="add-contactPhone" bind:value={form.contactPhone} placeholder="0917-XXX-XXXX" />
				</div>
			</div>
			<div>
				<Label for="add-notes">Notes</Label>
				<textarea
					id="add-notes"
					bind:value={form.notes}
					placeholder="Any relevant notes about this target..."
					class="w-full border rounded-md px-3 py-2 text-sm bg-background min-h-[80px] resize-y"
				></textarea>
			</div>
			<DialogFooter>
				<Button variant="outline" type="button" onclick={() => { showAddModal = false; resetForm(); }}>
					Cancel
				</Button>
				<Button type="submit" disabled={submitting || !form.name || !form.org}>
					{submitting ? 'Adding...' : 'Add Target'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>

<!-- Edit Target Modal -->
<Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) closeEdit(); }}>
	<DialogContent class="sm:max-w-lg">
		<DialogHeader>
			<DialogTitle>Edit Target</DialogTitle>
			<DialogDescription>Update target details for {editTarget?.org || 'this target'}.</DialogDescription>
		</DialogHeader>
		<form onsubmit={(e) => { e.preventDefault(); handleEdit(); }} class="space-y-4">
			<div class="grid grid-cols-2 gap-4">
				<div class="col-span-2">
					<Label for="edit-org">Organization Name</Label>
					<Input id="edit-org" bind:value={form.org} placeholder="e.g. Holy Name University" required />
				</div>
				<div>
					<Label for="edit-name">Contact / Decision Maker</Label>
					<Input id="edit-name" bind:value={form.name} placeholder="e.g. Dr. Francisco Rojas" required />
				</div>
				<div>
					<Label for="edit-type">Type</Label>
					<Select type="single" value={form.type} onValueChange={(v) => { if (v) form.type = v as typeof form.type; }}>
						<SelectTrigger class="w-full">
							{form.type.charAt(0).toUpperCase() + form.type.slice(1)}
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="school">School</SelectItem>
							<SelectItem value="company">Company</SelectItem>
							<SelectItem value="government">Government</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>
			<div>
				<Label for="edit-contactPerson">Contact Person</Label>
				<Input id="edit-contactPerson" bind:value={form.contactPerson} placeholder="e.g. Ma'am Rosie, Registrar" />
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<Label for="edit-contactEmail">Email</Label>
					<Input id="edit-contactEmail" type="email" bind:value={form.contactEmail} placeholder="registrar@hnu.edu.ph" />
				</div>
				<div>
					<Label for="edit-contactPhone">Phone</Label>
					<Input id="edit-contactPhone" bind:value={form.contactPhone} placeholder="0917-XXX-XXXX" />
				</div>
			</div>
			<div>
				<Label for="edit-notes">Notes</Label>
				<textarea
					id="edit-notes"
					bind:value={form.notes}
					placeholder="Any relevant notes about this target..."
					class="w-full border rounded-md px-3 py-2 text-sm bg-background min-h-[80px] resize-y"
				></textarea>
			</div>
			<DialogFooter>
				<Button variant="outline" type="button" onclick={closeEdit}>
					Cancel
				</Button>
				<Button type="submit" disabled={submitting || !form.name || !form.org}>
					{submitting ? 'Saving...' : 'Save Changes'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>

<!-- Delete Confirmation -->
<Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) deleteId = null; }}>
	<DialogContent class="sm:max-w-sm">
		<DialogHeader>
			<DialogTitle>Delete Target</DialogTitle>
			<DialogDescription>Are you sure? This action cannot be undone.</DialogDescription>
		</DialogHeader>
		<DialogFooter>
			<Button variant="outline" onclick={() => (deleteId = null)} disabled={deleting}>Cancel</Button>
			<Button variant="destructive" onclick={() => deleteId && handleDelete(deleteId)} disabled={deleting}>
				{deleting ? 'Deleting...' : 'Delete'}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
