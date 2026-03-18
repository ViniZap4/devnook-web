<script lang="ts">
	import { onMount } from 'svelte';
	import Avatar from './Avatar.svelte';
	import { users } from '$lib/services/api';
	import { userStore } from '$lib/stores/user.svelte';

	interface Developer {
		username: string;
		full_name: string;
		bio?: string;
		following: boolean;
	}

	let devs = $state<Developer[]>([]);
	let loading = $state(true);
	let togglingFollow = $state<Record<string, boolean>>({});

	onMount(async () => {
		try {
			const results = await users.search('');
			const currentUser = userStore.user?.username;
			devs = (results || [])
				.filter((u: any) => u.username !== currentUser)
				.slice(0, 5)
				.map((u: any) => ({
					username: u.username,
					full_name: u.full_name || u.username,
					bio: u.bio || '',
					following: false,
				}));
		} catch { devs = []; }
		finally { loading = false; }
	});

	async function toggleFollow(dev: Developer) {
		if (togglingFollow[dev.username]) return;
		togglingFollow[dev.username] = true;
		try {
			if (dev.following) {
				await users.unfollow(dev.username);
				dev.following = false;
			} else {
				await users.follow(dev.username);
				dev.following = true;
			}
		} catch { /* ignore */ }
		finally { togglingFollow[dev.username] = false; }
	}
</script>

<div class="suggested-card">
	<h3 class="card-title">Suggested Developers</h3>

	{#if loading}
		<div class="py-8 text-center text-[13px]" style="color: var(--color-text-dim);">Loading...</div>
	{:else if devs.length === 0}
		<div class="empty-state">
			<div class="empty-icon">
				<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
			</div>
			<p class="text-[14px] font-medium" style="color: var(--color-text); opacity: 0.7;">No suggestions yet</p>
			<span class="text-[12px] mt-1" style="color: var(--color-text-dim);">Follow some repos to get personalized suggestions</span>
		</div>
	{:else}
		<div class="dev-list">
			{#each devs as dev}
				<div class="dev-row">
					<a href="/{dev.username}" class="shrink-0">
						<Avatar username={dev.username} size={40} />
					</a>
					<div class="flex-1 min-w-0 ml-3">
						<a href="/{dev.username}" class="text-[14px] font-medium block truncate hover:underline" style="color: var(--color-text);">
							{dev.full_name}
						</a>
						<span class="text-[12px] block truncate" style="color: var(--color-text-dim);">
							{dev.bio || `@${dev.username}`}
						</span>
					</div>
					<button
						class="follow-btn"
						class:following={dev.following}
						disabled={togglingFollow[dev.username]}
						onclick={() => toggleFollow(dev)}
					>
						{#if dev.following}
							<svg class="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
							Following
						{:else}
							Follow
						{/if}
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.suggested-card {
		border-radius: 16px;
		background: var(--glass-bg);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid var(--glass-border);
		margin-top: 16px;
		transition: border-color 0.2s;
	}
	.suggested-card:hover {
		border-color: rgba(255, 255, 255, 0.12);
	}

	.card-title {
		padding: 16px;
		font-size: 15px;
		font-weight: 600;
		color: var(--color-text);
	}

	.dev-list {
		padding: 0 16px 16px;
	}

	.dev-row {
		display: flex;
		align-items: center;
		padding: 8px 0;
	}

	.follow-btn {
		padding: 6px 16px;
		border-radius: 8px;
		font-size: 13px;
		font-weight: 500;
		background: var(--color-primary);
		color: white;
		box-shadow: 0 2px 8px rgba(6, 182, 212, 0.3);
		transition: background 0.15s, color 0.15s, box-shadow 0.15s;
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.follow-btn:hover:not(.following):not(:disabled) {
		background: #22d3ee;
	}

	.follow-btn.following {
		background: rgba(255, 255, 255, 0.05);
		color: var(--color-text-dim);
		box-shadow: none;
	}

	.follow-btn.following:hover {
		background: rgba(244, 63, 94, 0.1);
		color: #fb7185;
	}

	.follow-btn:disabled {
		opacity: 0.5;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 24px 16px;
		text-align: center;
	}
	.empty-icon {
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.05);
		color: var(--color-text-dim);
		margin-bottom: 12px;
	}
</style>
