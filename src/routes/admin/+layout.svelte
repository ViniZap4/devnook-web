<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import FloatingNav from '$lib/components/FloatingNav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	onMount(() => {
		if (!userStore.isLoggedIn || !userStore.user?.is_admin) {
			goto('/dashboard');
		}
	});

	const navItems = [
		{ href: '/admin', label: 'Dashboard', icon: 'dashboard', match: (p: string) => p === '/admin' },
		{ href: '/admin/users', label: 'User Accounts', icon: 'users', match: (p: string) => p.startsWith('/admin/users') },
		{ href: '/admin/repos', label: 'Repositories', icon: 'repos', match: (p: string) => p.startsWith('/admin/repos') },
		{ href: '/admin/orgs', label: 'Organizations', icon: 'orgs', match: (p: string) => p.startsWith('/admin/orgs') },
	];
</script>

<div class="min-h-screen flex flex-col" style="background-color: var(--color-background);">
	<FloatingNav />
	<div class="flex-1 flex pt-20">
		<!-- Sidebar -->
		<aside class="w-64 shrink-0 border-r hidden lg:flex flex-col" style="border-color: var(--color-border); background-color: color-mix(in srgb, var(--color-surface) 60%, transparent); backdrop-filter: blur(12px);">
			<div class="p-5 border-b" style="border-color: var(--color-border);">
				<div class="flex items-center gap-2.5">
					<div class="w-8 h-8 rounded-xl flex items-center justify-center" style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); opacity: 0.9;">
						<svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
							<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
					</div>
					<div>
						<p class="text-sm font-semibold" style="color: var(--color-text);">Site Administration</p>
						<p class="text-[0.6875rem]" style="color: var(--color-text-dim);">Manage your instance</p>
					</div>
				</div>
			</div>
			<nav class="flex-1 p-3 flex flex-col gap-0.5">
				{#each navItems as item}
					{@const active = item.match($page.url.pathname)}
					<a
						href={item.href}
						class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
						style="
							color: {active ? 'var(--color-primary)' : 'var(--color-text-dim)'};
							background: {active ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)' : 'transparent'};
							font-weight: {active ? '600' : '400'};
						"
						onmouseenter={(e) => { if (!active) e.currentTarget.style.background = 'var(--color-surface-hover)'; }}
						onmouseleave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
					>
						{#if item.icon === 'dashboard'}
							<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 12a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
							</svg>
						{:else if item.icon === 'users'}
							<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
							</svg>
						{:else if item.icon === 'repos'}
							<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
							</svg>
						{:else if item.icon === 'orgs'}
							<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
							</svg>
						{/if}
						{item.label}
					</a>
				{/each}
			</nav>
			<div class="p-4 border-t" style="border-color: var(--color-border);">
				<a href="/dashboard" class="flex items-center gap-2 text-xs transition-colors" style="color: var(--color-text-dim);"
					onmouseenter={(e) => e.currentTarget.style.color = 'var(--color-text)'}
					onmouseleave={(e) => e.currentTarget.style.color = 'var(--color-text-dim)'}
				>
					<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
					</svg>
					Back to Dashboard
				</a>
			</div>
		</aside>

		<!-- Mobile nav -->
		<div class="lg:hidden border-b px-4 py-2 flex items-center gap-1 overflow-x-auto" style="border-color: var(--color-border); background-color: var(--color-surface);">
			{#each navItems as item}
				{@const active = item.match($page.url.pathname)}
				<a
					href={item.href}
					class="px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
					style="color: {active ? 'var(--color-primary)' : 'var(--color-text-dim)'}; background: {active ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)' : 'transparent'};"
				>
					{item.label}
				</a>
			{/each}
		</div>

		<!-- Main content -->
		<main class="flex-1 min-w-0 p-6 lg:p-8">
			<div class="max-w-[1400px] mx-auto">
				{@render children()}
			</div>
		</main>
	</div>
	<Footer />
</div>
