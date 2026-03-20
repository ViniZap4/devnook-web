<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { projects } from '$lib/services/api';
	import type { ProjectMember } from '$lib/types/project';
	import { toastStore } from '$lib/stores/toast.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';
	import Spinner from '$lib/components/Spinner.svelte';

	const slug = $derived($page.params.slug!);

	let members = $state<ProjectMember[]>([]);
	let loading = $state(true);

	let newMemberUsername = $state('');
	let newMemberRole = $state('member');
	let addingMember = $state(false);
	let removingMember = $state('');
	let updatingRole = $state('');

	let fetchId = 0;

	$effect(() => {
		const _slug = slug;
		const id = ++fetchId;

		if (!userStore.isLoggedIn) {
			goto('/');
			return;
		}

		loading = true;

		projects.members(_slug).then(data => {
			if (id !== fetchId) return;
			members = data;
		}).catch(() => {
			if (id !== fetchId) return;
		}).finally(() => {
			if (id !== fetchId) return;
			loading = false;
		});
	});

	const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
		owner:  { label: 'Owner',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
		admin:  { label: 'Admin',  color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
		member: { label: 'Member', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
		viewer: { label: 'Viewer', color: '#6b7280', bg: 'rgba(107,114,128,0.1)'  }
	};

	async function addMember() {
		const username = newMemberUsername.trim();
		if (!username || addingMember) return;
		addingMember = true;
		try {
			await projects.addMember(slug, { username, role: newMemberRole });
			toastStore.success(`Added ${username} as ${newMemberRole}.`);
			newMemberUsername = '';
			newMemberRole = 'member';
			const data = await projects.members(slug);
			members = data;
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to add member');
		} finally {
			addingMember = false;
		}
	}

	async function updateRole(username: string, role: string) {
		if (updatingRole === username) return;
		updatingRole = username;
		try {
			await projects.updateMember(slug, username, { role });
			toastStore.success(`${username}'s role updated to ${roleConfig[role]?.label ?? role}.`);
			const data = await projects.members(slug);
			members = data;
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to update role');
		} finally {
			updatingRole = '';
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
</script>

<div class="flex flex-col gap-6 max-w-3xl content-reveal">

	<!-- ── Section: Team Members ── -->
	<section class="card p-5 flex flex-col gap-5 card-animate stagger-1">

		<!-- Header -->
		<div class="flex items-center justify-between gap-3">
			<div class="flex items-center gap-3">
				<h2 class="section-title">Team Members</h2>
				{#if !loading}
					<span
						class="px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums"
						style="background: rgba(148,163,184,0.12); color: #94a3b8;"
					>
						{members.length}
					</span>
				{/if}
			</div>
		</div>

		{#if loading}
			<div class="flex justify-center py-10">
				<Spinner size="sm" />
			</div>
		{:else if members.length === 0}
			<div class="flex flex-col items-center gap-3 py-10 text-center">
				<div
					class="w-12 h-12 rounded-2xl flex items-center justify-center"
					style="background: var(--color-primary-subtle);"
				>
					<svg class="w-6 h-6" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
					</svg>
				</div>
				<p class="text-sm font-medium" style="color: var(--color-text);">No members yet</p>
				<p class="text-xs" style="color: var(--color-text-dim);">Add a member below to get started.</p>
			</div>
		{:else}
			<div class="flex flex-col gap-1.5">
				{#each members as member, i (member.id)}
					{@const rc = roleConfig[member.role] ?? roleConfig.member}
					{@const isOwner = member.role === 'owner'}
					{@const isSelf = member.username === userStore.user?.username}
					<div
						class="row-animate flex items-center gap-3 px-3 py-3 rounded-xl border transition-all duration-200 hover:bg-[rgba(255,255,255,0.025)]"
						style="
							border-color: var(--glass-border);
							background: var(--color-surface);
							animation-delay: {i * 40}ms;
						"
					>
						<!-- Avatar -->
						<a href="/{member.username}" class="shrink-0 press-scale">
							<Avatar username={member.username} size={36} />
						</a>

						<!-- Identity -->
						<div class="flex-1 min-w-0">
							<a
								href="/{member.username}"
								class="text-sm font-semibold hover:underline truncate block"
								style="color: var(--color-text);"
							>
								{member.username}
							</a>
							{#if member.full_name}
								<p class="text-xs truncate" style="color: var(--color-text-dim);">{member.full_name}</p>
							{/if}
						</div>

						<!-- Joined date -->
						<div class="hidden sm:flex items-center gap-1 text-xs shrink-0" style="color: var(--color-text-dim);">
							<svg class="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
							<RelativeTime date={member.joined_at} />
						</div>

						<!-- Role badge / selector -->
						{#if isOwner || isSelf}
							<!-- Non-editable badge -->
							<span
								class="text-[0.5625rem] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0"
								style="background: {rc.bg}; color: {rc.color};"
							>
								{rc.label}
							</span>
						{:else}
							<!-- Editable role selector -->
							<div class="relative shrink-0">
								<select
									value={member.role}
									disabled={updatingRole === member.username}
									onchange={(e) => updateRole(member.username, (e.currentTarget as HTMLSelectElement).value)}
									class="glass-subtle appearance-none pl-2 pr-6 py-1 text-[0.6875rem] font-semibold rounded-full uppercase tracking-wide cursor-pointer border outline-none transition-all duration-200 focus:border-[var(--color-primary)] disabled:opacity-50"
									style="
										border-color: {rc.bg};
										color: {rc.color};
										background-color: {rc.bg};
									"
								>
									<option value="admin">Admin</option>
									<option value="member">Member</option>
									<option value="viewer">Viewer</option>
								</select>
								{#if updatingRole === member.username}
									<div class="absolute right-1.5 top-1/2 -translate-y-1/2">
										<Spinner size="xs" />
									</div>
								{:else}
									<svg
										class="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 opacity-60"
										style="color: {rc.color};"
										fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"
									>
										<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
									</svg>
								{/if}
							</div>
						{/if}

						<!-- Remove button -->
						{#if !isOwner && !isSelf}
							<button
								class="press-scale shrink-0 p-1.5 rounded-lg transition-all duration-200 hover:bg-[rgba(239,68,68,0.1)] disabled:opacity-40"
								style="color: var(--color-text-dim);"
								title="Remove {member.username}"
								disabled={removingMember === member.username}
								onclick={() => removeMember(member.username)}
							>
								{#if removingMember === member.username}
									<Spinner size="xs" />
								{:else}
									<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
									</svg>
								{/if}
							</button>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		<!-- ── Add Member Form ── -->
		<div class="flex flex-col gap-2 pt-1">
			<p class="text-xs font-medium" style="color: var(--color-text-dim);">Add a new member</p>
			<div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
				<input
					type="text"
					bind:value={newMemberUsername}
					placeholder="Username..."
					onkeydown={(e) => { if (e.key === 'Enter') addMember(); }}
					class="flex-1 min-w-0 px-3 py-2 text-sm rounded-lg border bg-transparent outline-none transition-colors focus:border-[var(--color-primary)]"
					style="border-color: var(--glass-border); color: var(--color-text);"
				/>
				<select
					bind:value={newMemberRole}
					class="glass-subtle px-3 py-2 text-sm rounded-lg border outline-none cursor-pointer transition-colors focus:border-[var(--color-primary)] shrink-0"
					style="border-color: var(--glass-border); color: var(--color-text);"
				>
					<option value="viewer">Viewer</option>
					<option value="member">Member</option>
					<option value="admin">Admin</option>
				</select>
				<button
					class="btn-glow px-4 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-40 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0 press-scale"
					style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));"
					disabled={!newMemberUsername.trim() || addingMember}
					onclick={addMember}
				>
					{addingMember ? 'Adding...' : 'Add Member'}
				</button>
			</div>
		</div>
	</section>

	<!-- ── Section: Role Permissions ── -->
	<section class="card p-5 flex flex-col gap-4 card-animate stagger-2">
		<h2 class="section-title">Role Permissions</h2>

		<div class="flex flex-col gap-2">
			{#each [
				{ role: 'owner',  icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', desc: 'Full project control — manage settings, members, and delete the project.' },
				{ role: 'admin',  icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', desc: 'Manage columns, sprints, items, and invite members.' },
				{ role: 'member', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', desc: 'Create and edit items, move cards, and comment.' },
				{ role: 'viewer', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', desc: 'Read-only access — view the board and items without editing.' }
			] as perm}
				{@const rc = roleConfig[perm.role]}
				<div
					class="flex items-start gap-3 p-3 rounded-xl"
					style="border: 1px solid var(--glass-border); background: rgba(255,255,255,0.02);"
				>
					<div
						class="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5"
						style="background: {rc.bg};"
					>
						<svg class="w-3.5 h-3.5" style="color: {rc.color};" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d={perm.icon} />
						</svg>
					</div>
					<div class="flex-1 min-w-0">
						<span
							class="text-[0.625rem] font-semibold uppercase tracking-wide"
							style="color: {rc.color};"
						>
							{rc.label}
						</span>
						<p class="text-xs mt-0.5 leading-relaxed" style="color: var(--color-text-dim);">{perm.desc}</p>
					</div>
				</div>
			{/each}
		</div>
	</section>

</div>
