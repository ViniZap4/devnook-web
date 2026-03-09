export interface Notification {
	id: number;
	user_id: number;
	type: string;
	title: string;
	body?: string;
	link: string;
	read: boolean;
	created_at: string;
}

export interface UnreadCount {
	count: number;
}
