<script lang="ts">
	import { page } from '$app/stores';
	import { labels } from '$lib/services/api';
	import type { Label } from '$lib/types/issue';
	import { onMount } from 'svelte';

	const owner = $derived($page.params.owner!);
	const repo = $derived($page.params.repo!);

	let items = $state<Label[]>([]);
	let loading = $state(true);
	let showForm = $state(false);
	let name = $state('');
	let color = $state('#0075ca');
	let description = $state('');
	let submitting = $state(false);

	onMount(() => fetchLabels());

	async function fetchLabels() {
		loading = true;
		try {
			items = await labels.list(owner, repo);
		} catch {
			items = [];
		} finally {
			loading = false;
		}
	}

	async function handleCreate(e: Event) {
		e.preventDefault();
		if (!name) return;
		submitting = true;
		try {
			await labels.create(owner, repo, { name, color, description });
			name = ''; color = '#0075ca'; description = '';
			showForm = false;
			await fetchLabels();
		} catch {
			// ignore
		} finally {
			submitting = false;
		}
	}

	async function handleDelete(id: number) {
		if (!confirm('Delete this label?')) return;
		try {
			await labels.remove(owner, repo, id);
			await fetchLabels();
		} catch {
			// ignore
		}
	}
</script>

<div class="flex flex-col gap-5">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<h2 class="text-lg font-semibold" style="color: var(--color-text);">Labels</h2>
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
				New Label
			{/if}
		</button>
	</div>

	{#if showForm}
		<form onsubmit={handleCreate} class="rounded-xl border p-5 flex flex-col gap-4" style="border-color: var(--color-border); background-color: var(--color-surface);">
			<div class="flex items-end gap-3">
				<div class="flex-1">
					<label class="block text-xs font-medium mb-2" style="color: var(--color-text-dim);">Label name</label>
					<input type="text" bind:value={name} placeholder="e.g. bug, enhancement, help wanted" class="w-full px-3.5 py-2.5 text-sm rounded-xl border transition-colors focus:border-[var(--color-primary)]" style="border-color: var(--color-border); background-color: var(--color-background); color: var(--color-text);" />
				</div>
				<div>
					<label class="block text-xs font-medium mb-2" style="color: var(--color-text-dim);">Color</label>
					<div class="flex items-center gap-2">
						<input type="color" bind:value={color} class="w-10 h-10 rounded-xl cursor-pointer border-0 p-0.5" />
						<span class="text-xs font-mono" style="color: var(--color-text-dim);">{color}</span>
					</div>
				</div>
			</div>
			<div>
				<label class="block text-xs font-medium mb-2" style="color: var(--color-text-dim);">Description (optional)</label>
				<input type="text" bind:value={description} placeholder="Describe this label..." class="w-full px-3.5 py-2.5 text-sm rounded-xl border transition-colors focus:border-[var(--color-primary)]" style="border-color: var(--color-border); background-color: var(--color-background); color: var(--color-text);" />
			</div>
			<div class="flex items-center gap-3">
				<div class="flex items-center gap-2">
					<span class="text-xs font-medium px-3 py-1.5 rounded-full text-white" style="background-color: {color};">{name || 'Preview'}</span>
				</div>
				<button type="submit" disabled={submitting || !name} class="ml-auto px-5 py-2 text-sm font-medium rounded-xl text-white disabled:opacity-40 transition-all hover:brightness-110" style="background-color: var(--color-primary);">
					{submitting ? 'Creating...' : 'Create Label'}
				</button>
			</div>
		</form>
	{/if}

	{#if loading}
		<div class="py-12 text-center text-sm" style="color: var(--color-text-dim);">Loading labels...</div>
	{:else if items.length === 0 && !showForm}
		<div class="rounded-xl border p-16 text-center" style="border-color: var(--color-border);">
			<svg class="w-12 h-12 mx-auto mb-4 opacity-15" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
			</svg>
			<p class="text-sm font-medium mb-1" style="color: var(--color-text);">No labels yet</p>
			<p class="text-xs" style="color: var(--color-text-dim);">Labels help you organize and filter issues.</p>
		</div>
	{:else if items.length > 0}
		<div class="rounded-xl border overflow-hidden" style="border-color: var(--color-border);">
			{#each items as label, i}
				<div class="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-[var(--color-surface)] {i > 0 ? 'border-t' : ''}" style="border-color: var(--color-border);">
					<div class="flex items-center gap-3 min-w-0">
						<span class="text-xs font-medium px-3 py-1 rounded-full text-white shrink-0" style="background-color: {label.color};">{label.name}</span>
						{#if label.description}
							<p class="text-xs truncate" style="color: var(--color-text-dim);">{label.description}</p>
						{/if}
					</div>
					<button
						class="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-red-500/10 shrink-0 ml-3"
						style="border-color: var(--color-border); color: var(--color-error);"
						onclick={() => handleDelete(label.id)}
					>
						Delete
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>
