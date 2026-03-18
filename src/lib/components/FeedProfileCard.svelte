<script lang="ts">
	import { userStore } from '$lib/stores/user.svelte';
	import Avatar from './Avatar.svelte';
</script>

{#if userStore.user}
<div class="profile-card">
	<div class="profile-header">
		<Avatar username={userStore.user.username} size={56} />
		<div class="mt-3">
			<p class="text-[15px] font-semibold" style="color: var(--color-text);">
				{userStore.user.full_name || userStore.user.username}
			</p>
			<p class="text-[13px]" style="color: var(--color-text-dim);">@{userStore.user.username}</p>
		</div>
		{#if userStore.user.bio}
			<p class="text-[13px] mt-2 leading-relaxed" style="color: var(--color-text-dim); opacity: 0.8;">
				{userStore.user.bio}
			</p>
		{/if}
	</div>

	<div class="profile-nav">
		<a href="/{userStore.user.username}" class="profile-link">
			<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
			My Profile
		</a>
		<a href="/{userStore.user.username}?tab=repositories" class="profile-link">
			<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
			My Repositories
		</a>
		<a href="/new" class="profile-link">
			<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
			New Repository
		</a>
		<a href="/settings" class="profile-link">
			<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
			Settings
		</a>
	</div>
</div>
{/if}

<style>
	.profile-card {
		border-radius: 16px;
		background: var(--glass-bg);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid var(--glass-border);
		transition: border-color 0.2s;
	}
	.profile-card:hover {
		border-color: rgba(255, 255, 255, 0.12);
	}

	.profile-header {
		padding: 20px 16px;
		border-bottom: 1px solid var(--glass-border);
	}

	.profile-nav {
		padding: 8px;
	}

	.profile-link {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 10px;
		border-radius: 10px;
		font-size: 13px;
		font-weight: 500;
		color: var(--color-text-dim);
		text-decoration: none;
		transition: color 0.15s, background 0.15s;
	}
	.profile-link:hover {
		color: var(--color-text);
		background: rgba(255, 255, 255, 0.05);
	}
</style>
