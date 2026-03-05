<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import CreateOrgForm from '$lib/components/CreateOrgForm.svelte';
	import OrgIcon from '$lib/assets/icons/OrgIcon.svelte';

	onMount(() => {
		if (!userStore.isLoggedIn) goto('/');
	});
</script>

<PageShell maxWidth="max-w-3xl">
	<div class="flex flex-col gap-2 mb-8 pb-6 border-b border-[var(--color-border)]">
		<div class="flex items-center gap-3">
			<div class="w-10 h-10 rounded-xl bg-[var(--color-surface)] flex items-center justify-center">
				<OrgIcon size={18} color="var(--color-text)" />
			</div>
			<div>
				<h1 class="text-[var(--color-text)] text-xl font-bold">Create a new organization</h1>
				<p class="text-sm text-[var(--color-text)] opacity-30">Organizations let you collaborate with your team on repositories.</p>
			</div>
		</div>
	</div>
	<CreateOrgForm />
</PageShell>
