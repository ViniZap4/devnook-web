<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { repos } from '$lib/services/api';

	const owner = $derived($page.params.owner);
	const repoName = $derived($page.params.repo);

	let deleting = $state(false);
	let confirmName = $state('');

	async function handleDelete() {
		if (confirmName !== repoName) return;
		deleting = true;
		try {
			await repos.remove(owner, repoName);
			goto('/dashboard');
		} catch {
			deleting = false;
		}
	}
</script>

<div class="flex flex-col gap-8">
	<h2 class="text-[var(--color-text)] font-semibold">Settings</h2>

	<div class="rounded-lg border border-red-500/20 p-6">
		<h3 class="text-red-400 font-semibold mb-2">Danger Zone</h3>
		<p class="text-sm text-[var(--color-text)] opacity-60 mb-4">
			Once you delete a repository, there is no going back.
		</p>
		<div class="flex flex-col gap-3 max-w-sm">
			<input
				type="text"
				bind:value={confirmName}
				placeholder="Type repository name to confirm"
				class="w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/5 text-[var(--color-text)] placeholder:opacity-30"
			/>
			<button
				onclick={handleDelete}
				disabled={confirmName !== repoName || deleting}
				class="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
			>
				{deleting ? 'Deleting...' : 'Delete this repository'}
			</button>
		</div>
	</div>
</div>
