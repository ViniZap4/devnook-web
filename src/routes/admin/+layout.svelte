<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	onMount(() => {
		if (!userStore.isLoggedIn || !userStore.user?.is_admin) {
			goto('/dashboard');
		}
	});

	const navItems = [
		{ href: '/admin', label: 'Dashboard', icon: 'dashboard', match: (p: string) => p === '/admin' },
		{ href: '/admin/users', label: 'Users', icon: 'users', match: (p: string) => p.startsWith('/admin/users') },
		{ href: '/admin/repos', label: 'Repos', icon: 'repos', match: (p: string) => p.startsWith('/admin/repos') },
		{ href: '/admin/orgs', label: 'Orgs', icon: 'orgs', match: (p: string) => p.startsWith('/admin/orgs') },
	];
</script>

<PageShell width="full">
	<div class="admin-layout">
		<!-- Admin header -->
		<div class="admin-header">
			<div class="admin-title-row">
				<div class="flex items-center gap-2.5">
					<div class="admin-icon">
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
				<a
					href="/dashboard"
					class="back-link"
					onmouseenter={(e) => e.currentTarget.style.color = 'var(--color-text)'}
					onmouseleave={(e) => e.currentTarget.style.color = 'var(--color-text-dim)'}
				>
					<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
					</svg>
					Back to Dashboard
				</a>
			</div>

			<!-- Horizontal tab bar -->
			<nav class="admin-tabs">
				{#each navItems as item}
					{@const active = item.match($page.url.pathname)}
					<a
						href={item.href}
						class="admin-tab"
						class:active
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
						<span>{item.label}</span>
					</a>
				{/each}
			</nav>
		</div>

		<!-- Main content -->
		<div class="admin-content">
			<div class="max-w-[1400px] mx-auto">
				{@render children()}
			</div>
		</div>
	</div>
</PageShell>

<style>
	.admin-layout {
		display: flex;
		flex-direction: column;
		min-height: calc(100vh - 4rem);
	}

	.admin-header {
		border: 1px solid var(--glass-border);
		background: var(--glass-bg);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-radius: 1rem;
		margin-bottom: 1.5rem;
		overflow: hidden;
	}

	.admin-title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid var(--glass-border);
	}

	.admin-icon {
		width: 2rem;
		height: 2rem;
		border-radius: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
		opacity: 0.9;
	}

	.back-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: var(--color-text-dim);
		text-decoration: none;
		transition: color 0.15s;
	}

	.admin-tabs {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem 1rem;
		overflow-x: auto;
	}

	.admin-tab {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border-radius: 0.75rem;
		font-size: 0.8125rem;
		font-weight: 400;
		white-space: nowrap;
		color: var(--color-text-dim);
		text-decoration: none;
		transition: all 0.15s;
	}

	.admin-tab:hover:not(.active) {
		color: var(--color-text);
		background: rgba(255, 255, 255, 0.05);
	}

	.admin-tab.active {
		color: var(--color-primary);
		background-color: var(--color-primary-subtle);
		font-weight: 600;
	}

	.admin-content {
		flex: 1;
		padding: 0;
	}
</style>
