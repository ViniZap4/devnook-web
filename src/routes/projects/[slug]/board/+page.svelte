<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { projects } from '$lib/services/api';
	import { toastStore } from '$lib/stores/toast.svelte';
	import type { BoardData, BoardColumn, ProjectItem, ProjectSprint } from '$lib/types/project';
	import type { Repository } from '$lib/types/repository';
	import Spinner from '$lib/components/Spinner.svelte';
	import Avatar from '$lib/components/Avatar.svelte';

	const slug = $derived($page.params.slug!);

	let board = $state<BoardData | null>(null);
	let loading = $state(true);
	let fetchId = 0;

	// Sprint selector
	let sprints = $state<ProjectSprint[]>([]);
	let selectedSprintId = $state<number | undefined>(undefined);

	// Linked repos (for issue navigation)
	let linkedRepos = $state<Repository[]>([]);

	// Drag state
	let dragItemId = $state<number | null>(null);
	let dragSourceColumnId = $state<number | null>(null);
	let dragOverColumnId = $state<number | null>(null);

	// Quick-add state: columnId -> input value
	let addingInColumn = $state<number | null>(null);
	let addTitle = $state('');
	let addType = $state<'task' | 'bug' | 'feature' | 'story' | 'epic'>('task');
	let addingItem = $state(false);
	let showAddTypeMenu = $state(false);

	// Filter state
	let filterType = $state('');
	let filterPriority = $state('');
	let filterAssignee = $state('');

	// Detail panel state
	let panelItem = $state<ProjectItem | null>(null);
	let panelOpen = $state(false);
	let panelSaving = $state(false);
	let panelDeleting = $state(false);

	// Panel form fields (mirror the selected item's values)
	let panelTitle = $state('');
	let panelBody = $state('');
	let panelType = $state<ProjectItem['type']>('task');
	let panelPriority = $state<ProjectItem['priority']>('medium');
	let panelStoryPoints = $state(0);
	let panelDueDate = $state('');

	const isScrum = $derived(
		board?.project.methodology === 'scrum' ||
		board?.project.methodology === 'scrumban' ||
		board?.project.methodology === 'xp'
	);

	// All distinct assignees for filter dropdown
	const allAssignees = $derived.by(() => {
		if (!board) return [] as string[];
		const set = new Set<string>();
		for (const col of board.columns) {
			for (const item of col.items) {
				if (item.assignee) set.add(item.assignee);
			}
		}
		return Array.from(set).sort();
	});

	// Total items count before filtering
	const totalItemCount = $derived(board ? board.columns.reduce((s, c) => s + c.items.length, 0) : 0);

	// Filtered board view (client-side, doesn't mutate board state)
	const filteredColumns = $derived.by(() => {
		if (!board) return [] as BoardColumn[];
		if (!filterType && !filterPriority && !filterAssignee) return board.columns;
		return board.columns.map(col => ({
			...col,
			items: col.items.filter(item => {
				if (filterType && item.type !== filterType) return false;
				if (filterPriority && item.priority !== filterPriority) return false;
				if (filterAssignee && item.assignee !== filterAssignee) return false;
				return true;
			})
		}));
	});

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

	// Load linked repos once for issue navigation
	$effect(() => {
		const _slug = slug;
		if (!userStore.isLoggedIn) return;

		projects.linkedRepos(_slug).then(data => {
			linkedRepos = data;
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
		addType = 'task';
		showAddTypeMenu = false;
	}

	function cancelAdd() {
		addingInColumn = null;
		addTitle = '';
		showAddTypeMenu = false;
	}

	async function submitAdd(columnId: number) {
		const title = addTitle.trim();
		if (!title || addingItem) return;
		addingItem = true;
		try {
			await projects.createItem(slug, {
				title,
				column_id: columnId,
				type: addType,
				priority: 'medium'
			});
			addTitle = '';
			addingInColumn = null;
			showAddTypeMenu = false;
			const data = await projects.board(slug, selectedSprintId);
			board = data;
			toastStore.success('Item added');
		} catch {
			toastStore.error('Failed to add item');
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

	// ---- Card click ----

	function handleCardClick(item: ProjectItem) {
		// If dragging, don't open
		if (dragItemId !== null) return;

		if (item.issue_id && item.issue_number) {
			// Navigate to the issue — pick the first linked repo that matches,
			// or fall back to searching by owner from the board project
			const repo = linkedRepos[0];
			if (repo) {
				goto(`/${repo.owner}/${repo.name}/issues/${item.issue_number}`);
			} else {
				// Fallback: use project owner name from board
				const ownerName = board?.project.owner_name ?? board?.project.org_name ?? '';
				if (ownerName) {
					// We don't have a repo name without linked repos, show a toast
					toastStore.info(`Issue #${item.issue_number} — link a repo to navigate directly`);
				}
			}
			return;
		}

		// Standalone item — open detail panel
		openPanel(item);
	}

	// ---- Detail Panel ----

	function openPanel(item: ProjectItem) {
		panelItem = item;
		panelTitle = item.title;
		panelBody = item.body ?? '';
		panelType = item.type;
		panelPriority = item.priority;
		panelStoryPoints = item.story_points ?? 0;
		panelDueDate = item.due_date ? item.due_date.slice(0, 10) : '';
		panelOpen = true;
	}

	function closePanel() {
		panelOpen = false;
		// Keep data a moment so close animation doesn't flash blank
		setTimeout(() => { panelItem = null; }, 350);
	}

	function handlePanelBackdropClick(e: MouseEvent) {
		if ((e.target as HTMLElement).classList.contains('panel-backdrop')) {
			closePanel();
		}
	}

	function handlePanelKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') closePanel();
	}

	async function savePanel() {
		if (!panelItem || panelSaving) return;
		const title = panelTitle.trim();
		if (!title) return;

		panelSaving = true;
		try {
			await projects.updateItem(slug, panelItem.id, {
				title,
				body: panelBody,
				type: panelType,
				priority: panelPriority,
				story_points: panelStoryPoints || 0,
				due_date: panelDueDate || undefined
			});

			// Update board state optimistically
			if (board) {
				board = {
					...board,
					columns: board.columns.map(col => ({
						...col,
						items: col.items.map(i =>
							i.id === panelItem!.id
								? {
									...i,
									title,
									body: panelBody,
									type: panelType,
									priority: panelPriority,
									story_points: panelStoryPoints || 0,
									due_date: panelDueDate || undefined
								}
								: i
						)
					}))
				};
			}

			// Keep panel in sync
			if (panelItem) {
				panelItem = {
					...panelItem,
					title,
					body: panelBody,
					type: panelType,
					priority: panelPriority,
					story_points: panelStoryPoints || 0,
					due_date: panelDueDate || undefined
				};
			}

			toastStore.success('Item saved');
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to save item');
		} finally {
			panelSaving = false;
		}
	}

	async function deleteItem() {
		if (!panelItem || panelDeleting) return;
		if (!confirm(`Delete "${panelItem.title}"? This cannot be undone.`)) return;

		panelDeleting = true;
		try {
			await projects.deleteItem(slug, panelItem.id);

			// Remove from board state
			if (board) {
				board = {
					...board,
					columns: board.columns.map(col => ({
						...col,
						items: col.items.filter(i => i.id !== panelItem!.id),
						item_count: col.items.some(i => i.id === panelItem!.id)
							? col.item_count - 1
							: col.item_count
					}))
				};
			}

			toastStore.success('Item deleted');
			closePanel();
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to delete item');
		} finally {
			panelDeleting = false;
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

<svelte:window onkeydown={handlePanelKeydown} />

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
				<span>{totalItemCount} item{totalItemCount !== 1 ? 's' : ''}</span>
				<span style="opacity: 0.3;">·</span>
				<span>{board.columns.length} columns</span>
			</div>
		</div>

		<!-- Filter bar -->
		<div class="flex items-center gap-2 flex-wrap">
			<span class="section-title shrink-0">Filters:</span>

			<!-- Type filter -->
			<select
				class="filter-select"
				style="border-color: {filterType ? 'var(--color-primary)' : 'var(--glass-border)'};"
				bind:value={filterType}
			>
				<option value="">All types</option>
				{#each Object.entries(typeConfig) as [key, cfg]}
					<option value={key}>{cfg.label}</option>
				{/each}
			</select>

			<!-- Priority filter -->
			<select
				class="filter-select"
				style="border-color: {filterPriority ? 'var(--color-primary)' : 'var(--glass-border)'};"
				bind:value={filterPriority}
			>
				<option value="">All priorities</option>
				{#each Object.entries(priorityConfig) as [key, cfg]}
					<option value={key}>{cfg.title}</option>
				{/each}
			</select>

			<!-- Assignee filter -->
			{#if allAssignees.length > 0}
				<select
					class="filter-select"
					style="border-color: {filterAssignee ? 'var(--color-primary)' : 'var(--glass-border)'};"
					bind:value={filterAssignee}
				>
					<option value="">All assignees</option>
					{#each allAssignees as username}
						<option value={username}>{username}</option>
					{/each}
				</select>
			{/if}

			{#if filterType || filterPriority || filterAssignee}
				<button
					class="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors"
					style="color: var(--color-text-dim);"
					onclick={() => { filterType = ''; filterPriority = ''; filterAssignee = ''; }}
				>
					Clear
				</button>
			{/if}
		</div>

		<!-- Board scroll container -->
		<div class="board-scroll">
			<div class="board-inner">
				{#each filteredColumns as col}
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
								{@const isLinked = !!(item.issue_id && item.issue_number)}
								<div
									class="item-card glass-strong"
									class:dragging={dragItemId === item.id}
									class:is-linked={isLinked}
									draggable="true"
									ondragstart={(e) => onDragStart(e, item, col.id)}
									ondragend={onDragEnd}
									onclick={() => handleCardClick(item)}
									role="button"
									tabindex="0"
									onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(item); } }}
									aria-label={item.title}
								>
									<!-- Type + Priority row -->
									<div class="flex items-center justify-between gap-2 mb-2">
										<div class="flex items-center gap-1.5">
											<span
												class="text-[0.5625rem] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0"
												style="background: {tc.bg}; color: {tc.color};"
											>
												{tc.label}
											</span>

											<!-- Issue badge for linked items -->
											{#if isLinked}
												<span
													class="flex items-center gap-0.5 text-[0.5625rem] font-semibold px-1.5 py-0.5 rounded shrink-0"
													style="background: color-mix(in srgb, var(--color-primary) 12%, transparent); color: var(--color-primary);"
													title="Linked to issue #{item.issue_number}"
												>
													#{item.issue_number}
													<svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
														<path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
													</svg>
												</span>
											{/if}
										</div>

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

									<!-- Type selector row -->
									<div class="flex items-center gap-1.5 mt-2 flex-wrap">
										{#each (Object.keys(typeConfig) as Array<'task' | 'bug' | 'feature' | 'story' | 'epic'>) as t}
											{@const tc2 = typeConfig[t]}
											<button
												type="button"
												class="text-[0.5625rem] font-semibold px-2 py-0.5 rounded uppercase tracking-wide transition-all"
												style={addType === t
													? `background: ${tc2.bg}; color: ${tc2.color}; outline: 1px solid ${tc2.color};`
													: `background: transparent; color: var(--color-text-dim);`}
												onclick={() => addType = t}
											>
												{tc2.label}
											</button>
										{/each}
									</div>

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

<!-- Detail Panel Backdrop + Drawer -->
{#if panelOpen && panelItem}
	<!-- Backdrop -->
	<div
		class="panel-backdrop fixed inset-0 z-20"
		style="background: rgba(0,0,0,0.35);"
		onclick={handlePanelBackdropClick}
		role="presentation"
	></div>

	<!-- Slide-in Panel -->
	<aside
		class="detail-panel glass-strong"
		role="dialog"
		aria-modal="true"
		aria-label="Item details"
	>
		<!-- Panel header -->
		<div class="flex items-center justify-between gap-3 px-5 py-4 border-b" style="border-color: var(--glass-border);">
			<div class="flex items-center gap-2 min-w-0">
				<span
					class="text-[0.5625rem] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0"
					style="background: {(typeConfig[panelItem.type] ?? typeConfig.task).bg}; color: {(typeConfig[panelItem.type] ?? typeConfig.task).color};"
				>
					{(typeConfig[panelItem.type] ?? typeConfig.task).label}
				</span>
				<span class="text-xs truncate" style="color: var(--color-text-dim);">{panelItem.column_name}</span>
			</div>

			<button
				class="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/5"
				onclick={closePanel}
				aria-label="Close panel"
			>
				<svg class="w-4 h-4" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Scrollable content -->
		<div class="panel-body">
			<!-- Title -->
			<div class="panel-field">
				<label class="section-title block mb-1.5" for="panel-title">Title</label>
				<input
					id="panel-title"
					type="text"
					class="panel-input"
					bind:value={panelTitle}
				/>
			</div>

			<!-- Body / Description -->
			<div class="panel-field">
				<label class="section-title block mb-1.5" for="panel-body">Description</label>
				<textarea
					id="panel-body"
					class="panel-textarea"
					rows="5"
					placeholder="Add a description (markdown supported)..."
					bind:value={panelBody}
				></textarea>
			</div>

			<!-- Type + Priority row -->
			<div class="grid grid-cols-2 gap-3">
				<div class="panel-field">
					<label class="section-title block mb-1.5" for="panel-type">Type</label>
					<select id="panel-type" class="panel-select" bind:value={panelType}>
						{#each Object.entries(typeConfig) as [key, cfg]}
							<option value={key}>{cfg.label}</option>
						{/each}
					</select>
				</div>

				<div class="panel-field">
					<label class="section-title block mb-1.5" for="panel-priority">Priority</label>
					<select id="panel-priority" class="panel-select" bind:value={panelPriority}>
						{#each Object.entries(priorityConfig) as [key, cfg]}
							<option value={key}>{cfg.title}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Story points + Due date row -->
			<div class="grid grid-cols-2 gap-3">
				<div class="panel-field">
					<label class="section-title block mb-1.5" for="panel-points">Story Points</label>
					<input
						id="panel-points"
						type="number"
						min="0"
						max="999"
						class="panel-input"
						bind:value={panelStoryPoints}
					/>
				</div>

				<div class="panel-field">
					<label class="section-title block mb-1.5" for="panel-due">Due Date</label>
					<input
						id="panel-due"
						type="date"
						class="panel-input"
						bind:value={panelDueDate}
					/>
				</div>
			</div>

			<!-- Assignee (display only — full assignment requires member list) -->
			{#if panelItem.assignee}
				<div class="panel-field">
					<span class="section-title block mb-2">Assignee</span>
					<div class="flex items-center gap-2">
						<Avatar username={panelItem.assignee} size={24} />
						<span class="text-sm" style="color: var(--color-text);">{panelItem.assignee}</span>
					</div>
				</div>
			{/if}

			<!-- Linked issue badge -->
			{#if panelItem.issue_id && panelItem.issue_number}
				<div class="panel-field">
					<span class="section-title block mb-2">Linked Issue</span>
					<span
						class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg"
						style="background: color-mix(in srgb, var(--color-primary) 12%, transparent); color: var(--color-primary);"
					>
						<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10" />
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01" />
						</svg>
						Issue #{panelItem.issue_number}
						{#if panelItem.issue_state}
							<span class="opacity-60">({panelItem.issue_state})</span>
						{/if}
					</span>
				</div>
			{/if}
		</div>

		<!-- Panel footer actions -->
		<div class="flex items-center justify-between gap-3 px-5 py-4 border-t" style="border-color: var(--glass-border);">
			<button
				class="text-xs px-3 py-2 rounded-lg font-medium transition-all"
				style="color: var(--color-error); background: color-mix(in srgb, var(--color-error) 8%, transparent);"
				disabled={panelDeleting}
				onclick={deleteItem}
			>
				{panelDeleting ? 'Deleting...' : 'Delete'}
			</button>

			<div class="flex items-center gap-2">
				<button
					class="glass-subtle text-xs px-3 py-2 rounded-lg font-medium press-scale"
					style="color: var(--color-text-dim);"
					onclick={closePanel}
				>
					Cancel
				</button>
				<button
					class="btn-glow press-scale text-xs px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-50"
					style="background: var(--color-primary);"
					disabled={panelSaving || !panelTitle.trim()}
					onclick={savePanel}
				>
					{panelSaving ? 'Saving...' : 'Save'}
				</button>
			</div>
		</div>
	</aside>
{/if}

<style>
	/* ---- Filter bar ---- */
	.filter-select {
		font-size: 0.75rem;
		padding: 0.375rem 0.625rem;
		border-radius: 0.5rem;
		border: 1px solid var(--glass-border);
		background: var(--color-surface);
		color: var(--color-text);
		outline: none;
		cursor: pointer;
		transition: border-color 0.15s ease;
	}
	.filter-select:focus {
		border-color: var(--color-primary);
	}

	/* Board layout */
	.board-scroll {
		overflow-x: auto;
		overflow-y: hidden;
		padding-bottom: 1rem;
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
		max-height: calc(100vh - 18rem);
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

	.column-cards::-webkit-scrollbar { width: 4px; }
	.column-cards::-webkit-scrollbar-track { background: transparent; }
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
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 0;
		transition: box-shadow 0.15s ease, transform 0.15s ease, opacity 0.15s ease, border-color 0.15s ease;
		user-select: none;
	}

	.item-card:hover {
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
		transform: translateY(-1px);
		border-color: var(--glass-border-hover);
	}

	.item-card.is-linked:hover {
		border-color: color-mix(in srgb, var(--color-primary) 40%, transparent);
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

	/* ---- Detail Panel ---- */

	.detail-panel {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		z-index: 30;
		width: 380px;
		max-width: 100vw;
		display: flex;
		flex-direction: column;
		border-radius: 1rem 0 0 1rem;
		border-right: none;
		animation: var(--animate-slide-in-right);
		overflow: hidden;
	}

	@media (max-width: 480px) {
		.detail-panel {
			width: 100vw;
			border-radius: 0;
		}
	}

	.panel-body {
		flex: 1;
		overflow-y: auto;
		padding: 1.25rem 1.25rem 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.125rem;
		scrollbar-width: thin;
		scrollbar-color: var(--color-border) transparent;
	}

	.panel-body::-webkit-scrollbar { width: 4px; }
	.panel-body::-webkit-scrollbar-track { background: transparent; }
	.panel-body::-webkit-scrollbar-thumb {
		background: var(--color-border);
		border-radius: 2px;
	}

	.panel-field {
		display: flex;
		flex-direction: column;
	}

	.panel-input,
	.panel-select,
	.panel-textarea {
		width: 100%;
		background: transparent;
		border: 1px solid var(--glass-border);
		border-radius: 0.5rem;
		padding: 0.5rem 0.625rem;
		font-size: 0.8125rem;
		color: var(--color-text);
		outline: none;
		transition: border-color 0.15s ease;
		font-family: inherit;
	}

	.panel-input:focus,
	.panel-select:focus,
	.panel-textarea:focus {
		border-color: var(--color-primary);
	}

	.panel-input::placeholder,
	.panel-textarea::placeholder {
		color: var(--color-text-dim);
		opacity: 0.5;
	}

	.panel-textarea {
		resize: vertical;
		min-height: 80px;
	}

	.panel-select {
		cursor: pointer;
		appearance: auto;
	}

	/* Date input calendar icon theming */
	.panel-input[type="date"]::-webkit-calendar-picker-indicator {
		filter: invert(0.5);
		cursor: pointer;
	}
</style>
