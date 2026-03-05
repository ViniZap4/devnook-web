export interface Repository {
	id: number;
	owner_id: number;
	owner: string;
	name: string;
	description: string;
	is_private: boolean;
	default_branch: string;
	org_id?: number;
	created_at: string;
	updated_at: string;
}

export interface TreeEntry {
	name: string;
	path: string;
	type: 'blob' | 'tree';
	mode: string;
	size?: number;
}

export interface Commit {
	hash: string;
	short_hash: string;
	message: string;
	author: string;
	email: string;
	date: string;
}

export interface Branch {
	name: string;
	is_default: boolean;
	is_head: boolean;
}

export interface BlobContent {
	name: string;
	path: string;
	size: number;
	content: string;
	binary: boolean;
}

export interface ReadmeContent {
	name: string;
	content: string;
}
