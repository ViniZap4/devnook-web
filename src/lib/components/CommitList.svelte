<script lang="ts">
	import type { Commit } from '$lib/types/repository';
	import CommitRow from './CommitRow.svelte';

	let { commits, owner = '', repo = '' }: { commits: Commit[]; owner?: string; repo?: string } = $props();
</script>

<div class="rounded-xl border overflow-hidden divide-y" style="border-color: var(--color-border); --tw-divide-opacity: 1; divide-color: var(--color-border);">
	{#each commits as commit}
		<CommitRow {commit} {owner} {repo} />
	{:else}
		<div class="p-8 text-center text-[var(--color-text)] opacity-40">
			No commits yet.
		</div>
	{/each}
</div>
