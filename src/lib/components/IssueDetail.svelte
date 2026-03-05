<script lang="ts">
	import type { Issue } from '$lib/types/issue';
	import IssueIcon from '$lib/assets/icons/IssueIcon.svelte';
	import Badge from './Badge.svelte';
	import RelativeTime from './RelativeTime.svelte';
	import MarkdownRenderer from './MarkdownRenderer.svelte';

	let { issue, onToggleState }: {
		issue: Issue;
		onToggleState: () => void;
	} = $props();
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-start gap-3">
		<IssueIcon
			size={20}
			state={issue.state}
			color={issue.state === 'open' ? '#3fb950' : '#8b949e'}
		/>
		<div class="flex-1">
			<h2 class="text-[var(--color-text)] font-semibold text-xl">
				{issue.title}
				<span class="opacity-30 font-normal">#{issue.number}</span>
			</h2>
			<div class="flex items-center gap-2 mt-1">
				<Badge label={issue.state} variant={issue.state === 'open' ? 'success' : 'default'} />
				<span class="text-xs text-[var(--color-text)] opacity-40">
					{issue.author} opened this issue <RelativeTime date={issue.created_at} />
				</span>
			</div>
		</div>
	</div>

	{#if issue.body}
		<div class="rounded-lg border border-[var(--color-border)] p-5 text-[var(--color-text)]">
			<MarkdownRenderer content={issue.body} />
		</div>
	{/if}

	<div class="flex items-center gap-2">
		<button
			onclick={onToggleState}
			class="px-4 py-2 text-sm font-medium rounded-lg border transition-colors {issue.state === 'open' ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-green-500/30 text-green-400 hover:bg-green-500/10'}"
		>
			{issue.state === 'open' ? 'Close issue' : 'Reopen issue'}
		</button>
	</div>
</div>
