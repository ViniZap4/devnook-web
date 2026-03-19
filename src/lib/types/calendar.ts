export interface CalendarEvent {
	id: number;
	user_id: number;
	title: string;
	description: string;
	type: 'event' | 'meeting' | 'deadline' | 'reminder';
	start_time: string;
	end_time?: string;
	all_day: boolean;
	color: string;
	recurrence: '' | 'daily' | 'weekly' | 'monthly' | 'yearly';
	project_id?: number;
	sprint_id?: number;
	milestone_id?: number;
	issue_id?: number;
	conversation_id?: number;
	attendees: EventAttendee[];
	created_at: string;
	updated_at: string;
}

export interface EventAttendee {
	user_id: number;
	username: string;
	full_name: string;
	avatar_url: string;
	status: 'pending' | 'accepted' | 'declined' | 'tentative';
}

export interface CalendarEntry {
	id: number;
	title: string;
	start_time: string;
	end_time?: string;
	all_day: boolean;
	color: string;
	source: 'event' | 'milestone' | 'sprint' | 'issue';
	link: string;
	project_slug?: string;
	repo_owner?: string;
	repo_name?: string;
}
