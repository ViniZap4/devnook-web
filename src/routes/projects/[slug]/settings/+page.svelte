<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { projects, repos } from '$lib/services/api';
	import type { ProjectColumn, ProjectMember } from '$lib/types/project';
	import type { Repository } from '$lib/types/repository';
	import { toastStore } from '$lib/stores/toast.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import Spinner from '$lib/components/Spinner.svelte';

	const slug = $derived($page.params.slug!);

	// ---- General ----
	let generalLoading = $state(true);
	let generalName = $state('');
	let generalDescription = $state('');
	let generalMethodology = $state('kanban');
	let generalVisibility = $state('private');
	let generalColor = $state('#6366f1');
	let generalIcon = $state('');
	let generalSaving = $state(false);

	// ---- Columns ----
	let columnsLoading = $state(true);
	let columns = $state<ProjectColumn[]>([]);
	let draggingColId = $state<number | null>(null);
	let dragOverColId = $state<number | null>(null);
	// New column form
	let newColName = $state('');
	let newColColor = $state('#6366f1');
	let addingCol = $state(false);
	// Inline edit
	let editingColId = $state<number | null>(null);
	let editColName = $state('');
	let editColColor = $state('');
	let editColWip = $state(0);
	let editColDone = $state(false);
	let savingColId = $state<number | null>(null);
	let deletingColId = $state<number | null>(null);

	// ---- Members ----
	let membersLoading = $state(true);
	let members = $state<ProjectMember[]>([]);
	let newMemberUsername = $state('');
	let addingMember = $state(false);
	let removingMember = $state('');

	// ---- Linked Repos ----
	let linkedReposLoading = $state(true);
	let linkedRepos = $state<Repository[]>([]);
	let allRepos = $state<Repository[]>([]);
	let selectedRepoId = $state('');
	let linkingRepo = $state(false);
	let unlinkingRepoId = $state<number | null>(null);

	// ---- Danger ----
	let deleteConfirm = $state('');
	let deleting = $state(false);

	// --- Load general (syncs from layout's loaded project data via re-fetch) ---
	let fetchId = 0;

	$effect(() => {
		const _slug = slug;
		const id = ++fetchId;

		if (!userStore.isLoggedIn) {
			goto('/');
			return;
		}

		generalLoading = true;
		columnsLoading = true;
		membersLoading = true;
		linkedReposLoading = true;

		// General
		projects.get(_slug).then(p => {
			if (id !== fetchId) return;
			generalName = p.name;
			generalDescription = p.description;
			generalMethodology = p.methodology;
			generalVisibility = p.visibility;
			generalColor = p.color || '#6366f1';
			generalIcon = p.icon || '';
		}).catch(() => {}).finally(() => {
			if (id !== fetchId) return;
			generalLoading = false;
		});

		// Columns
		projects.columns(_slug).then(data => {
			if (id !== fetchId) return;
			columns = data;
		}).catch(() => {}).finally(() => {
			if (id !== fetchId) return;
			columnsLoading = false;
		});

		// Members
		projects.members(_slug).then(data => {
			if (id !== fetchId) return;
			members = data;
		}).catch(() => {}).finally(() => {
			if (id !== fetchId) return;
			membersLoading = false;
		});

		// Linked repos + all repos
		Promise.all([
			projects.linkedRepos(_slug),
			repos.list()
		]).then(([linked, all]) => {
			if (id !== fetchId) return;
			linkedRepos = linked;
			allRepos = all;
		}).catch(() => {}).finally(() => {
			if (id !== fetchId) return;
			linkedReposLoading = false;
		});
	});

	// Repos available to link (not yet linked)
	const availableRepos = $derived(
		allRepos.filter(r => !linkedRepos.some(lr => lr.id === r.id))
	);

	// ---- General Save ----
	async function saveGeneral() {
		if (generalSaving) return;
		generalSaving = true;
		try {
			await projects.update(slug, {
				name: generalName.trim(),
				description: generalDescription.trim(),
				methodology: generalMethodology,
				visibility: generalVisibility,
				color: generalColor,
				icon: generalIcon.trim() || undefined
			});
			toastStore.success('Project updated.');
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to update project');
		} finally {
			generalSaving = false;
		}
	}

	// ---- Columns ----
	function startEditCol(col: ProjectColumn) {
		editingColId = col.id;
		editColName = col.name;
		editColColor = col.color || '#6366f1';
		editColWip = col.wip_limit ?? 0;
		editColDone = col.is_done;
	}

	function cancelEditCol() {
		editingColId = null;
	}

	async function saveCol(col: ProjectColumn) {
		if (savingColId !== null) return;
		savingColId = col.id;
		try {
			await projects.updateColumn(slug, col.id, {
				name: editColName.trim(),
				color: editColColor,
				wip_limit: editColWip || 0,
				is_done: editColDone
			});
			toastStore.success('Column updated.');
			editingColId = null;
			const data = await projects.columns(slug);
			columns = data;
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to update column');
		} finally {
			savingColId = null;
		}
	}

	async function deleteCol(col: ProjectColumn) {
		if (!confirm(`Delete column "${col.name}"? Items in this column will need to be moved first.`)) return;
		if (deletingColId !== null) return;
		deletingColId = col.id;
		try {
			await projects.deleteColumn(slug, col.id);
			toastStore.success('Column deleted.');
			const data = await projects.columns(slug);
			columns = data;
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to delete column');
		} finally {
			deletingColId = null;
		}
	}

	async function addColumn() {
		const name = newColName.trim();
		if (!name || addingCol) return;
		addingCol = true;
		try {
			await projects.createColumn(slug, { name, color: newColColor });
			toastStore.success('Column added.');
			newColName = '';
			newColColor = '#6366f1';
			const data = await projects.columns(slug);
			columns = data;
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to add column');
		} finally {
			addingCol = false;
		}
	}

	// Drag to reorder columns
	function onColDragStart(colId: number) {
		draggingColId = colId;
	}

	function onColDragOver(e: DragEvent, colId: number) {
		e.preventDefault();
		if (draggingColId !== null && draggingColId !== colId) {
			dragOverColId = colId;
		}
	}

	function onColDrop(targetColId: number) {
		if (draggingColId === null || draggingColId === targetColId) {
			draggingColId = null;
			dragOverColId = null;
			return;
		}
		const fromIdx = columns.findIndex(c => c.id === draggingColId);
		const toIdx = columns.findIndex(c => c.id === targetColId);
		if (fromIdx === -1 || toIdx === -1) return;

		const reordered = [...columns];
		const [moved] = reordered.splice(fromIdx, 1);
		reordered.splice(toIdx, 0, moved);
		columns = reordered;

		draggingColId = null;
		dragOverColId = null;

		projects.reorderColumns(slug, reordered.map(c => c.id)).catch(() => {
			toastStore.error('Failed to reorder columns');
		});
	}

	// ---- Members ----
	async function addMember() {
		const username = newMemberUsername.trim();
		if (!username || addingMember) return;
		addingMember = true;
		try {
			await projects.addMember(slug, { username });
			toastStore.success(`Added ${username}.`);
			newMemberUsername = '';
			const data = await projects.members(slug);
			members = data;
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to add member');
		} finally {
			addingMember = false;
		}
	}

	async function removeMember(username: string) {
		if (!confirm(`Remove ${username} from this project?`)) return;
		if (removingMember) return;
		removingMember = username;
		try {
			await projects.removeMember(slug, username);
			toastStore.success(`Removed ${username}.`);
			const data = await projects.members(slug);
			members = data;
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to remove member');
		} finally {
			removingMember = '';
		}
	}

	// ---- Linked Repos ----
	async function linkRepo() {
		const id = Number(selectedRepoId);
		if (!id || linkingRepo) return;
		linkingRepo = true;
		try {
			await projects.linkRepo(slug, id);
			toastStore.success('Repository linked.');
			selectedRepoId = '';
			const data = await projects.linkedRepos(slug);
			linkedRepos = data;
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to link repository');
		} finally {
			linkingRepo = false;
		}
	}

	async function unlinkRepo(repo: Repository) {
		if (!confirm(`Unlink "${repo.name}" from this project?`)) return;
		if (unlinkingRepoId !== null) return;
		unlinkingRepoId = repo.id;
		try {
			await projects.unlinkRepo(slug, repo.id);
			toastStore.success('Repository unlinked.');
			const data = await projects.linkedRepos(slug);
			linkedRepos = data;
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to unlink repository');
		} finally {
			unlinkingRepoId = null;
		}
	}

	// ---- Danger ----
	async function deleteProject() {
		if (deleteConfirm !== slug || deleting) return;
		deleting = true;
		try {
			await projects.remove(slug);
			toastStore.success('Project deleted.');
			goto('/projects');
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to delete project');
			deleting = false;
		}
	}

	const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
		owner:  { label: 'Owner',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
		admin:  { label: 'Admin',  color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
		member: { label: 'Member', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
		viewer: { label: 'Viewer', color: '#6b7280', bg: 'rgba(107,114,128,0.1)'  }
	};
</script>

<div class="flex flex-col gap-6 max-w-3xl content-reveal">

	<!-- ── Section: General ── -->
	<section class="card p-5 flex flex-col gap-4 card-animate stagger-1">
		<h2 class="section-title">General</h2>

		{#if generalLoading}
			<div class="flex justify-center py-6"><Spinner size="sm" /></div>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div class="flex flex-col gap-1.5 sm:col-span-2">
					<label class="text-xs font-medium" style="color: var(--color-text-dim);">Name</label>
					<input
						type="text"
						bind:value={generalName}
						class="px-3 py-2 text-sm rounded-lg border bg-transparent outline-none transition-colors focus:border-[var(--color-primary)]"
						style="border-color: var(--glass-border); color: var(--color-text);"
					/>
				</div>

				<div class="flex flex-col gap-1.5 sm:col-span-2">
					<label class="text-xs font-medium" style="color: var(--color-text-dim);">Description</label>
					<textarea
						bind:value={generalDescription}
						rows="3"
						class="px-3 py-2 text-sm rounded-lg border bg-transparent outline-none transition-colors resize-none focus:border-[var(--color-primary)]"
						style="border-color: var(--glass-border); color: var(--color-text);"
					></textarea>
				</div>

				<div class="flex flex-col gap-1.5">
					<label class="text-xs font-medium" style="color: var(--color-text-dim);">Methodology</label>
					<select
						bind:value={generalMethodology}
						class="px-3 py-2 text-sm rounded-lg border bg-transparent outline-none cursor-pointer transition-colors focus:border-[var(--color-primary)]"
						style="border-color: var(--glass-border); color: var(--color-text);"
					>
						{#each ['kanban','scrum','scrumban','xp','waterfall','custom'] as m}
							<option value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
						{/each}
					</select>
				</div>

				<div class="flex flex-col gap-1.5">
					<label class="text-xs font-medium" style="color: var(--color-text-dim);">Visibility</label>
					<select
						bind:value={generalVisibility}
						class="px-3 py-2 text-sm rounded-lg border bg-transparent outline-none cursor-pointer transition-colors focus:border-[var(--color-primary)]"
						style="border-color: var(--glass-border); color: var(--color-text);"
					>
						<option value="private">Private</option>
						<option value="members">Members only</option>
						<option value="public">Public</option>
					</select>
				</div>

				<div class="flex flex-col gap-1.5">
					<label class="text-xs font-medium" style="color: var(--color-text-dim);">Color</label>
					<div class="flex items-center gap-2">
						<input
							type="color"
							bind:value={generalColor}
							class="w-9 h-9 rounded-lg border cursor-pointer p-0.5"
							style="background: var(--color-surface); border-color: var(--glass-border);"
						/>
						<input
							type="text"
							bind:value={generalColor}
							class="flex-1 px-3 py-2 text-sm rounded-lg border outline-none transition-colors font-mono"
							style="border-color: var(--glass-border); color: var(--color-text);"
						/>
					</div>
				</div>

				<div class="flex flex-col gap-1.5">
					<label class="text-xs font-medium" style="color: var(--color-text-dim);">Icon (emoji)</label>
					<input
						type="text"
						bind:value={generalIcon}
						placeholder="e.g. 🚀"
						class="px-3 py-2 text-sm rounded-lg border bg-transparent outline-none transition-colors focus:border-[var(--color-primary)]"
						style="border-color: var(--glass-border); color: var(--color-text);"
					/>
				</div>
			</div>

			<div class="pt-1">
				<button
					class="btn-glow px-5 py-2.5 text-sm font-semibold rounded-xl text-white disabled:opacity-40 transition-all hover:scale-[1.02] active:scale-[0.98]"
					style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));"
					disabled={generalSaving || !generalName.trim()}
					onclick={saveGeneral}
				>
					{generalSaving ? 'Saving...' : 'Save Changes'}
				</button>
			</div>
		{/if}
	</section>

	<!-- ── Section: Columns ── -->
	<section class="card p-5 flex flex-col gap-4 card-animate stagger-2">
		<h2 class="section-title">Columns</h2>

		{#if columnsLoading}
			<div class="flex justify-center py-6"><Spinner size="sm" /></div>
		{:else}
			<p class="text-xs" style="color: var(--color-text-dim);">Drag rows to reorder. Click a column to edit.</p>

			<div class="flex flex-col gap-1.5">
				{#each columns as col (col.id)}
					<div
						class="rounded-lg border transition-all"
						style="border-color: {dragOverColId === col.id ? 'var(--color-primary)' : 'var(--glass-border)'}; background: var(--color-surface);"
						draggable="true"
						ondragstart={() => onColDragStart(col.id)}
						ondragover={(e) => onColDragOver(e, col.id)}
						ondrop={() => onColDrop(col.id)}
						ondragend={() => { draggingColId = null; dragOverColId = null; }}
						role="listitem"
					>
						{#if editingColId === col.id}
							<!-- Edit mode -->
							<div class="p-3 flex flex-col gap-3">
								<div class="grid grid-cols-2 gap-3">
									<div class="flex flex-col gap-1">
										<label class="text-[0.6875rem] font-medium" style="color: var(--color-text-dim);">Name</label>
										<input
											type="text"
											bind:value={editColName}
											class="px-2.5 py-1.5 text-sm rounded-md border outline-none"
											style="background: var(--color-surface-hover); border-color: var(--glass-border); color: var(--color-text);"
										/>
									</div>
									<div class="flex flex-col gap-1">
										<label class="text-[0.6875rem] font-medium" style="color: var(--color-text-dim);">Color</label>
										<div class="flex items-center gap-1.5">
											<input
												type="color"
												bind:value={editColColor}
												class="w-8 h-8 rounded cursor-pointer p-0.5 border"
												style="background: transparent; border-color: var(--glass-border);"
											/>
											<input
												type="text"
												bind:value={editColColor}
												class="flex-1 px-2 py-1.5 text-xs rounded-md border outline-none font-mono"
												style="background: var(--color-surface-hover); border-color: var(--glass-border); color: var(--color-text);"
											/>
										</div>
									</div>
									<div class="flex flex-col gap-1">
										<label class="text-[0.6875rem] font-medium" style="color: var(--color-text-dim);">WIP Limit (0 = none)</label>
										<input
											type="number"
											min="0"
											bind:value={editColWip}
											class="px-2.5 py-1.5 text-sm rounded-md border outline-none"
											style="background: var(--color-surface-hover); border-color: var(--glass-border); color: var(--color-text);"
										/>
									</div>
									<div class="flex items-end pb-1">
										<button
											class="flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-colors"
											style="border-color: {editColDone ? 'var(--color-primary)' : 'var(--glass-border)'}; background: {editColDone ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'transparent'}; color: {editColDone ? 'var(--color-primary)' : 'var(--color-text-dim)'};"
											onclick={() => { editColDone = !editColDone; }}
										>
											<span class="w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0" style="border-color: {editColDone ? 'var(--color-primary)' : 'var(--color-text-dim)'}; background: {editColDone ? 'var(--color-primary)' : 'transparent'};">
												{#if editColDone}
													<svg class="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3.5">
														<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
													</svg>
												{/if}
											</span>
											Done column
										</button>
									</div>
								</div>
								<div class="flex items-center gap-2">
									<button
										class="px-3 py-1.5 text-xs font-medium rounded-md text-white disabled:opacity-40 transition-all hover:brightness-110"
										style="background: var(--color-primary);"
										disabled={savingColId === col.id || !editColName.trim()}
										onclick={() => saveCol(col)}
									>
										{savingColId === col.id ? 'Saving...' : 'Save'}
									</button>
									<button
										class="px-3 py-1.5 text-xs rounded-md transition-colors"
										style="color: var(--color-text-dim);"
										onclick={cancelEditCol}
									>
										Cancel
									</button>
									<button
										class="ml-auto px-3 py-1.5 text-xs font-medium rounded-md transition-all hover:brightness-110"
										style="color: var(--color-error); background: var(--color-error-subtle); border: 1px solid color-mix(in srgb, var(--color-error) 30%, transparent);"
										disabled={deletingColId === col.id}
										onclick={() => deleteCol(col)}
									>
										{deletingColId === col.id ? 'Deleting...' : 'Delete'}
									</button>
								</div>
							</div>
						{:else}
							<!-- View mode -->
							<button
								class="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[rgba(255,255,255,0.03)] transition-colors rounded-lg"
								onclick={() => startEditCol(col)}
							>
								<!-- Drag handle -->
								<svg class="w-3.5 h-3.5 shrink-0 cursor-grab" style="color: var(--color-text-dim); opacity: 0.4;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
								</svg>
								<!-- Color dot -->
								<span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: {col.color || 'var(--color-primary)'}"></span>
								<!-- Name -->
								<span class="text-sm font-medium flex-1 text-left" style="color: var(--color-text);">{col.name}</span>
								<!-- Meta -->
								<div class="flex items-center gap-2 text-xs shrink-0" style="color: var(--color-text-dim);">
									{#if col.wip_limit && col.wip_limit > 0}
										<span class="px-1.5 py-0.5 rounded" style="background: var(--color-surface-hover);">WIP {col.wip_limit}</span>
									{/if}
									{#if col.is_done}
										<span class="px-1.5 py-0.5 rounded text-[0.5625rem] font-semibold" style="background: color-mix(in srgb, var(--color-success) 12%, transparent); color: var(--color-success);">Done</span>
									{/if}
									<span style="opacity: 0.5;">{col.item_count} items</span>
									<svg class="w-3.5 h-3.5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
									</svg>
								</div>
							</button>
						{/if}
					</div>
				{/each}
			</div>

			<!-- Add column -->
			<div class="flex items-center gap-2 pt-1">
				<input
					type="color"
					bind:value={newColColor}
					class="w-8 h-8 rounded cursor-pointer p-0.5 border shrink-0"
					style="background: transparent; border-color: var(--glass-border);"
				/>
				<input
					type="text"
					bind:value={newColName}
					placeholder="New column name..."
					onkeydown={(e) => { if (e.key === 'Enter') addColumn(); }}
					class="flex-1 px-3 py-2 text-sm rounded-lg border outline-none transition-colors"
					style="border-color: var(--glass-border); color: var(--color-text);"
				/>
				<button
					class="px-3.5 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-40 transition-all hover:brightness-110 shrink-0"
					style="background: var(--color-primary);"
					disabled={!newColName.trim() || addingCol}
					onclick={addColumn}
				>
					{addingCol ? '...' : 'Add'}
				</button>
			</div>
		{/if}
	</section>

	<!-- ── Section: Members ── -->
	<section class="card p-5 flex flex-col gap-4 card-animate stagger-3">
		<h2 class="section-title">Members</h2>

		{#if membersLoading}
			<div class="flex justify-center py-6"><Spinner size="sm" /></div>
		{:else}
			{#if members.length === 0}
				<p class="text-sm" style="color: var(--color-text-dim); opacity: 0.6;">No members yet.</p>
			{:else}
				<div class="flex flex-col gap-1">
					{#each members as member (member.id)}
						{@const rc = roleConfig[member.role] ?? roleConfig.member}
						<div class="flex items-center gap-3 px-3 py-2.5 rounded-lg border" style="border-color: var(--glass-border); background: var(--color-surface);">
							<Avatar username={member.username} size={32} />
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium truncate" style="color: var(--color-text);">{member.username}</p>
								{#if member.full_name}
									<p class="text-xs truncate" style="color: var(--color-text-dim);">{member.full_name}</p>
								{/if}
							</div>
							<span
								class="text-[0.5625rem] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide shrink-0"
								style="background: {rc.bg}; color: {rc.color};"
							>
								{rc.label}
							</span>
							{#if member.role !== 'owner' && member.username !== userStore.user?.username}
								<button
									class="shrink-0 p-1.5 rounded-lg transition-colors hover:bg-[rgba(239,68,68,0.1)] disabled:opacity-40"
									style="color: var(--color-text-dim);"
									title="Remove member"
									disabled={removingMember === member.username}
									onclick={() => removeMember(member.username)}
								>
									<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							{/if}
						</div>
					{/each}
				</div>
			{/if}

			<!-- Add member -->
			<div class="flex items-center gap-2">
				<input
					type="text"
					bind:value={newMemberUsername}
					placeholder="Username to add..."
					onkeydown={(e) => { if (e.key === 'Enter') addMember(); }}
					class="flex-1 px-3 py-2 text-sm rounded-lg border outline-none transition-colors"
					style="border-color: var(--glass-border); color: var(--color-text);"
				/>
				<button
					class="px-3.5 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-40 transition-all hover:brightness-110 shrink-0"
					style="background: var(--color-primary);"
					disabled={!newMemberUsername.trim() || addingMember}
					onclick={addMember}
				>
					{addingMember ? '...' : 'Add'}
				</button>
			</div>
		{/if}
	</section>

	<!-- ── Section: Linked Repos ── -->
	<section class="card p-5 flex flex-col gap-4 card-animate stagger-4">
		<h2 class="section-title">Linked Repositories</h2>

		{#if linkedReposLoading}
			<div class="flex justify-center py-6"><Spinner size="sm" /></div>
		{:else}
			{#if linkedRepos.length === 0}
				<p class="text-sm" style="color: var(--color-text-dim); opacity: 0.6;">No repositories linked yet.</p>
			{:else}
				<div class="flex flex-col gap-1.5">
					{#each linkedRepos as repo (repo.id)}
						<div class="flex items-center gap-3 px-3 py-2.5 rounded-lg border" style="border-color: var(--glass-border); background: var(--color-surface);">
							<svg class="w-4 h-4 shrink-0" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
							</svg>
							<div class="flex-1 min-w-0">
								<a
									href="/{repo.owner}/{repo.name}"
									class="text-sm font-medium hover:underline truncate block"
									style="color: var(--color-primary);"
								>
									{repo.owner}/{repo.name}
								</a>
								{#if repo.description}
									<p class="text-xs truncate" style="color: var(--color-text-dim);">{repo.description}</p>
								{/if}
							</div>
							{#if repo.is_private}
								<span class="text-[0.5625rem] font-semibold px-1.5 py-0.5 rounded-full shrink-0" style="background: rgba(148,163,184,0.1); color: #94a3b8;">Private</span>
							{/if}
							<button
								class="shrink-0 px-2.5 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-40"
								style="color: var(--color-error); background: color-mix(in srgb, var(--color-error) 10%, transparent); border: 1px solid color-mix(in srgb, var(--color-error) 20%, transparent);"
								disabled={unlinkingRepoId === repo.id}
								onclick={() => unlinkRepo(repo)}
							>
								{unlinkingRepoId === repo.id ? '...' : 'Unlink'}
							</button>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Link repo -->
			{#if availableRepos.length > 0}
				<div class="flex items-center gap-2">
					<select
						bind:value={selectedRepoId}
						class="flex-1 px-3 py-2 text-sm rounded-lg border outline-none cursor-pointer transition-colors"
						style="border-color: var(--glass-border); color: var(--color-text);"
					>
						<option value="">Select a repository...</option>
						{#each availableRepos as repo}
							<option value={repo.id}>{repo.owner}/{repo.name}</option>
						{/each}
					</select>
					<button
						class="px-3.5 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-40 transition-all hover:brightness-110 shrink-0"
						style="background: var(--color-primary);"
						disabled={!selectedRepoId || linkingRepo}
						onclick={linkRepo}
					>
						{linkingRepo ? '...' : 'Link'}
					</button>
				</div>
			{:else if linkedRepos.length > 0}
				<p class="text-xs" style="color: var(--color-text-dim); opacity: 0.6;">All your repositories are already linked.</p>
			{/if}
		{/if}
	</section>

	<!-- ── Section: Danger Zone ── -->
	<section class="card p-5 flex flex-col gap-4 card-animate stagger-5" style="border-color: color-mix(in srgb, var(--color-error) 30%, transparent);">
		<h2 class="section-title" style="color: var(--color-error);">Danger Zone</h2>

		<div class="flex flex-col gap-2">
			<p class="text-sm" style="color: var(--color-text-dim);">
				Deleting this project is <strong style="color: var(--color-text);">permanent and cannot be undone.</strong>
				All items, columns, and sprints will be lost.
			</p>
			<p class="text-xs" style="color: var(--color-text-dim);">
				Type <code class="px-1 rounded text-xs font-mono" style="background: var(--color-surface); color: var(--color-text);">{slug}</code> to confirm.
			</p>
			<div class="flex items-center gap-2 pt-1">
				<input
					type="text"
					bind:value={deleteConfirm}
					placeholder={slug}
					class="flex-1 max-w-xs px-3 py-2 text-sm rounded-lg border outline-none transition-colors font-mono"
					style="border-color: var(--glass-border); color: var(--color-text);"
				/>
				<button
					class="px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-40 transition-all hover:brightness-110"
					style="background: var(--color-error); color: white;"
					disabled={deleteConfirm !== slug || deleting}
					onclick={deleteProject}
				>
					{deleting ? 'Deleting...' : 'Delete Project'}
				</button>
			</div>
		</div>
	</section>

</div>
