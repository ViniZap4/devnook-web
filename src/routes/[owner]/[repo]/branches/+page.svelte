<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { repos } from '$lib/services/api';
	import { userStore } from '$lib/stores/user.svelte';
	import type { Branch } from '$lib/types/repository';
	import BranchList from '$lib/components/BranchList.svelte';

	const owner = $derived($page.params.owner!);
	const repoName = $derived($page.params.repo!);
	const isOwner = $derived(userStore.user?.username === owner);

	let branches = $state<Branch[]>([]);
	let loading = $state(true);
	let showCreate = $state(false);
	let newBranchName = $state('');
	let fromBranch = $state('');
	let creating = $state(false);
	let error = $state('');

	onMount(async () => {
		await loadBranches();
	});

	async function loadBranches() {
		loading = true;
		try {
			branches = await repos.branches(owner, repoName);
			const def = branches.find(b => b.is_default);
			if (def && !fromBranch) fromBranch = def.name;
		} catch {
			// keep current state
		} finally {
			loading = false;
		}
	}

	async function handleCreate(e: Event) {
		e.preventDefault();
		if (!newBranchName.trim()) return;
		creating = true;
		error = '';
		try {
			await repos.createBranch(owner, repoName, { name: newBranchName.trim(), from: fromBranch });
			newBranchName = '';
			showCreate = false;
			await loadBranches();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create branch';
		} finally {
			creating = false;
		}
	}

	async function handleDelete(branch: string) {
		if (!confirm(`Delete branch "${branch}"?`)) return;
		try {
			await repos.deleteBranch(owner, repoName, branch);
			await loadBranches();
		} catch {
			// ignore
		}
	}
</script>

<div class="flex flex-col gap-5">
	<div class="flex items-center justify-between gap-4">
		<div class="flex items-center gap-1 rounded-xl border p-1 self-start" style="border-color: var(--color-border);">
			<a
				href="/{owner}/{repoName}/branches"
				class="px-4 py-2 text-sm rounded-lg font-medium transition-colors"
				style="background-color: var(--color-primary)10; color: var(--color-primary);"
			>
				<span class="flex items-center gap-2">
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 3v12m0 0a3 3 0 103 3V9a3 3 0 10-3-3m12 0a3 3 0 10-3 3v6" /></svg>
					Branches
				</span>
			</a>
			<a
				href="/{owner}/{repoName}/tags"
				class="px-4 py-2 text-sm rounded-lg transition-colors"
				style="color: var(--color-text-dim);"
			>
				<span class="flex items-center gap-2">
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
					Tags
				</span>
			</a>
		</div>

		{#if isOwner}
			<button
				onclick={() => { showCreate = !showCreate; }}
				class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-opacity hover:opacity-90"
				style="background-color: var(--color-success);"
			>
				<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
				New branch
			</button>
		{/if}
	</div>

	{#if showCreate}
		<form onsubmit={handleCreate} class="card p-4 flex flex-col gap-3">
			<h3 class="text-sm font-semibold" style="color: var(--color-text);">Create a new branch</h3>
			<div class="flex items-center gap-3 flex-wrap">
				<input
					type="text"
					bind:value={newBranchName}
					placeholder="Branch name"
					class="flex-1 min-w-[200px] px-3 py-2 text-sm rounded-lg border"
					style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text);"
				/>
				<div class="flex items-center gap-2 text-xs" style="color: var(--color-text-dim);">
					from
					<select
						bind:value={fromBranch}
						class="px-2 py-1.5 text-sm rounded-lg border"
						style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text);"
					>
						{#each branches as b}
							<option value={b.name}>{b.name}</option>
						{/each}
					</select>
				</div>
			</div>
			{#if error}
				<p class="text-xs" style="color: var(--color-error);">{error}</p>
			{/if}
			<div class="flex items-center gap-2">
				<button
					type="submit"
					disabled={creating || !newBranchName.trim()}
					class="px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-opacity disabled:opacity-40"
					style="background-color: var(--color-success);"
				>{creating ? 'Creating...' : 'Create branch'}</button>
				<button
					type="button"
					onclick={() => { showCreate = false; error = ''; }}
					class="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors hover:bg-[var(--color-surface)]"
					style="border-color: var(--color-border); color: var(--color-text);"
				>Cancel</button>
			</div>
		</form>
	{/if}

	{#if loading}
		<div class="py-12 text-center text-sm" style="color: var(--color-text-dim);">Loading branches...</div>
	{:else if branches.length === 0}
		<div class="rounded-xl border p-16 text-center" style="border-color: var(--color-border);">
			<svg class="w-12 h-12 mx-auto mb-4 opacity-15" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 3v12m0 0a3 3 0 103 3V9a3 3 0 10-3-3m12 0a3 3 0 10-3 3v6" />
			</svg>
			<p class="text-sm" style="color: var(--color-text-dim);">No branches found.</p>
		</div>
	{:else}
		<div class="rounded-xl border overflow-hidden divide-y" style="border-color: var(--color-border); --tw-divide-opacity: 1; divide-color: var(--color-border);">
			{#each branches as branch}
				<div class="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--color-surface)] transition-colors">
					<div class="flex items-center gap-3">
						<svg class="w-4 h-4 shrink-0" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 3v12m0 0a3 3 0 103 3V9a3 3 0 10-3-3m12 0a3 3 0 10-3 3v6" /></svg>
						<span class="text-sm font-medium" style="color: var(--color-text);">{branch.name}</span>
						{#if branch.is_default}
							<span class="text-[0.625rem] px-1.5 py-0.5 rounded-full font-medium" style="background-color: var(--color-success)20; color: var(--color-success);">default</span>
						{/if}
					</div>
					{#if isOwner && !branch.is_default}
						<button
							onclick={() => handleDelete(branch.name)}
							class="text-xs font-medium hover:underline"
							style="color: var(--color-error);"
						>
							<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
						</button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
