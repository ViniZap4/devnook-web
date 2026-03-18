<script lang="ts">
	import { userStore } from '$lib/stores/user.svelte';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { sidebarStore } from '$lib/stores/sidebar.svelte';
	import Avatar from './Avatar.svelte';
	import Dropdown from './Dropdown.svelte';

	let open = $state(false);
	let focusedIndex = $state(-1);

	interface MenuItem {
		label: string;
		href?: string;
		action?: () => void;
		danger?: boolean;
	}

	const mainItems: MenuItem[] = $derived.by(() => {
		const items: MenuItem[] = [
			{ label: 'Your profile', href: `/${userStore.user?.username ?? ''}` },
			{ label: 'Dashboard', href: '/dashboard' },
			{ label: 'New repository', href: '/new' },
			{ label: 'Settings', href: '/settings' },
		];
		if (userStore.user?.is_admin) {
			items.push({ label: 'Admin Panel', href: '/admin' });
		}
		return items;
	});

	function toggleThemeMode() {
		const modes = ['dark', 'light', 'auto'] as const;
		const idx = modes.indexOf(themeStore.mode);
		themeStore.mode = modes[(idx + 1) % modes.length];
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!open) return;
		switch (e.key) {
			case 'ArrowDown':
			case 'j':
				e.preventDefault();
				focusedIndex = Math.min(focusedIndex + 1, mainItems.length);
				break;
			case 'ArrowUp':
			case 'k':
				e.preventDefault();
				focusedIndex = Math.max(focusedIndex - 1, 0);
				break;
			case 'Enter':
				if (focusedIndex >= 0 && focusedIndex < mainItems.length) {
					const item = mainItems[focusedIndex];
					if (item.href) window.location.href = item.href;
				}
				open = false;
				break;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<Dropdown bind:open width="w-64" fixed={true}>
	{#snippet trigger()}
		<span
			class="user-trigger"
			onmouseenter={(e) => { e.currentTarget.style.outlineColor = 'var(--glass-border)'; }}
			onmouseleave={(e) => { e.currentTarget.style.outlineColor = 'transparent'; }}
			onclick={() => { focusedIndex = -1; }}
		>
			<Avatar username={userStore.user?.username ?? '?'} size={30} />
			<span class="user-name sidebar-label">{userStore.user?.username ?? ''}</span>
		</span>
	{/snippet}

	{#snippet children()}
		<!-- User info -->
		<div class="px-4 py-3 border-b" style="border-color: var(--glass-border);">
			<p class="text-sm font-medium" style="color: var(--color-text);">{userStore.user?.full_name || userStore.user?.username}</p>
			<p class="text-xs" style="color: var(--color-text-dim);">@{userStore.user?.username}</p>
		</div>

		<!-- Theme quick toggle -->
		<div class="px-4 py-2 border-b flex items-center justify-between" style="border-color: var(--glass-border);">
			<span class="text-xs" style="color: var(--color-text-dim);">Theme</span>
			<button
				class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors"
				style="color: var(--color-text-dim); background: rgba(255, 255, 255, 0.03);"
				onclick={toggleThemeMode}
				onmouseenter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
				onmouseleave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; }}
			>
				<span class="w-2 h-2 rounded-full" style="background: var(--color-primary);"></span>
				<span class="capitalize">{themeStore.mode}</span>
			</button>
		</div>

		<!-- Menu items -->
		<div class="py-1">
			{#each mainItems as item, i}
				<a
					href={item.href}
					class="dropdown-item"
					style="background: {focusedIndex === i ? 'rgba(255, 255, 255, 0.03)' : 'transparent'};"
					onclick={() => { open = false; }}
					onmouseenter={() => { focusedIndex = i; }}
				>
					{item.label}
				</a>
			{/each}
		</div>

		<!-- Sign out -->
		<div class="border-t py-1" style="border-color: var(--glass-border);">
			<button
				class="dropdown-item w-full text-left"
				style="color: var(--color-error);"
				onclick={() => { open = false; userStore.logout(); }}
			>
				Sign out
			</button>
		</div>
	{/snippet}
</Dropdown>

<style>
	.user-trigger {
		display: flex;
		align-items: center;
		gap: 0;
		border-radius: 9999px;
		outline: 2px solid transparent;
		transition: outline-color 0.15s, gap 0.25s;
	}

	:global(.sidebar.wide) .user-trigger {
		gap: 0.625rem;
	}

	.user-name {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-text);
	}

	.dropdown-item {
		display: block;
		padding: 0.5rem 1rem;
		font-size: 0.8125rem;
		color: var(--color-text);
		transition: background-color 0.1s;
	}
	.dropdown-item:hover {
		background: rgba(255, 255, 255, 0.03) !important;
	}
</style>
