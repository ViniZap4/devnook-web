<script lang="ts">
	import type { Issue } from '$lib/types/issue';
	import IssueRow from './IssueRow.svelte';

	let { issues, owner, repo }: { issues: Issue[]; owner: string; repo: string } = $props();
</script>

<div class="rounded-xl border overflow-hidden divide-y" style="border-color: var(--color-border); --tw-divide-opacity: 1; divide-color: var(--color-border);">
	{#each issues as issue}
		<IssueRow {issue} {owner} {repo} />
	{:else}
		<div class="p-12 text-center" style="color: var(--color-text-dim);">
			No issues found.
		</div>
	{/each}
</div>
