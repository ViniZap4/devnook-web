<script lang="ts">
	import type { Conversation } from '$lib/types/message';
	import type { User } from '$lib/services/api';
	import { userStore } from '$lib/stores/user.svelte';
	import { isOnline } from '$lib/stores/presence.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import Spinner from '$lib/components/Spinner.svelte';

	let {
		convo,
		onadmember,
		onremovemember
	}: {
		convo: Conversation;
		onadmember?: (convoId: number, username: string) => Promise<void>;
		onremovemember?: (convoId: number, username: string) => Promise<void>;
	} = $props();

	function getDisplayName(c: Conversation): string {
		if (c.name) return c.name;
		if (c.type === 'repo') return `${c.repo_owner}/${c.repo_name}`;
		if (c.type === 'org') return c.org_name || '';
		if (c.type === 'issue') return `Issue #${c.issue_number}`;
		const other = c.participants.find(p => p.username !== userStore.user?.username);
		return other?.full_name || other?.username || 'Chat';
	}

	function getDescription(c: Conversation): string {
		if (c.type === 'repo') return `Discussion about ${c.repo_owner}/${c.repo_name}`;
		if (c.type === 'org') return `Organization chat`;
		if (c.type === 'issue') return `Issue discussion`;
		return '';
	}

	// Member management state
	let showAddMember = $state(false);
	let addMemberQuery = $state('');
	let addMemberResults = $state<User[]>([]);
	let addMemberSearching = $state(false);
	let addMemberLoading = $state(false);
	let removingUsername = $state<string | null>(null);
	let addMemberTimeout: ReturnType<typeof setTimeout>;

	function isOwner(c: Conversation): boolean {
		const me = c.participants.find(p => p.username === userStore.user?.username);
		return me?.role === 'owner' || me?.role === 'admin';
	}

	async function handleMemberSearch() {
		const q = addMemberQuery.trim();
		if (!q) { addMemberResults = []; return; }
		clearTimeout(addMemberTimeout);
		addMemberTimeout = setTimeout(async () => {
			addMemberSearching = true;
			try {
				const { users } = await import('$lib/services/api');
				const results = await users.search(q);
				addMemberResults = results.filter(u =>
					!convo.participants.some(p => p.username === u.username)
				);
			} catch {
				addMemberResults = [];
			} finally {
				addMemberSearching = false;
			}
		}, 300);
	}

	async function handleAddMember(user: User) {
		if (!onadmember) return;
		addMemberLoading = true;
		try {
			await onadmember(convo.id, user.username);
			addMemberQuery = '';
			addMemberResults = [];
			showAddMember = false;
		} finally {
			addMemberLoading = false;
		}
	}

	async function handleRemoveMember(username: string) {
		if (!onremovemember) return;
		removingUsername = username;
		try {
			await onremovemember(convo.id, username);
		} finally {
			removingUsername = null;
		}
	}
</script>

<aside class="sidebar-right details-panel" aria-label="Details">
	{#if convo.type === 'direct'}
		{@const otherUser = convo.participants.find(p => p.username !== userStore.user?.username)}
		{#if otherUser}
			<div class="flex flex-col items-center">
				<div class="avatar-presence-wrap">
					<Avatar username={otherUser.username} size={80} />
					<span class="presence-dot" class:online={isOnline(otherUser.username)}></span>
				</div>
				<h3 class="profile-name">{otherUser.full_name || otherUser.username}</h3>
				<span class="profile-handle">@{otherUser.username}</span>
				<span class="presence-label">{isOnline(otherUser.username) ? 'Online' : 'Offline'}</span>
			</div>
			<div class="profile-section">
				<span class="section-title">ROLE</span>
				<span class="text-[13px] capitalize" style="color: var(--color-text);">{otherUser.role}</span>
			</div>
			<div class="flex-1"></div>
			<div class="profile-actions">
				<a href="/{otherUser.username}" class="action-btn secondary">
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
					</svg>
					Profile
				</a>
			</div>
		{/if}
	{:else}
		<div class="flex flex-col items-center">
			<div class="channel-avatar">
				<span class="text-2xl font-bold" style="color: var(--color-primary);">#</span>
			</div>
			<h3 class="profile-name">{getDisplayName(convo)}</h3>
			{#if getDescription(convo)}
				<span class="profile-handle" style="color: var(--color-text-dim);">{getDescription(convo)}</span>
			{/if}
		</div>
		<div class="profile-section">
			<span class="section-title">TYPE</span>
			<span class="text-[13px] capitalize" style="color: var(--color-text);">{convo.type}</span>
		</div>
		<div class="profile-section">
			<div class="members-header">
				<span class="section-title">MEMBERS ({convo.participants.length})</span>
				{#if isOwner(convo) && onadmember}
					<button
						class="add-member-btn"
						aria-label="Add member"
						onclick={() => { showAddMember = !showAddMember; addMemberQuery = ''; addMemberResults = []; }}
					>
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
						</svg>
					</button>
				{/if}
			</div>

			{#if showAddMember}
				<div class="add-member-wrap">
					<div class="add-member-input-row">
						<input
							type="text"
							bind:value={addMemberQuery}
							oninput={handleMemberSearch}
							placeholder="Search users..."
							class="add-member-input"
							autocomplete="off"
						/>
						{#if addMemberSearching || addMemberLoading}
							<div class="add-member-spinner"><Spinner size="sm" /></div>
						{/if}
					</div>
					{#if addMemberResults.length > 0}
						<div class="add-member-results">
							{#each addMemberResults as user (user.username)}
								<button class="add-member-result" type="button" onclick={() => handleAddMember(user)}>
									<Avatar username={user.username} size={22} />
									<span class="truncate">{user.full_name || user.username}</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			<div class="members-list">
				{#each convo.participants as member (member.username)}
					<div class="member-row-wrap">
						<a href="/{member.username}" class="member-row">
							<Avatar username={member.username} size={28} />
							<div class="member-info">
								<span class="member-name">{member.full_name || member.username}</span>
								<span class="member-role">{member.role}</span>
							</div>
						</a>
						{#if isOwner(convo) && onremovemember && member.username !== userStore.user?.username && member.role !== 'owner'}
							<button
								class="remove-member-btn"
								aria-label="Remove {member.username}"
								disabled={removingUsername === member.username}
								onclick={() => handleRemoveMember(member.username)}
							>
								{#if removingUsername === member.username}
									<Spinner size="sm" />
								{:else}
									<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
										<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
									</svg>
								{/if}
							</button>
						{/if}
					</div>
				{/each}
			</div>
		</div>
		<div class="flex-1"></div>
		{#if convo.type === 'repo' && convo.repo_owner}
			<div class="profile-actions">
				<a href="/{convo.repo_owner}/{convo.repo_name}" class="action-btn secondary">
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
					</svg>
					View Repo
				</a>
			</div>
		{/if}
	{/if}
</aside>

<style>
	.sidebar-right {
		width: 280px; flex-shrink: 0;
		background: var(--glass-bg);
		backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
		border: 1px solid var(--glass-border); border-radius: 16px;
		padding: 24px 20px; display: none; flex-direction: column;
		overflow-y: auto; box-shadow: 0 4px 24px color-mix(in srgb, var(--color-overlay, #000) 20%, transparent);
		animation: chat-panel-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
	}
	@keyframes chat-panel-in {
		from { opacity: 0; transform: translateY(20px) scale(0.97); filter: blur(4px); }
		to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
	}
	@media (min-width: 1280px) {
		.sidebar-right { display: flex; }
	}
	@media (prefers-reduced-motion: reduce) {
		.sidebar-right { animation: none !important; }
	}
	.profile-name { font-size: 18px; font-weight: 600; color: var(--color-text); text-align: center; margin-top: 16px; }
	.profile-handle { font-size: 14px; color: var(--color-primary); text-align: center; margin-top: 4px; }
	.profile-section { margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--glass-border); }
	.section-title {
		font-size: 11px; font-weight: 600; text-transform: uppercase;
		letter-spacing: 0.05em; color: var(--color-text-dim); margin-bottom: 12px; display: block;
	}
	.profile-actions { display: flex; gap: 8px; margin-top: 20px; }
	.action-btn {
		flex: 1; height: 36px; border-radius: 12px; font-size: 13px; font-weight: 500;
		display: flex; align-items: center; justify-content: center; gap: 6px;
		text-decoration: none; transition: background 0.15s;
	}
	.action-btn.secondary {
		background: color-mix(in srgb, var(--color-text) 6%, transparent); border: 1px solid var(--glass-border); color: var(--color-text);
	}
	.action-btn.secondary:hover { background: color-mix(in srgb, var(--color-text) 8%, transparent); }
	.channel-avatar {
		width: 80px; height: 80px; border-radius: 16px;
		background: color-mix(in srgb, var(--color-primary) 10%, transparent); border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent);
		display: flex; align-items: center; justify-content: center;
	}

	/* Members */
	.members-header {
		display: flex; align-items: center; justify-content: space-between;
		margin-bottom: 12px;
	}
	.members-header .section-title { margin-bottom: 0; }
	.add-member-btn {
		width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center;
		color: var(--color-text-dim); transition: background 0.12s, color 0.12s;
	}
	.add-member-btn:hover { background: color-mix(in srgb, var(--color-text) 6%, transparent); color: var(--color-text); }

	.add-member-wrap { margin-bottom: 8px; }
	.add-member-input-row { position: relative; }
	.add-member-input {
		width: 100%; padding: 7px 32px 7px 10px; font-size: 13px; border-radius: 8px;
		border: 1px solid var(--glass-border); background: color-mix(in srgb, var(--color-text) 4%, transparent);
		color: var(--color-text); outline: none; font-family: inherit;
		transition: border-color 0.15s;
	}
	.add-member-input:focus { border-color: var(--color-primary); }
	.add-member-input::placeholder { color: var(--color-text-dim); opacity: 0.5; }
	.add-member-spinner {
		position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
		pointer-events: none;
	}
	.add-member-results {
		margin-top: 4px; border-radius: 8px; border: 1px solid var(--glass-border);
		background: var(--glass-bg); backdrop-filter: blur(12px); max-height: 140px; overflow-y: auto;
	}
	.add-member-result {
		width: 100%; display: flex; align-items: center; gap: 8px;
		padding: 7px 10px; text-align: left; font-size: 13px;
		color: var(--color-text); transition: background 0.12s;
	}
	.add-member-result:hover { background: color-mix(in srgb, var(--color-text) 5%, transparent); }

	.members-list { display: flex; flex-direction: column; gap: 2px; }
	.member-row-wrap { display: flex; align-items: center; gap: 4px; border-radius: 8px; }
	.member-row-wrap:hover { background: color-mix(in srgb, var(--color-text) 3%, transparent); }
	.member-row {
		flex: 1; display: flex; align-items: center; gap: 10px; padding: 6px 8px;
		border-radius: 8px; text-decoration: none; transition: background 0.12s;
		min-width: 0;
	}
	.member-row:hover { background: color-mix(in srgb, var(--color-text) 5%, transparent); }
	.member-row-wrap:hover .member-row { background: transparent; }
	.member-info { display: flex; flex-direction: column; min-width: 0; }
	.member-name { font-size: 13px; font-weight: 500; color: var(--color-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.member-role { font-size: 11px; color: var(--color-text-dim); text-transform: capitalize; }
	.remove-member-btn {
		width: 28px; height: 28px; flex-shrink: 0; border-radius: 6px; display: flex; align-items: center; justify-content: center;
		color: var(--color-text-dim); opacity: 0; transition: background 0.12s, color 0.12s, opacity 0.12s;
	}
	.member-row-wrap:hover .remove-member-btn { opacity: 1; }
	.remove-member-btn:hover { background: color-mix(in srgb, var(--color-error) 15%, transparent); color: var(--color-error); }
	.remove-member-btn:disabled { opacity: 0.4; cursor: not-allowed; }

	.avatar-presence-wrap { position: relative; display: inline-block; }
	.presence-dot {
		position: absolute; bottom: 2px; right: 2px;
		width: 14px; height: 14px; border-radius: 50%;
		background: var(--color-text-dim); opacity: 0.4;
		border: 2px solid var(--glass-bg);
	}
	.presence-dot.online { background: var(--color-success); opacity: 1; }
	.presence-label { font-size: 12px; color: var(--color-text-dim); margin-top: 2px; }
</style>
