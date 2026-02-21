/**
 * Dorm-Docs Report Data Types
 * Based on the dorm app database schema
 */

// ============================================
// ENUMS (matching dorm database schema)
// ============================================

export type UtilityType = 'ELECTRICITY' | 'WATER' | 'INTERNET';
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'PENALIZED';
export type PaymentMethod = 'CASH' | 'BANK' | 'GCASH' | 'OTHER' | 'SECURITY_DEPOSIT';
export type LeaseStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'TERMINATED' | 'PENDING' | 'ARCHIVED';
export type TenantStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'BLACKLISTED';
export type BillingType = 'RENT' | 'UTILITY' | 'PENALTY' | 'MAINTENANCE' | 'SERVICE' | 'SECURITY_DEPOSIT';
export type LocationStatus = 'VACANT' | 'OCCUPIED' | 'RESERVED';
export type ProjectStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';

// ============================================
// ELECTRICITY REPORT
// ============================================

export interface MeterReading {
	id: number;
	meter_id: number;
	meter_name: string;
	reading: number;
	previous_reading: number | null;
	reading_date: string;
	consumption: number;
	rate_at_reading: number;
	cost: number;
}

export interface ElectricityMeter {
	id: number;
	name: string;
	location_type: 'PROPERTY' | 'FLOOR' | 'RENTAL_UNIT';
	property_id: number;
	floor_id: number | null;
	rental_unit_id: number | null;
	initial_reading: number;
	status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}

export interface ElectricityReportData {
	report_period: string;
	generated_at: string;
	meters: ElectricityMeter[];
	readings: MeterReading[];
	summary: {
		total_consumption_kwh: number;
		total_cost: number;
		average_rate: number;
		meters_active: number;
		meters_inactive: number;
	};
}

// ============================================
// WATER REPORT
// ============================================

export interface WaterMeter {
	id: number;
	name: string;
	location_type: 'PROPERTY' | 'FLOOR' | 'RENTAL_UNIT';
	property_id: number;
	floor_id: number | null;
	rental_unit_id: number | null;
	initial_reading: number;
	status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}

export interface WaterReading {
	id: number;
	meter_id: number;
	meter_name: string;
	reading: number;
	previous_reading: number | null;
	reading_date: string;
	consumption: number;
	rate_at_reading: number;
	cost: number;
}

export interface WaterReportData {
	report_period: string;
	generated_at: string;
	meters: WaterMeter[];
	readings: WaterReading[];
	summary: {
		total_consumption_cubic_meters: number;
		total_cost: number;
		average_rate: number;
		meters_active: number;
	};
}

// ============================================
// POPULATION REPORT
// ============================================

export interface TenantSummary {
	id: number;
	name: string;
	contact_number: string | null;
	email: string | null;
	status: TenantStatus;
	rental_unit_name: string | null;
	floor_number: number | null;
	move_in_date: string | null;
}

export interface PopulationByStatus {
	status: TenantStatus;
	count: number;
	percentage: number;
}

export interface OccupancyByFloor {
	floor_id: number;
	floor_number: number;
	total_capacity: number;
	occupied: number;
	occupancy_rate: number;
}

export interface PopulationReportData {
	report_date: string;
	generated_at: string;
	tenants: TenantSummary[];
	population_by_status: PopulationByStatus[];
	occupancy_by_floor: OccupancyByFloor[];
	summary: {
		total_tenants: number;
		active_tenants: number;
		pending_tenants: number;
		total_capacity: number;
		overall_occupancy_rate: number;
	};
	trends: {
		move_ins_this_month: number;
		move_outs_this_month: number;
		net_change: number;
	};
}

// ============================================
// CONTRACTS REPORT
// ============================================

export interface ContractSummary {
	lease_id: number;
	lease_name: string;
	rental_unit_name: string;
	tenant_names: string[];
	start_date: string;
	end_date: string;
	rent_amount: number;
	security_deposit: number;
	status: LeaseStatus;
	terms_month: number | null;
	days_until_expiry: number | null;
}

export interface ContractsByStatus {
	status: LeaseStatus;
	count: number;
	total_rent_value: number;
}

export interface ContractsReportData {
	report_date: string;
	generated_at: string;
	contracts: ContractSummary[];
	contracts_by_status: ContractsByStatus[];
	summary: {
		total_contracts: number;
		active_contracts: number;
		expiring_within_30_days: number;
		expiring_within_60_days: number;
		total_monthly_rent: number;
		total_security_deposits: number;
	};
	renewals_due: ContractSummary[];
}

// ============================================
// REVENUE REPORT
// ============================================

export interface PaymentRecord {
	id: number;
	amount: number;
	method: PaymentMethod;
	reference_number: string | null;
	paid_by: string;
	paid_at: string;
	notes: string | null;
	billing_type: BillingType;
}

export interface RevenueByType {
	type: BillingType;
	total_billed: number;
	total_collected: number;
	outstanding: number;
	collection_rate: number;
}

export interface RevenueByMethod {
	method: PaymentMethod;
	total_amount: number;
	transaction_count: number;
	percentage: number;
}

export interface RevenueReportData {
	report_period: string;
	generated_at: string;
	payments: PaymentRecord[];
	revenue_by_type: RevenueByType[];
	revenue_by_method: RevenueByMethod[];
	summary: {
		total_billed: number;
		total_collected: number;
		total_outstanding: number;
		collection_rate: number;
		transaction_count: number;
	};
	comparison: {
		previous_period_collected: number;
		change_percentage: number;
	};
}

// ============================================
// RENTS REPORT
// ============================================

export interface RentBilling {
	id: number;
	lease_id: number;
	lease_name: string;
	rental_unit_name: string;
	amount: number;
	paid_amount: number;
	balance: number;
	status: PaymentStatus;
	due_date: string;
	billing_date: string;
	penalty_amount: number;
	days_overdue: number | null;
}

export interface RentsByStatus {
	status: PaymentStatus;
	count: number;
	total_amount: number;
	total_balance: number;
}

export interface RentsReportData {
	report_period: string;
	generated_at: string;
	billings: RentBilling[];
	rents_by_status: RentsByStatus[];
	summary: {
		total_rent_billed: number;
		total_collected: number;
		total_outstanding: number;
		total_penalties: number;
		collection_rate: number;
		overdue_count: number;
	};
	top_delinquents: RentBilling[];
}

// ============================================
// MONTHLY REPORT
// ============================================

export interface MonthlyRevenue {
	month: string;
	rent_collected: number;
	utility_collected: number;
	penalties_collected: number;
	other_collected: number;
	total_collected: number;
}

export interface MonthlyExpense {
	month: string;
	utilities: number;
	maintenance: number;
	supplies: number;
	other: number;
	total_expenses: number;
}

export interface MonthlyOccupancy {
	month: string;
	total_units: number;
	occupied_units: number;
	occupancy_rate: number;
	move_ins: number;
	move_outs: number;
}

export interface MonthlyReportData {
	report_month: string;
	generated_at: string;
	revenue: MonthlyRevenue;
	expenses: MonthlyExpense;
	occupancy: MonthlyOccupancy;
	summary: {
		gross_revenue: number;
		total_expenses: number;
		net_income: number;
		profit_margin: number;
		occupancy_rate: number;
	};
	year_to_date: {
		total_revenue: number;
		total_expenses: number;
		net_income: number;
	};
	profit_sharing: {
		total_profit: number;
		manager_share_percent: number;
		manager_share_amount: number;
		owner_share_percent: number;
		owner_share_amount: number;
	};
	revenue_by_floor: {
		floor: string;
		amount: number;
		percentage: number;
	}[];
	expense_breakdown: {
		category: string;
		amount: number;
	}[];
	trend_data: MonthlyRevenue[];
}

// ============================================
// PROJECTS REPORT
// ============================================

export interface BudgetItem {
	name: string;
	category: string;
	planned_amount: number;
	actual_amount: number;
	variance: number;
}

export interface Project {
	id: number;
	project_name: string;
	project_description: string | null;
	project_category: string | null;
	planned_amount: number;
	pending_amount: number;
	actual_amount: number;
	budget_items: BudgetItem[];
	status: ProjectStatus;
	start_date: string | null;
	end_date: string | null;
	property_id: number;
	property_name: string;
	progress_percentage: number;
}

export interface ProjectsByStatus {
	status: ProjectStatus;
	count: number;
	total_budget: number;
	total_spent: number;
}

export interface ProjectsReportData {
	report_date: string;
	generated_at: string;
	projects: Project[];
	projects_by_status: ProjectsByStatus[];
	summary: {
		total_projects: number;
		active_projects: number;
		completed_projects: number;
		total_planned_budget: number;
		total_actual_spent: number;
		budget_variance: number;
	};
	upcoming_projects: Project[];
}
