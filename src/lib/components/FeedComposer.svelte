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

<div class="feed-composer">
	<div class="flex gap-3 p-4">
		<div class="shrink-0 pt-0.5">
			<Avatar {username} size={44} />
		</div>
		<div class="flex-1 min-w-0 flex flex-col">
			<div class="composer-input-wrapper">
				<textarea
					bind:value={content}
					placeholder={postType === 'code' ? 'Paste your code snippet...' : "What's your latest commit? Share a snippet..."}
					class="w-full bg-transparent resize-none text-[15px] leading-relaxed outline-none {postType === 'code' ? 'font-mono text-[13px]' : ''}"
					style="color: var(--color-text); min-height: 72px;"
					rows="3"
					onfocus={() => { expanded = true; }}
				></textarea>

				{#if repoRef || postType === 'code'}
					<div class="flex items-center gap-2 mt-2">
						{#if postType === 'code'}
							<span class="text-[11px] px-2 py-0.5 rounded font-mono" style="background: rgba(255,255,255,0.05); color: var(--color-text-dim);">code</span>
						{/if}
						{#if repoRef}
							<span class="text-[11px] px-2 py-0.5 rounded" style="background: var(--color-primary-subtle); color: var(--color-primary);">{repoRef}</span>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Toolbar - always visible -->
			<div class="composer-toolbar">
				<div class="flex items-center gap-1">
					<!-- Code toggle -->
					<button
						class="toolbar-btn"
						class:toolbar-btn-active={postType === 'code'}
						onclick={() => { postType = postType === 'code' ? 'text' : 'code'; }}
						title="Code snippet"
					>
						<svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
					</button>
					<!-- Image -->
					<button class="toolbar-btn" title="Add image">
						<svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
					</button>
					<!-- Link -->
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
					<!-- Hashtag -->
					<button class="toolbar-btn" title="Add hashtag">
						<svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
					</button>
				</div>

				<button
					class="post-btn"
					disabled={!content.trim()}
					onclick={handleSubmit}
				>Post Update</button>
			</div>
		</div>
	</div>
</div>

<style>
	.feed-composer {
		border-radius: 16px;
		background: var(--glass-bg);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid var(--glass-border);
	}
	.composer-input-wrapper {
		background: #0f1629;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 12px;
		padding: 12px 16px;
		transition: border-color 0.15s;
	}
	.composer-input-wrapper:focus-within {
		border-color: rgba(255, 255, 255, 0.15);
	}
	.composer-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 12px;
		margin-top: 8px;
	}
	.toolbar-btn {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
		color: #64748b;
		transition: color 0.15s, background 0.15s;
	}
	.toolbar-btn:hover {
		color: var(--color-primary);
		background: rgba(255, 255, 255, 0.05);
	}
	.toolbar-btn-active {
		color: var(--color-primary);
		background: rgba(255, 255, 255, 0.05);
	}
	.post-btn {
		padding: 10px 24px;
		border-radius: 20px;
		background: var(--color-primary);
		color: white;
		font-size: 14px;
		font-weight: 600;
		box-shadow: 0 4px 14px rgba(6, 182, 212, 0.35);
		transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
	}
	.post-btn:hover:not(:disabled) {
		background: #22d3ee;
	}
	.post-btn:active:not(:disabled) {
		background: #0891b2;
		transform: scale(0.98);
	}
	.post-btn:disabled {
		background: #1e293b;
		color: #475569;
		box-shadow: none;
		cursor: not-allowed;
	}
</style>
