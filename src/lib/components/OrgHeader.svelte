<script lang="ts">
	import type { Organization } from '$lib/types/organization';
	import OrgIcon from '$lib/assets/icons/OrgIcon.svelte';

	let { org }: { org: Organization } = $props();
</script>

<div class="flex items-center gap-4">
	<div class="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center">
		<OrgIcon size={28} color="var(--color-text)" />
	</div>
	<div>
		<h1 class="text-[var(--color-text)]">{org.display_name || org.name}</h1>
		{#if org.description}
			<p class="text-sm text-[var(--color-text)] opacity-50 mt-1">{org.description}</p>
		{/if}
	</div>
</div>
