export interface Repository {
	id: number;
	owner_id: number;
	owner: string;
	name: string;
	description: string;
	website: string;
	is_private: boolean;
	is_fork: boolean;
	forked_from_id?: number;
	default_branch: string;
	topics: string[];
	stars_count: number;
	forks_count: number;
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

export interface CommitDetail {
	hash: string;
	short_hash: string;
	message: string;
	author: string;
	email: string;
	date: string;
	diff: DiffFile[];
}

export interface DiffFile {
	from_file: string;
	to_file: string;
	hunks: DiffHunk[];
}

export interface DiffHunk {
	header: string;
	lines: string[];
}

export interface Branch {
	name: string;
	is_default: boolean;
	is_head: boolean;
}

export interface Tag {
	name: string;
	hash: string;
	message: string;
	date: string;
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

export interface BlameLine {
	hash: string;
	author: string;
	date: string;
	line_number: number;
	content: string;
}

export interface CompareResult {
	base: string;
	head: string;
	commits: Commit[];
	diff: DiffFile[];
}
