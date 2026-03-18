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

	const cards = $derived(stats ? [
		{
			value: stats.total_commits ?? 0,
			label: 'Total Commits',
			color: '#06b6d4',
			icon: 'commit'
		},
		{
			value: stats.open_issues,
			label: 'Open Issues',
			color: '#e3b341',
			icon: 'issue'
		},
		{
			value: stats.total_orgs,
			label: 'Organizations',
			color: '#3fb950',
			icon: 'org'
		},
		{
			value: stats.total_repos,
			label: 'Repositories',
			color: '#8b5cf6',
			icon: 'repo'
		},
	] : []);
</script>

{#if stats}
<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
	{#each cards as card, i}
		<div class="card-glow p-4 flex items-center gap-4 animate-fade-up stagger-{i + 1}">
			<div
				class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
				style="background: linear-gradient(135deg, color-mix(in srgb, {card.color} 20%, transparent), color-mix(in srgb, {card.color} 5%, transparent));"
			>
				{#if card.icon === 'commit'}
					<svg class="w-5 h-5" style="color: {card.color};" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="3" />
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v3m0 12v3M3 12h3m12 0h3" />
					</svg>
				{:else if card.icon === 'issue'}
					<svg class="w-5 h-5" style="color: {card.color};" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10" />
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01" />
					</svg>
				{:else if card.icon === 'org'}
					<svg class="w-5 h-5" style="color: {card.color};" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
					</svg>
				{:else}
					<svg class="w-5 h-5" style="color: {card.color};" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
					</svg>
				{/if}
			</div>
			<div>
				<div class="text-2xl font-bold tabular-nums" style="color: var(--color-text);">{card.value}</div>
				<div class="text-xs" style="color: var(--color-text-dim);">{card.label}</div>
			</div>
		</div>
	{/each}
</div>
{/if}
