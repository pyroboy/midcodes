/**
 * Drizzle-inferred types for schooldocs (replaces old Supabase Database type).
 */
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type {
	profiles,
	organizations,
	students,
	document_types,
	orders,
	order_items,
	payments
} from '$lib/server/schema';

export type Profile = InferSelectModel<typeof profiles>;
export type NewProfile = InferInsertModel<typeof profiles>;

export type Organization = InferSelectModel<typeof organizations>;
export type NewOrganization = InferInsertModel<typeof organizations>;

export type Student = InferSelectModel<typeof students>;
export type NewStudent = InferInsertModel<typeof students>;

export type DocumentType = InferSelectModel<typeof document_types>;
export type NewDocumentType = InferInsertModel<typeof document_types>;

export type Order = InferSelectModel<typeof orders>;
export type NewOrder = InferInsertModel<typeof orders>;

export type OrderItem = InferSelectModel<typeof order_items>;
export type NewOrderItem = InferInsertModel<typeof order_items>;

export type Payment = InferSelectModel<typeof payments>;
export type NewPayment = InferInsertModel<typeof payments>;

export type OrderStatus = Order['status'];
export type DeliveryMethod = Order['delivery_method'];
export type PaymentStatus = Payment['status'];
export type PaymentMethod = Payment['method'];
export type DocumentStatus = DocumentType['status'];
export type AppRole = Profile['role'];
