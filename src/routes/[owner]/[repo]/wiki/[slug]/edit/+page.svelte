<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { repos } from '$lib/services/api';

	const owner = $derived($page.params.owner!);
	const repoName = $derived($page.params.repo!);
	const slug = $derived($page.params.slug!);

	let body = $state('');
	let loading = $state(true);
	let saving = $state(false);
	let error = $state('');

	onMount(async () => {
		try {
			const blob = await repos.blob(owner, repoName, 'main', `wiki/${slug}.md`);
			body = blob.content;
		} catch {
			error = 'Page not found';
		} finally {
			loading = false;
		}
	});

	async function savePage() {
		saving = true;
		error = '';
		const path = `wiki/${slug}.md`;

		try {
			await repos.updateFile(owner, repoName, path, {
				content: btoa(unescape(encodeURIComponent(body))),
				message: `wiki: update ${slug}`,
				branch: 'main'
			});
			goto(`/${owner}/${repoName}/wiki/${slug}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save page';
		} finally {
			saving = false;
		}
	}

	async function deletePage() {
		if (!confirm(`Delete wiki page "${slug.replace(/-/g, ' ')}"?`)) return;
		saving = true;
		try {
			await repos.deleteFile(owner, repoName, `wiki/${slug}.md`, {
				message: `wiki: delete ${slug}`,
				branch: 'main'
			});
			goto(`/${owner}/${repoName}/wiki`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete page';
			saving = false;
		}
	}
</script>

<div class="flex flex-col gap-5">
	<div class="flex items-center gap-2 text-sm page-header">
		<a href="/{owner}/{repoName}/wiki" class="animated-link font-medium" style="color: var(--color-primary);">Wiki</a>
		<svg class="w-3 h-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
		<a href="/{owner}/{repoName}/wiki/{slug}" class="animated-link font-medium" style="color: var(--color-primary);">{slug.replace(/-/g, ' ')}</a>
		<svg class="w-3 h-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
		<h2 class="font-bold" style="color: var(--color-text);">Edit</h2>
	</div>

	{#if error}
		<div class="card px-4 py-3 text-sm animate-pop-in" style="background: color-mix(in srgb, var(--color-error) 8%, transparent); border-color: color-mix(in srgb, var(--color-error) 20%, transparent); color: var(--color-error);">
			{error}
		</div>
	{/if}

	{#if loading}
		<div class="card p-5 card-animate">
			<div class="w-20 h-4 skeleton-loading rounded mb-3"></div>
			<div class="w-full h-64 skeleton-loading rounded"></div>
		</div>
	{:else}
		<form onsubmit={(e) => { e.preventDefault(); savePage(); }} class="flex flex-col gap-4 animate-fade-up">
			<div class="card p-5">
				<label for="wiki-body" class="section-title mb-2 block">Content (Markdown)</label>
				<textarea
					id="wiki-body"
					bind:value={body}
					rows="25"
					class="w-full px-4 py-3 text-sm rounded-xl bg-transparent font-mono transition-all"
					style="border: 1px solid var(--color-border); color: var(--color-text); resize: vertical;"
				></textarea>
			</div>

			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<button
						type="submit"
						disabled={saving}
						class="btn-glow px-5 py-2.5 text-sm font-semibold rounded-xl text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
						style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));"
					>
						{saving ? 'Saving...' : 'Save Changes'}
					</button>
					<a
						href="/{owner}/{repoName}/wiki/{slug}"
						class="px-4 py-2.5 text-sm rounded-xl glass-subtle transition-all hover:scale-[1.02]"
						style="color: var(--color-text-dim);"
					>
						Cancel
					</a>
				</div>
				<button
					type="button"
					onclick={deletePage}
					disabled={saving}
					class="px-4 py-2.5 text-sm font-medium rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
					style="border: 1px solid color-mix(in srgb, var(--color-error) 30%, transparent); color: var(--color-error); background: color-mix(in srgb, var(--color-error) 5%, transparent);"
				>
					Delete Page
				</button>
			</div>
		</form>
	{/if}
</div>
