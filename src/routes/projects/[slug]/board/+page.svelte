<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { projects } from '$lib/services/api';
	import type { BoardData, BoardColumn, ProjectItem, ProjectSprint } from '$lib/types/project';
	import Spinner from '$lib/components/Spinner.svelte';
	import Avatar from '$lib/components/Avatar.svelte';

	const slug = $derived($page.params.slug!);

	let board = $state<BoardData | null>(null);
	let loading = $state(true);
	let fetchId = 0;

	// Sprint selector
	let sprints = $state<ProjectSprint[]>([]);
	let selectedSprintId = $state<number | undefined>(undefined);

	// Drag state
	let dragItemId = $state<number | null>(null);
	let dragSourceColumnId = $state<number | null>(null);
	let dragOverColumnId = $state<number | null>(null);

	// Quick-add state: columnId -> input value
	let addingInColumn = $state<number | null>(null);
	let addTitle = $state('');
	let addingItem = $state(false);

	const isScrum = $derived(
		board?.project.methodology === 'scrum' ||
		board?.project.methodology === 'scrumban' ||
		board?.project.methodology === 'xp'
	);

	$effect(() => {
		const _slug = slug;
		const _sprint = selectedSprintId;
		const id = ++fetchId;

		if (!userStore.isLoggedIn) {
			goto('/');
			return;
		}

		loading = true;
		board = null;

		projects.board(_slug, _sprint).then(data => {
			if (id !== fetchId) return;
			board = data;
		}).catch(() => {
			if (id !== fetchId) return;
		}).finally(() => {
			if (id !== fetchId) return;
			loading = false;
		});
	});

	// Load sprints when methodology warrants it
	$effect(() => {
		const _slug = slug;
		if (!userStore.isLoggedIn) return;

		projects.sprints(_slug).then(data => {
			sprints = data;
		}).catch(() => {});
	});

	// ---- Drag and drop ----

	function onDragStart(e: DragEvent, item: ProjectItem, columnId: number) {
		dragItemId = item.id;
		dragSourceColumnId = columnId;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', String(item.id));
		}
	}

	function onDragOver(e: DragEvent, columnId: number) {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		dragOverColumnId = columnId;
	}

	function onDragLeave(columnId: number) {
		if (dragOverColumnId === columnId) dragOverColumnId = null;
	}

	function onDrop(e: DragEvent, targetColumn: BoardColumn) {
		e.preventDefault();
		dragOverColumnId = null;

		if (!board || dragItemId === null || dragSourceColumnId === null) return;
		if (dragSourceColumnId === targetColumn.id) {
			dragItemId = null;
			dragSourceColumnId = null;
			return;
		}

		const itemId = dragItemId;
		const fromColId = dragSourceColumnId;
		const toColId = targetColumn.id;
		const newPosition = targetColumn.items.length + 1;

		// Optimistic update
		board = {
			...board,
			columns: board.columns.map(col => {
				if (col.id === fromColId) {
					return { ...col, items: col.items.filter(i => i.id !== itemId), item_count: col.item_count - 1 };
				}
				if (col.id === toColId) {
					const moved = board!.columns
						.flatMap(c => c.items)
						.find(i => i.id === itemId);
					if (!moved) return col;
					return {
						...col,
						items: [...col.items, { ...moved, column_id: toColId, position: newPosition }],
						item_count: col.item_count + 1
					};
				}
				return col;
			})
		};

		dragItemId = null;
		dragSourceColumnId = null;

		projects.moveItem(slug, itemId, { column_id: toColId, position: newPosition }).catch(() => {
			// On error re-fetch to reconcile
			projects.board(slug, selectedSprintId).then(data => { board = data; }).catch(() => {});
		});
	}

	function onDragEnd() {
		dragItemId = null;
		dragSourceColumnId = null;
		dragOverColumnId = null;
	}

	// ---- Quick add ----

	function startAdd(columnId: number) {
		addingInColumn = columnId;
		addTitle = '';
	}

	function cancelAdd() {
		addingInColumn = null;
		addTitle = '';
	}

	async function submitAdd(columnId: number) {
		const title = addTitle.trim();
		if (!title || addingItem) return;
		addingItem = true;
		try {
			await projects.createItem(slug, { title, column_id: columnId });
			addTitle = '';
			addingInColumn = null;
			// Refetch board to get the new item
			const data = await projects.board(slug, selectedSprintId);
			board = data;
		} catch {
			// ignore
		} finally {
			addingItem = false;
		}
	}

	function handleAddKeydown(e: KeyboardEvent, columnId: number) {
		if (e.key === 'Enter') {
			e.preventDefault();
			submitAdd(columnId);
		} else if (e.key === 'Escape') {
			cancelAdd();
		}
	}

	// ---- Helpers ----

	const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
		task:    { label: 'Task',    color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
		bug:     { label: 'Bug',     color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
		feature: { label: 'Feature', color: '#34d399', bg: 'rgba(52,211,153,0.12)'  },
		story:   { label: 'Story',   color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
		epic:    { label: 'Epic',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  }
	};

	const priorityConfig: Record<string, { color: string; title: string }> = {
		critical: { color: '#ef4444', title: 'Critical' },
		high:     { color: '#f97316', title: 'High'     },
		medium:   { color: '#eab308', title: 'Medium'   },
		low:      { color: '#3b82f6', title: 'Low'      },
		none:     { color: '#6b7280', title: 'None'      }
	};

	function wipStatus(col: BoardColumn): 'ok' | 'at' | 'over' {
		if (!col.wip_limit || col.wip_limit === 0) return 'ok';
		if (col.items.length > col.wip_limit) return 'over';
		if (col.items.length === col.wip_limit) return 'at';
		return 'ok';
	}

	function isOverdue(due: string): boolean {
		return new Date(due) < new Date();
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
</script>

{#if loading}
	<div class="py-20 flex flex-col items-center gap-3">
		<Spinner size="md" />
		<span class="text-sm" style="color: var(--color-text-dim);">Loading board...</span>
	</div>
{:else if board}
	<div class="flex flex-col gap-4">
		<!-- Sprint selector + board meta -->
		<div class="flex items-center justify-between gap-4 flex-wrap">
			{#if isScrum && sprints.length > 0}
				<div class="flex items-center gap-2">
					<span class="text-xs font-medium" style="color: var(--color-text-dim);">Sprint:</span>
					<select
						class="text-xs px-2.5 py-1.5 rounded-lg border outline-none cursor-pointer transition-colors"
						style="background: var(--color-surface); border-color: var(--glass-border); color: var(--color-text);"
						value={selectedSprintId ?? ''}
						onchange={(e) => {
							const val = (e.target as HTMLSelectElement).value;
							selectedSprintId = val ? Number(val) : undefined;
						}}
					>
						<option value="">All sprints</option>
						{#each sprints as sprint}
							<option value={sprint.id}>
								#{sprint.number} {sprint.name}
								{sprint.state === 'active' ? '(active)' : ''}
							</option>
						{/each}
					</select>

					{#if board.active_sprint}
						<span class="text-xs px-2 py-1 rounded-full font-medium"
							style="background: color-mix(in srgb, var(--color-success) 12%, transparent); color: var(--color-success);">
							Sprint {board.active_sprint.number} active
						</span>
					{/if}
				</div>
			{:else}
				<div></div>
			{/if}

			<div class="flex items-center gap-3 text-xs" style="color: var(--color-text-dim);">
				<span>{board.columns.reduce((s, c) => s + c.items.length, 0)} items</span>
				<span style="opacity: 0.3;">·</span>
				<span>{board.columns.length} columns</span>
			</div>
		</div>

		<!-- Board scroll container -->
		<div class="board-scroll">
			<div class="board-inner">
				{#each board.columns as col}
					{@const wip = wipStatus(col)}
					<div
						class="board-column glass"
						class:drop-target={dragOverColumnId === col.id}
						ondragover={(e) => onDragOver(e, col.id)}
						ondragleave={() => onDragLeave(col.id)}
						ondrop={(e) => onDrop(e, col)}
						role="region"
						aria-label={col.name}
					>
						<!-- Column header -->
						<div class="column-header">
							<div
								class="column-color-bar"
								style="background-color: {col.color || 'var(--color-primary)'};"
							></div>

							<div class="flex items-center justify-between px-3 py-2.5">
								<div class="flex items-center gap-2 min-w-0">
									<span class="text-sm font-semibold truncate" style="color: var(--color-text);">
										{col.name}
									</span>
									<span class="text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0"
										style="background: var(--color-surface-hover); color: var(--color-text-dim);">
										{col.items.length}
									</span>
								</div>

								<!-- WIP indicator -->
								{#if col.wip_limit && col.wip_limit > 0}
									<span
										class="text-[0.625rem] px-1.5 py-0.5 rounded font-semibold shrink-0"
										title="WIP limit: {col.wip_limit}"
										style={wip === 'over'
											? 'background: rgba(239,68,68,0.15); color: #ef4444;'
											: wip === 'at'
											? 'background: rgba(234,179,8,0.15); color: #eab308;'
											: 'background: var(--color-surface-hover); color: var(--color-text-dim);'}
									>
										{col.items.length}/{col.wip_limit}
									</span>
								{/if}
							</div>
						</div>

						<!-- Cards -->
						<div class="column-cards">
							{#each col.items as item (item.id)}
								{@const tc = typeConfig[item.type] ?? typeConfig.task}
								{@const pc = priorityConfig[item.priority] ?? priorityConfig.none}
								<div
									class="item-card glass-strong"
									class:dragging={dragItemId === item.id}
									draggable="true"
									ondragstart={(e) => onDragStart(e, item, col.id)}
									ondragend={onDragEnd}
									role="button"
									tabindex="0"
									aria-label={item.title}
								>
									<!-- Type + Priority row -->
									<div class="flex items-center justify-between gap-2 mb-2">
										<span
											class="text-[0.5625rem] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0"
											style="background: {tc.bg}; color: {tc.color};"
										>
											{tc.label}
										</span>

										<div class="flex items-center gap-1.5">
											<!-- Priority dot -->
											<span
												class="w-2 h-2 rounded-full shrink-0"
												title={pc.title}
												style="background-color: {pc.color};"
											></span>

											<!-- Story points -->
											{#if item.story_points > 0}
												<span
													class="text-[0.5625rem] font-semibold px-1.5 py-0.5 rounded-full"
													style="background: color-mix(in srgb, var(--color-primary) 12%, transparent); color: var(--color-primary);"
													title="Story points"
												>
													{item.story_points}
												</span>
											{/if}
										</div>
									</div>

									<!-- Title -->
									<p class="text-sm leading-snug mb-2.5" style="color: var(--color-text);">{item.title}</p>

									<!-- Labels -->
									{#if item.labels && item.labels.length > 0}
										<div class="flex flex-wrap gap-1 mb-2">
											{#each item.labels.slice(0, 3) as label}
												<span
													class="text-[0.5rem] px-1.5 py-0.5 rounded-full font-medium"
													style="background: {label.color}22; color: {label.color};"
												>
													{label.name}
												</span>
											{/each}
											{#if item.labels.length > 3}
												<span class="text-[0.5rem] px-1 py-0.5 rounded-full" style="color: var(--color-text-dim);">
													+{item.labels.length - 3}
												</span>
											{/if}
										</div>
									{/if}

									<!-- Footer: assignee + due date -->
									<div class="flex items-center justify-between gap-2 mt-auto">
										<div class="flex items-center gap-1.5">
											{#if item.assignee}
												<Avatar username={item.assignee} size={20} />
											{/if}
										</div>

										{#if item.due_date}
											<span
												class="text-[0.5625rem] font-medium"
												style="color: {isOverdue(item.due_date) ? '#ef4444' : 'var(--color-text-dim)'};"
											>
												{formatDue(item.due_date)}
											</span>
										{/if}
									</div>
								</div>
							{/each}

							<!-- Inline quick-add form -->
							{#if addingInColumn === col.id}
								<div class="quick-add-form glass-strong">
									<input
										type="text"
										class="quick-add-input"
										placeholder="Item title..."
										bind:value={addTitle}
										onkeydown={(e) => handleAddKeydown(e, col.id)}
										autofocus
									/>
									<div class="flex items-center gap-1.5 mt-2">
										<button
											class="text-xs px-3 py-1.5 rounded-lg font-medium text-white disabled:opacity-40 transition-opacity"
											style="background: var(--color-primary);"
											disabled={!addTitle.trim() || addingItem}
											onclick={() => submitAdd(col.id)}
										>
											{addingItem ? '...' : 'Add'}
										</button>
										<button
											class="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors"
											style="color: var(--color-text-dim);"
											onclick={cancelAdd}
										>
											Cancel
										</button>
									</div>
								</div>
							{/if}
						</div>

						<!-- Add item button -->
						{#if addingInColumn !== col.id}
							<div class="column-footer">
								<button
									class="add-item-btn"
									onclick={() => startAdd(col.id)}
								>
									<svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
										<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
									</svg>
									Add item
								</button>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</div>
{:else}
	<div class="py-16 text-center">
		<p class="text-sm" style="color: var(--color-text-dim);">Board unavailable.</p>
	</div>
{/if}

<style>
	/* Board layout */
	.board-scroll {
		overflow-x: auto;
		overflow-y: hidden;
		padding-bottom: 1rem;
		/* Slight negative margin so columns reach the edge on narrow screens */
		margin: 0 -0.5rem;
		padding-left: 0.5rem;
		padding-right: 0.5rem;
	}

	.board-inner {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
		width: max-content;
		min-width: 100%;
	}

	/* Column */
	.board-column {
		display: flex;
		flex-direction: column;
		width: 296px;
		min-width: 296px;
		max-width: 296px;
		border-radius: 1rem;
		overflow: hidden;
		transition: box-shadow 0.2s ease, border-color 0.2s ease;
		max-height: calc(100vh - 14rem);
	}

	.board-column.drop-target {
		box-shadow: 0 0 0 2px var(--color-primary);
	}

	.column-header {
		flex-shrink: 0;
		background: color-mix(in srgb, var(--color-surface) 60%, transparent);
	}

	.column-color-bar {
		height: 3px;
		width: 100%;
	}

	/* Cards area — scrollable */
	.column-cards {
		flex: 1;
		overflow-y: auto;
		padding: 0.625rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		scrollbar-width: thin;
		scrollbar-color: var(--color-border) transparent;
	}

	.column-cards::-webkit-scrollbar {
		width: 4px;
	}
	.column-cards::-webkit-scrollbar-track {
		background: transparent;
	}
	.column-cards::-webkit-scrollbar-thumb {
		background: var(--color-border);
		border-radius: 2px;
	}

	/* Footer */
	.column-footer {
		flex-shrink: 0;
		padding: 0.5rem 0.625rem;
		border-top: 1px solid var(--color-separator);
	}

	.add-item-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		width: 100%;
		padding: 0.5rem 0.5rem;
		border-radius: 0.5rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-text-dim);
		transition: all 0.15s ease;
	}

	.add-item-btn:hover {
		background: color-mix(in srgb, var(--color-primary) 8%, transparent);
		color: var(--color-primary);
	}

	/* Cards */
	.item-card {
		padding: 0.625rem;
		border-radius: 0.625rem;
		cursor: grab;
		display: flex;
		flex-direction: column;
		gap: 0;
		transition: box-shadow 0.15s ease, transform 0.15s ease, opacity 0.15s ease;
		user-select: none;
	}

	.item-card:hover {
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
		transform: translateY(-1px);
	}

	.item-card:active,
	.item-card.dragging {
		cursor: grabbing;
		opacity: 0.5;
		transform: scale(0.97);
	}

	/* Quick add */
	.quick-add-form {
		padding: 0.625rem;
		border-radius: 0.625rem;
	}

	.quick-add-input {
		width: 100%;
		background: transparent;
		border: none;
		outline: none;
		font-size: 0.8125rem;
		color: var(--color-text);
		resize: none;
	}

	.quick-add-input::placeholder {
		color: var(--color-text-dim);
		opacity: 0.5;
	}
</style>
