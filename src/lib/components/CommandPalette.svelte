<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let open = $state(false);
	let query = $state('');
	let selectedIndex = $state(0);
	let inputEl = $state<HTMLInputElement>();

	interface PaletteItem {
		label: string;
		description: string;
		action: () => void;
	}

	const allItems: PaletteItem[] = [
		{ label: 'Dashboard', description: 'Go to dashboard', action: () => goto('/dashboard') },
		{ label: 'Explore', description: 'Browse public repositories', action: () => goto('/explore') },
		{ label: 'New Repository', description: 'Create a new repository', action: () => goto('/new') },
		{ label: 'New Organization', description: 'Create a new organization', action: () => goto('/orgs/new') },
		{ label: 'Settings', description: 'Account and preferences', action: () => goto('/settings') },
	];

	let filtered = $derived(
		query.trim()
			? allItems.filter(
					(item) =>
						item.label.toLowerCase().includes(query.toLowerCase()) ||
						item.description.toLowerCase().includes(query.toLowerCase())
				)
			: allItems
	);

	$effect(() => {
		// Reset selection when filtered list changes
		const _ = filtered.length;
		selectedIndex = 0;
	});

	function handleOpen() {
		open = true;
		query = '';
		selectedIndex = 0;
		requestAnimationFrame(() => inputEl?.focus());
	}

	function handleClose() {
		open = false;
		query = '';
	}

	function handleSelect() {
		const item = filtered[selectedIndex];
		if (item) {
			item.action();
			handleClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			if (open) handleClose();
			else handleOpen();
			return;
		}

		if (!open) return;

		switch (e.key) {
			case 'Escape':
				handleClose();
				break;
			case 'ArrowDown':
			case 'j':
				if (e.key === 'j' && document.activeElement === inputEl) break;
				e.preventDefault();
				selectedIndex = (selectedIndex + 1) % Math.max(filtered.length, 1);
				break;
			case 'ArrowUp':
			case 'k':
				if (e.key === 'k' && document.activeElement === inputEl) break;
				e.preventDefault();
				selectedIndex = (selectedIndex - 1 + filtered.length) % Math.max(filtered.length, 1);
				break;
			case 'Enter':
				e.preventDefault();
				handleSelect();
				break;
		}
	}

	onMount(() => {
		document.addEventListener('open-command-palette', handleOpen);
		return () => {
			document.removeEventListener('open-command-palette', handleOpen);
		};
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- Backdrop -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
		style="background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px);"
		onclick={handleClose}
		onkeydown={() => {}}
	>
		<!-- Panel -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden animate-scale-in-center"
			style="background: var(--color-background); border-color: var(--color-border);"
			onclick={(e) => e.stopPropagation()}
			onkeydown={() => {}}
		>
			<!-- Search input -->
			<div class="flex items-center gap-3 px-4 py-3 border-b" style="border-color: var(--color-border);">
				<svg class="w-4 h-4 shrink-0" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
				</svg>
				<input
					bind:this={inputEl}
					bind:value={query}
					class="flex-1 bg-transparent text-sm outline-none"
					style="color: var(--color-text);"
					placeholder="Search commands..."
				/>
				<kbd class="px-1.5 py-0.5 rounded border text-[10px] font-mono" style="border-color: var(--color-border); color: var(--color-text-dim);">
					ESC
				</kbd>
			</div>

			<!-- Results -->
			<div class="max-h-64 overflow-y-auto py-1">
				{#if filtered.length === 0}
					<div class="px-4 py-6 text-center text-sm" style="color: var(--color-text-dim);">
						No results found
					</div>
				{:else}
					{#each filtered as item, i}
						<button
							class="w-full flex flex-col px-4 py-2.5 text-left transition-colors"
							style="background: {i === selectedIndex ? 'var(--color-surface)' : 'transparent'};"
							onclick={() => { selectedIndex = i; handleSelect(); }}
							onmouseenter={() => { selectedIndex = i; }}
						>
							<span class="text-sm font-medium" style="color: {i === selectedIndex ? 'var(--color-primary)' : 'var(--color-text)'};">
								{item.label}
							</span>
							<span class="text-xs" style="color: var(--color-text-dim);">
								{item.description}
							</span>
						</button>
					{/each}
				{/if}
			</div>

			<!-- Footer -->
			<div class="flex items-center gap-4 px-4 py-2 border-t text-[10px]" style="border-color: var(--color-border); color: var(--color-text-dim);">
				<span><kbd class="font-mono">\u2191\u2193</kbd> Navigate</span>
				<span><kbd class="font-mono">\u21B5</kbd> Select</span>
				<span><kbd class="font-mono">Esc</kbd> Close</span>
			</div>
		</div>
	</div>
{/if}
