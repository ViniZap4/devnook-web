<script lang="ts">
	import { page } from '$app/stores';
	import { issuesStore } from '$lib/stores/issues.svelte';
	import { issues as issuesApi, labels as labelsApi, milestones as milestonesApi } from '$lib/services/api';
	import type { Label, Milestone } from '$lib/types/issue';
	import IssueList from '$lib/components/IssueList.svelte';

	const owner = $derived($page.params.owner!);
	const repoName = $derived($page.params.repo!);

	// State filter
	let stateFilter = $state<'open' | 'closed'>('open');

	// Text / dropdown filters
	let labelFilter = $state('');
	let milestoneFilter = $state('');
	let assigneeFilter = $state('');
	let searchQuery = $state('');
	let typeFilter = $state('');
	let priorityFilter = $state('');

	// Sort
	let sortField = $state('newest'); // newest | oldest | most_commented | recently_updated | priority

	// Filter panel toggle
	let showFilters = $state(false);

	// Sidebar data
	let repoLabels = $state<Label[]>([]);
	let repoMilestones = $state<Milestone[]>([]);

	// Counts for open/closed
	let openCount = $state<number | null>(null);
	let closedCount = $state<number | null>(null);

	let searchTimeout: ReturnType<typeof setTimeout>;
	let fetchId = 0;

	// Derived sort/direction from sortField
	const sortParams = $derived((() => {
		switch (sortField) {
			case 'newest':           return { sort: 'created',  direction: 'desc' };
			case 'oldest':           return { sort: 'created',  direction: 'asc'  };
			case 'most_commented':   return { sort: 'comments', direction: 'desc' };
			case 'recently_updated': return { sort: 'updated',  direction: 'desc' };
			case 'priority':         return { sort: 'priority', direction: 'asc'  };
			default:                 return { sort: 'created',  direction: 'desc' };
		}
	})());

	const hasFilters = $derived(
		!!labelFilter || !!milestoneFilter || !!assigneeFilter || !!searchQuery || !!typeFilter || !!priorityFilter
	);

	$effect(() => {
		const _owner = owner;
		const _repo = repoName;
		// reading all reactive filter deps inside the effect
		const _state = stateFilter;
		const _label = labelFilter;
		const _milestone = milestoneFilter;
		const _assignee = assigneeFilter;
		const _q = searchQuery;
		const _type = typeFilter;
		const _priority = priorityFilter;
		const _sort = sortParams;

		const id = ++fetchId;

		// Load main list
		issuesStore.load(_owner, _repo, {
			state: _state,
			labels: _label || undefined,
			milestone: _milestone || undefined,
			assignee: _assignee || undefined,
			q: _q || undefined,
			type: _type || undefined,
			priority: _priority || undefined,
			sort: _sort.sort,
			direction: _sort.direction,
		});

		// Load sidebar data + counts in parallel
		Promise.all([
			labelsApi.list(_owner, _repo),
			milestonesApi.list(_owner, _repo),
			issuesApi.list(_owner, _repo, { state: 'open',   labels: _label || undefined, milestone: _milestone || undefined, assignee: _assignee || undefined, q: _q || undefined, type: _type || undefined, priority: _priority || undefined }),
			issuesApi.list(_owner, _repo, { state: 'closed', labels: _label || undefined, milestone: _milestone || undefined, assignee: _assignee || undefined, q: _q || undefined, type: _type || undefined, priority: _priority || undefined }),
		]).then(([l, m, open, closed]) => {
			if (id !== fetchId) return;
			repoLabels = l;
			repoMilestones = m;
			openCount = open.length;
			closedCount = closed.length;
		}).catch(() => {});
	});

	function switchState(s: 'open' | 'closed') {
		stateFilter = s;
	}

	function handleSearchInput() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			// trigger $effect by no-op reassign (search already reactive)
		}, 300);
	}

	function clearFilters() {
		labelFilter = '';
		milestoneFilter = '';
		assigneeFilter = '';
		searchQuery = '';
		typeFilter = '';
		priorityFilter = '';
	}

	const SORT_OPTIONS = [
		{ value: 'newest',           label: 'Newest' },
		{ value: 'oldest',           label: 'Oldest' },
		{ value: 'most_commented',   label: 'Most commented' },
		{ value: 'recently_updated', label: 'Recently updated' },
		{ value: 'priority',         label: 'Priority' },
	];

	const TYPE_OPTIONS = [
		{ value: '',        label: 'All types' },
		{ value: 'bug',     label: 'Bug' },
		{ value: 'feature', label: 'Feature' },
		{ value: 'task',    label: 'Task' },
		{ value: 'story',   label: 'Story' },
		{ value: 'epic',    label: 'Epic' },
	];

	const PRIORITY_OPTIONS = [
		{ value: '',         label: 'All priorities' },
		{ value: 'critical', label: 'Critical' },
		{ value: 'high',     label: 'High' },
		{ value: 'medium',   label: 'Medium' },
		{ value: 'low',      label: 'Low' },
		{ value: 'none',     label: 'None' },
	];

	const priorityDotColor: Record<string, string> = {
		critical: 'var(--color-error)',
		high:     '#f97316',
		medium:   '#eab308',
		low:      'var(--color-primary)',
		none:     'var(--color-text-dim)',
	};
</script>

<div class="content-reveal flex flex-col gap-4">
	<!-- Header bar -->
	<div class="flex items-center justify-between flex-wrap gap-3">
		<!-- Left: state toggle + filter button -->
		<div class="flex items-center gap-2 flex-wrap">
			<!-- Open / Closed toggle -->
			<div class="flex items-center gap-1 glass-subtle rounded-xl p-1">
				<button
					class="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all duration-300"
					style="
						color: {stateFilter === 'open' ? 'var(--color-success)' : 'var(--color-text-dim)'};
						background: {stateFilter === 'open' ? 'var(--color-success-subtle)' : 'transparent'};
						font-weight: {stateFilter === 'open' ? '600' : '400'};
					"
					onclick={() => switchState('open')}
				>
					<svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
						<path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm9 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-.25-6.25a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0v-3.5Z"/>
					</svg>
					Open
					{#if openCount !== null}
						<span class="text-xs opacity-70">{openCount}</span>
					{/if}
				</button>
				<button
					class="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all duration-300"
					style="
						color: {stateFilter === 'closed' ? '#a855f7' : 'var(--color-text-dim)'};
						background: {stateFilter === 'closed' ? 'color-mix(in srgb, #a855f7 12%, var(--color-surface))' : 'transparent'};
						font-weight: {stateFilter === 'closed' ? '600' : '400'};
					"
					onclick={() => switchState('closed')}
				>
					<svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
						<path d="M11.28 6.78a.75.75 0 0 0-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l3.5-3.5Z"/>
						<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0Zm-1.5 0a6.5 6.5 0 1 0-13 0 6.5 6.5 0 0 0 13 0Z"/>
					</svg>
					Closed
					{#if closedCount !== null}
						<span class="text-xs opacity-70">{closedCount}</span>
					{/if}
				</button>
			</div>

			<!-- Filters toggle button -->
			<button
				class="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-xl glass-subtle transition-all hover:scale-[1.02] active:scale-[0.98]"
				style="color: {showFilters || hasFilters ? 'var(--color-primary)' : 'var(--color-text-dim)'};"
				onclick={() => { showFilters = !showFilters; }}
			>
				<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
				</svg>
				Filters
				{#if hasFilters}
					<span class="w-1.5 h-1.5 rounded-full live-dot" style="background-color: var(--color-primary);"></span>
				{/if}
			</button>

			<!-- Sort dropdown -->
			<div class="relative">
				<select
					bind:value={sortField}
					class="appearance-none pl-3 pr-8 py-1.5 text-sm rounded-xl glass-subtle border-0 cursor-pointer transition-all hover:scale-[1.02] focus:outline-none"
					style="color: var(--color-text-dim); background: transparent;"
				>
					{#each SORT_OPTIONS as opt}
						<option value={opt.value} style="background: var(--color-surface); color: var(--color-text);">{opt.label}</option>
					{/each}
				</select>
				<svg class="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
				</svg>
			</div>
		</div>

		<!-- Right: board link + new issue -->
		<div class="flex items-center gap-2">
			<a
				href="/{owner}/{repoName}/board"
				class="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl glass-subtle transition-all hover:scale-[1.02] active:scale-[0.98]"
				style="color: var(--color-text-dim);"
			>
				<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
				</svg>
				Board
			</a>
			<a
				href="/{owner}/{repoName}/issues/new"
				class="btn-glow flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
				style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));"
			>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
				</svg>
				New Issue
			</a>
		</div>
	</div>

	<!-- Filter panel -->
	{#if showFilters}
		<div class="card p-4 flex flex-col gap-3 animate-fade-up-sm">
			<!-- Row 1: search + type + priority + assignee -->
			<div class="flex items-center gap-3 flex-wrap">
				<!-- Search -->
				<div class="relative flex-1 min-w-[180px]">
					<svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
					<input
						type="text"
						bind:value={searchQuery}
						oninput={handleSearchInput}
						placeholder="Search issues..."
						class="w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-transparent transition-colors focus:outline-none focus:border-[var(--color-primary)]"
						style="border-color: var(--glass-border); color: var(--color-text);"
					/>
				</div>

				<!-- Type filter -->
				<div class="relative">
					<select
						bind:value={typeFilter}
						class="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border bg-transparent cursor-pointer focus:outline-none focus:border-[var(--color-primary)]"
						style="border-color: var(--glass-border); color: var(--color-text);"
					>
						{#each TYPE_OPTIONS as opt}
							<option value={opt.value} style="background: var(--color-surface); color: var(--color-text);">{opt.label}</option>
						{/each}
					</select>
					<svg class="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
					</svg>
				</div>

				<!-- Priority filter -->
				<div class="relative">
					<select
						bind:value={priorityFilter}
						class="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border bg-transparent cursor-pointer focus:outline-none focus:border-[var(--color-primary)]"
						style="border-color: var(--glass-border); color: var(--color-text);"
					>
						{#each PRIORITY_OPTIONS as opt}
							<option value={opt.value} style="background: var(--color-surface); color: var(--color-text);">{opt.label}</option>
						{/each}
					</select>
					<svg class="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
					</svg>
				</div>

				<!-- Label filter -->
				{#if repoLabels.length > 0}
					<div class="relative">
						<select
							bind:value={labelFilter}
							class="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border bg-transparent cursor-pointer focus:outline-none focus:border-[var(--color-primary)]"
							style="border-color: var(--glass-border); color: var(--color-text);"
						>
							<option value="" style="background: var(--color-surface);">All labels</option>
							{#each repoLabels as label}
								<option value={label.name} style="background: var(--color-surface); color: var(--color-text);">{label.name}</option>
							{/each}
						</select>
						<svg class="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
						</svg>
					</div>
				{/if}

				<!-- Milestone filter -->
				{#if repoMilestones.length > 0}
					<div class="relative">
						<select
							bind:value={milestoneFilter}
							class="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border bg-transparent cursor-pointer focus:outline-none focus:border-[var(--color-primary)]"
							style="border-color: var(--glass-border); color: var(--color-text);"
						>
							<option value="" style="background: var(--color-surface);">All milestones</option>
							{#each repoMilestones as m}
								<option value={String(m.id)} style="background: var(--color-surface); color: var(--color-text);">{m.title}</option>
							{/each}
						</select>
						<svg class="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
						</svg>
					</div>
				{/if}

				<!-- Assignee -->
				<input
					type="text"
					bind:value={assigneeFilter}
					placeholder="Assignee username"
					class="px-3 py-2 text-sm rounded-lg border bg-transparent transition-colors focus:outline-none focus:border-[var(--color-primary)]"
					style="border-color: var(--glass-border); color: var(--color-text); width: 160px;"
				/>
			</div>

			<!-- Active filter chips + clear -->
			{#if hasFilters}
				<div class="flex items-center gap-2 flex-wrap">
					{#if typeFilter}
						<span class="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full" style="background: var(--color-primary-subtle); color: var(--color-primary);">
							Type: {typeFilter}
							<button onclick={() => { typeFilter = ''; }} class="hover:opacity-70 transition-opacity">
								<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
							</button>
						</span>
					{/if}
					{#if priorityFilter}
						<span class="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full" style="background: color-mix(in srgb, {priorityDotColor[priorityFilter]} 12%, var(--color-surface)); color: {priorityDotColor[priorityFilter]};">
							Priority: {priorityFilter}
							<button onclick={() => { priorityFilter = ''; }} class="hover:opacity-70 transition-opacity">
								<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
							</button>
						</span>
					{/if}
					{#if labelFilter}
						<span class="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full" style="background: var(--glass-bg); color: var(--color-text-dim); border: 1px solid var(--glass-border);">
							Label: {labelFilter}
							<button onclick={() => { labelFilter = ''; }} class="hover:opacity-70 transition-opacity">
								<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
							</button>
						</span>
					{/if}
					{#if assigneeFilter}
						<span class="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full" style="background: var(--glass-bg); color: var(--color-text-dim); border: 1px solid var(--glass-border);">
							Assignee: {assigneeFilter}
							<button onclick={() => { assigneeFilter = ''; }} class="hover:opacity-70 transition-opacity">
								<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
							</button>
						</span>
					{/if}
					{#if searchQuery}
						<span class="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full" style="background: var(--glass-bg); color: var(--color-text-dim); border: 1px solid var(--glass-border);">
							Search: "{searchQuery}"
							<button onclick={() => { searchQuery = ''; }} class="hover:opacity-70 transition-opacity">
								<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
							</button>
						</span>
					{/if}
					<button class="text-xs hover:underline transition-colors" style="color: var(--color-text-dim);" onclick={clearFilters}>
						Clear all
					</button>
				</div>
			{/if}
		</div>
	{/if}

	<!-- List / empty / loading -->
	{#if issuesStore.loading}
		<div class="card overflow-hidden">
			{#each Array(5) as _, i}
				<div
					class="flex items-start gap-3 px-4 py-3.5 row-animate"
					style="animation-delay: {i * 0.04}s; border-bottom: 1px solid var(--glass-border);"
				>
					<div class="w-4 h-4 rounded-full mt-0.5 shrink-0 animate-pulse" style="background: var(--glass-bg);"></div>
					<div class="flex-1 flex flex-col gap-2">
						<div class="h-3.5 rounded animate-pulse" style="background: var(--glass-bg); width: {40 + (i * 11) % 40}%;"></div>
						<div class="h-2.5 rounded animate-pulse" style="background: var(--glass-bg); width: 30%;"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if issuesStore.issues.length === 0}
		<div class="card p-16 text-center card-animate">
			<div class="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style="background: {stateFilter === 'open' ? 'var(--color-success-subtle)' : 'color-mix(in srgb, #a855f7 12%, var(--color-surface))'};  ">
				{#if stateFilter === 'open'}
					<svg class="w-8 h-8 opacity-40" style="color: var(--color-success);" viewBox="0 0 16 16" fill="currentColor">
						<path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm9 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-.25-6.25a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0v-3.5Z"/>
					</svg>
				{:else}
					<svg class="w-8 h-8 opacity-40" style="color: #a855f7;" viewBox="0 0 16 16" fill="currentColor">
						<path d="M11.28 6.78a.75.75 0 0 0-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l3.5-3.5Z"/>
						<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0Zm-1.5 0a6.5 6.5 0 1 0-13 0 6.5 6.5 0 0 0 13 0Z"/>
					</svg>
				{/if}
			</div>
			<p class="text-sm font-semibold mb-1" style="color: var(--color-text);">No {stateFilter} issues</p>
			<p class="text-xs" style="color: var(--color-text-dim);">
				{#if hasFilters}
					Try adjusting your filters.
				{:else if stateFilter === 'open'}
					Great work! There are no open issues right now.
				{:else}
					No closed issues yet.
				{/if}
			</p>
			{#if hasFilters}
				<button
					class="mt-4 text-xs px-4 py-2 rounded-xl glass-subtle transition-all hover:scale-[1.02]"
					style="color: var(--color-primary);"
					onclick={clearFilters}
				>
					Clear filters
				</button>
			{/if}
		</div>
	{:else}
		<IssueList issues={issuesStore.issues} {owner} repo={repoName} />
	{/if}
</div>
