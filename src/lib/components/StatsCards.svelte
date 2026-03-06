<script lang="ts">
	import { onMount } from 'svelte';
	import { users } from '$lib/services/api';
	import type { DashboardStats } from '$lib/services/api';

	let stats = $state<DashboardStats | null>(null);
	let visible = $state(false);
	let counters = $state<number[]>([0, 0, 0, 0]);

	onMount(async () => {
		try {
			stats = await users.dashboardStats();
			requestAnimationFrame(() => {
				visible = true;
				// Animate counters
				if (stats) {
					const targets = [stats.total_repos, stats.total_orgs, stats.open_issues, stats.total_commits ?? 0];
					const duration = 800;
					const start = performance.now();
					function tick(now: number) {
						const t = Math.min((now - start) / duration, 1);
						const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
						counters = targets.map(target => Math.round(target * ease));
						if (t < 1) requestAnimationFrame(tick);
					}
					requestAnimationFrame(tick);
				}
			});
		} catch {
			// ignore
		}
	});

	const cards = $derived(stats ? [
		{ value: counters[0], label: 'Repositories', color: 'var(--color-info)', icon: 'repo' },
		{ value: counters[1], label: 'Organizations', color: 'var(--color-warning)', icon: 'org' },
		{ value: counters[2], label: 'Open Issues', color: 'var(--color-success)', icon: 'issue' },
		{ value: counters[3], label: 'Total Commits', color: 'var(--color-primary)', icon: 'commit' },
	] : []);
</script>

{#if stats}
<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
	{#each cards as card, i}
		<div
			class="group relative rounded-2xl border p-5 overflow-hidden transition-all duration-500"
			style="
				border-color: var(--color-border);
				background: color-mix(in srgb, var(--color-surface) 60%, transparent);
				backdrop-filter: blur(12px);
				opacity: {visible ? 1 : 0};
				transform: {visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.95)'};
				transition-delay: {i * 100}ms;
			"
		>
			<!-- Glow background on hover -->
			<div
				class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
				style="background: radial-gradient(circle at 50% 50%, {card.color}08 0%, transparent 70%);"
			></div>

			<!-- Top accent gradient -->
			<div
				class="absolute top-0 left-0 right-0 h-px transition-opacity duration-500 opacity-0 group-hover:opacity-100"
				style="background: linear-gradient(90deg, transparent, {card.color}60, transparent);"
			></div>

			<div class="relative flex flex-col gap-3">
				<div
					class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
					style="background-color: {card.color}10; box-shadow: 0 0 0 1px {card.color}15;"
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
						class="text-2xl font-bold tabular-nums tracking-tight transition-colors duration-300"
						style="color: var(--color-text);"
					>{card.value}</p>
					<p class="text-[0.6875rem] mt-0.5 font-medium" style="color: var(--color-text-dim);">{card.label}</p>
				</div>
			</div>

			<!-- Bottom accent line -->
			<div
				class="absolute bottom-0 left-0 h-0.5 transition-all duration-700 group-hover:w-full"
				style="background: linear-gradient(90deg, {card.color}, {card.color}40); width: 0%;"
			></div>
		</div>
	{/each}
</div>
{/if}
