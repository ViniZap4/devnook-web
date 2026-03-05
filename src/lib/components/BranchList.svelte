<script lang="ts">
	import type { Branch } from '$lib/types/repository';
	import BranchIcon from '$lib/assets/icons/BranchIcon.svelte';
	import Badge from './Badge.svelte';

	let { branches }: { branches: Branch[] } = $props();
</script>

<div class="rounded-xl border overflow-hidden divide-y" style="border-color: var(--color-border); --tw-divide-opacity: 1; divide-color: var(--color-border);">
	{#each branches as branch}
		<div class="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--color-surface)] transition-colors">
			<div class="flex items-center gap-3">
				<BranchIcon size={16} color="var(--color-text-dim)" />
				<span class="text-sm font-medium" style="color: var(--color-text);">{branch.name}</span>
				{#if branch.is_default}
					<Badge label="default" variant="success" />
				{/if}
			</div>
		</div>
	{:else}
		<div class="p-12 text-center" style="color: var(--color-text-dim);">
			No branches found.
		</div>
	{/each}
</div>
