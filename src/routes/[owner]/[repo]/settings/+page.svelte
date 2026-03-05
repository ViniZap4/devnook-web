<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { repos, webhooks } from '$lib/services/api';
	import type { Repository } from '$lib/types/repository';
	import type { Webhook } from '$lib/types/webhook';
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
			hooks = await webhooks.list(owner, repoName);
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
		<h3 class="text-red-400 font-semibold mb-2">Danger Zone</h3>
		<p class="text-sm text-[var(--color-text)] opacity-60 mb-4">
			Once you delete a repository, there is no going back.
		</p>
		<div class="flex flex-col gap-3 max-w-sm">
			<input
				type="text"
				bind:value={confirmName}
				placeholder="Type repository name to confirm"
				class="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:opacity-30"
			/>
			<button
				onclick={handleDelete}
				disabled={confirmName !== repoName || deleting}
				class="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
			>
				{deleting ? 'Deleting...' : 'Delete this repository'}
			</button>
		</div>
	</section>
</div>
