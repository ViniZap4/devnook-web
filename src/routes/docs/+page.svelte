<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { docs } from '$lib/services/api';
	import type { DocSpace } from '$lib/types/doc';
	import PageShell from '$lib/components/PageShell.svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';

	let spaces = $state<DocSpace[]>([]);
	let loading = $state(true);
	let showCreate = $state(false);
	let newName = $state('');
	let newDesc = $state('');
	let creating = $state(false);

	onMount(async () => {
		if (!userStore.isLoggedIn) { goto('/'); return; }
		await loadSpaces();
	});

	async function loadSpaces() {
		loading = true;
		try {
			spaces = await docs.spaces();
		} catch {
			spaces = [];
		} finally {
			loading = false;
		}
	}

	async function createSpace() {
		if (!newName.trim() || creating) return;
		creating = true;
		try {
			const result = await docs.createSpace({ name: newName, description: newDesc, owner_type: 'user' });
			newName = '';
			newDesc = '';
			showCreate = false;
			await loadSpaces();
			goto(`/docs/${result.slug}`);
		} catch {
			// ignore
		} finally {
			creating = false;
		}
	}

	const spaceIcons: Record<string, string> = {
		user: '<path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />',
		repo: '<path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />',
		org: '<path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />',
	};
</script>

<PageShell maxWidth="max-w-5xl">
	<div class="flex flex-col gap-6">
		<div class="flex items-center justify-between page-header">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: var(--color-primary)10;">
					<svg class="w-5 h-5" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
				</div>
				<div>
					<h1 class="text-xl font-bold" style="color: var(--color-text);">Documentation</h1>
					<p class="text-xs mt-0.5" style="color: var(--color-text-dim);">Knowledge base with vim editing — linked to repos, orgs, and issues</p>
				</div>
			</div>
			<button
				class="btn-glow flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-white"
				style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));"
				onclick={() => { showCreate = !showCreate; }}
			>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
				New Space
			</button>
		</div>

		{#if showCreate}
			<div class="card p-5 flex flex-col gap-3 animate-fade-up-sm">
				<h3 class="text-sm font-semibold" style="color: var(--color-text);">Create Documentation Space</h3>
				<input
					type="text"
					bind:value={newName}
					placeholder="Space name..."
					class="px-3 py-2 text-sm rounded-lg border bg-transparent"
					style="border-color: var(--color-border); color: var(--color-text);"
				/>
				<input
					type="text"
					bind:value={newDesc}
					placeholder="Description (optional)"
					class="px-3 py-2 text-sm rounded-lg border bg-transparent"
					style="border-color: var(--color-border); color: var(--color-text);"
				/>
				<div class="flex items-center justify-end gap-2">
					<button class="text-xs" style="color: var(--color-text-dim);" onclick={() => { showCreate = false; }}>Cancel</button>
					<button
						class="px-4 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-40"
						style="background: var(--color-primary);"
						disabled={!newName.trim() || creating}
						onclick={createSpace}
					>{creating ? 'Creating...' : 'Create'}</button>
				</div>
			</div>
		{/if}

		{#if loading}
			<div class="py-16 flex flex-col items-center gap-3">
				<div class="w-6 h-6 border-2 rounded-full animate-spin" style="border-color: var(--color-border); border-top-color: var(--color-primary);"></div>
			</div>
		{:else if spaces.length === 0}
			<div class="card p-16 text-center">
				<svg class="w-16 h-16 mx-auto mb-4 opacity-10" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
				<p class="text-sm font-medium" style="color: var(--color-text);">No documentation spaces yet</p>
				<p class="text-xs mt-1" style="color: var(--color-text-dim);">Create a space to start writing documentation with vim keybindings</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each spaces as space, i}
					<a
						href="/docs/{space.slug}"
						class="card p-5 group transition-all duration-300"
						style="animation: card-entrance 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: {i * 60}ms;"
					>
						<div class="flex items-start gap-3">
							<div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" style="background: var(--color-primary)10;">
								{#if space.icon}
									<span class="text-lg">{space.icon}</span>
								{:else}
									<svg class="w-5 h-5" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">{@html spaceIcons[space.owner_type] || spaceIcons.user}</svg>
								{/if}
							</div>
							<div class="min-w-0 flex-1">
								<h3 class="text-sm font-semibold truncate" style="color: var(--color-text);">{space.name}</h3>
								{#if space.description}
									<p class="text-xs mt-0.5 line-clamp-2" style="color: var(--color-text-dim);">{space.description}</p>
								{/if}
								<div class="flex items-center gap-2 mt-2">
									{#if space.repo_owner}
										<span class="text-[0.625rem] px-1.5 py-0.5 rounded-full" style="background: var(--color-info)10; color: var(--color-info);">{space.repo_owner}/{space.repo_name}</span>
									{:else if space.org_name}
										<span class="text-[0.625rem] px-1.5 py-0.5 rounded-full" style="background: var(--color-warning)10; color: var(--color-warning);">{space.org_name}</span>
									{:else}
										<span class="text-[0.625rem] px-1.5 py-0.5 rounded-full" style="background: var(--color-surface); color: var(--color-text-dim);">{space.owner_name}</span>
									{/if}
									<span class="text-[0.625rem]" style="color: var(--color-text-dim); opacity: 0.5;"><RelativeTime date={space.updated_at} /></span>
								</div>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</PageShell>
