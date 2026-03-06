export interface Post {
	id: number;
	author_id: number;
	author_username: string;
	author_full_name: string;
	author_avatar_url: string;
	content: string;
	type: 'text' | 'code' | 'image' | 'link' | 'repo_share' | 'commit_share' | 'issue_share';
	repo_owner?: string;
	repo_name?: string;
	commit_hash?: string;
	issue_number?: number;
	org_name?: string;
	likes_count: number;
	comments_count: number;
	reposts_count: number;
	liked: boolean;
	reposted: boolean;
	tags: string[];
	created_at: string;
	updated_at: string;
}

export interface PostComment {
	id: number;
	post_id: number;
	author_id: number;
	author_username: string;
	author_full_name: string;
	content: string;
	likes_count: number;
	liked: boolean;
	created_at: string;
}
