<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { repos } from '$lib/services/api';

	const owner = $derived($page.params.owner!);
	const repoName = $derived($page.params.repo!);

	let title = $state('');
	let body = $state('');
	let saving = $state(false);
	let error = $state('');

	async function createPage() {
		if (!title.trim()) return;
		saving = true;
		error = '';

		const slug = title.trim().replace(/\s+/g, '-');
		const path = `wiki/${slug}.md`;

		try {
			await repos.createFile(owner, repoName, path, {
				content: btoa(unescape(encodeURIComponent(body || `# ${title}\n`))),
				message: `wiki: create ${slug}`,
				branch: 'main'
			});
			goto(`/${owner}/${repoName}/wiki/${slug}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create page';
		} finally {
			saving = false;
		}
	}
</script>

<div class="flex flex-col gap-5">
	<div class="flex items-center gap-2 text-sm page-header">
		<a href="/{owner}/{repoName}/wiki" class="animated-link font-medium" style="color: var(--color-primary);">Wiki</a>
		<svg class="w-3 h-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
		<h2 class="font-bold" style="color: var(--color-text);">New Page</h2>
	</div>

	{#if error}
		<div class="card px-4 py-3 text-sm animate-pop-in" style="background: color-mix(in srgb, var(--color-error) 8%, transparent); border-color: color-mix(in srgb, var(--color-error) 20%, transparent); color: var(--color-error);">
			{error}
		</div>
	{/if}

	<form onsubmit={(e) => { e.preventDefault(); createPage(); }} class="flex flex-col gap-4 animate-fade-up">
		<div class="card p-5">
			<label for="wiki-title" class="section-title mb-2 block">Page Title</label>
			<input
				id="wiki-title"
				type="text"
				bind:value={title}
				placeholder="e.g. Home, Getting Started, API Reference"
				class="w-full px-4 py-2.5 text-sm rounded-xl bg-transparent transition-all"
				style="border: 1px solid var(--color-border); color: var(--color-text);"
				required
			/>
		</div>

		<div class="card p-5">
			<label for="wiki-body" class="section-title mb-2 block">Content (Markdown)</label>
			<textarea
				id="wiki-body"
				bind:value={body}
				placeholder="Write your wiki page content here..."
				rows="20"
				class="w-full px-4 py-3 text-sm rounded-xl bg-transparent font-mono transition-all"
				style="border: 1px solid var(--color-border); color: var(--color-text); resize: vertical;"
			></textarea>
		</div>

		<div class="flex items-center gap-3">
			<button
				type="submit"
				disabled={saving || !title.trim()}
				class="btn-glow px-5 py-2.5 text-sm font-semibold rounded-xl text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
				style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));"
			>
				{saving ? 'Creating...' : 'Create Page'}
			</button>
			<a
				href="/{owner}/{repoName}/wiki"
				class="px-4 py-2.5 text-sm rounded-xl glass-subtle transition-all hover:scale-[1.02]"
				style="color: var(--color-text-dim);"
			>
				Cancel
			</a>
		</div>
	</form>
</div>
