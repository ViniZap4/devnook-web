<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import CreateRepoForm from '$lib/components/CreateRepoForm.svelte';
	import RepoIcon from '$lib/assets/icons/RepoIcon.svelte';

	onMount(() => {
		if (!userStore.isLoggedIn) goto('/');
	});
</script>

<PageShell maxWidth="max-w-3xl">
	<div class="flex flex-col gap-2 mb-8 pb-6 border-b border-white/[0.06]">
		<div class="flex items-center gap-3">
			<div class="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
				<RepoIcon size={18} color="var(--color-text)" />
			</div>
			<div>
				<h1 class="text-[var(--color-text)] text-xl font-bold">Create a new repository</h1>
				<p class="text-sm text-[var(--color-text)] opacity-30">A repository contains all project files, including the revision history.</p>
			</div>
		</div>
	</div>
	<CreateRepoForm />
</PageShell>
