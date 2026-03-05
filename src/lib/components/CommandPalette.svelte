<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { explore } from '$lib/services/api';

	let open = $state(false);
	let query = $state('');
	let selectedIndex = $state(0);
	let inputEl = $state<HTMLInputElement>();
	let searchTimeout: ReturnType<typeof setTimeout>;

	interface PaletteItem {
		label: string;
		description: string;
		icon?: 'nav' | 'repo' | 'search';
		action: () => void;
	}

	const navItems: PaletteItem[] = [
		{ label: 'Dashboard', description: 'Go to dashboard', icon: 'nav', action: () => goto('/dashboard') },
		{ label: 'Explore', description: 'Browse public repositories', icon: 'nav', action: () => goto('/explore') },
		{ label: 'New Repository', description: 'Create a new repository', icon: 'nav', action: () => goto('/new') },
		{ label: 'New Organization', description: 'Create a new organization', icon: 'nav', action: () => goto('/orgs/new') },
		{ label: 'Settings', description: 'Account and preferences', icon: 'nav', action: () => goto('/settings') },
		{ label: 'Notifications', description: 'View notifications', icon: 'nav', action: () => goto('/notifications') },
		{ label: 'SSH Keys', description: 'Manage SSH keys', icon: 'nav', action: () => goto('/settings/keys') },
	];

	let searchResults = $state<PaletteItem[]>([]);
	let searching = $state(false);

	const filtered = $derived(() => {
		const q = query.trim().toLowerCase();
		if (!q) return navItems;
		const navMatches = navItems.filter(
			item => item.label.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
		);
		return [...navMatches, ...searchResults];
	});

	$effect(() => {
		// Reset selection when filtered list changes
		const _ = filtered().length;
		selectedIndex = 0;
	});

	function handleSearchInput() {
		clearTimeout(searchTimeout);
		const q = query.trim();
		if (q.length < 2) {
			searchResults = [];
			return;
		}
		searchTimeout = setTimeout(async () => {
			searching = true;
			try {
				const res = await explore.repos({ q, page: 1 });
				searchResults = res.repos.slice(0, 5).map(r => ({
					label: `${r.owner}/${r.name}`,
					description: r.description || 'Repository',
					icon: 'repo' as const,
					action: () => goto(`/${r.owner}/${r.name}`)
				}));
			} catch {
				searchResults = [];
			} finally {
				searching = false;
			}
		}, 250);
	}

	function handleOpen() {
		open = true;
		query = '';
		selectedIndex = 0;
		searchResults = [];
		requestAnimationFrame(() => inputEl?.focus());
	}

	function handleClose() {
		open = false;
		query = '';
		searchResults = [];
	}

	function handleSelect() {
		const items = filtered();
		const item = items[selectedIndex];
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
				selectedIndex = (selectedIndex + 1) % Math.max(filtered().length, 1);
				break;
			case 'ArrowUp':
			case 'k':
				if (e.key === 'k' && document.activeElement === inputEl) break;
				e.preventDefault();
				selectedIndex = (selectedIndex - 1 + filtered().length) % Math.max(filtered().length, 1);
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
					oninput={handleSearchInput}
					class="flex-1 bg-transparent text-sm outline-none"
					style="color: var(--color-text);"
					placeholder="Search repos or type a command..."
				/>
				{#if searching}
					<div class="w-4 h-4 rounded-full border-2 animate-spin shrink-0" style="border-color: var(--color-border); border-top-color: var(--color-primary);"></div>
				{:else}
					<kbd class="px-1.5 py-0.5 rounded border text-[10px] font-mono" style="border-color: var(--color-border); color: var(--color-text-dim);">
						ESC
					</kbd>
				{/if}
			</div>

			<!-- Results -->
			<div class="max-h-72 overflow-y-auto py-1">
				{#if filtered().length === 0}
					<div class="px-4 py-6 text-center text-sm" style="color: var(--color-text-dim);">
						{searching ? 'Searching...' : 'No results found'}
					</div>
				{:else}
					{#each filtered() as item, i}
						<button
							class="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
							style="background: {i === selectedIndex ? 'var(--color-surface)' : 'transparent'};"
							onclick={() => { selectedIndex = i; handleSelect(); }}
							onmouseenter={() => { selectedIndex = i; }}
						>
							<div class="w-5 h-5 flex items-center justify-center shrink-0 opacity-40">
								{#if item.icon === 'repo'}
									<svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.25.25 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"/></svg>
								{:else}
									<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
								{/if}
							</div>
							<div class="flex flex-col min-w-0">
								<span class="text-sm font-medium truncate" style="color: {i === selectedIndex ? 'var(--color-primary)' : 'var(--color-text)'};">
									{item.label}
								</span>
								<span class="text-xs truncate" style="color: var(--color-text-dim);">
									{item.description}
								</span>
							</div>
						</button>
					{/each}
				{/if}
			</div>

			<!-- Footer -->
			<div class="flex items-center gap-4 px-4 py-2 border-t text-[10px]" style="border-color: var(--color-border); color: var(--color-text-dim);">
				<span><kbd class="font-mono">↑↓</kbd> Navigate</span>
				<span><kbd class="font-mono">↵</kbd> Select</span>
				<span><kbd class="font-mono">Esc</kbd> Close</span>
			</div>
		</div>
	</div>
{/if}
