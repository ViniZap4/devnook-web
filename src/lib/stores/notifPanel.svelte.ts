let panelOpen = $state(false);

export const notifPanelStore = {
	get open() { return panelOpen; },
	toggle() { panelOpen = !panelOpen; },
	close() { panelOpen = false; },
};
