<script lang="ts">
	import type { Branch } from '$lib/types/repository';
	import BranchIcon from '$lib/assets/icons/BranchIcon.svelte';
	import Badge from './Badge.svelte';

	let { branches }: { branches: Branch[] } = $props();
</script>

<div class="rounded-lg border border-white/[0.06] overflow-hidden divide-y divide-white/[0.04]">
	{#each branches as branch}
		<div class="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
			<div class="flex items-center gap-3">
				<BranchIcon size={16} color="var(--color-text)" />
				<span class="text-sm text-[var(--color-text)] font-medium">{branch.name}</span>
				{#if branch.is_default}
					<Badge label="default" variant="success" />
				{/if}
			</div>
		</div>
	{:else}
		<div class="p-8 text-center text-[var(--color-text)] opacity-40">
			No branches found.
		</div>
	{/each}
</div>
