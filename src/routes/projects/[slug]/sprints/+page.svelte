<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { projects } from '$lib/services/api';
	import type { ProjectSprint } from '$lib/types/project';
	import { toastStore } from '$lib/stores/toast.svelte';
	import Spinner from '$lib/components/Spinner.svelte';

	const slug = $derived($page.params.slug!);

	let sprints = $state<ProjectSprint[]>([]);
	let loading = $state(true);
	let fetchId = 0;

	// Action state
	let actingId = $state<number | null>(null);

	// New sprint form
	let showNewForm = $state(false);
	let newName = $state('');
	let newGoal = $state('');
	let newStartDate = $state('');
	let newEndDate = $state('');
	let creating = $state(false);

	$effect(() => {
		const _slug = slug;
		const id = ++fetchId;

		if (!userStore.isLoggedIn) {
			goto('/');
			return;
		}

		loading = true;
		sprints = [];

		projects.sprints(_slug).then(data => {
			if (id !== fetchId) return;
			sprints = data;
		}).catch(() => {
			if (id !== fetchId) return;
		}).finally(() => {
			if (id !== fetchId) return;
			loading = false;
		});
	});

	const stateConfig: Record<string, { label: string; color: string; bg: string }> = {
		planning:  { label: 'Planning',  color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
		active:    { label: 'Active',    color: '#34d399', bg: 'rgba(52,211,153,0.12)'  },
		completed: { label: 'Completed', color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
		cancelled: { label: 'Cancelled', color: '#f87171', bg: 'rgba(248,113,113,0.12)' }
	};

	function formatDate(dateStr?: string): string {
		if (!dateStr) return '—';
		return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function progressPct(sprint: ProjectSprint): number {
		if (!sprint.total_items) return 0;
		return Math.round((sprint.done_items / sprint.total_items) * 100);
	}

	async function startSprint(sprint: ProjectSprint) {
		if (actingId !== null) return;
		actingId = sprint.id;
		try {
			await projects.startSprint(slug, sprint.id);
			toastStore.success(`Sprint "${sprint.name}" started.`);
			// Refresh
			const data = await projects.sprints(slug);
			sprints = data;
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to start sprint');
		} finally {
			actingId = null;
		}
	}

	async function completeSprint(sprint: ProjectSprint) {
		if (actingId !== null) return;
		if (!confirm(`Complete sprint "${sprint.name}"? Incomplete items will remain in the backlog.`)) return;
		actingId = sprint.id;
		try {
			const result = await projects.completeSprint(slug, sprint.id);
			toastStore.success(`Sprint completed. Velocity: ${result.velocity} pts.`);
			const data = await projects.sprints(slug);
			sprints = data;
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to complete sprint');
		} finally {
			actingId = null;
		}
	}

	async function createSprint() {
		const name = newName.trim();
		if (!name || creating) return;
		creating = true;
		try {
			await projects.createSprint(slug, {
				name,
				goal: newGoal.trim() || undefined,
				start_date: newStartDate || undefined,
				end_date: newEndDate || undefined
			});
			toastStore.success('Sprint created.');
			newName = '';
			newGoal = '';
			newStartDate = '';
			newEndDate = '';
			showNewForm = false;
			const data = await projects.sprints(slug);
			sprints = data;
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to create sprint');
		} finally {
			creating = false;
		}
	}

	function cancelNew() {
		showNewForm = false;
		newName = '';
		newGoal = '';
		newStartDate = '';
		newEndDate = '';
	}
</script>

{#if loading}
	<div class="py-20 flex flex-col items-center gap-3">
		<Spinner size="md" />
		<span class="text-sm" style="color: var(--color-text-dim);">Loading sprints...</span>
	</div>
{:else}
	<div class="flex flex-col gap-5">
		<!-- Header -->
		<div class="flex items-center justify-between">
			<p class="text-sm" style="color: var(--color-text-dim);">
				{sprints.length} sprint{sprints.length === 1 ? '' : 's'}
				{#if sprints.some(s => s.state === 'active')}
					<span class="ml-2 text-xs font-medium px-2 py-0.5 rounded-full"
						style="background: rgba(52,211,153,0.12); color: #34d399;">
						1 active
					</span>
				{/if}
			</p>
			<button
				class="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-lg text-white transition-all hover:brightness-110"
				style="background: var(--color-primary);"
				onclick={() => { showNewForm = !showNewForm; }}
			>
				<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
				</svg>
				New Sprint
			</button>
		</div>

		<!-- New sprint form -->
		{#if showNewForm}
			<div
				class="rounded-xl border p-5 flex flex-col gap-4"
				style="border-color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 5%, var(--glass-bg));"
			>
				<h3 class="text-sm font-semibold" style="color: var(--color-text);">New Sprint</h3>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="flex flex-col gap-1.5">
						<label class="text-xs font-medium" style="color: var(--color-text-dim);">Name *</label>
						<input
							type="text"
							bind:value={newName}
							placeholder="Sprint 1"
							class="px-3 py-2 text-sm rounded-lg border outline-none transition-colors"
							style="background: var(--color-surface); border-color: var(--glass-border); color: var(--color-text);"
						/>
					</div>
					<div class="flex flex-col gap-1.5">
						<label class="text-xs font-medium" style="color: var(--color-text-dim);">Goal</label>
						<input
							type="text"
							bind:value={newGoal}
							placeholder="Sprint goal..."
							class="px-3 py-2 text-sm rounded-lg border outline-none transition-colors"
							style="background: var(--color-surface); border-color: var(--glass-border); color: var(--color-text);"
						/>
					</div>
					<div class="flex flex-col gap-1.5">
						<label class="text-xs font-medium" style="color: var(--color-text-dim);">Start Date</label>
						<input
							type="date"
							bind:value={newStartDate}
							class="px-3 py-2 text-sm rounded-lg border outline-none transition-colors"
							style="background: var(--color-surface); border-color: var(--glass-border); color: var(--color-text);"
						/>
					</div>
					<div class="flex flex-col gap-1.5">
						<label class="text-xs font-medium" style="color: var(--color-text-dim);">End Date</label>
						<input
							type="date"
							bind:value={newEndDate}
							class="px-3 py-2 text-sm rounded-lg border outline-none transition-colors"
							style="background: var(--color-surface); border-color: var(--glass-border); color: var(--color-text);"
						/>
					</div>
				</div>
				<div class="flex items-center gap-2 pt-1">
					<button
						class="px-4 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-40 transition-all hover:brightness-110"
						style="background: var(--color-primary);"
						disabled={!newName.trim() || creating}
						onclick={createSprint}
					>
						{creating ? 'Creating...' : 'Create Sprint'}
					</button>
					<button
						class="px-4 py-2 text-sm rounded-lg transition-colors"
						style="color: var(--color-text-dim);"
						onclick={cancelNew}
					>
						Cancel
					</button>
				</div>
			</div>
		{/if}

		<!-- Sprint cards -->
		{#if sprints.length === 0}
			<div
				class="rounded-xl border flex flex-col items-center justify-center py-16 gap-3"
				style="border-color: var(--glass-border); background: var(--glass-bg); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);"
			>
				<svg class="w-12 h-12 opacity-10" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
					<path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
				</svg>
				<p class="text-sm" style="color: var(--color-text-dim);">No sprints yet. Create your first sprint above.</p>
			</div>
		{:else}
			<div class="flex flex-col gap-3">
				{#each sprints as sprint (sprint.id)}
					{@const sc = stateConfig[sprint.state] ?? stateConfig.planning}
					{@const pct = progressPct(sprint)}
					{@const isActive = sprint.state === 'active'}
					<div
						class="rounded-xl border p-5 flex flex-col gap-3 transition-all"
						style="border-color: {isActive ? 'color-mix(in srgb, #34d399 35%, var(--glass-border))' : 'var(--glass-border)'}; background: {isActive ? 'color-mix(in srgb, #34d399 4%, var(--glass-bg))' : 'var(--glass-bg)'}; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);"
					>
						<!-- Top row: name + state + actions -->
						<div class="flex items-start justify-between gap-3 flex-wrap">
							<div class="flex items-center gap-2.5 flex-wrap">
								<span class="text-[0.625rem] font-semibold" style="color: var(--color-text-dim);">#{sprint.number}</span>
								<h3 class="text-base font-semibold" style="color: var(--color-text);">{sprint.name}</h3>
								<span
									class="text-[0.5625rem] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
									style="background: {sc.bg}; color: {sc.color};"
								>
									{sc.label}
								</span>
							</div>

							<div class="flex items-center gap-2 shrink-0">
								{#if sprint.state === 'planning'}
									<button
										class="text-xs font-medium px-3 py-1.5 rounded-lg text-white disabled:opacity-40 transition-all hover:brightness-110"
										style="background: #34d399;"
										disabled={actingId !== null}
										onclick={() => startSprint(sprint)}
									>
										{actingId === sprint.id ? '...' : 'Start Sprint'}
									</button>
								{:else if sprint.state === 'active'}
									<button
										class="text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-40 transition-all hover:brightness-110"
										style="background: rgba(129,140,248,0.15); color: #818cf8; border: 1px solid rgba(129,140,248,0.3);"
										disabled={actingId !== null}
										onclick={() => completeSprint(sprint)}
									>
										{actingId === sprint.id ? '...' : 'Complete Sprint'}
									</button>
								{/if}
							</div>
						</div>

						<!-- Goal -->
						{#if sprint.goal}
							<p class="text-sm" style="color: var(--color-text-dim);">{sprint.goal}</p>
						{/if}

						<!-- Dates + stats row -->
						<div class="flex items-center gap-4 flex-wrap text-xs" style="color: var(--color-text-dim);">
							<span class="flex items-center gap-1.5">
								<svg class="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
								{formatDate(sprint.start_date)} — {formatDate(sprint.end_date)}
							</span>

							<span style="opacity: 0.3;">·</span>
							<span>{sprint.done_items}/{sprint.total_items} items</span>

							<span style="opacity: 0.3;">·</span>
							<span>{sprint.done_points}/{sprint.total_points} pts</span>

							{#if sprint.state === 'completed' && sprint.velocity > 0}
								<span style="opacity: 0.3;">·</span>
								<span class="font-medium" style="color: #818cf8;">Velocity: {sprint.velocity}</span>
							{/if}
						</div>

						<!-- Progress bar -->
						{#if sprint.total_items > 0}
							<div class="flex flex-col gap-1">
								<div class="w-full h-1.5 rounded-full overflow-hidden" style="background: var(--color-surface-hover);">
									<div
										class="h-full rounded-full transition-all duration-500"
										style="width: {pct}%; background: {isActive ? '#34d399' : 'var(--color-primary)'};"
									></div>
								</div>
								<div class="flex items-center justify-between text-[0.625rem]" style="color: var(--color-text-dim);">
									<span>{pct}% complete</span>
									{#if sprint.total_items - sprint.done_items > 0}
										<span>{sprint.total_items - sprint.done_items} remaining</span>
									{/if}
								</div>
							</div>
						{:else}
							<div class="text-xs" style="color: var(--color-text-dim); opacity: 0.5;">No items in this sprint</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}
