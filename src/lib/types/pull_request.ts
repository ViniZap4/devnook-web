export interface PullRequest {
	id: number;
	repo_id: number;
	number: number;
	author_id: number;
	author: string;
	title: string;
	body: string;
	state: 'open' | 'closed' | 'merged';
	head_branch: string;
	base_branch: string;
	merged_at?: string;
	created_at: string;
	updated_at: string;
}

export interface PRComment {
	id: number;
	pr_id: number;
	author_id: number;
	author: string;
	body: string;
	path?: string;
	line?: number;
	created_at: string;
	updated_at: string;
}

export interface PRReview {
	id: number;
	pr_id: number;
	author_id: number;
	author: string;
	state: 'approved' | 'changes_requested' | 'comment';
	body: string;
	created_at: string;
}
