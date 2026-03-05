<script lang="ts">
	import type { Issue } from '$lib/types/issue';
	import IssueIcon from '$lib/assets/icons/IssueIcon.svelte';
	import RelativeTime from './RelativeTime.svelte';

	let { issue, owner, repo }: { issue: Issue; owner: string; repo: string } = $props();
</script>

<a href="/{owner}/{repo}/issues/{issue.number}" class="flex items-start gap-3 px-5 py-3.5 hover:bg-[var(--color-surface)] transition-colors group">
	<div class="mt-0.5 shrink-0">
		<IssueIcon
			size={16}
			state={issue.state}
			color={issue.state === 'open' ? 'var(--color-success)' : 'var(--color-text-dim)'}
		/>
	</div>
	<div class="min-w-0 flex-1">
		<span class="text-sm font-medium group-hover:underline" style="color: var(--color-text);">{issue.title}</span>
		{#if issue.labels && issue.labels.length > 0}
			{#each issue.labels as label}
				<span class="inline-flex ml-1.5 text-[0.625rem] px-2 py-0.5 rounded-full text-white align-middle" style="background-color: {label.color};">{label.name}</span>
			{/each}
		{/if}
		<p class="text-xs mt-1" style="color: var(--color-text-dim);">
			#{issue.number} opened <RelativeTime date={issue.created_at} /> by {issue.author}
		</p>
	</div>
</a>
