<script lang="ts">
	import { orgsStore } from '$lib/stores/orgs.svelte';
	import { onMount } from 'svelte';
	import OrgIcon from '$lib/assets/icons/OrgIcon.svelte';
	import Skeleton from './Skeleton.svelte';

	let visible = $state(false);

	onMount(() => {
		orgsStore.load();
	});

	$effect(() => {
		if (!orgsStore.loading && orgsStore.orgs.length > 0) {
			requestAnimationFrame(() => { visible = true; });
		}
	});
</script>

<section>
	<div class="flex items-center justify-between mb-4">
		<h2 class="text-[var(--color-text)] text-sm font-semibold uppercase tracking-wider opacity-50">Organizations</h2>
		<a href="/orgs/new" class="text-xs font-medium rounded-lg px-2.5 py-1 border border-[var(--color-border)] text-[var(--color-text)] opacity-60 hover:opacity-100 hover:bg-[var(--color-surface)] hover:border-[color-mix(in_srgb,var(--color-primary)_19%,transparent)] transition-all duration-200">
			+ New
		</a>
	</div>

	{#if orgsStore.loading}
		<div class="flex flex-col gap-3">
			{#each Array(2) as _, i}
				<div class="flex items-center gap-3 py-3" style="animation: fade-slide-in-sm 0.3s ease both; animation-delay: {i * 100}ms;">
					<Skeleton width="32px" height="32px" rounded="rounded-lg" />
					<Skeleton width="50%" height="14px" />
				</div>
			{/each}
		</div>
	{:else if orgsStore.orgs.length === 0}
		<div class="card p-6 text-center animate-fade-in">
			<OrgIcon size={24} color="var(--color-text)" />
			<p class="text-sm text-[var(--color-text)] opacity-30 mt-3">No organizations yet.</p>
			<a href="/orgs/new" class="inline-block mt-2 text-xs font-medium animated-link" style="color: var(--color-primary);">Create one</a>
		</div>
	{:else}
		<div class="flex flex-col gap-2">
			{#each orgsStore.orgs as org, i}
				<a
					href="/orgs/{org.name}"
					class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group"
					style="
						opacity: {visible ? 1 : 0};
						transform: {visible ? 'translateX(0)' : 'translateX(-8px)'};
						transition-delay: {i * 60}ms;
					"
					onmouseenter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface)'; }}
					onmouseleave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
				>
					<div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg" style="background-color: var(--color-surface-hover);">
						<OrgIcon size={14} color="var(--color-text)" />
					</div>
					<div class="min-w-0">
						<p class="text-sm font-medium text-[var(--color-text)] group-hover:underline">{org.display_name || org.name}</p>
						{#if org.description}
							<p class="text-xs text-[var(--color-text)] opacity-25 truncate">{org.description}</p>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	{/if}
</section>
