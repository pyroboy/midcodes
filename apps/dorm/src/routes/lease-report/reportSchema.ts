import { z } from 'zod';

// Define enums for payment status
export const paymentStatusEnum = z.enum(['PAID', 'PENDING', 'PARTIAL', 'OVERDUE']);

export type PaymentStatus = z.infer<typeof paymentStatusEnum>;

// Schema for filtering/date range selection
export const leaseReportFilterSchema = z.object({
	startMonth: z.string().regex(/^\d{4}-\d{2}$/, { message: 'Invalid month format. Use YYYY-MM' }),
	monthCount: z.coerce.number().int().min(1).max(12).default(6),
	floorId: z.coerce.number().optional(),
	propertyId: z.coerce.number().optional(),
	showInactiveLeases: z.boolean().default(false)
});

export type LeaseReportFilterSchema = typeof leaseReportFilterSchema;

// Response type definitions for the report
export interface MonthlyPaymentStatus {
	month: string; // YYYY-MM format
	rent: PaymentStatus;
	utilities: PaymentStatus;
	penalty: PaymentStatus;
	rentAmount?: number;
	utilitiesAmount?: number;
	penaltyAmount?: number;
	rentPaidAmount?: number;
	utilitiesPaidAmount?: number;
	penaltyPaidAmount?: number;
}

export interface TenantPaymentRecord {
	tenantId: number;
	tenantName: string;
	leaseId: number;
	leaseName: string;
	securityDeposit: number;
	startDate: string;
	monthlyPayments: MonthlyPaymentStatus[];
	totalPaid: number;
	totalRentPaid: number;
	totalUtilitiesPaid: number;
	totalPenaltyPaid: number;
	totalPending: number;
}

export interface RentalUnitGroup {
	rentalUnitId: number;
	roomName: string;
	capacity: number;
	tenantRecords: TenantPaymentRecord[];
}

export interface FloorGroup {
	floorId: number;
	floorNumber: string;
	wing?: string;
	rentalUnits: RentalUnitGroup[];
}

export interface LeaseReportData {
	floors: FloorGroup[];
	reportPeriod: {
		startMonth: string;
		endMonth: string;
		months: string[];
	};
}
