<script lang="ts">
	import type { Issue } from '$lib/types/issue';
	import RelativeTime from './RelativeTime.svelte';
	import Avatar from './Avatar.svelte';

	let { issue, owner, repo }: { issue: Issue; owner: string; repo: string } = $props();

	const MAX_LABELS = 3;

	const visibleLabels = $derived(issue.labels?.slice(0, MAX_LABELS) ?? []);
	const extraLabelCount = $derived((issue.labels?.length ?? 0) - MAX_LABELS);

	const priorityColor: Record<string, string> = {
		critical: 'var(--color-error)',
		high: '#f97316',
		medium: '#eab308',
		low: 'var(--color-primary)',
		none: 'var(--color-text-dim)'
	};

	const typeConfig: Record<string, { label: string; bg: string; color: string }> = {
		bug:     { label: 'Bug',     bg: 'color-mix(in srgb, var(--color-error) 12%, var(--color-surface))',     color: 'var(--color-error)' },
		feature: { label: 'Feature', bg: 'color-mix(in srgb, var(--color-success) 12%, var(--color-surface))',   color: 'var(--color-success)' },
		task:    { label: 'Task',    bg: 'color-mix(in srgb, var(--color-primary) 12%, var(--color-surface))',   color: 'var(--color-primary)' },
		story:   { label: 'Story',   bg: 'color-mix(in srgb, var(--color-secondary) 12%, var(--color-surface))', color: 'var(--color-secondary)' },
		epic:    { label: 'Epic',    bg: 'color-mix(in srgb, #a855f7 12%, var(--color-surface))',                color: '#a855f7' },
	};

	const isOverdue = $derived(
		!!issue.due_date && issue.state === 'open' && new Date(issue.due_date) < new Date()
	);

	function formatDueDate(dateStr: string): string {
		const d = new Date(dateStr);
		return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
	}
</script>

<a
	href="/{owner}/{repo}/issues/{issue.number}"
	class="flex items-start gap-3 px-4 py-3.5 hover-slide group transition-all duration-200"
	style="background: transparent;"
	onmouseenter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
	onmouseleave={(e) => { e.currentTarget.style.background = 'transparent'; }}
>
	<!-- State icon -->
	<div class="mt-0.5 shrink-0 transition-transform duration-300 group-hover:scale-110">
		{#if issue.state === 'open'}
			<svg class="w-4 h-4" style="color: var(--color-success);" viewBox="0 0 16 16" fill="currentColor">
				<path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm9 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-.25-6.25a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0v-3.5Z"/>
			</svg>
		{:else}
			<svg class="w-4 h-4" style="color: #a855f7;" viewBox="0 0 16 16" fill="currentColor">
				<path d="M11.28 6.78a.75.75 0 0 0-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l3.5-3.5Z"/>
				<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0Zm-1.5 0a6.5 6.5 0 1 0-13 0 6.5 6.5 0 0 0 13 0Z"/>
			</svg>
		{/if}
	</div>

	<!-- Main content -->
	<div class="min-w-0 flex-1">
		<!-- Title row -->
		<div class="flex items-center gap-2 flex-wrap">
			<!-- Priority dot -->
			{#if issue.priority && issue.priority !== 'none'}
				<span
					class="w-2 h-2 rounded-full shrink-0"
					style="background-color: {priorityColor[issue.priority] ?? priorityColor.none};"
					title="Priority: {issue.priority}"
				></span>
			{/if}

			<!-- Title -->
			<span class="text-sm font-semibold group-hover:underline transition-colors duration-200" style="color: var(--color-text);">
				{issue.title}
			</span>

			<!-- Type badge -->
			{#if issue.type && issue.type !== 'task'}
				{@const tc = typeConfig[issue.type]}
				{#if tc}
					<span
						class="text-[0.6rem] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide shrink-0"
						style="background: {tc.bg}; color: {tc.color};"
					>{tc.label}</span>
				{/if}
			{/if}

			<!-- Labels -->
			{#each visibleLabels as label}
				<span
					class="text-[0.6rem] px-2 py-0.5 rounded-full font-medium shrink-0 transition-all duration-200 hover:scale-105"
					style="background-color: color-mix(in srgb, {label.color} 12%, var(--color-surface)); color: {label.color}; border: 1px solid color-mix(in srgb, {label.color} 25%, transparent);"
				>{label.name}</span>
			{/each}
			{#if extraLabelCount > 0}
				<span class="text-[0.6rem] px-1.5 py-0.5 rounded-full font-medium" style="background: var(--glass-bg); color: var(--color-text-dim);">+{extraLabelCount}</span>
			{/if}

			<!-- Story points -->
			{#if issue.story_points > 0}
				<span
					class="text-[0.6rem] px-1.5 py-0.5 rounded font-mono font-semibold shrink-0"
					style="background: var(--glass-bg); color: var(--color-text-dim); border: 1px solid var(--glass-border);"
					title="Story points"
				>{issue.story_points} SP</span>
			{/if}
		</div>

		<!-- Meta row -->
		<div class="flex items-center gap-3 mt-1.5 flex-wrap">
			<p class="text-xs" style="color: var(--color-text-dim);">
				#{issue.number} opened <RelativeTime date={issue.created_at} /> by {issue.author}
			</p>

			<!-- Due date -->
			{#if issue.due_date}
				<span
					class="flex items-center gap-1 text-xs"
					style="color: {isOverdue ? 'var(--color-error)' : 'var(--color-text-dim)'};"
				>
					<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
					{isOverdue ? 'Overdue · ' : ''}{formatDueDate(issue.due_date)}
				</span>
			{/if}
		</div>
	</div>

	<!-- Right side: assignee + comment count + arrow -->
	<div class="flex items-center gap-3 shrink-0 mt-0.5">
		<!-- Comment count -->
		{#if issue.comment_count && issue.comment_count > 0}
			<div class="flex items-center gap-1" style="color: var(--color-text-dim);">
				<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
				</svg>
				<span class="text-xs">{issue.comment_count}</span>
			</div>
		{/if}

		<!-- Assignee avatar -->
		{#if issue.assignee}
			<Avatar username={issue.assignee} size={22} />
		{/if}

		<!-- Hover arrow -->
		<div class="opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
			<svg class="w-4 h-4" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
			</svg>
		</div>
	</div>
</a>
