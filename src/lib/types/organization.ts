export interface Organization {
	id: number;
	name: string;
	display_name: string;
	description: string;
	avatar_url: string;
	location: string;
	website: string;
	created_at: string;
	updated_at: string;
}

export interface OrgMember {
	id: number;
	org_id: number;
	user_id: number;
	username: string;
	full_name: string;
	role: string;
	joined_at: string;
}
