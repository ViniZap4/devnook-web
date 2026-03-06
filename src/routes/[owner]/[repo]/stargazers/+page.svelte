<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { repos } from '$lib/services/api';
	import type { User } from '$lib/services/api';
	import Avatar from '$lib/components/Avatar.svelte';

	const owner = $derived($page.params.owner!);
	const repoName = $derived($page.params.repo!);

	let stargazers = $state<User[]>([]);
	let loading = $state(true);

	onMount(async () => {
		try {
			stargazers = await repos.stargazers(owner, repoName);
		} catch {
			// ignore
		} finally {
			loading = false;
		}
	});
</script>

<div class="flex flex-col gap-6">
	<div class="flex items-center gap-3 page-header">
		<div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background: color-mix(in srgb, var(--color-warning) 12%, transparent);">
			<svg class="w-4.5 h-4.5" style="color: var(--color-warning);" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/></svg>
		</div>
		<div>
			<h2 class="text-lg font-bold gradient-text">Stargazers</h2>
			<p class="text-xs" style="color: var(--color-text-dim);">{stargazers.length} {stargazers.length === 1 ? 'person' : 'people'} starred this repository</p>
		</div>
	</div>

	{#if loading}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
			{#each Array(6) as _, i}
				<div class="card p-4 card-animate stagger-{Math.min(i + 1, 6)}">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-full skeleton-loading"></div>
						<div class="flex flex-col gap-1.5">
							<div class="w-24 h-3.5 skeleton-loading rounded"></div>
							<div class="w-16 h-3 skeleton-loading rounded"></div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else if stargazers.length === 0}
		<div class="card p-16 text-center card-animate">
			<div class="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style="background: color-mix(in srgb, var(--color-warning) 8%, transparent);">
				<svg class="w-8 h-8 opacity-30" style="color: var(--color-warning);" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/></svg>
			</div>
			<p class="text-sm font-semibold mb-1" style="color: var(--color-text);">No stargazers yet</p>
			<p class="text-xs" style="color: var(--color-text-dim);">Be the first to star this repository.</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
			{#each stargazers as user, i}
				<a
					href="/{user.username}"
					class="card p-4 card-hover card-animate stagger-{Math.min(i + 1, 8)} group"
				>
					<div class="flex items-center gap-3">
						<div class="relative">
							<Avatar username={user.username} size={40} />
							<div class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center" style="background: var(--color-background); border: 1.5px solid var(--color-border);">
								<svg class="w-2 h-2" style="color: var(--color-warning);" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/></svg>
							</div>
						</div>
						<div class="min-w-0">
							<p class="text-sm font-semibold truncate group-hover:underline" style="color: var(--color-text);">{user.full_name || user.username}</p>
							<p class="text-xs truncate" style="color: var(--color-text-dim);">@{user.username}</p>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
