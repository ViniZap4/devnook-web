<script lang="ts">
	import { onMount } from 'svelte';
	import { admin } from '$lib/services/api';
	import type { AdminStats, AdminAnalytics } from '$lib/services/api';
	import AdminChart from '$lib/components/AdminChart.svelte';

	let stats = $state<AdminStats | null>(null);
	let analytics = $state<AdminAnalytics | null>(null);
	let loading = $state(true);
	let error = $state('');

	onMount(async () => {
		try {
			stats = await admin.stats();
		} catch {
			error = 'Failed to load stats';
		} finally {
			loading = false;
		}
		try {
			analytics = await admin.analytics();
		} catch {
			// analytics is optional — dashboard still works without it
		}
	});
</script>

<div class="flex flex-col gap-8">
	<div>
		<h1 class="text-2xl font-bold" style="color: var(--color-text);">Dashboard</h1>
		<p class="text-sm mt-1" style="color: var(--color-text-dim);">System overview and analytics</p>
	</div>

	{#if loading}
		<div class="py-12 text-center text-sm" style="color: var(--color-text-dim);">Loading...</div>
	{:else if error}
		<div class="rounded-xl border p-6 text-center" style="border-color: var(--color-error-subtle); background: var(--color-error-subtle);">
			<p class="text-sm" style="color: var(--color-error);">{error}</p>
			<button class="text-xs mt-2 underline" style="color: var(--color-error);" onclick={() => location.reload()}>Retry</button>
		</div>
	{:else if stats}
		<!-- Stats Grid -->
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
			<div class="rounded-xl border p-5 flex flex-col gap-3" style="border-color: var(--glass-border); background: var(--glass-bg); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);">
				<div class="flex items-center justify-between">
					<span class="text-xs font-medium uppercase tracking-wider" style="color: var(--color-text-dim);">Users</span>
					<div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background-color: var(--color-info-subtle);">
						<svg class="w-4 h-4" style="color: var(--color-info);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
						</svg>
					</div>
				</div>
				<p class="text-3xl font-bold" style="color: var(--color-text);">{stats.total_users}</p>
				<a href="/admin/users" class="text-xs font-medium" style="color: var(--color-info);">Manage users &rarr;</a>
			</div>

			<div class="rounded-xl border p-5 flex flex-col gap-3" style="border-color: var(--glass-border); background: var(--glass-bg); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);">
				<div class="flex items-center justify-between">
					<span class="text-xs font-medium uppercase tracking-wider" style="color: var(--color-text-dim);">Repositories</span>
					<div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background-color: var(--color-success-subtle);">
						<svg class="w-4 h-4" style="color: var(--color-success);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
						</svg>
					</div>
				</div>
				<p class="text-3xl font-bold" style="color: var(--color-text);">{stats.total_repos}</p>
				<a href="/admin/repos" class="text-xs font-medium" style="color: var(--color-success);">Manage repos &rarr;</a>
			</div>

			<div class="rounded-xl border p-5 flex flex-col gap-3" style="border-color: var(--glass-border); background: var(--glass-bg); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);">
				<div class="flex items-center justify-between">
					<span class="text-xs font-medium uppercase tracking-wider" style="color: var(--color-text-dim);">Organizations</span>
					<div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background-color: var(--color-warning-subtle);">
						<svg class="w-4 h-4" style="color: var(--color-warning);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
						</svg>
					</div>
				</div>
				<p class="text-3xl font-bold" style="color: var(--color-text);">{stats.total_orgs}</p>
				<a href="/admin/orgs" class="text-xs font-medium" style="color: var(--color-warning);">Manage orgs &rarr;</a>
			</div>

			<div class="rounded-xl border p-5 flex flex-col gap-3" style="border-color: var(--glass-border); background: var(--glass-bg); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);">
				<div class="flex items-center justify-between">
					<span class="text-xs font-medium uppercase tracking-wider" style="color: var(--color-text-dim);">Open Issues</span>
					<div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background-color: var(--color-error-subtle);">
						<svg class="w-4 h-4" style="color: var(--color-error);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10" />
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01" />
						</svg>
					</div>
				</div>
				<p class="text-3xl font-bold" style="color: var(--color-text);">{stats.total_issues}</p>
				<span class="text-xs" style="color: var(--color-text-dim);">Across all repos</span>
			</div>
		</div>

		<!-- Activity Metrics -->
		{#if analytics}
			<div class="grid grid-cols-3 gap-4">
				<div class="rounded-xl border p-4 flex flex-col items-center gap-1" style="border-color: var(--glass-border); background: var(--glass-bg); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);">
					<span class="text-2xl font-bold" style="color: var(--color-primary);">{analytics.active_today}</span>
					<span class="text-[0.6875rem]" style="color: var(--color-text-dim);">Active today</span>
				</div>
				<div class="rounded-xl border p-4 flex flex-col items-center gap-1" style="border-color: var(--glass-border); background: var(--glass-bg); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);">
					<span class="text-2xl font-bold" style="color: var(--color-success);">{analytics.new_this_week}</span>
					<span class="text-[0.6875rem]" style="color: var(--color-text-dim);">New this week</span>
				</div>
				<div class="rounded-xl border p-4 flex flex-col items-center gap-1" style="border-color: var(--glass-border); background: var(--glass-bg); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);">
					<span class="text-2xl font-bold" style="color: var(--color-info);">{analytics.new_this_month}</span>
					<span class="text-[0.6875rem]" style="color: var(--color-text-dim);">New this month</span>
				</div>
			</div>

			<!-- Growth Charts -->
			<div>
				<h2 class="text-sm font-semibold uppercase tracking-wider mb-4" style="color: var(--color-text-dim);">Growth (Last 30 Days)</h2>
				<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
					<AdminChart data={analytics.user_growth} label="User Signups" color="var(--color-info)" />
					<AdminChart data={analytics.repo_growth} label="New Repositories" color="var(--color-success)" />
					<AdminChart data={analytics.issue_growth} label="Issues Created" color="var(--color-error)" />
				</div>
			</div>
		{/if}

		<!-- Quick Actions -->
		<div>
			<h2 class="text-sm font-semibold uppercase tracking-wider mb-4" style="color: var(--color-text-dim);">Quick Actions</h2>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
				<a href="/admin/users" class="rounded-xl border p-4 flex items-center gap-3 transition-all hover:border-[rgba(255,255,255,0.12)]" style="border-color: var(--glass-border); background: var(--glass-bg); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);">
					<div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style="background-color: var(--color-primary-subtle);">
						<svg class="w-5 h-5" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
						</svg>
					</div>
					<div>
						<p class="text-sm font-medium" style="color: var(--color-text);">Manage Users</p>
						<p class="text-xs mt-0.5" style="color: var(--color-text-dim);">Roles, permissions, and accounts</p>
					</div>
				</a>
				<a href="/admin/repos" class="rounded-xl border p-4 flex items-center gap-3 transition-all hover:border-[rgba(255,255,255,0.12)]" style="border-color: var(--glass-border); background: var(--glass-bg); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);">
					<div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style="background-color: var(--color-primary-subtle);">
						<svg class="w-5 h-5" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
						</svg>
					</div>
					<div>
						<p class="text-sm font-medium" style="color: var(--color-text);">Manage Repositories</p>
						<p class="text-xs mt-0.5" style="color: var(--color-text-dim);">Browse and manage all repositories</p>
					</div>
				</a>
				<a href="/admin/orgs" class="rounded-xl border p-4 flex items-center gap-3 transition-all hover:border-[rgba(255,255,255,0.12)]" style="border-color: var(--glass-border); background: var(--glass-bg); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);">
					<div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style="background-color: var(--color-primary-subtle);">
						<svg class="w-5 h-5" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
						</svg>
					</div>
					<div>
						<p class="text-sm font-medium" style="color: var(--color-text);">Manage Organizations</p>
						<p class="text-xs mt-0.5" style="color: var(--color-text-dim);">View and manage organizations</p>
					</div>
				</a>
			</div>
		</div>
	{/if}
</div>
