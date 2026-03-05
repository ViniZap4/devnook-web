<script lang="ts">
	import { marked } from 'marked';

	let { content }: { content: string } = $props();

	const html = $derived(marked(content) as string);
</script>

<div class="markdown-body prose prose-invert max-w-none">
	{@html html}
</div>

<style>
	.markdown-body :global(h1) { font-size: 1.5rem; font-weight: 700; margin: 1rem 0 0.5rem; padding-bottom: 0.3em; border-bottom: 1px solid var(--color-border); }
	.markdown-body :global(h2) { font-size: 1.25rem; font-weight: 600; margin: 1rem 0 0.5rem; padding-bottom: 0.3em; border-bottom: 1px solid var(--color-border); }
	.markdown-body :global(h3) { font-size: 1.1rem; font-weight: 600; margin: 0.75rem 0 0.5rem; }
	.markdown-body :global(p) { margin: 0.5rem 0; line-height: 1.6; }
	.markdown-body :global(code) {
		background: var(--color-border);
		padding: 0.15em 0.4em;
		border-radius: 4px;
		font-size: 0.85em;
	}
	.markdown-body :global(pre) {
		background: rgba(0,0,0,0.3);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 1rem;
		overflow-x: auto;
		margin: 0.75rem 0;
	}
	.markdown-body :global(pre code) {
		background: none;
		padding: 0;
	}
	.markdown-body :global(a) { color: var(--color-primary); }
	.markdown-body :global(a:hover) { text-decoration: underline; }
	.markdown-body :global(ul), .markdown-body :global(ol) { padding-left: 1.5rem; margin: 0.5rem 0; }
	.markdown-body :global(li) { margin: 0.25rem 0; }
	.markdown-body :global(blockquote) {
		border-left: 3px solid var(--color-border);
		padding-left: 1rem;
		margin: 0.5rem 0;
		opacity: 0.8;
	}
	.markdown-body :global(img) { max-width: 100%; border-radius: 8px; }
	.markdown-body :global(table) { border-collapse: collapse; width: 100%; margin: 0.75rem 0; }
	.markdown-body :global(th), .markdown-body :global(td) {
		border: 1px solid var(--color-border);
		padding: 0.5rem 0.75rem;
		text-align: left;
	}
	.markdown-body :global(th) { background: var(--color-surface); font-weight: 600; }
	.markdown-body :global(hr) { border: none; border-top: 1px solid var(--color-border); margin: 1rem 0; }
</style>
