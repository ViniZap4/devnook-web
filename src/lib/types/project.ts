import type { Label } from './issue';

export interface Project {
	id: number;
	owner_id: number;
	owner_name: string;
	org_id?: number;
	org_name?: string;
	name: string;
	slug: string;
	description: string;
	methodology: 'kanban' | 'scrum' | 'scrumban' | 'xp' | 'waterfall' | 'custom';
	visibility: 'private' | 'members' | 'public';
	default_view: 'board' | 'list' | 'timeline';
	color: string;
	icon: string;
	member_count: number;
	item_count: number;
	created_at: string;
	updated_at: string;
}

export interface ProjectMember {
	id: number;
	user_id: number;
	username: string;
	full_name: string;
	avatar_url: string;
	role: 'owner' | 'admin' | 'member' | 'viewer';
	joined_at: string;
}

export interface ProjectColumn {
	id: number;
	project_id: number;
	name: string;
	color: string;
	position: number;
	wip_limit: number;
	is_done: boolean;
	item_count: number;
	created_at: string;
}

export interface ProjectSwimlane {
	id: number;
	project_id: number;
	name: string;
	position: number;
	created_at: string;
}

export interface ProjectSprint {
	id: number;
	project_id: number;
	name: string;
	goal: string;
	number: number;
	start_date?: string;
	end_date?: string;
	state: 'planning' | 'active' | 'completed' | 'cancelled';
	velocity: number;
	total_items: number;
	done_items: number;
	total_points: number;
	done_points: number;
	created_at: string;
	updated_at: string;
}

export interface ProjectItem {
	id: number;
	project_id: number;
	column_id: number;
	column_name: string;
	swimlane_id?: number;
	sprint_id?: number;
	issue_id?: number;
	pr_id?: number;
	title: string;
	body: string;
	type: 'task' | 'bug' | 'feature' | 'story' | 'epic';
	priority: 'critical' | 'high' | 'medium' | 'low' | 'none';
	story_points: number;
	assignee_id?: number;
	assignee?: string;
	position: number;
	due_date?: string;
	started_at?: string;
	completed_at?: string;
	labels: Label[];
	issue_number?: number;
	issue_state?: string;
	created_at: string;
	updated_at: string;
}

export interface BoardData {
	project: Project;
	columns: BoardColumn[];
	swimlanes: ProjectSwimlane[];
	active_sprint?: ProjectSprint;
}

export interface BoardColumn extends ProjectColumn {
	items: ProjectItem[];
}

export interface ProjectItemHistory {
	id: number;
	item_id: number;
	user_id: number;
	username: string;
	field: string;
	old_value: string;
	new_value: string;
	created_at: string;
}
