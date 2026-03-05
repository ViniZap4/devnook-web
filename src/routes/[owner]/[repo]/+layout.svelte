<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { repos } from '$lib/services/api';
	import type { Repository } from '$lib/types/repository';
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import RepoHeader from '$lib/components/RepoHeader.svelte';
	import RepoNav from '$lib/components/RepoNav.svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	let repo = $state<Repository | null>(null);
	let loading = $state(true);
	let error = $state('');

	const owner = $derived($page.params.owner);
	const repoName = $derived($page.params.repo);

	onMount(async () => {
		if (!userStore.isLoggedIn) {
			goto('/');
			return;
		}
		try {
			repo = await repos.get(owner, repoName);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Repository not found';
		} finally {
			loading = false;
		}
	});
</script>

<div class="min-h-screen flex flex-col" style="background-color: var(--color-background);">
	<Navbar />
	<main class="max-w-5xl mx-auto px-6 py-6 w-full flex-1">
		{#if loading}
			<div class="flex flex-col gap-6">
				<div class="flex flex-col gap-3">
					<div class="flex items-center gap-2">
						<Skeleton width="100px" height="18px" />
						<span class="text-[var(--color-text)] opacity-15">/</span>
						<Skeleton width="140px" height="18px" />
					</div>
					<Skeleton width="300px" height="14px" />
				</div>
				<Skeleton width="100%" height="40px" rounded="rounded-lg" />
				<Skeleton width="100%" height="200px" rounded="rounded-xl" />
			</div>
		{:else if error}
			<div class="flex flex-col items-center justify-center py-20 gap-4">
				<svg class="w-16 h-16 text-[var(--color-text)] opacity-10" viewBox="0 0 16 16" fill="currentColor">
					<path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8Z"/>
				</svg>
				<p class="text-[var(--color-text)] opacity-40 text-lg">{error}</p>
				<a href="/dashboard" class="text-sm font-medium hover:underline" style="color: var(--palette-0);">Back to dashboard</a>
			</div>
		{:else if repo}
			<div class="flex flex-col gap-6">
				<RepoHeader {repo} />
				<RepoNav owner={owner} repo={repoName} />
				{@render children()}
			</div>
		{/if}
	</main>
	<Footer />
</div>
