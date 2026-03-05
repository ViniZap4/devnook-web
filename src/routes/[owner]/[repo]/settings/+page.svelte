<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { repos, webhooks } from '$lib/services/api';
	import type { Repository } from '$lib/types/repository';
	import type { Webhook } from '$lib/types/webhook';
	import type { Collaborator } from '$lib/services/api';
	import { onMount } from 'svelte';

	const owner = $derived($page.params.owner!);
	const repoName = $derived($page.params.repo!);

	let repo = $state<Repository | null>(null);
	let description = $state('');
	let website = $state('');
	let isPrivate = $state(false);
	let defaultBranch = $state('');
	let topicsInput = $state('');
	let saving = $state(false);
	let saved = $state(false);

	// Webhooks
	let hooks = $state<Webhook[]>([]);
	let showHookForm = $state(false);
	let hookUrl = $state('');
	let hookSecret = $state('');
	let hookEvents = $state('push');
	let hookSubmitting = $state(false);

	// Collaborators
	let collaborators = $state<Collaborator[]>([]);
	let showCollabForm = $state(false);
	let collabUsername = $state('');
	let collabPermission = $state('write');
	let collabSubmitting = $state(false);

	// Transfer
	let transferOwner = $state('');
	let transferring = $state(false);

	// Delete
	let deleting = $state(false);
	let confirmName = $state('');

	onMount(async () => {
		try {
			repo = await repos.get(owner, repoName);
			if (repo) {
				description = repo.description || '';
				website = repo.website || '';
				isPrivate = repo.is_private;
				defaultBranch = repo.default_branch;
				topicsInput = (repo.topics || []).join(', ');
			}
			const [h, c] = await Promise.all([
				webhooks.list(owner, repoName),
				repos.listCollaborators(owner, repoName)
			]);
			hooks = h;
			collaborators = c;
		} catch {
			// ignore
		}
	});

	async function handleSave(e: Event) {
		e.preventDefault();
		saving = true;
		saved = false;
		try {
			const topics = topicsInput.split(',').map(t => t.trim()).filter(Boolean);
			await repos.update(owner, repoName, { description, website, is_private: isPrivate, default_branch: defaultBranch, topics });
			saved = true;
			setTimeout(() => { saved = false; }, 3000);
		} catch {
			// ignore
		} finally {
			saving = false;
		}
	}

	async function handleDelete() {
		if (confirmName !== repoName) return;
		deleting = true;
		try {
			await repos.remove(owner, repoName);
			goto('/dashboard');
		} catch {
			deleting = false;
		}
	}

	async function addHook(e: Event) {
		e.preventDefault();
		if (!hookUrl) return;
		hookSubmitting = true;
		try {
			await webhooks.create(owner, repoName, { url: hookUrl, secret: hookSecret, events: hookEvents.split(',').map(e => e.trim()), active: true });
			hookUrl = ''; hookSecret = ''; hookEvents = 'push';
			showHookForm = false;
			hooks = await webhooks.list(owner, repoName);
		} catch {
			// ignore
		} finally {
			hookSubmitting = false;
		}
	}

	async function deleteHook(id: number) {
		try {
			await webhooks.remove(owner, repoName, id);
			hooks = hooks.filter(h => h.id !== id);
		} catch {
			// ignore
		}
	}

	async function addCollaborator(e: Event) {
		e.preventDefault();
		if (!collabUsername) return;
		collabSubmitting = true;
		try {
			await repos.addCollaborator(owner, repoName, { username: collabUsername, permission: collabPermission });
			collabUsername = '';
			collabPermission = 'write';
			showCollabForm = false;
			collaborators = await repos.listCollaborators(owner, repoName);
		} catch {
			// ignore
		} finally {
			collabSubmitting = false;
		}
	}

	async function removeCollaborator(username: string) {
		if (!confirm(`Remove ${username} as collaborator?`)) return;
		try {
			await repos.removeCollaborator(owner, repoName, username);
			collaborators = collaborators.filter(c => c.username !== username);
		} catch {
			// ignore
		}
	}

	async function handleTransfer() {
		if (!transferOwner || !confirm(`Transfer this repository to "${transferOwner}"? This action cannot be undone.`)) return;
		transferring = true;
		try {
			await repos.transfer(owner, repoName, transferOwner);
			goto(`/${transferOwner}/${repoName}`);
		} catch {
			transferring = false;
		}
	}
</script>

<div class="flex flex-col gap-8">
	<h2 class="text-[var(--color-text)] font-semibold">Settings</h2>

	<!-- General -->
	<section class="card p-6">
		<h3 class="font-semibold text-sm mb-4" style="color: var(--color-text);">General</h3>
		<form onsubmit={handleSave} class="flex flex-col gap-4 max-w-lg">
			<div>
				<label class="block text-xs font-medium mb-1.5" style="color: var(--color-text-dim);">Description</label>
				<input type="text" bind:value={description} class="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]" />
			</div>
			<div>
				<label class="block text-xs font-medium mb-1.5" style="color: var(--color-text-dim);">Website</label>
				<input type="text" bind:value={website} placeholder="https://..." class="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]" />
			</div>
			<div>
				<label class="block text-xs font-medium mb-1.5" style="color: var(--color-text-dim);">Default branch</label>
				<input type="text" bind:value={defaultBranch} class="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]" />
			</div>
			<div>
				<label class="block text-xs font-medium mb-1.5" style="color: var(--color-text-dim);">Topics (comma-separated)</label>
				<input type="text" bind:value={topicsInput} placeholder="go, web, api" class="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]" />
			</div>
			<label class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
				<input type="checkbox" bind:checked={isPrivate} />
				Private repository
			</label>
			<div class="flex items-center gap-3">
				<button type="submit" disabled={saving} class="px-4 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-40" style="background-color: var(--color-primary);">{saving ? 'Saving...' : 'Save'}</button>
				{#if saved}
					<span class="text-sm text-green-400">Saved!</span>
				{/if}
			</div>
		</form>
	</section>

	<!-- Collaborators -->
	<section class="card p-6">
		<div class="flex items-center justify-between mb-4">
			<h3 class="font-semibold text-sm" style="color: var(--color-text);">Collaborators</h3>
			<button class="text-xs px-3 py-1.5 rounded-lg text-white" style="background-color: var(--color-primary);" onclick={() => { showCollabForm = !showCollabForm; }}>{showCollabForm ? 'Cancel' : 'Add Collaborator'}</button>
		</div>

		{#if showCollabForm}
			<form onsubmit={addCollaborator} class="flex items-end gap-3 mb-4 max-w-lg">
				<div class="flex-1">
					<label class="block text-xs font-medium mb-1.5" style="color: var(--color-text-dim);">Username</label>
					<input type="text" bind:value={collabUsername} placeholder="Username" class="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]" />
				</div>
				<div>
					<label class="block text-xs font-medium mb-1.5" style="color: var(--color-text-dim);">Permission</label>
					<select bind:value={collabPermission} class="px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]">
						<option value="read">Read</option>
						<option value="write">Write</option>
						<option value="admin">Admin</option>
					</select>
				</div>
				<button type="submit" disabled={collabSubmitting || !collabUsername} class="px-4 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-40" style="background-color: var(--color-primary);">{collabSubmitting ? 'Adding...' : 'Add'}</button>
			</form>
		{/if}

		{#if collaborators.length === 0}
			<p class="text-sm" style="color: var(--color-text-dim);">No collaborators</p>
		{:else}
			<div class="flex flex-col gap-2">
				{#each collaborators as collab}
					<div class="flex items-center justify-between p-3 rounded-lg border" style="border-color: var(--color-border);">
						<div class="flex items-center gap-3">
							<div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium" style="background-color: var(--color-surface-hover); color: var(--color-text-dim);">
								{collab.username.charAt(0).toUpperCase()}
							</div>
							<div>
								<a href="/{collab.username}" class="text-sm font-medium hover:underline" style="color: var(--color-primary);">{collab.username}</a>
								{#if collab.full_name}
									<span class="text-xs ml-1" style="color: var(--color-text-dim);">{collab.full_name}</span>
								{/if}
							</div>
						</div>
						<div class="flex items-center gap-3">
							<span class="text-xs px-2 py-0.5 rounded-full" style="background-color: var(--color-surface); color: var(--color-text-dim);">{collab.permission}</span>
							<button class="text-xs opacity-40 hover:opacity-100" style="color: var(--color-error);" onclick={() => removeCollaborator(collab.username)}>Remove</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<!-- Webhooks -->
	<section class="card p-6">
		<div class="flex items-center justify-between mb-4">
			<h3 class="font-semibold text-sm" style="color: var(--color-text);">Webhooks</h3>
			<button class="text-xs px-3 py-1.5 rounded-lg text-white" style="background-color: var(--color-primary);" onclick={() => { showHookForm = !showHookForm; }}>{showHookForm ? 'Cancel' : 'Add Webhook'}</button>
		</div>

		{#if showHookForm}
			<form onsubmit={addHook} class="flex flex-col gap-3 mb-4 max-w-lg">
				<input type="url" bind:value={hookUrl} placeholder="Payload URL" class="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]" />
				<input type="text" bind:value={hookSecret} placeholder="Secret (optional)" class="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]" />
				<input type="text" bind:value={hookEvents} placeholder="Events: push, issues, pull_request" class="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]" />
				<button type="submit" disabled={hookSubmitting || !hookUrl} class="self-start px-4 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-40" style="background-color: var(--color-primary);">{hookSubmitting ? 'Adding...' : 'Add'}</button>
			</form>
		{/if}

		{#if hooks.length === 0}
			<p class="text-sm" style="color: var(--color-text-dim);">No webhooks configured</p>
		{:else}
			<div class="flex flex-col gap-2">
				{#each hooks as hook}
					<div class="flex items-center justify-between p-3 rounded-lg border" style="border-color: var(--color-border);">
						<div>
							<span class="text-sm font-mono" style="color: var(--color-text);">{hook.url}</span>
							<div class="text-xs mt-0.5" style="color: var(--color-text-dim);">
								{hook.events.join(', ')} · {hook.active ? 'Active' : 'Inactive'}
							</div>
						</div>
						<button class="text-xs opacity-40 hover:opacity-100" style="color: var(--color-error);" onclick={() => deleteHook(hook.id)}>Delete</button>
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<!-- Danger zone -->
	<section class="rounded-lg border border-red-500/20 p-6">
		<h3 class="text-red-400 font-semibold mb-4">Danger Zone</h3>

		<!-- Transfer -->
		<div class="flex items-center justify-between p-4 rounded-lg border mb-4" style="border-color: var(--color-border);">
			<div>
				<p class="text-sm font-medium" style="color: var(--color-text);">Transfer ownership</p>
				<p class="text-xs mt-0.5" style="color: var(--color-text-dim);">Transfer this repository to another user.</p>
			</div>
			<div class="flex items-center gap-2 shrink-0">
				<input
					type="text"
					bind:value={transferOwner}
					placeholder="New owner"
					class="px-3 py-1.5 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] w-32"
				/>
				<button
					onclick={handleTransfer}
					disabled={!transferOwner || transferring}
					class="px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors hover:bg-red-500/10 disabled:opacity-30"
					style="border-color: var(--color-border); color: var(--color-error);"
				>{transferring ? 'Transferring...' : 'Transfer'}</button>
			</div>
		</div>

		<!-- Delete -->
		<div class="flex items-center justify-between p-4 rounded-lg border" style="border-color: var(--color-border);">
			<div>
				<p class="text-sm font-medium" style="color: var(--color-text);">Delete this repository</p>
				<p class="text-xs mt-0.5" style="color: var(--color-text-dim);">Once deleted, there is no going back.</p>
			</div>
			<div class="flex items-center gap-2 shrink-0">
				<input
					type="text"
					bind:value={confirmName}
					placeholder="Type name to confirm"
					class="px-3 py-1.5 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] w-40"
				/>
				<button
					onclick={handleDelete}
					disabled={confirmName !== repoName || deleting}
					class="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
				>{deleting ? 'Deleting...' : 'Delete'}</button>
			</div>
		</div>
	</section>
</div>
