<script lang="ts">
	import { onMount } from 'svelte';
	import { users } from '$lib/services/api';
	import type { DashboardStats } from '$lib/services/api';

	let stats = $state<DashboardStats | null>(null);

	onMount(async () => {
		try {
			stats = await users.dashboardStats();
		} catch {
			// ignore
		}
	});
</script>

{#if stats}
<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
	<div class="rounded-xl border p-4 transition-colors hover:border-[var(--color-info)]" style="border-color: var(--color-border); background-color: var(--color-surface);">
		<div class="flex items-center gap-3">
			<div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style="background-color: var(--color-info)12;">
				<svg class="w-[18px] h-[18px]" style="color: var(--color-info);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
				</svg>
			</div>
			<div>
				<p class="text-xl font-bold" style="color: var(--color-text);">{stats.total_repos}</p>
				<p class="text-[0.6875rem]" style="color: var(--color-text-dim);">Repositories</p>
			</div>
		</div>
	</div>
	<div class="rounded-xl border p-4 transition-colors hover:border-[var(--color-warning)]" style="border-color: var(--color-border); background-color: var(--color-surface);">
		<div class="flex items-center gap-3">
			<div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style="background-color: var(--color-warning)12;">
				<svg class="w-[18px] h-[18px]" style="color: var(--color-warning);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
				</svg>
			</div>
			<div>
				<p class="text-xl font-bold" style="color: var(--color-text);">{stats.total_orgs}</p>
				<p class="text-[0.6875rem]" style="color: var(--color-text-dim);">Organizations</p>
			</div>
		</div>
	</div>
	<div class="rounded-xl border p-4 transition-colors hover:border-[var(--color-success)]" style="border-color: var(--color-border); background-color: var(--color-surface);">
		<div class="flex items-center gap-3">
			<div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style="background-color: var(--color-success)12;">
				<svg class="w-[18px] h-[18px]" style="color: var(--color-success);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10" />
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01" />
				</svg>
			</div>
			<div>
				<p class="text-xl font-bold" style="color: var(--color-text);">{stats.open_issues}</p>
				<p class="text-[0.6875rem]" style="color: var(--color-text-dim);">Open Issues</p>
			</div>
		</div>
	</div>
	<div class="rounded-xl border p-4 transition-colors hover:border-[var(--color-primary)]" style="border-color: var(--color-border); background-color: var(--color-surface);">
		<div class="flex items-center gap-3">
			<div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style="background-color: var(--color-primary)12;">
				<svg class="w-[18px] h-[18px]" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="3" />
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v3m0 12v3M3 12h3m12 0h3" />
				</svg>
			</div>
			<div>
				<p class="text-xl font-bold" style="color: var(--color-text);">{stats.total_commits ?? 0}</p>
				<p class="text-[0.6875rem]" style="color: var(--color-text-dim);">Total Commits</p>
			</div>
		</div>
	</div>
</div>
{/if}
