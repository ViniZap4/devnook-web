<script lang="ts">
	import { userStore } from '$lib/stores/user.svelte';
	import { themeStore } from '$lib/stores/theme.svelte';
	import Avatar from './Avatar.svelte';

	let open = $state(false);
	let focusedIndex = $state(-1);

	interface MenuItem {
		label: string;
		href?: string;
		action?: () => void;
		danger?: boolean;
	}

	const mainItems: MenuItem[] = [
		{ label: 'Your profile', href: '' },
		{ label: 'Dashboard', href: '/dashboard' },
		{ label: 'New repository', href: '/new' },
		{ label: 'Settings', href: '/settings' },
	];

	$effect(() => {
		if (userStore.user?.username && mainItems[0]) {
			mainItems[0].href = `/${userStore.user.username}`;
		}
	});

	function toggleThemeMode() {
		const modes = ['dark', 'light', 'auto'] as const;
		const idx = modes.indexOf(themeStore.mode);
		themeStore.mode = modes[(idx + 1) % modes.length];
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!open) return;
		switch (e.key) {
			case 'Escape':
				open = false;
				break;
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

<div class="relative">
	<button
		class="flex items-center gap-2 rounded-full transition-all"
		style="outline: 2px solid transparent;"
		onmouseenter={(e) => { e.currentTarget.style.outlineColor = 'var(--color-border)'; }}
		onmouseleave={(e) => { e.currentTarget.style.outlineColor = 'transparent'; }}
		onclick={() => { open = !open; focusedIndex = -1; }}
	>
		<Avatar username={userStore.user?.username ?? '?'} size={30} />
	</button>

	{#if open}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="fixed inset-0 z-40" onclick={() => { open = false; }} onkeydown={() => {}}></div>
		<div
			class="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border shadow-2xl overflow-hidden animate-scale-in-center"
			style="background: var(--color-background); border-color: var(--color-border);"
		>
			<!-- User info -->
			<div class="px-4 py-3 border-b" style="border-color: var(--color-separator);">
				<p class="text-sm font-medium" style="color: var(--color-text);">{userStore.user?.full_name || userStore.user?.username}</p>
				<p class="text-xs" style="color: var(--color-text-dim);">@{userStore.user?.username}</p>
			</div>

			<!-- Theme quick toggle -->
			<div class="px-4 py-2 border-b flex items-center justify-between" style="border-color: var(--color-separator);">
				<span class="text-xs" style="color: var(--color-text-dim);">Theme</span>
				<button
					class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors"
					style="color: var(--color-text-dim); background: var(--color-surface);"
					onclick={toggleThemeMode}
					onmouseenter={(e) => { e.currentTarget.style.background = 'var(--color-surface-hover)'; }}
					onmouseleave={(e) => { e.currentTarget.style.background = 'var(--color-surface)'; }}
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
						style="background: {focusedIndex === i ? 'var(--color-surface)' : 'transparent'};"
						onclick={() => { open = false; }}
						onmouseenter={() => { focusedIndex = i; }}
					>
						{item.label}
					</a>
				{/each}
			</div>

			<!-- Sign out -->
			<div class="border-t py-1" style="border-color: var(--color-separator);">
				<button
					class="dropdown-item w-full text-left"
					style="color: var(--color-error);"
					onclick={() => { open = false; userStore.logout(); }}
				>
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
		background: var(--color-surface) !important;
	}
</style>
