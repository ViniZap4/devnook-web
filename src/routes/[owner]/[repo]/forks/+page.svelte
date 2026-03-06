<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { repos } from '$lib/services/api';
	import type { Repository } from '$lib/types/repository';
	import RelativeTime from '$lib/components/RelativeTime.svelte';

	const owner = $derived($page.params.owner!);
	const repoName = $derived($page.params.repo!);

	let forkList = $state<Repository[]>([]);
	let loading = $state(true);
	let forking = $state(false);

	onMount(async () => {
		try {
			forkList = await repos.forks(owner, repoName);
		} catch {
			// ignore
		} finally {
			loading = false;
		}
	});

	async function createFork() {
		forking = true;
		try {
			const result = await repos.fork(owner, repoName);
			window.location.href = `/${result.name}`;
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Failed to fork');
		} finally {
			forking = false;
		}
	}
</script>

<div class="flex flex-col gap-6">
	<div class="flex items-center justify-between page-header">
		<div class="flex items-center gap-3">
			<div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background: color-mix(in srgb, var(--color-accent) 12%, transparent);">
				<svg class="w-4.5 h-4.5" style="color: var(--color-accent);" viewBox="0 0 16 16" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/></svg>
			</div>
			<div>
				<h2 class="text-lg font-bold gradient-text">Forks</h2>
				<p class="text-xs" style="color: var(--color-text-dim);">{forkList.length} {forkList.length === 1 ? 'fork' : 'forks'}</p>
			</div>
		</div>
		<button
			onclick={createFork}
			disabled={forking}
			class="btn-glow flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
			style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));"
		>
			<svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/></svg>
			{forking ? 'Forking...' : 'Fork'}
		</button>
	</div>

	{#if loading}
		<div class="flex flex-col gap-3">
			{#each Array(3) as _, i}
				<div class="card p-4 card-animate stagger-{i + 1}">
					<div class="flex items-center gap-3">
						<div class="w-5 h-5 skeleton-loading rounded"></div>
						<div class="flex flex-col gap-1.5 flex-1">
							<div class="w-40 h-4 skeleton-loading rounded"></div>
							<div class="w-64 h-3 skeleton-loading rounded"></div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else if forkList.length === 0}
		<div class="card p-16 text-center card-animate">
			<div class="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style="background: color-mix(in srgb, var(--color-accent) 8%, transparent);">
				<svg class="w-8 h-8 opacity-30" style="color: var(--color-accent);" viewBox="0 0 16 16" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/></svg>
			</div>
			<p class="text-sm font-semibold mb-1" style="color: var(--color-text);">No forks yet</p>
			<p class="text-xs" style="color: var(--color-text-dim);">Be the first to fork this repository.</p>
		</div>
	{:else}
		<div class="flex flex-col gap-2">
			{#each forkList as fork, i}
				<a
					href="/{fork.owner}/{fork.name}"
					class="card card-hover p-4 card-animate stagger-{Math.min(i + 1, 8)} group"
				>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3 min-w-0">
							<div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background: color-mix(in srgb, var(--color-primary) 10%, transparent);">
								<svg class="w-4 h-4 opacity-50" style="color: var(--color-primary);" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8Z"/></svg>
							</div>
							<div class="min-w-0">
								<p class="text-sm font-semibold truncate group-hover:underline" style="color: var(--color-primary);">{fork.owner}<span style="color: var(--color-text-dim);">/</span>{fork.name}</p>
								{#if fork.description}
									<p class="text-xs truncate mt-0.5" style="color: var(--color-text-dim);">{fork.description}</p>
								{/if}
							</div>
						</div>
						<div class="flex items-center gap-2 shrink-0 ml-4">
							<span class="text-[11px]" style="color: var(--color-text-dim); opacity: 0.6;">
								<RelativeTime date={fork.created_at} />
							</span>
							<svg class="w-4 h-4 opacity-0 group-hover:opacity-40 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
