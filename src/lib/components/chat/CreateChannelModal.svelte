<script lang="ts">
	import type { User } from '$lib/services/api';
	import Modal from '$lib/components/Modal.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import Spinner from '$lib/components/Spinner.svelte';

	let {
		open = false,
		onclose,
		oncreate
	}: {
		open: boolean;
		onclose: () => void;
		oncreate: (data: { name: string; type: 'group' | 'repo' | 'org'; participants: string[] }) => Promise<void>;
	} = $props();

	let channelName = $state('');
	let channelType = $state<'group' | 'repo' | 'org'>('group');
	let creating = $state(false);
	let error = $state('');

	// Participant search
	let selectedUsers = $state<User[]>([]);
	let userSearchQuery = $state('');
	let userSearchResults = $state<User[]>([]);
	let userSearching = $state(false);
	let userSearchTimeout: ReturnType<typeof setTimeout>;

	async function handleUserSearch() {
		const q = userSearchQuery.trim();
		if (!q) { userSearchResults = []; return; }
		clearTimeout(userSearchTimeout);
		userSearchTimeout = setTimeout(async () => {
			userSearching = true;
			try {
				const { users } = await import('$lib/services/api');
				const { userStore } = await import('$lib/stores/user.svelte');
				const results = await users.search(q);
				userSearchResults = results.filter(u =>
					u.username !== userStore.user?.username &&
					!selectedUsers.some(s => s.username === u.username)
				);
			} catch {
				userSearchResults = [];
			} finally {
				userSearching = false;
			}
		}, 300);
	}

	function addUser(user: User) {
		if (!selectedUsers.some(u => u.username === user.username)) {
			selectedUsers = [...selectedUsers, user];
		}
		userSearchQuery = '';
		userSearchResults = [];
	}

	function removeUser(username: string) {
		selectedUsers = selectedUsers.filter(u => u.username !== username);
	}

	async function handleSubmit() {
		if (!channelName.trim()) {
			error = 'Channel name is required';
			return;
		}
		creating = true;
		error = '';
		try {
			await oncreate({
				name: channelName.trim(),
				type: channelType,
				participants: selectedUsers.map(u => u.username)
			});
			reset();
		} catch (err: any) {
			error = err?.message || 'Failed to create channel';
		} finally {
			creating = false;
		}
	}

	function reset() {
		channelName = '';
		channelType = 'group';
		error = '';
		selectedUsers = [];
		userSearchQuery = '';
		userSearchResults = [];
	}

	function handleClose() {
		reset();
		onclose();
	}
</script>

<Modal {open} title="Create Channel" onclose={handleClose}>
	<div class="form-body">
		<div class="form-group">
			<label class="form-label" for="ch-name">Channel Name</label>
			<input id="ch-name" type="text" bind:value={channelName} placeholder="e.g. general, project-alpha" class="form-input" />
		</div>
		<div class="form-group">
			<label class="form-label" for="ch-type">Type</label>
			<select id="ch-type" bind:value={channelType} class="form-input form-select">
				<option value="group">Group</option>
				<option value="repo">Repository</option>
				<option value="org">Organization</option>
			</select>
		</div>

		<!-- Participant search -->
		<div class="form-group">
			<label class="form-label" for="ch-participants">Add Participants (optional)</label>
			{#if selectedUsers.length > 0}
				<div class="selected-tags">
					{#each selectedUsers as user (user.username)}
						<span class="user-tag">
							<Avatar username={user.username} size={18} />
							<span>{user.full_name || user.username}</span>
							<button class="tag-remove" aria-label="Remove {user.username}" onclick={() => removeUser(user.username)}>
								<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
									<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</span>
					{/each}
				</div>
			{/if}
			<div class="user-search-wrap">
				<input
					id="ch-participants"
					type="text"
					bind:value={userSearchQuery}
					oninput={handleUserSearch}
					placeholder="Search users..."
					class="form-input"
					autocomplete="off"
				/>
				{#if userSearching}
					<div class="search-spinner"><Spinner size="sm" /></div>
				{/if}
				{#if userSearchResults.length > 0}
					<div class="user-results">
						{#each userSearchResults as user (user.username)}
							<button class="user-result-item" type="button" onclick={() => addUser(user)}>
								<Avatar username={user.username} size={24} />
								<div class="user-result-info">
									<span class="user-result-name">{user.full_name || user.username}</span>
									<span class="user-result-handle">@{user.username}</span>
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		{#if error}
			<p class="form-error">{error}</p>
		{/if}
		<div class="form-actions">
			<button class="btn-cancel" onclick={handleClose}>Cancel</button>
			<button class="btn-submit" disabled={creating || !channelName.trim()} onclick={handleSubmit}>
				{#if creating}
					<Spinner size="sm" />
				{:else}
					Create Channel
				{/if}
			</button>
		</div>
	</div>
</Modal>

<style>
	.form-body { display: flex; flex-direction: column; gap: 16px; }
	.form-group { display: flex; flex-direction: column; gap: 6px; }
	.form-label { font-size: 13px; font-weight: 500; color: var(--color-text); }
	.form-input {
		width: 100%; padding: 10px 14px; font-size: 14px; border-radius: 12px;
		border: 1px solid var(--glass-border); background: var(--color-surface);
		color: var(--color-text); outline: none; transition: border-color 0.15s; font-family: inherit;
	}
	.form-input::placeholder { color: var(--color-text-dim); opacity: 0.5; }
	.form-input:focus { border-color: var(--color-primary); }
	.form-select {
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
		background-repeat: no-repeat; background-position: right 12px center;
		padding-right: 36px; cursor: pointer;
	}
	.form-select option { background: var(--color-surface); color: var(--color-text); }
	.form-error {
		font-size: 13px; color: var(--color-error);
		padding: 8px 12px; border-radius: 8px;
		background: color-mix(in srgb, var(--color-error) 10%, transparent); border: 1px solid color-mix(in srgb, var(--color-error) 15%, transparent);
	}
	.form-actions {
		display: flex; justify-content: flex-end; gap: 10px;
		padding-top: 8px; border-top: 1px solid var(--color-separator);
	}
	.btn-cancel {
		padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 500;
		color: var(--color-text-dim); background: color-mix(in srgb, var(--color-text) 6%, transparent);
		border: 1px solid var(--color-border); transition: background 0.15s;
	}
	.btn-cancel:hover { background: color-mix(in srgb, var(--color-text) 10%, transparent); }
	.btn-submit {
		padding: 8px 20px; border-radius: 8px; font-size: 13px; font-weight: 500;
		color: white; background: var(--color-primary);
		transition: background 0.15s; display: flex; align-items: center; gap: 8px;
	}
	.btn-submit:hover:not(:disabled) { background: var(--color-accent); }
	.btn-submit:disabled { opacity: 0.4; cursor: not-allowed; }

	/* Selected user tags */
	.selected-tags {
		display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 6px;
	}
	.user-tag {
		display: inline-flex; align-items: center; gap: 6px;
		padding: 3px 8px 3px 5px; border-radius: 20px;
		background: color-mix(in srgb, var(--color-primary) 12%, transparent); border: 1px solid color-mix(in srgb, var(--color-primary) 25%, transparent);
		font-size: 13px; color: var(--color-text);
	}
	.tag-remove {
		display: flex; align-items: center; justify-content: center;
		width: 16px; height: 16px; border-radius: 50%;
		color: var(--color-text-dim); transition: background 0.12s, color 0.12s;
	}
	.tag-remove:hover { background: color-mix(in srgb, var(--color-error) 15%, transparent); color: var(--color-error); }

	/* User search */
	.user-search-wrap { position: relative; }
	.search-spinner {
		position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
		pointer-events: none;
	}
	.user-results {
		position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 10;
		border-radius: 10px; border: 1px solid var(--glass-border);
		background: var(--glass-bg); backdrop-filter: blur(12px); box-shadow: 0 8px 24px color-mix(in srgb, var(--color-overlay, #000) 40%, transparent);
		max-height: 180px; overflow-y: auto;
	}
	.user-result-item {
		width: 100%; display: flex; align-items: center; gap: 10px;
		padding: 8px 12px; text-align: left; transition: background 0.12s;
	}
	.user-result-item:hover { background: color-mix(in srgb, var(--color-text) 5%, transparent); }
	.user-result-info { display: flex; flex-direction: column; min-width: 0; }
	.user-result-name { font-size: 13px; font-weight: 500; color: var(--color-text); }
	.user-result-handle { font-size: 11px; color: var(--color-text-dim); opacity: 0.7; }
</style>
