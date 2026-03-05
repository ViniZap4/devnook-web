<script lang="ts">
	import CloneUrlBox from './CloneUrlBox.svelte';

	let { cloneUrl }: { cloneUrl: string } = $props();
</script>

<div class="flex flex-col gap-6">
	<div class="card p-8 text-center border-dashed">
		<svg class="w-12 h-12 mx-auto text-[var(--color-text)] opacity-10" viewBox="0 0 16 16" fill="currentColor">
			<path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8Z"/>
		</svg>
		<h3 class="text-[var(--color-text)] font-semibold mt-4 mb-1">This repository is empty</h3>
		<p class="text-sm text-[var(--color-text)] opacity-30 mb-6">Get started by pushing code to this repository.</p>
		<div class="max-w-md mx-auto">
			<CloneUrlBox url={cloneUrl} />
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<div class="card p-6">
			<h4 class="text-[var(--color-text)] font-semibold text-sm mb-3 flex items-center gap-2">
				<span class="w-5 h-5 rounded-full bg-white/[0.06] flex items-center justify-center text-xs opacity-50">1</span>
				Create a new repository
			</h4>
			<pre class="text-xs bg-black/20 rounded-lg p-4 overflow-x-auto border border-white/[0.04] text-[var(--color-text)] opacity-60"><code>echo "# My Project" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin {cloneUrl}
git push -u origin main</code></pre>
		</div>

		<div class="card p-6">
			<h4 class="text-[var(--color-text)] font-semibold text-sm mb-3 flex items-center gap-2">
				<span class="w-5 h-5 rounded-full bg-white/[0.06] flex items-center justify-center text-xs opacity-50">2</span>
				Push an existing repository
			</h4>
			<pre class="text-xs bg-black/20 rounded-lg p-4 overflow-x-auto border border-white/[0.04] text-[var(--color-text)] opacity-60"><code>git remote add origin {cloneUrl}
git branch -M main
git push -u origin main</code></pre>
		</div>
	</div>
</div>
