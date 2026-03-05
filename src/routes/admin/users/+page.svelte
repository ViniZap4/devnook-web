<script lang="ts">
	import { onMount } from 'svelte';
	import { admin } from '$lib/services/api';
	import type { User } from '$lib/services/api';
	import { userStore } from '$lib/stores/user.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';

	let users = $state<User[]>([]);
	let loading = $state(true);
	let search = $state('');

	const filtered = $derived(
		search
			? users.filter(u =>
				u.username.toLowerCase().includes(search.toLowerCase()) ||
				u.email.toLowerCase().includes(search.toLowerCase()) ||
				(u.full_name && u.full_name.toLowerCase().includes(search.toLowerCase()))
			)
			: users
	);

	onMount(async () => {
		try {
			users = await admin.listUsers();
		} catch {
			// ignore
		} finally {
			loading = false;
		}
	});

	async function toggleAdmin(username: string, isAdmin: boolean) {
		try {
			await admin.updateUser(username, { is_admin: !isAdmin });
			users = await admin.listUsers();
		} catch {
			// ignore
		}
	}

	async function deleteUser(username: string) {
		if (!confirm(`Delete user "${username}"? This action cannot be undone and will remove all their data.`)) return;
		try {
			await admin.removeUser(username);
			users = users.filter(u => u.username !== username);
		} catch {
			// ignore
		}
	}
</script>

<div class="flex flex-col gap-6">
	<div class="flex items-center justify-between flex-wrap gap-4">
		<div>
			<h1 class="text-2xl font-bold" style="color: var(--color-text);">User Accounts</h1>
			<p class="text-sm mt-1" style="color: var(--color-text-dim);">
				{users.length} registered {users.length === 1 ? 'user' : 'users'}
			</p>
		</div>
	</div>

	<!-- Search -->
	<div class="max-w-md">
		<input
			type="text"
			bind:value={search}
			placeholder="Search users by name, username, or email..."
			class="w-full px-4 py-2.5 text-sm rounded-xl border bg-transparent transition-colors focus:border-[var(--color-primary)]"
			style="border-color: var(--color-border); color: var(--color-text);"
		/>
	</div>

	{#if loading}
		<div class="py-12 text-center text-sm" style="color: var(--color-text-dim);">Loading users...</div>
	{:else if filtered.length === 0}
		<div class="rounded-xl border p-12 text-center" style="border-color: var(--color-border);">
			<svg class="w-12 h-12 mx-auto mb-3 opacity-20" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
			</svg>
			<p class="text-sm" style="color: var(--color-text-dim);">{search ? 'No users match your search.' : 'No users found.'}</p>
		</div>
	{:else}
		<div class="rounded-xl border overflow-hidden" style="border-color: var(--color-border);">
			<!-- Table header -->
			<div class="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-4 py-2.5 text-xs font-medium uppercase tracking-wider border-b" style="border-color: var(--color-border); color: var(--color-text-dim); background-color: var(--color-surface);">
				<span class="w-8"></span>
				<span>User</span>
				<span class="w-16 text-center">Role</span>
				<span class="w-24 text-right">Joined</span>
				<span class="w-40 text-right">Actions</span>
			</div>
			{#each filtered as user, i}
				<div
					class="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-4 py-3 transition-colors hover:bg-[var(--color-surface)] {i > 0 ? 'border-t' : ''}"
					style="border-color: var(--color-border);"
				>
					<Avatar username={user.username} size={32} />
					<div class="min-w-0">
						<div class="flex items-center gap-2">
							<a href="/{user.username}" class="text-sm font-medium hover:underline" style="color: var(--color-text);">{user.username}</a>
							{#if user.full_name}
								<span class="text-xs truncate" style="color: var(--color-text-dim);">({user.full_name})</span>
							{/if}
						</div>
						<p class="text-xs truncate" style="color: var(--color-text-dim);">{user.email}</p>
					</div>
					<div class="w-16 text-center">
						{#if user.is_admin}
							<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[0.625rem] font-medium" style="background-color: var(--color-primary)15; color: var(--color-primary);">Admin</span>
						{:else}
							<span class="text-[0.625rem]" style="color: var(--color-text-dim);">User</span>
						{/if}
					</div>
					<div class="w-24 text-right text-xs" style="color: var(--color-text-dim);">
						{#if user.created_at}
							<RelativeTime date={user.created_at} />
						{/if}
					</div>
					<div class="w-40 flex items-center justify-end gap-2">
						<button
							class="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-[var(--color-surface-hover)]"
							style="border-color: var(--color-border); color: var(--color-text-dim);"
							onclick={() => toggleAdmin(user.username, user.is_admin)}
						>
							{user.is_admin ? 'Revoke Admin' : 'Make Admin'}
						</button>
						{#if user.username !== userStore.user?.username}
							<button
								class="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-red-500/10"
								style="border-color: var(--color-border); color: var(--color-error);"
								onclick={() => deleteUser(user.username)}
							>
								Delete
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
