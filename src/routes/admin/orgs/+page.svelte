<script lang="ts">
	import { onMount } from 'svelte';
	import { orgs as orgsApi } from '$lib/services/api';
	import type { Organization } from '$lib/types/organization';
	import OrgIcon from '$lib/assets/icons/OrgIcon.svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';

	let orgsList = $state<Organization[]>([]);
	let loading = $state(true);
	let search = $state('');

	const filtered = $derived(
		search
			? orgsList.filter(o =>
				o.name.toLowerCase().includes(search.toLowerCase()) ||
				(o.display_name && o.display_name.toLowerCase().includes(search.toLowerCase())) ||
				(o.description && o.description.toLowerCase().includes(search.toLowerCase()))
			)
			: orgsList
	);

	onMount(async () => {
		try {
			orgsList = await orgsApi.list();
		} catch {
			// ignore
		} finally {
			loading = false;
		}
	});

	async function deleteOrg(name: string) {
		if (!confirm(`Delete organization "${name}"? This action cannot be undone.`)) return;
		try {
			await orgsApi.remove(name);
			orgsList = orgsList.filter(o => o.name !== name);
		} catch {
			// ignore
		}
	}
</script>

<div class="flex flex-col gap-6">
	<div class="flex items-center justify-between flex-wrap gap-4">
		<div>
			<h1 class="text-2xl font-bold" style="color: var(--color-text);">Organizations</h1>
			<p class="text-sm mt-1" style="color: var(--color-text-dim);">
				{orgsList.length} {orgsList.length === 1 ? 'organization' : 'organizations'}
			</p>
		</div>
	</div>

	<!-- Search -->
	<div class="max-w-md">
		<input
			type="text"
			bind:value={search}
			placeholder="Search organizations..."
			class="w-full px-4 py-2.5 text-sm rounded-xl border bg-transparent transition-colors focus:border-[var(--color-primary)]"
			style="border-color: var(--color-border); color: var(--color-text);"
		/>
	</div>

	{#if loading}
		<div class="py-12 text-center text-sm" style="color: var(--color-text-dim);">Loading organizations...</div>
	{:else if filtered.length === 0}
		<div class="rounded-xl border p-12 text-center" style="border-color: var(--color-border);">
			<svg class="w-12 h-12 mx-auto mb-3 opacity-20" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
			</svg>
			<p class="text-sm" style="color: var(--color-text-dim);">{search ? 'No organizations match your search.' : 'No organizations found.'}</p>
		</div>
	{:else}
		<div class="rounded-xl border overflow-hidden" style="border-color: var(--color-border);">
			{#each filtered as org, i}
				<div
					class="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-[var(--color-surface)] {i > 0 ? 'border-t' : ''}"
					style="border-color: var(--color-border);"
				>
					<div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style="background-color: var(--color-surface-hover);">
						<OrgIcon size={18} color="var(--color-text-dim)" />
					</div>
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2">
							<a href="/orgs/{org.name}" class="text-sm font-medium hover:underline" style="color: var(--color-primary);">
								{org.display_name || org.name}
							</a>
							<span class="text-xs" style="color: var(--color-text-dim);">@{org.name}</span>
						</div>
						{#if org.description}
							<p class="text-xs truncate mt-0.5" style="color: var(--color-text-dim);">{org.description}</p>
						{/if}
					</div>
					<div class="flex items-center gap-3 shrink-0">
						{#if org.created_at}
							<span class="text-xs" style="color: var(--color-text-dim);">
								<RelativeTime date={org.created_at} />
							</span>
						{/if}
						<button
							class="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-red-500/10"
							style="border-color: var(--color-border); color: var(--color-error);"
							onclick={() => deleteOrg(org.name)}
						>
							Delete
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
