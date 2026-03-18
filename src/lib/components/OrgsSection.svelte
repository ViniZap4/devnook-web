<script lang="ts">
	import { orgsStore } from '$lib/stores/orgs.svelte';
	import { onMount } from 'svelte';
	import OrgIcon from '$lib/assets/icons/OrgIcon.svelte';
	import Skeleton from './Skeleton.svelte';

	onMount(() => {
		orgsStore.load();
	});
</script>

<section class="animate-fade-up">
	<div class="flex items-center justify-between mb-4">
		<h2 class="text-[var(--color-text)] text-sm font-semibold uppercase tracking-wider opacity-70">Organizations</h2>
		<a href="/orgs/new" class="text-xs font-medium rounded-lg px-2.5 py-1 border border-[var(--glass-border)] text-[var(--color-text)] opacity-70 hover:opacity-100 hover:bg-[rgba(255,255,255,0.03)] hover:border-[var(--glass-border-hover)] transition-all duration-200">
			+ New
		</a>
	</div>

	{#if orgsStore.loading}
		<div class="flex flex-col gap-3">
			{#each Array(2) as _, i}
				<div class="flex items-center gap-3 py-3" style="animation: fade-up 0.3s ease both; animation-delay: {i * 100}ms;">
					<Skeleton width="32px" height="32px" rounded="rounded-lg" />
					<Skeleton width="50%" height="14px" />
				</div>
			{/each}
		</div>
	{:else if orgsStore.orgs.length === 0}
		<div class="card p-6 text-center animate-fade-in">
			<OrgIcon size={24} color="var(--color-text)" />
			<p class="text-sm text-[var(--color-text)] opacity-50 mt-3">No organizations yet.</p>
			<a href="/orgs/new" class="inline-block mt-2 text-xs font-medium animated-link" style="color: var(--color-primary);">Create one</a>
		</div>
	{:else}
		<div class="card overflow-hidden">
			{#each orgsStore.orgs as org}
				<a
					href="/orgs/{org.name}"
					class="flex items-center gap-3 px-4 py-3 transition-colors duration-150 group hover:bg-[rgba(255,255,255,0.03)]"
					style="border-bottom: 1px solid var(--glass-border);"
				>
					<div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105" style="background-color: rgba(255, 255, 255, 0.06);">
						<OrgIcon size={14} color="var(--color-text)" />
					</div>
					<div class="min-w-0">
						<p class="text-sm font-medium text-[var(--color-text)] group-hover:underline">{org.display_name || org.name}</p>
						{#if org.description}
							<p class="text-xs text-[var(--color-text)] opacity-50 truncate">{org.description}</p>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	{/if}
</section>
