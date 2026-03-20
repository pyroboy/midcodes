/**
 * Centralized camelCase→snake_case transforms for RxDB pull endpoint.
 * Each function maps a Drizzle row to the flat snake_case shape
 * that the corresponding RxDB collection schema expects.
 *
 * ID fields are coerced to strings (RxDB requires string primary keys).
 * Timestamps are serialized to ISO strings.
 */

function ts(v: Date | string | null | undefined): string | null {
	if (!v) return null;
	return v instanceof Date ? v.toISOString() : v;
}

function sid(v: number | string | null | undefined): string {
	return String(v ?? '');
}

export function transformTenant(row: any) {
	return {
		id: sid(row.id),
		name: row.name,
		contact_number: row.contactNumber ?? null,
		email: row.email ?? null,
		created_at: ts(row.createdAt),
		updated_at: ts(row.updatedAt),
		auth_id: row.authId ?? null,
		emergency_contact: row.emergencyContact ?? null,
		tenant_status: row.tenantStatus,
		created_by: row.createdBy ?? null,
		deleted_at: ts(row.deletedAt),
		profile_picture_url: row.profilePictureUrl ?? null,
		address: row.address ?? null,
		school_or_workplace: row.schoolOrWorkplace ?? null,
		facebook_name: row.facebookName ?? null,
		birthday: ts(row.birthday)
	};
}

export function transformLease(row: any) {
	return {
		id: sid(row.id),
		rental_unit_id: sid(row.rentalUnitId),
		name: row.name,
		start_date: ts(row.startDate),
		end_date: ts(row.endDate),
		rent_amount: row.rentAmount,
		security_deposit: row.securityDeposit,
		notes: row.notes ?? null,
		created_at: ts(row.createdAt),
		updated_at: ts(row.updatedAt),
		created_by: row.createdBy ?? null,
		terms_month: row.termsMonth ?? null,
		status: row.status,
		deleted_at: ts(row.deletedAt),
		deleted_by: row.deletedBy ?? null,
		deletion_reason: row.deletionReason ?? null
	};
}

export function transformLeaseTenant(row: any) {
	return {
		id: sid(row.id),
		lease_id: sid(row.leaseId),
		tenant_id: sid(row.tenantId),
		created_at: ts(row.createdAt),
		updated_at: ts(row.updatedAt),
		deleted_at: ts(row.deletedAt),
	};
}

export function transformRentalUnit(row: any) {
	return {
		id: sid(row.id),
		name: row.name,
		capacity: row.capacity,
		rental_unit_status: row.rentalUnitStatus,
		base_rate: row.baseRate,
		created_at: ts(row.createdAt),
		updated_at: ts(row.updatedAt),
		property_id: sid(row.propertyId),
		floor_id: sid(row.floorId),
		type: row.type,
		amenities: (row.amenities && (Array.isArray(row.amenities) ? row.amenities.length > 0 : Object.keys(row.amenities).length > 0)) ? row.amenities : null,
		number: row.number,
		deleted_at: ts(row.deletedAt),
	};
}

export function transformProperty(row: any) {
	return {
		id: sid(row.id),
		name: row.name,
		address: row.address,
		type: row.type,
		status: row.status,
		created_at: ts(row.createdAt),
		updated_at: ts(row.updatedAt),
		deleted_at: ts(row.deletedAt),
	};
}

export function transformFloor(row: any) {
	return {
		id: sid(row.id),
		property_id: sid(row.propertyId),
		floor_number: row.floorNumber,
		wing: row.wing ?? null,
		status: row.status,
		created_at: ts(row.createdAt),
		updated_at: ts(row.updatedAt),
		deleted_at: ts(row.deletedAt),
	};
}

export function transformMeter(row: any) {
	return {
		id: sid(row.id),
		name: row.name,
		location_type: row.locationType,
		property_id: row.propertyId != null ? sid(row.propertyId) : null,
		floor_id: row.floorId != null ? sid(row.floorId) : null,
		rental_unit_id: row.rentalUnitId != null ? sid(row.rentalUnitId) : null,
		type: row.type,
		is_active: row.isActive ?? null,
		status: row.status,
		notes: row.notes ?? null,
		initial_reading: row.initialReading ?? null,
		created_at: ts(row.createdAt),
		updated_at: ts(row.updatedAt),
		deleted_at: ts(row.deletedAt),
	};
}

export function transformReading(row: any) {
	return {
		id: sid(row.id),
		meter_id: sid(row.meterId),
		reading: row.reading,
		reading_date: ts(row.readingDate),
		meter_name: row.meterName ?? null,
		rate_at_reading: row.rateAtReading ?? null,
		previous_reading: row.previousReading ?? null,
		backdating_enabled: row.backdatingEnabled ?? null,
		review_status: row.reviewStatus,
		created_at: ts(row.createdAt),
		updated_at: ts(row.updatedAt),
		deleted_at: ts(row.deletedAt),
	};
}

export function transformBilling(row: any) {
	return {
		id: sid(row.id),
		lease_id: sid(row.leaseId),
		type: row.type,
		utility_type: row.utilityType ?? null,
		amount: row.amount,
		paid_amount: row.paidAmount ?? null,
		balance: row.balance,
		status: row.status,
		due_date: ts(row.dueDate),
		billing_date: ts(row.billingDate),
		penalty_amount: row.penaltyAmount ?? null,
		notes: row.notes ?? null,
		meter_id: row.meterId != null ? sid(row.meterId) : null,
		created_at: ts(row.createdAt),
		updated_at: ts(row.updatedAt),
		deleted_at: ts(row.deletedAt),
	};
}

export function transformPayment(row: any) {
	return {
		id: sid(row.id),
		amount: row.amount,
		method: row.method,
		reference_number: row.referenceNumber ?? null,
		paid_by: row.paidBy,
		paid_at: ts(row.paidAt),
		notes: row.notes ?? null,
		receipt_url: row.receiptUrl ?? null,
		created_by: row.createdBy ?? null,
		updated_by: row.updatedBy ?? null,
		billing_ids: row.billingIds != null ? row.billingIds.map((v: any) => sid(v)) : null,
		billing_id: row.billingId != null ? sid(row.billingId) : null,
		reverted_at: ts(row.revertedAt),
		reverted_by: row.revertedBy ?? null,
		revert_reason: row.revertReason ?? null,
		created_at: ts(row.createdAt),
		updated_at: ts(row.updatedAt),
		deleted_at: ts(row.deletedAt),
	};
}

export function transformPaymentAllocation(row: any) {
	return {
		id: sid(row.id),
		payment_id: row.paymentId != null ? sid(row.paymentId) : null,
		billing_id: row.billingId != null ? sid(row.billingId) : null,
		amount: row.amount,
		created_at: ts(row.createdAt),
		updated_at: ts(row.updatedAt),
		deleted_at: ts(row.deletedAt),
	};
}

export function transformExpense(row: any) {
	return {
		id: sid(row.id),
		property_id: row.propertyId != null ? sid(row.propertyId) : null,
		amount: row.amount,
		description: row.description,
		type: row.type,
		status: row.status,
		created_by: row.createdBy ?? null,
		expense_date: ts(row.expenseDate),
		created_at: ts(row.createdAt),
		updated_at: ts(row.updatedAt),
		deleted_at: ts(row.deletedAt),
	};
}

export function transformBudget(row: any) {
	return {
		id: sid(row.id),
		project_name: row.projectName,
		project_description: row.projectDescription ?? null,
		project_category: row.projectCategory ?? null,
		planned_amount: row.plannedAmount,
		pending_amount: row.pendingAmount ?? null,
		actual_amount: row.actualAmount ?? null,
		budget_items: row.budgetItems ?? null,
		status: row.status ?? null,
		start_date: ts(row.startDate),
		end_date: ts(row.endDate),
		property_id: sid(row.propertyId),
		created_by: row.createdBy ?? null,
		created_at: ts(row.createdAt),
		updated_at: ts(row.updatedAt),
		deleted_at: ts(row.deletedAt),
	};
}

export function transformPenaltyConfig(row: any) {
	return {
		id: sid(row.id),
		type: row.type,
		grace_period: row.gracePeriod,
		penalty_percentage: row.penaltyPercentage,
		compound_period: row.compoundPeriod ?? null,
		max_penalty_percentage: row.maxPenaltyPercentage ?? null,
		created_at: ts(row.createdAt),
		updated_at: ts(row.updatedAt),
		deleted_at: ts(row.deletedAt),
	};
}

export function transformFloorLayoutItem(row: any) {
	return {
		id: sid(row.id),
		floor_id: sid(row.floorId),
		rental_unit_id: row.rentalUnitId != null ? sid(row.rentalUnitId) : null,
		item_type: row.itemType,
		grid_x: row.gridX,
		grid_y: row.gridY,
		grid_w: row.gridW,
		grid_h: row.gridH,
		label: row.label ?? null,
		color: row.color ?? null,
		created_at: ts(row.createdAt),
		updated_at: ts(row.updatedAt),
		deleted_at: ts(row.deletedAt)
	};
}
