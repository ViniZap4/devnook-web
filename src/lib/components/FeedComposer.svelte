<script lang="ts">
	import Avatar from './Avatar.svelte';

	let {
		username = '',
		onsubmit
	}: {
		username: string;
		onsubmit?: (data: { content: string; type: 'text' | 'code'; repoRef: string }) => void;
	} = $props();

	let content = $state('');
	let postType = $state<'text' | 'code'>('text');
	let repoRef = $state('');
	let expanded = $state(false);

	function handleSubmit() {
		if (!content.trim()) return;
		onsubmit?.({ content, type: postType, repoRef });
		content = '';
		repoRef = '';
		expanded = false;
		postType = 'text';
	}
</script>

<div class="card p-4">
	<div class="flex gap-3">
		<div class="shrink-0 pt-1">
			<Avatar {username} size={40} />
		</div>
		<div class="flex-1 min-w-0">
			<textarea
				bind:value={content}
				placeholder={postType === 'code' ? 'Paste your code snippet...' : "What's your latest commit? Share a snippet..."}
				class="composer-textarea {postType === 'code' ? 'font-mono text-[13px]' : 'text-[15px]'}"
				rows="2"
				onfocus={() => { expanded = true; }}
			></textarea>

			{#if repoRef || postType === 'code'}
				<div class="flex items-center gap-2 mt-1.5">
					{#if postType === 'code'}
						<span class="tag-pill font-mono">code</span>
					{/if}
					{#if repoRef}
						<span class="tag-pill tag-pill-primary">{repoRef}</span>
					{/if}
				</div>
			{/if}

			<div class="flex items-center justify-between mt-3 pt-3" style="border-top: 1px solid var(--glass-border);">
				<div class="flex items-center gap-0.5">
					<button
						class="toolbar-btn"
						class:toolbar-btn-active={postType === 'code'}
						onclick={() => { postType = postType === 'code' ? 'text' : 'code'; }}
						title="Code snippet"
					>
						<svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
					</button>
					<button class="toolbar-btn" title="Add image">
						<svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
					</button>
					<button
						class="toolbar-btn"
						title="Link repository"
						onclick={() => {
							const ref = prompt('Enter repo (owner/name):');
							if (ref) repoRef = ref;
						}}
					>
						<svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path stroke-linecap="round" stroke-linejoin="round" d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
					</button>
					<button class="toolbar-btn" title="Add hashtag">
						<svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
					</button>
				</div>

				<button
					class="post-btn"
					disabled={!content.trim()}
					onclick={handleSubmit}
				>Post</button>
			</div>
		</div>
	</div>
</div>

<style>
	.composer-textarea {
		width: 100%;
		background: transparent;
		resize: none;
		outline: none;
		line-height: 1.6;
		color: var(--color-text);
		min-height: 52px;
	}
	.composer-textarea::placeholder {
		color: var(--color-text-dim);
		opacity: 0.5;
	}
	.tag-pill {
		font-size: 11px;
		padding: 2px 8px;
		border-radius: 6px;
		background: var(--glass-border);
		color: var(--color-text-dim);
	}
	.tag-pill-primary {
		background: var(--color-primary-subtle);
		color: var(--color-primary);
	}
	.toolbar-btn {
		width: 34px;
		height: 34px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
		color: var(--color-text-dim);
		transition: color 0.15s, background 0.15s;
	}
	.toolbar-btn:hover {
		color: var(--color-primary);
		background: var(--color-primary-subtle);
	}
	.toolbar-btn-active {
		color: var(--color-primary);
		background: var(--color-primary-subtle);
	}
	.post-btn {
		padding: 8px 20px;
		border-radius: 10px;
		background: var(--color-primary);
		color: white;
		font-size: 13px;
		font-weight: 600;
		transition: opacity 0.15s, transform 0.1s;
	}
	.post-btn:hover:not(:disabled) {
		opacity: 0.9;
	}
	.post-btn:active:not(:disabled) {
		transform: scale(0.97);
	}
	.post-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
</style>
