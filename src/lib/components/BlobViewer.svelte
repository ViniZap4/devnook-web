<script lang="ts">
	import type { BlobContent } from '$lib/types/repository';
	import { userStore } from '$lib/stores/user.svelte';
	import { repos } from '$lib/services/api';
	import { goto } from '$app/navigation';
	import { copyTextToClipboard } from '$lib/util/copyTextToClipboard';
	import Breadcrumb from './Breadcrumb.svelte';
	import { page } from '$app/stores';
	import hljs from 'highlight.js/lib/core';

	// Register common languages on demand
	import javascript from 'highlight.js/lib/languages/javascript';
	import typescript from 'highlight.js/lib/languages/typescript';
	import python from 'highlight.js/lib/languages/python';
	import go from 'highlight.js/lib/languages/go';
	import rust from 'highlight.js/lib/languages/rust';
	import css from 'highlight.js/lib/languages/css';
	import xml from 'highlight.js/lib/languages/xml';
	import json from 'highlight.js/lib/languages/json';
	import yaml from 'highlight.js/lib/languages/yaml';
	import bash from 'highlight.js/lib/languages/bash';
	import sql from 'highlight.js/lib/languages/sql';
	import ruby from 'highlight.js/lib/languages/ruby';
	import java from 'highlight.js/lib/languages/java';
	import kotlin from 'highlight.js/lib/languages/kotlin';
	import swift from 'highlight.js/lib/languages/swift';
	import csharp from 'highlight.js/lib/languages/csharp';
	import cpp from 'highlight.js/lib/languages/cpp';
	import c from 'highlight.js/lib/languages/c';
	import php from 'highlight.js/lib/languages/php';
	import lua from 'highlight.js/lib/languages/lua';
	import markdown from 'highlight.js/lib/languages/markdown';
	import dockerfile from 'highlight.js/lib/languages/dockerfile';
	import scss from 'highlight.js/lib/languages/scss';
	import dart from 'highlight.js/lib/languages/dart';
	import ini from 'highlight.js/lib/languages/ini';

	hljs.registerLanguage('javascript', javascript);
	hljs.registerLanguage('typescript', typescript);
	hljs.registerLanguage('python', python);
	hljs.registerLanguage('go', go);
	hljs.registerLanguage('rust', rust);
	hljs.registerLanguage('css', css);
	hljs.registerLanguage('xml', xml);
	hljs.registerLanguage('html', xml);
	hljs.registerLanguage('json', json);
	hljs.registerLanguage('yaml', yaml);
	hljs.registerLanguage('bash', bash);
	hljs.registerLanguage('shell', bash);
	hljs.registerLanguage('sql', sql);
	hljs.registerLanguage('ruby', ruby);
	hljs.registerLanguage('java', java);
	hljs.registerLanguage('kotlin', kotlin);
	hljs.registerLanguage('swift', swift);
	hljs.registerLanguage('csharp', csharp);
	hljs.registerLanguage('cpp', cpp);
	hljs.registerLanguage('c', c);
	hljs.registerLanguage('php', php);
	hljs.registerLanguage('lua', lua);
	hljs.registerLanguage('markdown', markdown);
	hljs.registerLanguage('dockerfile', dockerfile);
	hljs.registerLanguage('scss', scss);
	hljs.registerLanguage('dart', dart);
	hljs.registerLanguage('ini', ini);
	hljs.registerLanguage('toml', ini);
	hljs.registerLanguage('env', ini);

	let { blob, owner, repo, ref }: {
		blob: BlobContent;
		owner: string;
		repo: string;
		ref: string;
	} = $props();

	const lines = $derived(blob.content ? blob.content.split('\n') : []);
	const isOwner = $derived(userStore.user?.username === owner);
	let deleting = $state(false);
	let copied = $state(false);
	let selectedLine = $state<number | null>(null);

	const extensionLanguageMap: Record<string, string> = {
		'.ts': 'TypeScript',
		'.tsx': 'TypeScript',
		'.js': 'JavaScript',
		'.jsx': 'JavaScript',
		'.svelte': 'Svelte',
		'.go': 'Go',
		'.py': 'Python',
		'.rs': 'Rust',
		'.md': 'Markdown',
		'.json': 'JSON',
		'.css': 'CSS',
		'.html': 'HTML',
		'.yml': 'YAML',
		'.yaml': 'YAML',
		'.toml': 'TOML',
		'.sh': 'Shell',
		'.bash': 'Shell',
		'.zsh': 'Shell',
		'.sql': 'SQL',
		'.rb': 'Ruby',
		'.java': 'Java',
		'.kt': 'Kotlin',
		'.swift': 'Swift',
		'.c': 'C',
		'.cpp': 'C++',
		'.h': 'C',
		'.hpp': 'C++',
		'.cs': 'C#',
		'.php': 'PHP',
		'.lua': 'Lua',
		'.zig': 'Zig',
		'.ex': 'Elixir',
		'.exs': 'Elixir',
		'.erl': 'Erlang',
		'.hs': 'Haskell',
		'.vim': 'Vim',
		'.dockerfile': 'Dockerfile',
		'.xml': 'XML',
		'.svg': 'SVG',
		'.scss': 'SCSS',
		'.sass': 'Sass',
		'.less': 'Less',
		'.graphql': 'GraphQL',
		'.gql': 'GraphQL',
		'.proto': 'Protobuf',
		'.r': 'R',
		'.dart': 'Dart',
		'.vue': 'Vue',
	};

	function getLanguage(filename: string): string | null {
		const lower = filename.toLowerCase();

		// Handle special filenames
		if (lower === 'dockerfile') return 'Dockerfile';
		if (lower === 'makefile') return 'Makefile';
		if (lower === '.gitignore') return 'Git';
		if (lower === '.env' || lower.startsWith('.env.')) return 'Env';

		const dotIndex = lower.lastIndexOf('.');
		if (dotIndex === -1) return null;

		const ext = lower.slice(dotIndex);
		return extensionLanguageMap[ext] ?? null;
	}

	const language = $derived(getLanguage(blob.name));

	// Map display names to hljs language IDs
	const hljsLangMap: Record<string, string> = {
		'TypeScript': 'typescript', 'JavaScript': 'javascript', 'Python': 'python',
		'Go': 'go', 'Rust': 'rust', 'CSS': 'css', 'HTML': 'html', 'JSON': 'json',
		'YAML': 'yaml', 'Shell': 'shell', 'SQL': 'sql', 'Ruby': 'ruby', 'Java': 'java',
		'Kotlin': 'kotlin', 'Swift': 'swift', 'C#': 'csharp', 'C++': 'cpp', 'C': 'c',
		'PHP': 'php', 'Lua': 'lua', 'Markdown': 'markdown', 'Dockerfile': 'dockerfile',
		'SCSS': 'scss', 'Dart': 'dart', 'TOML': 'toml', 'Env': 'env', 'Makefile': 'bash',
		'Svelte': 'xml', 'Vue': 'xml', 'XML': 'xml', 'SVG': 'xml', 'Git': 'ini',
	};

	const highlightedLines = $derived.by(() => {
		if (!blob.content || blob.binary) return [];
		const lang = language ? hljsLangMap[language] : null;
		try {
			const result = lang && hljs.getLanguage(lang)
				? hljs.highlight(blob.content, { language: lang })
				: hljs.highlightAuto(blob.content);
			return result.value.split('\n');
		} catch {
			return blob.content.split('\n').map(l => l.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
		}
	});

	// Parse initial line from URL hash
	$effect(() => {
		const hash = $page.url.hash;
		if (hash.startsWith('#L')) {
			const n = parseInt(hash.slice(2));
			if (!isNaN(n) && n > 0) selectedLine = n;
		}
	});

	function formatSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	async function handleCopy() {
		await copyTextToClipboard(blob.content);
		copied = true;
		setTimeout(() => { copied = false; }, 2000);
	}

	function handleLineClick(lineNum: number) {
		selectedLine = selectedLine === lineNum ? null : lineNum;
		const hash = selectedLine ? `#L${selectedLine}` : '';
		history.replaceState(null, '', `${$page.url.pathname}${hash}`);
	}

	async function handleDelete() {
		if (!confirm(`Delete ${blob.name}?`)) return;
		deleting = true;
		try {
			await repos.deleteFile(owner, repo, blob.path, { branch: ref });
			const dir = blob.path.split('/').slice(0, -1).join('/');
			goto(`/${owner}/${repo}/tree/${ref}/${dir}`);
		} catch {
			deleting = false;
		}
	}
</script>

<div class="flex flex-col gap-3">
	<Breadcrumb {owner} {repo} path={blob.path} {ref} />

	<div class="card overflow-hidden">
		<div class="flex items-center justify-between flex-wrap gap-2 px-4 py-2 border-b" style="border-color: var(--glass-border); background: color-mix(in srgb, var(--color-text) 3%, transparent);">
			<div class="flex items-center gap-2">
				{#if language}
					<span
						class="text-[10px] px-2 py-0.5 rounded-full font-medium"
						style="background: var(--color-primary-subtle); color: var(--color-primary);"
					>{language}</span>
				{/if}
				<span class="text-xs opacity-50" style="color: var(--color-text-dim);">
					{lines.length} lines · {formatSize(blob.size)}
				</span>
			</div>
			<div class="flex items-center gap-3 flex-wrap">
				{#if !blob.binary}
					<button
						class="text-xs font-medium hover:underline transition-colors"
						style="color: {copied ? 'var(--color-success)' : 'var(--color-text-dim)'};"
						onclick={handleCopy}
					>{copied ? 'Copied!' : 'Copy'}</button>
					<button
						class="text-xs font-medium hover:underline"
						style="color: var(--color-text-dim);"
						onclick={() => {
							const b = new Blob([blob.content], { type: 'text/plain' });
							const url = URL.createObjectURL(b);
							const a = document.createElement('a');
							a.href = url; a.download = blob.name; a.click();
							URL.revokeObjectURL(url);
						}}
					>Raw</button>
					<a
						href="/{owner}/{repo}/blame/{ref}/{blob.path}"
						class="text-xs font-medium hover:underline"
						style="color: var(--color-primary);"
					>Blame</a>
				{/if}
				{#if isOwner && !blob.binary}
					<a
						href="/{owner}/{repo}/_edit/{ref}/{blob.path}"
						class="flex items-center gap-1 text-xs font-medium hover:underline"
						style="color: var(--color-primary);"
					>
						<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
						Edit
					</a>
				{/if}
				{#if isOwner}
					<button
						onclick={handleDelete}
						disabled={deleting}
						class="flex items-center gap-1 text-xs font-medium hover:underline disabled:opacity-40"
						style="color: var(--color-error);"
					>
						<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
						{deleting ? 'Deleting...' : 'Delete'}
					</button>
				{/if}
			</div>
		</div>

		{#if blob.binary}
			<div class="p-8 text-center opacity-50" style="color: var(--color-text-dim);">
				Binary file not shown.
			</div>
		{:else}
			<div class="overflow-x-auto blob-code-wrap">
				<table class="w-full text-xs font-mono" style="color: var(--color-text);">
					<tbody>
						{#each highlightedLines as line, i}
							{@const lineNum = i + 1}
							<tr
								class="blob-line"
								style="{selectedLine === lineNum ? `background: var(--color-primary-subtle); border-left: 3px solid var(--color-primary);` : 'border-left: 3px solid transparent;'}"
							>
								<td
									class="px-3 py-0.5 text-right select-none whitespace-nowrap cursor-pointer"
									style="color: {selectedLine === lineNum ? 'var(--color-primary)' : 'var(--color-text)'}; opacity: {selectedLine === lineNum ? 0.8 : 0.25}; min-width: 3.5rem; width: 3.5rem; border-right: 1px solid var(--glass-border);"
									id="L{lineNum}"
									onclick={() => handleLineClick(lineNum)}
								>
									{lineNum}
								</td>
								<td class="px-4 py-0.5 whitespace-pre">{@html line || ' '}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<style>
	/* Theme-aware code background */
	:global(.blob-code-wrap) {
		background: color-mix(in srgb, var(--color-background) 90%, var(--color-surface));
	}
	:global(.blob-line) {
		transition: background 0.1s;
	}
	:global(.blob-line:hover) {
		background: color-mix(in srgb, var(--color-text) 4%, transparent) !important;
	}

	/* Highlight.js theme using CSS custom properties */
	:global(.blob-code-wrap .hljs-keyword),
	:global(.blob-code-wrap .hljs-selector-tag),
	:global(.blob-code-wrap .hljs-built_in) { color: var(--color-primary); }

	:global(.blob-code-wrap .hljs-string),
	:global(.blob-code-wrap .hljs-addition) { color: var(--color-success); }

	:global(.blob-code-wrap .hljs-number),
	:global(.blob-code-wrap .hljs-literal) { color: var(--color-warning); }

	:global(.blob-code-wrap .hljs-comment),
	:global(.blob-code-wrap .hljs-quote) { color: var(--color-text-dim); opacity: 0.6; font-style: italic; }

	:global(.blob-code-wrap .hljs-type),
	:global(.blob-code-wrap .hljs-class .hljs-title),
	:global(.blob-code-wrap .hljs-title) { color: var(--color-accent); }

	:global(.blob-code-wrap .hljs-function),
	:global(.blob-code-wrap .hljs-title.function_) { color: var(--color-accent); }

	:global(.blob-code-wrap .hljs-attr),
	:global(.blob-code-wrap .hljs-attribute) { color: var(--color-secondary); }

	:global(.blob-code-wrap .hljs-variable),
	:global(.blob-code-wrap .hljs-template-variable) { color: var(--color-error); }

	:global(.blob-code-wrap .hljs-deletion) { color: var(--color-error); }

	:global(.blob-code-wrap .hljs-tag) { color: var(--color-primary); }

	:global(.blob-code-wrap .hljs-name) { color: var(--color-error); }

	:global(.blob-code-wrap .hljs-regexp),
	:global(.blob-code-wrap .hljs-link) { color: var(--color-info); }

	:global(.blob-code-wrap .hljs-meta),
	:global(.blob-code-wrap .hljs-meta .hljs-keyword) { color: var(--color-secondary); font-weight: 600; }

	:global(.blob-code-wrap .hljs-params) { color: var(--color-text); opacity: 0.8; }

	:global(.blob-code-wrap .hljs-punctuation) { color: var(--color-text-dim); }

	:global(.blob-code-wrap .hljs-symbol) { color: var(--color-accent); }

	:global(.blob-code-wrap .hljs-selector-id),
	:global(.blob-code-wrap .hljs-selector-class) { color: var(--color-accent); }

	:global(.blob-code-wrap .hljs-property) { color: var(--color-secondary); }
</style>
