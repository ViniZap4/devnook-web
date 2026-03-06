export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
	id: number;
	message: string;
	type: ToastType;
}

let items = $state<ToastItem[]>([]);
let nextId = 0;

export const toastStore = {
	get items() {
		return items;
	},

	show(message: string, type: ToastType = 'info', duration = 4000) {
		const id = nextId++;
		items = [...items, { id, message, type }];
		setTimeout(() => {
			this.dismiss(id);
		}, duration);
	},

	success(message: string) {
		this.show(message, 'success');
	},

	error(message: string) {
		this.show(message, 'error', 6000);
	},

	warning(message: string) {
		this.show(message, 'warning');
	},

	info(message: string) {
		this.show(message, 'info');
	},

	dismiss(id: number) {
		items = items.filter((t) => t.id !== id);
	},
};
