<script lang="ts">
	import { onMount } from 'svelte';
	import { admin } from '$lib/services/api';
	import type { User } from '$lib/services/api';
	import { userStore } from '$lib/stores/user.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';
	import Pagination from '$lib/components/Pagination.svelte';

	let users = $state<User[]>([]);
	let loading = $state(true);
	let error = $state('');
	let search = $state('');
	let currentPage = $state(1);
	let totalPages = $state(1);
	let totalCount = $state(0);
	let searchTimeout: ReturnType<typeof setTimeout>;
	let expandedUser = $state<string | null>(null);
	let editData = $state<{ full_name: string; email: string; is_admin: boolean }>({ full_name: '', email: '', is_admin: false });
	let editOriginal = $state<{ full_name: string; email: string; is_admin: boolean }>({ full_name: '', email: '', is_admin: false });
	let saving = $state(false);

	const hasUnsavedChanges = $derived(
		editData.full_name !== editOriginal.full_name ||
		editData.email !== editOriginal.email ||
		editData.is_admin !== editOriginal.is_admin
	);

	onMount(loadUsers);

	async function loadUsers() {
		loading = true;
		error = '';
		try {
			const res = await admin.listUsers({ page: currentPage, q: search || undefined });
			users = res.users;
			totalCount = res.total_count;
			totalPages = Math.max(1, Math.ceil(res.total_count / (res.per_page || 50)));
		} catch {
			error = 'Failed to load users';
			users = [];
		} finally {
			loading = false;
		}
	}

	function handleSearchInput() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			currentPage = 1;
			loadUsers();
		}, 300);
	}

	function toggleExpand(user: User) {
		if (expandedUser === user.username) {
			if (hasUnsavedChanges) {
				if (!confirm('Discard unsaved changes?')) return;
			}
			expandedUser = null;
		} else {
			if (expandedUser && hasUnsavedChanges) {
				if (!confirm('Discard unsaved changes?')) return;
			}
			expandedUser = user.username;
			const data = {
				full_name: user.full_name || '',
				email: user.email,
				is_admin: user.is_admin,
			};
			editData = { ...data };
			editOriginal = { ...data };
		}
	}

	function cancelEdit() {
		if (hasUnsavedChanges) {
			if (!confirm('Discard unsaved changes?')) return;
		}
		expandedUser = null;
	}

	async function saveUserChanges(username: string) {
		if (saving) return;

		if (username === userStore.user?.username && !editData.is_admin) {
			if (!confirm('You are about to revoke your own admin access. You will lose access to this panel. Continue?')) return;
		}

		saving = true;
		try {
			await admin.updateUser(username, {
				full_name: editData.full_name,
				email: editData.email,
				is_admin: editData.is_admin,
			});
			toastStore.success(`Updated ${username}`);
			expandedUser = null;
			await loadUsers();
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to update user');
		} finally {
			saving = false;
		}
	}

	async function deleteUser(username: string) {
		if (!confirm(`Delete user "${username}"? This action cannot be undone and will remove all their data.`)) return;
		try {
			await admin.removeUser(username);
			toastStore.success(`Deleted ${username}`);
			expandedUser = null;
			await loadUsers();
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to delete user');
		}
	}
</script>

<div class="flex flex-col gap-6">
	<div class="flex items-center justify-between flex-wrap gap-4">
		<div>
			<h1 class="text-2xl font-bold" style="color: var(--color-text);">User Accounts</h1>
			<p class="text-sm mt-1" style="color: var(--color-text-dim);">
				{#if search}
					{totalCount} {totalCount === 1 ? 'result' : 'results'} for "{search}"
				{:else}
					{totalCount} registered {totalCount === 1 ? 'user' : 'users'}
				{/if}
			</p>
		</div>
	</div>

	<!-- Search -->
	<div class="max-w-md">
		<input
			type="text"
			bind:value={search}
			oninput={handleSearchInput}
			placeholder="Search users by name, username, or email..."
			class="w-full px-4 py-2.5 text-sm rounded-xl border transition-colors focus:border-[var(--color-primary)]"
			style="border-color: var(--glass-border); color: var(--color-text); background: #0f1629;"
		/>
	</div>

	{#if loading}
		<div class="py-12 text-center text-sm" style="color: var(--color-text-dim);">Loading users...</div>
	{:else if error}
		<div class="rounded-xl border p-8 text-center" style="border-color: var(--color-error-subtle); background: var(--color-error-subtle);">
			<p class="text-sm" style="color: var(--color-error);">{error}</p>
			<button class="text-xs mt-2 underline" style="color: var(--color-error);" onclick={loadUsers}>Retry</button>
		</div>
	{:else if users.length === 0}
		<div class="rounded-xl border p-12 text-center" style="border-color: var(--glass-border); background: var(--glass-bg); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);">
			<svg class="w-12 h-12 mx-auto mb-3 opacity-20" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
			</svg>
			<p class="text-sm" style="color: var(--color-text-dim);">{search ? 'No users match your search.' : 'No users found.'}</p>
		</div>
	{:else}
		<div class="overflow-x-auto -mx-4 sm:mx-0">
		<div class="rounded-xl border overflow-hidden min-w-[600px] sm:min-w-full" style="border-color: var(--glass-border); background: var(--glass-bg); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);">
			<!-- Table header -->
			<div class="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-4 py-2.5 text-xs font-medium uppercase tracking-wider border-b" style="border-color: var(--glass-border); color: var(--color-text-dim); background: rgba(255, 255, 255, 0.02);">
				<span class="w-8"></span>
				<span>User</span>
				<span class="w-16 text-center">Role</span>
				<span class="w-24 text-right">Joined</span>
				<span class="w-24 text-right">Actions</span>
			</div>
			{#each users as user, i}
				<!-- User row -->
				<button
					class="w-full grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-4 py-3 transition-colors hover:bg-[rgba(255,255,255,0.03)] text-left {i > 0 ? 'border-t' : ''}"
					style="border-color: var(--glass-border);"
					onclick={() => toggleExpand(user)}
				>
					<Avatar username={user.username} size={32} />
					<div class="min-w-0">
						<div class="flex items-center gap-2">
							<span class="text-sm font-medium" style="color: var(--color-text);">{user.username}</span>
							{#if user.full_name}
								<span class="text-xs truncate" style="color: var(--color-text-dim);">({user.full_name})</span>
							{/if}
						</div>
						<p class="text-xs truncate" style="color: var(--color-text-dim);">{user.email}</p>
					</div>
					<div class="w-16 text-center">
						{#if user.is_admin}
							<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[0.625rem] font-medium" style="background-color: var(--color-primary-subtle); color: var(--color-primary);">Admin</span>
						{:else}
							<span class="text-[0.625rem]" style="color: var(--color-text-dim);">User</span>
						{/if}
					</div>
					<div class="w-24 text-right text-xs" style="color: var(--color-text-dim);">
						{#if user.created_at}
							<RelativeTime date={user.created_at} />
						{/if}
					</div>
					<div class="w-24 flex items-center justify-end">
						<svg
							class="w-4 h-4 transition-transform duration-200"
							style="color: var(--color-text-dim); transform: rotate({expandedUser === user.username ? '180deg' : '0deg'});"
							fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
						</svg>
					</div>
				</button>

				<!-- Expanded permissions panel -->
				{#if expandedUser === user.username}
					<div class="px-4 py-4 border-t animate-fade-up-sm" style="border-color: var(--glass-border); background: rgba(255, 255, 255, 0.015);">
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
							<!-- Profile info -->
							<div class="flex flex-col gap-3">
								<h4 class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-text-dim);">Profile</h4>
								<div>
									<label class="block text-[0.6875rem] mb-1" style="color: var(--color-text-dim);">Full Name</label>
									<input
										type="text"
										bind:value={editData.full_name}
										class="w-full px-3 py-2 text-sm rounded-lg border bg-transparent transition-colors focus:border-[var(--color-primary)]"
										style="border-color: var(--glass-border); color: var(--color-text);"
									/>
								</div>
								<div>
									<label class="block text-[0.6875rem] mb-1" style="color: var(--color-text-dim);">Email</label>
									<input
										type="email"
										bind:value={editData.email}
										class="w-full px-3 py-2 text-sm rounded-lg border bg-transparent transition-colors focus:border-[var(--color-primary)]"
										style="border-color: var(--glass-border); color: var(--color-text);"
									/>
								</div>
							</div>

							<!-- Permissions -->
							<div class="flex flex-col gap-3">
								<h4 class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-text-dim);">Permissions</h4>

								<!-- Admin toggle -->
								<button
									class="flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors"
									style="border-color: {editData.is_admin ? 'var(--color-primary)' : 'var(--glass-border)'}; background: {editData.is_admin ? 'var(--color-primary-subtle)' : 'transparent'};"
									onclick={() => { editData.is_admin = !editData.is_admin; }}
								>
									<div class="flex items-center gap-2">
										<svg class="w-4 h-4" style="color: {editData.is_admin ? 'var(--color-primary)' : 'var(--color-text-dim)'};" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
										</svg>
										<span class="text-sm" style="color: {editData.is_admin ? 'var(--color-primary)' : 'var(--color-text)'};">Site Administrator</span>
									</div>
									<div
										class="w-8 h-4.5 rounded-full transition-colors relative"
										style="background: {editData.is_admin ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)'};"
									>
										<div
											class="w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all duration-200"
											style="left: {editData.is_admin ? '17px' : '2px'};"
										></div>
									</div>
								</button>

								<div class="text-[0.6875rem] leading-relaxed px-1" style="color: var(--color-text-dim);">
									{#if editData.is_admin}
										Full access to site administration, user management, and all repositories.
									{:else}
										Standard user access. Can create repositories, issues, and participate in organizations.
									{/if}
								</div>

								<!-- User info -->
								<div class="mt-1 flex flex-col gap-1.5 text-[0.6875rem]" style="color: var(--color-text-dim);">
									<div class="flex items-center gap-2">
										<svg class="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
										<a href="/{user.username}" class="hover:underline" style="color: var(--color-primary);">View profile</a>
									</div>
									{#if user.created_at}
										<div class="flex items-center gap-2">
											<svg class="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
											<span>Joined <RelativeTime date={user.created_at} /></span>
										</div>
									{/if}
								</div>
							</div>
						</div>

						<!-- Action bar -->
						<div class="flex items-center justify-between mt-5 pt-4 border-t" style="border-color: var(--glass-border);">
							<div class="flex items-center gap-2">
								<button
									class="px-4 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-40 transition-all hover:brightness-110"
									style="background: var(--color-primary);"
									disabled={saving || !hasUnsavedChanges}
									onclick={() => saveUserChanges(user.username)}
								>
									{saving ? 'Saving...' : 'Save Changes'}
								</button>
								<button
									class="px-4 py-2 text-sm rounded-lg transition-colors"
									style="color: var(--color-text-dim);"
									onclick={cancelEdit}
								>
									Cancel
								</button>
								{#if hasUnsavedChanges}
									<span class="text-[0.625rem] ml-1" style="color: var(--color-warning);">Unsaved changes</span>
								{/if}
							</div>
							{#if user.username !== userStore.user?.username}
								<button
									class="px-4 py-2 text-sm font-medium rounded-lg transition-all hover:brightness-110"
									style="border: 1px solid var(--color-error-subtle); color: var(--color-error); background: var(--color-error-subtle);"
									onclick={() => deleteUser(user.username)}
								>
									Delete User
								</button>
							{/if}
						</div>
					</div>
				{/if}
			{/each}
		</div>
		</div>

		<Pagination page={currentPage} {totalPages} onPageChange={(p) => { currentPage = p; loadUsers(); }} />
	{/if}
</div>
