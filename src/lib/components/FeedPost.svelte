<script lang="ts">
	import Avatar from './Avatar.svelte';
	import RelativeTime from './RelativeTime.svelte';
	import Spinner from './Spinner.svelte';
	import type { Post, PostComment } from '$lib/types/post';

	let {
		post,
		currentUsername = '',
		onlike,
		oncomment,
		ondeletecomment,
		onrepost,
		loadComments
	}: {
		post: Post;
		currentUsername?: string;
		onlike?: (post: Post) => void;
		oncomment?: (post: Post, content: string) => Promise<void>;
		ondeletecomment?: (post: Post, commentId: number) => void;
		onrepost?: (post: Post) => void;
		loadComments?: (postId: number) => Promise<PostComment[]>;
	} = $props();

	let commentsExpanded = $state(false);
	let comments = $state<PostComment[]>([]);
	let commentInput = $state('');
	let loadingComments = $state(false);
	let sendingComment = $state(false);
	let justLiked = $state(false);

	function renderContent(text: string): string {
		return text.replace(/#(\w+)/g, '<span class="feed-hashtag">#$1</span>');
	}

	async function toggleComments() {
		if (commentsExpanded) {
			commentsExpanded = false;
			return;
		}
		commentsExpanded = true;
		if (comments.length === 0 && loadComments) {
			loadingComments = true;
			try {
				comments = await loadComments(post.id);
			} catch { comments = []; }
			finally { loadingComments = false; }
		}
	}

	function handleLike() {
		if (!post.liked) {
			justLiked = true;
			setTimeout(() => { justLiked = false; }, 300);
		}
		onlike?.(post);
	}

	async function handleSubmitComment() {
		const content = commentInput.trim();
		if (!content || sendingComment) return;
		sendingComment = true;
		try {
			await oncomment?.(post, content);
			commentInput = '';
			if (loadComments) {
				comments = await loadComments(post.id);
			}
		} catch { /* ignore */ }
		finally { sendingComment = false; }
	}

	function handleDeleteComment(commentId: number) {
		ondeletecomment?.(post, commentId);
		comments = comments.filter(c => c.id !== commentId);
	}

	async function handleCopyCode() {
		try { await navigator.clipboard.writeText(post.content); } catch {}
	}
</script>

<article class="feed-post">
	<div class="post-body">
		<!-- Header -->
		<div class="flex items-start gap-3">
			<a href="/{post.author_username}" class="shrink-0">
				<Avatar username={post.author_username} size={44} />
			</a>
			<div class="flex-1 min-w-0">
				<div class="flex items-center gap-2">
					<a href="/{post.author_username}" class="text-[15px] font-semibold hover:underline" style="color: var(--color-text);">
						{post.author_full_name || post.author_username}
					</a>
					<span class="text-[14px]" style="color: var(--color-text-dim);">@{post.author_username}</span>
					<span class="text-[14px]" style="color: var(--color-text-dim); opacity: 0.4;">·</span>
					<span class="text-[14px]" style="color: var(--color-text-dim);"><RelativeTime date={post.created_at} /></span>
					<button class="post-menu-btn ml-auto" title="More options">
						<svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>
					</button>
				</div>

				<!-- Content -->
				{#if post.type === 'code'}
					<div class="code-block mt-3">
						<div class="code-header">
							<span class="font-mono text-[12px]" style="color: var(--color-text-dim);">snippet</span>
							<button class="code-copy-btn" onclick={handleCopyCode}>Copy</button>
						</div>
						<pre class="code-content">{post.content}</pre>
					</div>
				{:else}
					<p class="mt-2 text-[15px] leading-[1.6]" style="color: var(--color-text); opacity: 0.9;">
						{@html renderContent(post.content)}
					</p>
				{/if}

				<!-- Repo reference -->
				{#if post.repo_owner && post.repo_name}
					<a
						href="/{post.repo_owner}/{post.repo_name}"
						class="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-lg text-[13px] font-medium transition-colors"
						style="background: var(--color-primary-subtle); color: var(--color-primary);"
					>
						<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
						{post.repo_owner}/{post.repo_name}
					</a>
				{/if}

				<!-- Tags -->
				{#if post.tags && post.tags.length > 0}
					<div class="flex flex-wrap gap-2 mt-3">
						{#each post.tags as tag}
							<span class="tag-pill">#{tag}</span>
						{/each}
					</div>
				{/if}

				<!-- Actions -->
				<div class="post-actions">
					<div class="flex items-center gap-6">
						<!-- Like -->
						<button class="action-btn" class:action-like-active={post.liked} onclick={handleLike}>
							<svg class="w-[18px] h-[18px]" class:heart-pop={justLiked} fill={post.liked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
							{#if post.likes_count}<span>{post.likes_count}</span>{/if}
						</button>
						<!-- Comment -->
						<button class="action-btn" class:action-comment-active={commentsExpanded} onclick={toggleComments}>
							<svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
							{#if post.comments_count}<span>{post.comments_count}</span>{/if}
						</button>
						<!-- Repost -->
						<button class="action-btn" class:action-repost-active={post.reposted} onclick={() => onrepost?.(post)}>
							<svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 1l4 4-4 4" /><path stroke-linecap="round" stroke-linejoin="round" d="M3 11V9a4 4 0 014-4h14" /><path stroke-linecap="round" stroke-linejoin="round" d="M7 23l-4-4 4-4" /><path stroke-linecap="round" stroke-linejoin="round" d="M21 13v2a4 4 0 01-4 4H3" /></svg>
							{#if post.reposts_count}<span>{post.reposts_count}</span>{/if}
						</button>
					</div>
					<!-- Share -->
					<button class="share-btn" title="Share">
						<svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Comments section -->
	{#if commentsExpanded}
		<div class="comments-section">
			{#if loadingComments}
				<div class="py-4 flex justify-center">
					<Spinner size="xs" />
				</div>
			{:else}
				{#if comments.length > 0}
					<div class="flex flex-col gap-3 mb-3">
						{#each comments as comment}
							<div class="flex items-start gap-2.5">
								<a href="/{comment.author_username}" class="shrink-0">
									<Avatar username={comment.author_username} size={32} />
								</a>
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2">
										<a href="/{comment.author_username}" class="text-[13px] font-semibold hover:underline" style="color: var(--color-text);">{comment.author_full_name || comment.author_username}</a>
										<span class="text-[11px]" style="color: var(--color-text-dim);"><RelativeTime date={comment.created_at} /></span>
										{#if comment.author_username === currentUsername}
											<button
												class="ml-auto text-[11px] opacity-0 group-hover:opacity-100 transition-opacity"
												style="color: var(--color-error);"
												onclick={() => handleDeleteComment(comment.id)}
											>Delete</button>
										{/if}
									</div>
									<p class="text-[13px] mt-0.5 leading-relaxed" style="color: var(--color-text); opacity: 0.85;">{comment.content}</p>
								</div>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Comment input -->
				<div class="flex items-center gap-2.5">
					<Avatar username={currentUsername || '?'} size={32} />
					<input
						type="text"
						bind:value={commentInput}
						placeholder="Write a comment..."
						class="flex-1 px-3 py-2 text-[13px] rounded-lg border-none outline-none transition-colors"
						style="background: rgba(255, 255, 255, 0.06); color: var(--color-text);"
						onkeydown={(e) => { if (e.key === 'Enter') handleSubmitComment(); }}
					/>
					<button
						class="shrink-0 px-4 py-2 text-[13px] font-medium rounded-lg text-white disabled:opacity-30 transition-all"
						style="background: var(--color-primary);"
						disabled={!commentInput.trim() || sendingComment}
						onclick={handleSubmitComment}
					>{sendingComment ? '...' : 'Reply'}</button>
				</div>
			{/if}
		</div>
	{/if}
</article>

<style>
	.feed-post {
		border-radius: 16px;
		background: var(--glass-bg);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid var(--glass-border);
		transition: border-color 0.2s, background 0.15s;
		overflow: hidden;
	}
	.feed-post:hover {
		border-color: rgba(255, 255, 255, 0.12);
	}

	.post-body {
		padding: 16px 20px;
	}

	.post-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 12px;
	}

	.post-menu-btn {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
		color: var(--color-text-dim);
		opacity: 0;
		transition: opacity 0.15s, background 0.15s;
	}
	.feed-post:hover .post-menu-btn {
		opacity: 1;
	}
	.post-menu-btn:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	/* Code block */
	.code-block {
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.06);
		background: #0a0e17;
		overflow: hidden;
	}
	.code-header {
		padding: 8px 16px;
		background: rgba(255, 255, 255, 0.02);
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.code-copy-btn {
		font-size: 12px;
		color: var(--color-text-dim);
		transition: color 0.15s;
	}
	.code-copy-btn:hover {
		color: var(--color-primary);
	}
	.code-content {
		padding: 16px;
		font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
		font-size: 13px;
		line-height: 1.6;
		color: var(--color-text);
		opacity: 0.9;
		overflow-x: auto;
		white-space: pre;
		margin: 0;
	}

	/* Tags */
	.tag-pill {
		padding: 4px 12px;
		border-radius: 9999px;
		font-size: 12px;
		font-weight: 500;
		background: rgba(255, 255, 255, 0.05);
		color: var(--color-text-dim);
		transition: background 0.15s, color 0.15s;
		cursor: pointer;
	}
	.tag-pill:hover {
		background: rgba(6, 182, 212, 0.1);
		color: var(--color-primary);
	}

	/* Hashtags in content */
	:global(.feed-hashtag) {
		color: var(--color-primary);
		cursor: pointer;
	}
	:global(.feed-hashtag:hover) {
		text-decoration: underline;
	}

	/* Action buttons */
	.action-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		border-radius: 8px;
		font-size: 14px;
		color: #64748b;
		transition: color 0.15s, background 0.15s;
	}
	.action-btn:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	/* Like hover + active */
	.action-btn:nth-child(1):hover {
		color: #f43f5e;
	}
	.action-like-active {
		color: #f43f5e;
	}

	/* Comment hover + active */
	.action-btn:nth-child(2):hover {
		color: var(--color-primary);
	}
	.action-comment-active {
		color: var(--color-primary);
	}

	/* Repost hover + active */
	.action-btn:nth-child(3):hover {
		color: #22c55e;
	}
	.action-repost-active {
		color: var(--color-success);
	}

	/* Heart pop animation */
	.heart-pop {
		animation: heartPop 300ms ease;
	}
	@keyframes heartPop {
		0% { transform: scale(1); }
		50% { transform: scale(1.3); }
		100% { transform: scale(1); }
	}

	/* Share button */
	.share-btn {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
		color: #64748b;
		transition: background 0.15s, color 0.15s;
	}
	.share-btn:hover {
		background: rgba(255, 255, 255, 0.05);
		color: var(--color-primary);
	}

	/* Comments section */
	.comments-section {
		padding: 12px 16px 16px;
		border-top: 1px solid var(--glass-border);
	}
</style>
