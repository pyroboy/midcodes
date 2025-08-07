export interface FloorData {
	income: number;
	note: string;
	tenantCount?: number;
	collected: number; // Amount actually collected
	collectible: number; // Amount still to be collected
	lastCollectionDate?: string; // Date of the last collection for this floor
	floorNumber: number; // Add floor number for display purposes
	floorId: string; // Add floor ID for reference
}

export interface FloorDataMap {
	[key: string]: FloorData; // Dynamic mapping of floor IDs to FloorData
}

export interface Expense {
	id: number;
	amount: number;
	description: string;
	type: string;
	status: string;
	created_at: string;
}

export interface MonthData {
	floorData: FloorDataMap;
	expenses: Expense[];
	profitSharing: {
		forty: number;
		sixty: number;
	};
	totals: {
		grossIncome: number;
		totalExpenses: number;
		netIncome: number;
		collectibles: number; // Total unpaid rent/fees for the month
		collected: number; // Total amount collected
		lastCollectionDate?: string; // Date of the last collection overall
	};
}

export interface Property {
	id: number;
	name: string;
}

export type Month =
	| 'january'
	| 'february'
	| 'march'
	| 'april'
	| 'may'
	| 'june'
	| 'july'
	| 'august'
	| 'september'
	| 'october'
	| 'november'
	| 'december';

export interface ProfitSharingCalculation {
	fortyShare: number;
	sixtyShare: number;
}
