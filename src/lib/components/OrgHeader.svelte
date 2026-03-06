<script lang="ts">
	import type { Organization } from '$lib/types/organization';
	import OrgIcon from '$lib/assets/icons/OrgIcon.svelte';

	let { org }: { org: Organization } = $props();
</script>

<div class="flex items-center gap-4">
	<div class="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 hover:scale-105" style="background: linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 15%, transparent), color-mix(in srgb, var(--color-secondary) 10%, transparent)); border: 1px solid color-mix(in srgb, var(--color-primary) 15%, transparent);">
		<OrgIcon size={24} color="var(--color-primary)" />
	</div>
	<div>
		<h1 class="text-xl font-bold" style="color: var(--color-text);">{org.display_name || org.name}</h1>
		{#if org.description}
			<p class="text-sm mt-0.5" style="color: var(--color-text-dim);">{org.description}</p>
		{/if}
		{#if org.location || org.website}
			<div class="flex items-center gap-3 mt-1.5">
				{#if org.location}
					<span class="flex items-center gap-1 text-xs" style="color: var(--color-text-dim);">
						<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
						{org.location}
					</span>
				{/if}
				{#if org.website}
					<a href={org.website} target="_blank" rel="noopener noreferrer" class="flex items-center gap-1 text-xs animated-link" style="color: var(--color-primary);">
						<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
						{org.website}
					</a>
				{/if}
			</div>
		{/if}
	</div>
</div>
