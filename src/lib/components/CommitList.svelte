<script lang="ts">
	import type { Commit } from '$lib/types/repository';
	import CommitRow from './CommitRow.svelte';

	let { commits, owner = '', repo = '' }: { commits: Commit[]; owner?: string; repo?: string } = $props();
</script>

<div class="card overflow-hidden">
	<div class="relative">
		{#if commits.length > 0}
			<!-- Vertical graph line -->
			<div
				class="absolute left-[23px] top-0 bottom-0 w-[2px] z-0"
				style="background: linear-gradient(to bottom, transparent, var(--color-primary), var(--color-primary), transparent); opacity: 0.3;"
			></div>
		{/if}

		{#each commits as commit, i}
			<div class="relative z-10" class:border-t={i > 0} style={i > 0 ? 'border-color: var(--glass-border);' : ''}>
				<CommitRow {commit} {owner} {repo} showGraphDot />
			</div>
		{:else}
			<div class="p-8 text-center text-[var(--color-text)] opacity-40">
				No commits yet.
			</div>
		{/each}
	</div>
</div>
