// Employee Types
export type EmployeeRole = 'admin' | 'manager' | 'staff';

export interface Employee {
	id: string;
	email: string;
	name: string;
	phone?: string;
	role: EmployeeRole;
	avatar_url?: string;
	home_lat?: number;
	home_lng?: number;
	created_at: Date;
}

// Shift Types
export type ShiftStatus = 'active' | 'completed' | 'missed';

export interface Shift {
	id: string;
	employee_id: string;
	location_id?: string;
	clock_in?: Date;
	clock_out?: Date;
	clock_in_lat?: number;
	clock_in_lng?: number;
	clock_out_lat?: number;
	clock_out_lng?: number;
	status: ShiftStatus;
	notes?: string;
	created_at: Date;
}

// Task Types
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
	id: string;
	title: string;
	description?: string;
	assigned_to?: string;
	location_id?: string;
	status: TaskStatus;
	priority: TaskPriority;
	photo_url?: string;
	completed_at?: Date;
	created_at: Date;
}

// Inventory Types
export interface Inventory {
	id: string;
	name: string;
	sku: string;
	quantity: number;
	min_stock: number;
	location_id?: string;
	category?: string;
	unit: string;
	updated_at: Date;
	created_at: Date;
}

// Expense Types
export type ExpenseStatus = 'pending' | 'approved' | 'rejected';

export interface Expense {
	id: string;
	employee_id: string;
	amount: number;
	category: string;
	description?: string;
	receipt_url?: string;
	status: ExpenseStatus;
	approved_by?: string;
	created_at: Date;
}

// Message Types
export interface Message {
	id: string;
	sender_id: string;
	channel: string;
	content: string;
	created_at: Date;
}

// Schedule Types
export interface Schedule {
	id: string;
	employee_id: string;
	location_id?: string;
	date: Date;
	start_time: string;
	end_time: string;
	created_at: Date;
}

// Location Types
export interface Location {
	id: string;
	name: string;
	address?: string;
	lat?: number;
	lng?: number;
	created_at: Date;
}

// Auth Types
export interface Session {
	user: Employee;
	token: string;
}
