<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { sshKeys } from '$lib/services/api';
	import type { SSHKey } from '$lib/types/ssh_key';
	import PageShell from '$lib/components/PageShell.svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';

	let keys = $state<SSHKey[]>([]);
	let loading = $state(true);
	let showForm = $state(false);
	let name = $state('');
	let publicKey = $state('');
	let submitting = $state(false);
	let error = $state('');

	onMount(async () => {
		if (!userStore.isLoggedIn) { goto('/'); return; }
		await fetchKeys();
	});

	async function fetchKeys() {
		loading = true;
		try {
			keys = await sshKeys.list();
		} catch {
			keys = [];
		} finally {
			loading = false;
		}
	}

	async function handleCreate(e: Event) {
		e.preventDefault();
		if (!name || !publicKey) return;
		submitting = true;
		error = '';
		try {
			await sshKeys.create({ name, public_key: publicKey });
			name = ''; publicKey = '';
			showForm = false;
			await fetchKeys();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to add key';
		} finally {
			submitting = false;
		}
	}

	async function handleDelete(id: number) {
		try {
			await sshKeys.remove(id);
			await fetchKeys();
		} catch {
			// ignore
		}
	}
</script>

<PageShell maxWidth="max-w-3xl">
	<div class="flex flex-col gap-8">
		<div>
			<h1 class="text-2xl font-bold" style="color: var(--color-text);">SSH Keys</h1>
			<p class="text-sm mt-1" style="color: var(--color-text-dim);">Manage your SSH keys for git access</p>
		</div>

		<div class="flex items-center gap-3">
			<a href="/settings" class="text-sm hover:underline" style="color: var(--color-primary);">← Back to Settings</a>
		</div>

		<button
			class="self-start px-4 py-2 text-sm font-medium rounded-lg text-white transition-opacity hover:opacity-90"
			style="background-color: var(--color-primary);"
			onclick={() => { showForm = !showForm; }}
		>{showForm ? 'Cancel' : 'Add SSH Key'}</button>

		{#if showForm}
			<form onsubmit={handleCreate} class="card p-6 flex flex-col gap-4">
				<div>
					<label class="block text-xs font-medium mb-1.5" style="color: var(--color-text-dim);">Title</label>
					<input type="text" bind:value={name} placeholder="My Laptop" class="w-full px-3 py-2 text-sm rounded-lg border" style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text);" />
				</div>
				<div>
					<label class="block text-xs font-medium mb-1.5" style="color: var(--color-text-dim);">Key</label>
					<textarea bind:value={publicKey} placeholder="ssh-rsa AAAA... or ssh-ed25519 AAAA..." rows={4} class="w-full px-3 py-2 text-sm rounded-lg border font-mono resize-y" style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text);"></textarea>
				</div>
				{#if error}
					<p class="text-sm" style="color: var(--color-error);">{error}</p>
				{/if}
				<button type="submit" disabled={submitting || !name || !publicKey} class="self-start px-4 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-40" style="background-color: var(--color-primary);">{submitting ? 'Adding...' : 'Add Key'}</button>
			</form>
		{/if}

		{#if loading}
			<div class="py-12 text-center text-sm" style="color: var(--color-text-dim);">Loading...</div>
		{:else if keys.length === 0}
			<div class="py-12 text-center text-sm" style="color: var(--color-text-dim);">No SSH keys configured</div>
		{:else}
			<div class="rounded-xl border overflow-hidden" style="border-color: var(--color-border);">
				{#each keys as key, i}
					<div class="flex items-center justify-between px-4 py-3 {i > 0 ? 'border-t' : ''}" style="border-color: var(--color-border);">
						<div>
							<span class="font-medium text-sm" style="color: var(--color-text);">{key.name}</span>
							<p class="text-xs font-mono mt-0.5" style="color: var(--color-text-dim);">{key.fingerprint}</p>
							{#if key.created_at}
								<p class="text-xs mt-0.5" style="color: var(--color-text-dim);">Added <RelativeTime date={key.created_at} /></p>
							{/if}
						</div>
						<button class="text-xs px-3 py-1 rounded-lg border transition-colors hover:bg-red-500/10" style="border-color: var(--color-border); color: var(--color-error);" onclick={() => handleDelete(key.id)}>Delete</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</PageShell>
