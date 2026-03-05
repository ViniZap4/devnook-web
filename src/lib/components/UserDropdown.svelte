<script lang="ts">
	import { userStore } from '$lib/stores/user.svelte';
	import Avatar from './Avatar.svelte';

	let open = $state(false);
</script>

<div class="relative">
	<button
		class="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-white/10 transition-all"
		onclick={() => { open = !open; }}
	>
		<Avatar username={userStore.user?.username ?? '?'} size={30} />
	</button>

	{#if open}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="fixed inset-0 z-40" onclick={() => { open = false; }} onkeydown={() => {}}></div>
		<div class="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl border border-white/[0.08] bg-[var(--color-background)] shadow-2xl overflow-hidden animate-scale-in-center">
			<div class="px-4 py-3 border-b border-white/[0.06]">
				<p class="text-sm font-medium text-[var(--color-text)]">{userStore.user?.full_name || userStore.user?.username}</p>
				<p class="text-xs text-[var(--color-text)] opacity-40">@{userStore.user?.username}</p>
			</div>
			<div class="py-1">
				<a href="/{userStore.user?.username}" class="dropdown-item" onclick={() => { open = false; }}>Your profile</a>
				<a href="/dashboard" class="dropdown-item" onclick={() => { open = false; }}>Dashboard</a>
				<a href="/new" class="dropdown-item" onclick={() => { open = false; }}>New repository</a>
				<a href="/settings" class="dropdown-item" onclick={() => { open = false; }}>Settings</a>
			</div>
			<div class="border-t border-white/[0.06] py-1">
				<button class="dropdown-item w-full text-left text-red-400" onclick={() => { open = false; userStore.logout(); }}>
					Sign out
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.dropdown-item {
		display: block;
		padding: 0.5rem 1rem;
		font-size: 0.8125rem;
		color: var(--color-text);
		transition: background-color 0.1s;
	}
	.dropdown-item:hover {
		background: rgba(255, 255, 255, 0.04);
	}
</style>
