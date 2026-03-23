import type { RxCollection, RxDatabase, RxDocument } from 'rxdb';
import type {
	Employee,
	Shift,
	Task,
	Inventory,
	Expense,
	Message,
	Schedule
} from '$lib/types';

export type EmployeeDocType = Employee;
export type ShiftDocType = Shift;
export type TaskDocType = Task;
export type InventoryDocType = Inventory;
export type ExpenseDocType = Expense;
export type MessageDocType = Message;
export type ScheduleDocType = Schedule;

export type EmployeeDocument = RxDocument<EmployeeDocType>;
export type ShiftDocument = RxDocument<ShiftDocType>;
export type TaskDocument = RxDocument<TaskDocType>;
export type InventoryDocument = RxDocument<InventoryDocType>;
export type ExpenseDocument = RxDocument<ExpenseDocType>;
export type MessageDocument = RxDocument<MessageDocType>;
export type ScheduleDocument = RxDocument<ScheduleDocType>;

export interface RemoteDeskCollections {
	employees: RxCollection<EmployeeDocType>;
	shifts: RxCollection<ShiftDocType>;
	tasks: RxCollection<TaskDocType>;
	inventory: RxCollection<InventoryDocType>;
	expenses: RxCollection<ExpenseDocType>;
	messages: RxCollection<MessageDocType>;
	schedules: RxCollection<ScheduleDocType>;
}
