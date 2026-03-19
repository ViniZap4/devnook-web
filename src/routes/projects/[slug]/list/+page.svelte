<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { projects } from '$lib/services/api';
	import type { ProjectItem } from '$lib/types/project';
	import Spinner from '$lib/components/Spinner.svelte';
	import Avatar from '$lib/components/Avatar.svelte';

	const slug = $derived($page.params.slug!);

	let items = $state<ProjectItem[]>([]);
	let loading = $state(true);
	let fetchId = 0;

	// Filters
	let searchQuery = $state('');
	let filterType = $state('');
	let filterPriority = $state('');
	let filterAssignee = $state('');

	// Sort
	type SortKey = 'title' | 'type' | 'priority' | 'column_name' | 'assignee' | 'story_points' | 'due_date';
	let sortKey = $state<SortKey>('type');
	let sortAsc = $state(true);

	const tableColumns: { key: string; label: string }[] = [
		{ key: 'type', label: 'Type' },
		{ key: 'title', label: 'Title' },
		{ key: 'priority', label: 'Priority' },
		{ key: 'column_name', label: 'Status' },
		{ key: 'assignee', label: 'Assignee' },
		{ key: 'story_points', label: 'SP' },
		{ key: 'due_date', label: 'Due' }
	];

	const typeConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
		task:    { label: 'Task',    color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
		bug:     { label: 'Bug',     color: '#f87171', bg: 'rgba(248,113,113,0.12)', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
		feature: { label: 'Feature', color: '#34d399', bg: 'rgba(52,211,153,0.12)',  icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
		story:   { label: 'Story',   color: '#818cf8', bg: 'rgba(129,140,248,0.12)', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
		epic:    { label: 'Epic',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' }
	};

	const priorityConfig: Record<string, { label: string; color: string; order: number }> = {
		critical: { label: 'Critical', color: '#ef4444', order: 0 },
		high:     { label: 'High',     color: '#f97316', order: 1 },
		medium:   { label: 'Medium',   color: '#eab308', order: 2 },
		low:      { label: 'Low',      color: '#3b82f6', order: 3 },
		none:     { label: 'None',     color: '#6b7280', order: 4 }
	};

	$effect(() => {
		const _slug = slug;
		const id = ++fetchId;

		if (!userStore.isLoggedIn) {
			goto('/');
			return;
		}

		loading = true;
		items = [];

		projects.items(_slug).then(data => {
			if (id !== fetchId) return;
			items = data;
		}).catch(() => {
			if (id !== fetchId) return;
		}).finally(() => {
			if (id !== fetchId) return;
			loading = false;
		});
	});

	const uniqueAssignees = $derived(
		[...new Set(items.filter(i => i.assignee).map(i => i.assignee!))]
	);

	const filtered = $derived.by(() => {
		let result = items;
		const q = searchQuery.trim().toLowerCase();
		if (q) result = result.filter(i => i.title.toLowerCase().includes(q));
		if (filterType) result = result.filter(i => i.type === filterType);
		if (filterPriority) result = result.filter(i => i.priority === filterPriority);
		if (filterAssignee) result = result.filter(i => i.assignee === filterAssignee);
		return result;
	});

	const sorted = $derived.by(() => {
		const arr = [...filtered];
		arr.sort((a, b) => {
			let cmp = 0;
			switch (sortKey) {
				case 'title':
					cmp = a.title.localeCompare(b.title);
					break;
				case 'type':
					cmp = a.type.localeCompare(b.type);
					break;
				case 'priority':
					cmp = (priorityConfig[a.priority]?.order ?? 9) - (priorityConfig[b.priority]?.order ?? 9);
					break;
				case 'column_name':
					cmp = a.column_name.localeCompare(b.column_name);
					break;
				case 'assignee':
					cmp = (a.assignee ?? '').localeCompare(b.assignee ?? '');
					break;
				case 'story_points':
					cmp = (a.story_points ?? 0) - (b.story_points ?? 0);
					break;
				case 'due_date':
					cmp = (a.due_date ?? '').localeCompare(b.due_date ?? '');
					break;
			}
			return sortAsc ? cmp : -cmp;
		});
		return arr;
	});

	function setSort(key: SortKey) {
		if (sortKey === key) {
			sortAsc = !sortAsc;
		} else {
			sortKey = key;
			sortAsc = true;
		}
	}

	function formatDue(due: string): string {
		const d = new Date(due);
		const now = new Date();
		const diff = Math.round((d.getTime() - now.getTime()) / 86400000);
		if (diff === 0) return 'Today';
		if (diff === 1) return 'Tomorrow';
		if (diff === -1) return 'Yesterday';
		return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
	}

	function isOverdue(due: string): boolean {
		return new Date(due) < new Date();
	}

	const hasFilters = $derived(!!searchQuery || !!filterType || !!filterPriority || !!filterAssignee);
</script>

{#if loading}
	<div class="py-20 flex flex-col items-center gap-3">
		<Spinner size="md" />
		<span class="text-sm" style="color: var(--color-text-dim);">Loading items...</span>
	</div>
{:else}
	<div class="flex flex-col gap-4">
		<!-- Filter bar -->
		<div class="flex items-center gap-2 flex-wrap">
			<!-- Search -->
			<div class="relative flex-1 min-w-48">
				<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
				<input
					type="text"
					placeholder="Search items..."
					bind:value={searchQuery}
					class="w-full pl-9 pr-3 py-2 text-sm rounded-lg border outline-none transition-colors"
					style="background: var(--color-surface); border-color: var(--glass-border); color: var(--color-text);"
				/>
			</div>

			<!-- Type filter -->
			<select
				bind:value={filterType}
				class="text-xs px-2.5 py-2 rounded-lg border outline-none cursor-pointer transition-colors"
				style="background: var(--color-surface); border-color: var(--glass-border); color: var(--color-text);"
			>
				<option value="">All types</option>
				{#each Object.entries(typeConfig) as [key, cfg]}
					<option value={key}>{cfg.label}</option>
				{/each}
			</select>

			<!-- Priority filter -->
			<select
				bind:value={filterPriority}
				class="text-xs px-2.5 py-2 rounded-lg border outline-none cursor-pointer transition-colors"
				style="background: var(--color-surface); border-color: var(--glass-border); color: var(--color-text);"
			>
				<option value="">All priorities</option>
				{#each Object.entries(priorityConfig) as [key, cfg]}
					<option value={key}>{cfg.label}</option>
				{/each}
			</select>

			<!-- Assignee filter -->
			{#if uniqueAssignees.length > 0}
				<select
					bind:value={filterAssignee}
					class="text-xs px-2.5 py-2 rounded-lg border outline-none cursor-pointer transition-colors"
					style="background: var(--color-surface); border-color: var(--glass-border); color: var(--color-text);"
				>
					<option value="">All assignees</option>
					{#each uniqueAssignees as assignee}
						<option value={assignee}>{assignee}</option>
					{/each}
				</select>
			{/if}

			{#if hasFilters}
				<button
					class="text-xs px-2.5 py-2 rounded-lg transition-colors"
					style="color: var(--color-text-dim);"
					onclick={() => { searchQuery = ''; filterType = ''; filterPriority = ''; filterAssignee = ''; }}
				>
					Clear
				</button>
			{/if}

			<span class="ml-auto text-xs" style="color: var(--color-text-dim);">
				{sorted.length} item{sorted.length === 1 ? '' : 's'}
			</span>
		</div>

		<!-- Table -->
		{#if sorted.length === 0}
			<div
				class="rounded-xl border flex flex-col items-center justify-center py-16 gap-3"
				style="border-color: var(--glass-border); background: var(--glass-bg); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);"
			>
				<svg class="w-12 h-12 opacity-10" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
					<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
				</svg>
				<p class="text-sm" style="color: var(--color-text-dim);">
					{hasFilters ? 'No items match your filters.' : 'No items yet.'}
				</p>
			</div>
		{:else}
			<div class="overflow-x-auto -mx-0.5">
				<div
					class="rounded-xl border overflow-hidden min-w-[680px]"
					style="border-color: var(--glass-border); background: var(--glass-bg); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);"
				>
					<!-- Header -->
					<div
						class="grid items-center gap-3 px-4 py-2.5 text-xs font-medium uppercase tracking-wider border-b"
						style="grid-template-columns: 80px 1fr 90px 120px 100px 60px 90px; border-color: var(--glass-border); color: var(--color-text-dim); background: rgba(255,255,255,0.02);"
					>
						{#each tableColumns as col}
							<button
								class="flex items-center gap-1 hover:opacity-80 transition-opacity text-left"
								onclick={() => setSort(col.key as SortKey)}
							>
								{col.label}
								{#if sortKey === col.key}
									<svg class="w-2.5 h-2.5 shrink-0 transition-transform" style="transform: rotate({sortAsc ? '0deg' : '180deg'});" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
										<path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
									</svg>
								{/if}
							</button>
						{/each}
					</div>

					<!-- Rows -->
					{#each sorted as item, i (item.id)}
						{@const tc = typeConfig[item.type] ?? typeConfig.task}
						{@const pc = priorityConfig[item.priority] ?? priorityConfig.none}
						<div
							class="grid items-center gap-3 px-4 py-3 transition-colors cursor-pointer {i > 0 ? 'border-t' : ''}"
							style="grid-template-columns: 80px 1fr 90px 120px 100px 60px 90px; border-color: var(--glass-border);"
							role="row"
							tabindex="0"
							onclick={() => {}}
							onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') {} }}
							class:hover-row={true}
						>
							<!-- Type -->
							<div>
								<span
									class="inline-flex items-center gap-1 text-[0.5625rem] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide"
									style="background: {tc.bg}; color: {tc.color};"
								>
									<svg class="w-2.5 h-2.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d={tc.icon} />
									</svg>
									{tc.label}
								</span>
							</div>

							<!-- Title -->
							<div class="min-w-0">
								<p class="text-sm font-medium truncate" style="color: var(--color-text);">{item.title}</p>
								{#if item.labels && item.labels.length > 0}
									<div class="flex flex-wrap gap-1 mt-0.5">
										{#each item.labels.slice(0, 2) as label}
											<span
												class="text-[0.5rem] px-1.5 py-0.5 rounded-full font-medium"
												style="background: {label.color}22; color: {label.color};"
											>
												{label.name}
											</span>
										{/each}
										{#if item.labels.length > 2}
											<span class="text-[0.5rem] px-1 py-0.5 rounded-full" style="color: var(--color-text-dim);">
												+{item.labels.length - 2}
											</span>
										{/if}
									</div>
								{/if}
							</div>

							<!-- Priority -->
							<div class="flex items-center gap-1.5">
								<span
									class="w-2 h-2 rounded-full shrink-0"
									title={pc.label}
									style="background-color: {pc.color};"
								></span>
								<span class="text-xs" style="color: var(--color-text-dim);">{pc.label}</span>
							</div>

							<!-- Status (column) -->
							<div>
								<span
									class="text-xs px-2 py-0.5 rounded-full font-medium"
									style="background: var(--color-surface-hover); color: var(--color-text-dim);"
								>
									{item.column_name}
								</span>
							</div>

							<!-- Assignee -->
							<div class="flex items-center gap-1.5 min-w-0">
								{#if item.assignee}
									<Avatar username={item.assignee} size={20} />
									<span class="text-xs truncate" style="color: var(--color-text-dim);">{item.assignee}</span>
								{:else}
									<span class="text-xs" style="color: var(--color-text-dim); opacity: 0.4;">—</span>
								{/if}
							</div>

							<!-- Story Points -->
							<div>
								{#if item.story_points > 0}
									<span
										class="text-xs font-semibold px-1.5 py-0.5 rounded-full"
										style="background: color-mix(in srgb, var(--color-primary) 12%, transparent); color: var(--color-primary);"
									>
										{item.story_points}
									</span>
								{:else}
									<span class="text-xs" style="color: var(--color-text-dim); opacity: 0.4;">—</span>
								{/if}
							</div>

							<!-- Due Date -->
							<div>
								{#if item.due_date}
									<span
										class="text-xs font-medium"
										style="color: {isOverdue(item.due_date) ? '#ef4444' : 'var(--color-text-dim)'};"
									>
										{formatDue(item.due_date)}
									</span>
								{:else}
									<span class="text-xs" style="color: var(--color-text-dim); opacity: 0.4;">—</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.hover-row:hover {
		background: rgba(255, 255, 255, 0.025);
	}
</style>
