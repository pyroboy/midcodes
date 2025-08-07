export interface NavigationPath {
	path: string;
	showInNav?: boolean;
	label?: string;
}

export interface NavigationState {
	homeUrl: string;
	showHeader: boolean;
	allowedPaths: NavigationPath[];
	showRoleEmulation: boolean;
}
