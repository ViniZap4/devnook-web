<script lang="ts">
	import { onMount } from 'svelte';
	import { users } from '$lib/services/api';
	import type { DashboardStats } from '$lib/services/api';

	let stats = $state<DashboardStats | null>(null);
	let visible = $state(false);

	onMount(async () => {
		try {
			stats = await users.dashboardStats();
			// Small delay for entrance animation
			requestAnimationFrame(() => { visible = true; });
		} catch {
			// ignore
		}
	});

	const cards = $derived(stats ? [
		{ value: stats.total_repos, label: 'Repositories', color: 'var(--color-info)', icon: 'repo' },
		{ value: stats.total_orgs, label: 'Organizations', color: 'var(--color-warning)', icon: 'org' },
		{ value: stats.open_issues, label: 'Open Issues', color: 'var(--color-success)', icon: 'issue' },
		{ value: stats.total_commits ?? 0, label: 'Total Commits', color: 'var(--color-primary)', icon: 'commit' },
	] : []);
</script>

{#if stats}
<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
	{#each cards as card, i}
		<div
			class="group relative rounded-xl border p-4 overflow-hidden transition-all duration-300"
			style="
				border-color: var(--color-border);
				background-color: var(--color-surface);
				opacity: {visible ? 1 : 0};
				transform: {visible ? 'translateY(0)' : 'translateY(12px)'};
				transition-delay: {i * 80}ms;
			"
		>
			<!-- Glow background on hover -->
			<div
				class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
				style="background: radial-gradient(circle at 50% 50%, {card.color}08 0%, transparent 70%);"
			></div>

			<div class="relative flex items-center gap-3">
				<div
					class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
					style="background-color: {card.color}12;"
				>
					{#if card.icon === 'repo'}
						<svg class="w-[18px] h-[18px]" style="color: {card.color};" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
						</svg>
					{:else if card.icon === 'org'}
						<svg class="w-[18px] h-[18px]" style="color: {card.color};" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
						</svg>
					{:else if card.icon === 'issue'}
						<svg class="w-[18px] h-[18px]" style="color: {card.color};" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10" />
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01" />
						</svg>
					{:else}
						<svg class="w-[18px] h-[18px]" style="color: {card.color};" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="3" />
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v3m0 12v3M3 12h3m12 0h3" />
						</svg>
					{/if}
				</div>
				<div>
					<p
						class="text-xl font-bold transition-colors duration-300"
						style="color: var(--color-text);"
					>{card.value}</p>
					<p class="text-[0.6875rem]" style="color: var(--color-text-dim);">{card.label}</p>
				</div>
			</div>

			<!-- Bottom accent line -->
			<div
				class="absolute bottom-0 left-0 h-0.5 transition-all duration-500 group-hover:w-full"
				style="background: {card.color}; width: 0%;"
			></div>
		</div>
	{/each}
</div>
{/if}
