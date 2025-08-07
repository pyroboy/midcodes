export interface Emulation {
	organizationName: string | null;
	role: string | null;
	context: Record<string, any>;
	metadata?: Record<string, any>;
}
