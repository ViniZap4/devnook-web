<script lang="ts">
	import { page } from '$app/stores';
	import { milestones } from '$lib/services/api';
	import type { Milestone } from '$lib/types/issue';
	import { onMount } from 'svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';

	const owner = $derived($page.params.owner!);
	const repo = $derived($page.params.repo!);

	let items = $state<Milestone[]>([]);
	let loading = $state(true);
	let showForm = $state(false);
	let title = $state('');
	let description = $state('');
	let dueDate = $state('');
	let submitting = $state(false);

	let editingId = $state<number | null>(null);
	let editTitle = $state('');
	let editDescription = $state('');
	let editDueDate = $state('');
	let editSaving = $state(false);

	onMount(() => fetchMilestones());

	async function fetchMilestones() {
		loading = true;
		try {
			items = await milestones.list(owner, repo);
		} catch {
			items = [];
		} finally {
			loading = false;
		}
	}

	async function handleCreate(e: Event) {
		e.preventDefault();
		if (!title) return;
		submitting = true;
		try {
			await milestones.create(owner, repo, { title, description, due_date: dueDate || undefined });
			title = ''; description = ''; dueDate = '';
			showForm = false;
			await fetchMilestones();
		} catch {
			// ignore
		} finally {
			submitting = false;
		}
	}

	function startEdit(m: Milestone) {
		editingId = m.id;
		editTitle = m.title;
		editDescription = m.description;
		editDueDate = m.due_date ? m.due_date.slice(0, 10) : '';
	}

	function cancelEdit() {
		editingId = null;
	}

	async function saveEdit() {
		if (!editingId || !editTitle) return;
		editSaving = true;
		try {
			await milestones.update(owner, repo, editingId, {
				title: editTitle,
				description: editDescription,
				due_date: editDueDate || undefined
			});
			await fetchMilestones();
			editingId = null;
		} catch {
			// ignore
		} finally {
			editSaving = false;
		}
	}

	async function toggleState(m: Milestone) {
		const newState = m.state === 'open' ? 'closed' : 'open';
		try {
			await milestones.update(owner, repo, m.id, { state: newState });
			await fetchMilestones();
		} catch {
			// ignore
		}
	}

	async function handleDelete(id: number) {
		if (!confirm('Delete this milestone? This action cannot be undone.')) return;
		try {
			await milestones.remove(owner, repo, id);
			await fetchMilestones();
		} catch {
			// ignore
		}
	}
</script>

<div class="flex flex-col gap-5">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<h2 class="text-lg font-semibold" style="color: var(--color-text);">Milestones</h2>
			<span class="text-xs px-2 py-0.5 rounded-full" style="background-color: var(--color-surface); color: var(--color-text-dim);">{items.length}</span>
		</div>
		<button
			class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-white transition-all hover:brightness-110"
			style="background-color: var(--color-primary);"
			onclick={() => { showForm = !showForm; }}
		>
			{#if showForm}
				Cancel
			{:else}
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
				New Milestone
			{/if}
		</button>
	</div>

	{#if showForm}
		<form onsubmit={handleCreate} class="rounded-xl border p-5 flex flex-col gap-4" style="border-color: var(--color-border); background-color: var(--color-surface);">
			<div>
				<label class="block text-xs font-medium mb-2" style="color: var(--color-text-dim);">Title</label>
				<input type="text" bind:value={title} placeholder="Milestone title" class="w-full px-3.5 py-2.5 text-sm rounded-xl border transition-colors focus:border-[var(--color-primary)]" style="border-color: var(--color-border); background-color: var(--color-background); color: var(--color-text);" />
			</div>
			<div>
				<label class="block text-xs font-medium mb-2" style="color: var(--color-text-dim);">Description (optional)</label>
				<textarea bind:value={description} placeholder="Describe this milestone..." rows={3} class="w-full px-3.5 py-2.5 text-sm rounded-xl border transition-colors focus:border-[var(--color-primary)] resize-y" style="border-color: var(--color-border); background-color: var(--color-background); color: var(--color-text);"></textarea>
			</div>
			<div>
				<label class="block text-xs font-medium mb-2" style="color: var(--color-text-dim);">Due date (optional)</label>
				<input type="date" bind:value={dueDate} class="px-3.5 py-2.5 text-sm rounded-xl border transition-colors focus:border-[var(--color-primary)]" style="border-color: var(--color-border); background-color: var(--color-background); color: var(--color-text);" />
			</div>
			<button type="submit" disabled={submitting || !title} class="self-start px-5 py-2.5 text-sm font-medium rounded-xl text-white disabled:opacity-40 transition-all hover:brightness-110" style="background-color: var(--color-primary);">{submitting ? 'Creating...' : 'Create Milestone'}</button>
		</form>
	{/if}

	{#if loading}
		<div class="py-12 text-center text-sm" style="color: var(--color-text-dim);">Loading milestones...</div>
	{:else if items.length === 0 && !showForm}
		<div class="rounded-xl border p-16 text-center" style="border-color: var(--color-border);">
			<svg class="w-12 h-12 mx-auto mb-4 opacity-15" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
			</svg>
			<p class="text-sm font-medium mb-1" style="color: var(--color-text);">No milestones yet</p>
			<p class="text-xs" style="color: var(--color-text-dim);">Milestones help you track progress on groups of issues.</p>
		</div>
	{:else if items.length > 0}
		<div class="flex flex-col gap-4">
			{#each items as milestone}
				{@const total = milestone.open_issues + milestone.closed_issues}
				{@const pct = total > 0 ? Math.round((milestone.closed_issues / total) * 100) : 0}
				<div class="rounded-xl border p-5" style="border-color: var(--color-border);">
					{#if editingId === milestone.id}
						<!-- Edit mode -->
						<div class="flex flex-col gap-3">
							<input type="text" bind:value={editTitle} placeholder="Title" class="px-3 py-2 text-sm rounded-lg border transition-colors focus:border-[var(--color-primary)]" style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text);" />
							<textarea bind:value={editDescription} placeholder="Description" rows={2} class="px-3 py-2 text-sm rounded-lg border transition-colors focus:border-[var(--color-primary)] resize-y" style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text);"></textarea>
							<input type="date" bind:value={editDueDate} class="px-3 py-2 text-sm rounded-lg border transition-colors focus:border-[var(--color-primary)] w-fit" style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text);" />
							<div class="flex items-center gap-2">
								<button class="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-[var(--color-surface-hover)]" style="border-color: var(--color-border); color: var(--color-text-dim);" onclick={cancelEdit}>Cancel</button>
								<button class="text-xs px-3 py-1.5 rounded-lg text-white disabled:opacity-40" style="background-color: var(--color-primary);" disabled={editSaving || !editTitle} onclick={saveEdit}>{editSaving ? 'Saving...' : 'Save'}</button>
							</div>
						</div>
					{:else}
						<!-- View mode -->
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<div class="flex items-center gap-2">
									<h3 class="font-semibold text-sm" style="color: var(--color-text);">{milestone.title}</h3>
									{#if milestone.state === 'closed'}
										<span class="text-[0.625rem] px-2 py-0.5 rounded-full" style="background-color: color-mix(in srgb, var(--color-error) 8%, transparent); color: var(--color-error);">Closed</span>
									{/if}
								</div>
								{#if milestone.description}
									<p class="text-xs mt-1.5" style="color: var(--color-text-dim);">{milestone.description}</p>
								{/if}
								<div class="flex items-center gap-3 text-xs mt-2" style="color: var(--color-text-dim);">
									<span>{milestone.open_issues} open</span>
									<span>{milestone.closed_issues} closed</span>
									{#if milestone.due_date}
										<span>Due <RelativeTime date={milestone.due_date} /></span>
									{/if}
									<span class="font-medium" style="color: {pct === 100 ? 'var(--color-success)' : 'var(--color-text-dim)'};">{pct}% complete</span>
								</div>
							</div>
							<div class="flex items-center gap-2 shrink-0">
								<button
									class="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-[var(--color-surface-hover)]"
									style="border-color: var(--color-border); color: var(--color-text-dim);"
									onclick={() => startEdit(milestone)}
								>Edit</button>
								<button
									class="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-[var(--color-surface-hover)]"
									style="border-color: var(--color-border); color: var(--color-text-dim);"
									onclick={() => toggleState(milestone)}
								>{milestone.state === 'open' ? 'Close' : 'Reopen'}</button>
								<button
									class="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-red-500/10"
									style="border-color: var(--color-border); color: var(--color-error);"
									onclick={() => handleDelete(milestone.id)}
								>Delete</button>
							</div>
						</div>
						<div class="mt-3 h-2 rounded-full overflow-hidden" style="background-color: var(--color-border);">
							<div class="h-full rounded-full transition-all duration-500" style="width: {pct}%; background-color: var(--color-success);"></div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
