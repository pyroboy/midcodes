import { error } from '@sveltejs/kit';
import { query, command, getRequestEvent } from '$app/server';
import { z } from 'zod';
import { addCredits, refundCredits, grantUnlimitedTemplates, grantWatermarkRemoval } from '$lib/utils/credits';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/schema';
import { eq, and, desc, sql, lt, gte } from 'drizzle-orm';
import {
	invoiceCreateInputSchema,
	invoiceMarkPaidInputSchema,
	invoiceVoidInputSchema,
	type InvoiceCreateInput,
	type InvoiceMarkPaidInput,
	type InvoiceVoidInput
} from '$lib/schemas/billing.schema';

// Helper to require admin permissions
async function requireAdminPermissions() {
	const { locals } = getRequestEvent();
	const user = locals.user;
	
	if (!user || !['super_admin', 'org_admin', 'id_gen_admin'].includes(user.role)) {
		throw error(403, 'Admin privileges required.');
	}
	
	return { user, org_id: locals.org_id };
}

// Get all invoices for the organization
export const getInvoices = query(async (params?: { status?: string; userId?: string; limit?: number }) => {
	const { org_id } = await requireAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	try {
		let conditions = [eq(schema.invoices.orgId, org_id)];
		
		if (params?.status) {
			conditions.push(eq(schema.invoices.status, params.status));
		}
		
		if (params?.userId) {
			conditions.push(eq(schema.invoices.userId, params.userId));
		}

		const results = await db.select({
				invoice: schema.invoices,
				user: {
					id: schema.profiles.id,
					email: schema.profiles.email,
					credits_balance: schema.profiles.creditsBalance
				}
			})
			.from(schema.invoices)
			.leftJoin(schema.profiles, eq(schema.invoices.userId, schema.profiles.id))
			.where(and(...conditions))
			.orderBy(desc(schema.invoices.createdAt))
			.limit(params?.limit || 100);

		// Fetch invoice items for each invoice (could be optimized with a join or separate query)
		const invoiceIds = results.map(r => r.invoice.id);
		let allItems: any[] = [];
		if (invoiceIds.length > 0) {
			allItems = await db.select()
				.from(schema.invoiceItems)
				.where(sql`${schema.invoiceItems.invoiceId} IN ${invoiceIds}`);
		}

		return results.map(r => ({
			...r.invoice,
			user: r.user,
			invoice_items: allItems.filter(item => item.invoiceId === r.invoice.id)
		}));
	} catch (err) {
		console.error('Error fetching invoices:', err);
		throw error(500, 'Failed to load invoices');
	}
});

// Get a single invoice by ID
export const getInvoiceById = query('unchecked', async ({ invoiceId }: { invoiceId: string }) => {
	const { org_id } = await requireAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	try {
        const result = await db.select({
                invoice: schema.invoices,
                user: {
                    id: schema.profiles.id,
                    email: schema.profiles.email,
                    credits_balance: schema.profiles.creditsBalance,
                    unlimited_templates: schema.profiles.unlimitedTemplates,
                    remove_watermarks: schema.profiles.removeWatermarks
                }
            })
            .from(schema.invoices)
            .leftJoin(schema.profiles, eq(schema.invoices.userId, schema.profiles.id))
            .where(and(eq(schema.invoices.id, invoiceId), eq(schema.invoices.orgId, org_id)))
            .limit(1);

        if (result.length === 0) throw error(404, 'Invoice not found');

        const items = await db.select()
            .from(schema.invoiceItems)
            .where(eq(schema.invoiceItems.invoiceId, invoiceId));

        return {
            ...result[0].invoice,
            user: result[0].user,
            invoice_items: items
        };
	} catch (err) {
		console.error('Error fetching invoice:', err);
		if (err instanceof Error && 'status' in err) throw err;
		throw error(500, 'Failed to load invoice');
	}
}) as any;

// Create a new invoice
export const createInvoice = command('unchecked', async (input: InvoiceCreateInput) => {
	const { user, org_id } = await requireAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	// Validate input
	const parsed = invoiceCreateInputSchema.safeParse(input);
	if (!parsed.success) {
		throw error(400, `Invalid input: ${parsed.error.message}`);
	}

	const { user_id, invoice_type, notes, internal_notes, due_date, items } = parsed.data;

	try {
        return await db.transaction(async (tx) => {
            // Verify user exists in org
            const targetUser = await tx.query.profiles.findFirst({
                where: and(eq(schema.profiles.id, user_id), eq(schema.profiles.orgId, org_id)),
                columns: { id: true, email: true }
            });

            if (!targetUser) {
                throw error(404, 'Target user not found in organization');
            }

            // Calculate totals
            let subtotal = 0;
            let totalCredits = 0;
            const processedItems = items.map((item) => {
                const total = item.quantity * item.unit_price;
                subtotal += total;
                totalCredits += item.credits_granted || 0;
                return {
                    ...item,
                    total_price: total
                };
            });

            // Create invoice - generate invoiceNumber since Drizzle doesn't have triggers
            const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            const [invoice] = await tx.insert(schema.invoices)
                .values({
                    invoiceNumber,
                    userId: user_id,
                    orgId: org_id,
                    invoiceType: invoice_type,
                    status: 'draft',
                    subtotal,
                    taxAmount: 0,
                    discountAmount: 0,
                    totalAmount: subtotal,
                    amountPaid: 0,
                    notes,
                    internalNotes: internal_notes,
                    dueDate: due_date ? new Date(due_date) : null,
                    createdBy: user!.id
                })
                .returning();

            // Insert invoice items
            const itemsToInsert = processedItems.map((item) => ({
                invoiceId: invoice.id,
                itemType: item.item_type,
                skuId: item.sku_id,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unit_price,
                totalPrice: item.total_price,
                creditsGranted: item.credits_granted,
                metadata: item.metadata
            }));

            await tx.insert(schema.invoiceItems).values(itemsToInsert);

            await getInvoices().refresh();

            return {
                success: true,
                invoice: {
                    ...invoice,
                    invoice_items: itemsToInsert,
                    total_credits: totalCredits
                }
            };
        });
	} catch (err) {
		console.error('Error creating invoice:', err);
		if (err instanceof Error && 'status' in err) throw err;
		throw error(500, 'Failed to create invoice');
	}
});

// Send invoice (change status from draft to sent)
export const sendInvoice = command('unchecked', async (invoiceId: string) => {
	const { org_id } = await requireAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	try {
        const [invoice] = await db.select()
            .from(schema.invoices)
            .where(and(eq(schema.invoices.id, invoiceId), eq(schema.invoices.orgId, org_id)));

        if (!invoice) throw error(404, 'Invoice not found');
        if (invoice.status !== 'draft') throw error(400, 'Only draft invoices can be sent');

        await db.update(schema.invoices)
            .set({
                status: 'sent',
                issueDate: new Date()
            })
            .where(eq(schema.invoices.id, invoiceId));

        await getInvoices().refresh();
        return { success: true };
	} catch (err) {
		console.error('Error sending invoice:', err);
		if (err instanceof Error && 'status' in err) throw err;
		throw error(500, 'Failed to send invoice');
	}
});

// Mark invoice as paid (adds credits to user)
export const markInvoicePaid = command('unchecked', async (input: InvoiceMarkPaidInput) => {
	const { user, org_id } = await requireAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	const parsed = invoiceMarkPaidInputSchema.safeParse(input);
	if (!parsed.success) {
		throw error(400, `Invalid input: ${parsed.error.message}`);
	}

	const { invoice_id, payment_method, payment_reference, notes } = parsed.data;

	try {
        return await db.transaction(async (tx) => {
            // Get invoice with items
            const result = await tx.select({
                    invoice: schema.invoices,
                })
                .from(schema.invoices)
                .where(and(eq(schema.invoices.id, invoice_id), eq(schema.invoices.orgId, org_id)))
                .limit(1);

            if (result.length === 0) throw error(404, 'Invoice not found');
            const invoice = result[0].invoice;

            if (invoice.status === 'paid') throw error(400, 'Invoice is already paid');
            if (invoice.status === 'void') throw error(400, 'Cannot pay a voided invoice');

            const items = await tx.select()
                .from(schema.invoiceItems)
                .where(eq(schema.invoiceItems.invoiceId, invoice_id));

            // Calculate totals
            let totalCredits = 0;
            let hasUnlimitedTemplates = false;
            let hasRemoveWatermarks = false;

            for (const item of items) {
                if (item.creditsGranted && item.creditsGranted > 0) {
                    totalCredits += item.creditsGranted;
                }
                if (item.skuId === 'unlimited_templates' || item.itemType === 'feature') {
                    if (item.description?.toLowerCase().includes('unlimited template')) {
                        hasUnlimitedTemplates = true;
                    }
                    if (item.description?.toLowerCase().includes('watermark')) {
                        hasRemoveWatermarks = true;
                    }
                }
            }

            // Update invoice status
            await tx.update(schema.invoices)
                .set({
                    status: 'paid',
                    paidAt: new Date(),
                    paidBy: user!.id,
                    paymentMethod: payment_method || 'manual',
                    paymentReference: payment_reference,
                    amountPaid: invoice.totalAmount,
                    notes: notes ? `${invoice.notes || ''}\n${notes}`.trim() : invoice.notes,
                    updatedAt: new Date()
                })
                .where(eq(schema.invoices.id, invoice_id));

            // Add credits to user
            if (totalCredits > 0) {
                const creditResult = await addCredits(
                    invoice.userId,
                    org_id,
                    totalCredits,
                    invoice_id,
                    `Invoice ${invoice.invoiceNumber}`
                );

                if (!creditResult.success) {
                    throw error(500, 'Failed to add credits to user');
                }
            }

            // Grant features
            if (hasUnlimitedTemplates) {
                await grantUnlimitedTemplates(invoice.userId, org_id, invoice_id);
            }
            if (hasRemoveWatermarks) {
                await grantWatermarkRemoval(invoice.userId, org_id, invoice_id);
            }

            await getInvoices().refresh();

            return {
                success: true,
                creditsAdded: totalCredits,
                featuresGranted: {
                    unlimitedTemplates: hasUnlimitedTemplates,
                    removeWatermarks: hasRemoveWatermarks
                }
            };
        });
	} catch (err) {
		console.error('Error marking invoice as paid:', err);
		if (err instanceof Error && 'status' in err) throw err;
		throw error(500, 'Failed to update invoice status');
	}
});

// Void an invoice
export const voidInvoice = command('unchecked', async (input: InvoiceVoidInput) => {
	const { user, org_id } = await requireAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	const parsed = invoiceVoidInputSchema.safeParse(input);
	if (!parsed.success) {
		throw error(400, `Invalid input: ${parsed.error.message}`);
	}

	const { invoice_id, reason } = parsed.data;

	try {
        return await db.transaction(async (tx) => {
            const result = await tx.select().from(schema.invoices).where(and(eq(schema.invoices.id, invoice_id), eq(schema.invoices.orgId, org_id))).limit(1);
            if (result.length === 0) throw error(404, 'Invoice not found');
            const invoice = result[0];

            if (invoice.status === 'void') throw error(400, 'Invoice is already voided');

            // Handle credit reversal if paid
            let creditsReversed = 0;
            if (invoice.status === 'paid') {
                const items = await tx.select().from(schema.invoiceItems).where(eq(schema.invoiceItems.invoiceId, invoice_id));
                for (const item of items) {
                    if (item.creditsGranted && item.creditsGranted > 0) {
                        creditsReversed += item.creditsGranted;
                    }
                }

                if (creditsReversed > 0) {
                    const refundResult = await refundCredits(
                        invoice.userId,
                        org_id,
                        -creditsReversed,
                        invoice_id,
                        `Voided invoice ${invoice.invoiceNumber}: ${reason}`
                    );
                    if (!refundResult.success) throw error(500, 'Failed to reverse credits');
                }
            }

            await tx.update(schema.invoices)
                .set({
                    status: 'void',
                    voidedAt: new Date(),
                    voidedBy: user!.id,
                    internalNotes: `${invoice.internalNotes || ''}\nVoided: ${reason}`.trim(),
                    updatedAt: new Date()
                })
                .where(eq(schema.invoices.id, invoice_id));

            await getInvoices().refresh();
            return { success: true, creditsReversed };
        });
	} catch (err) {
		console.error('Error voiding invoice:', err);
		if (err instanceof Error && 'status' in err) throw err;
		throw error(500, 'Failed to void invoice');
	}
});

// Get admin audit log (recent invoice actions)
export const getAdminAuditLog = query(async (limit: number = 20) => {
	const { org_id } = await requireAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	try {
        const recentInvoices = await db.select({
                id: schema.invoices.id,
                invoice_number: schema.invoices.invoiceNumber,
                status: schema.invoices.status,
                invoice_type: schema.invoices.invoiceType,
                total_amount: schema.invoices.totalAmount,
                created_at: schema.invoices.createdAt,
                paid_at: schema.invoices.paidAt,
                voided_at: schema.invoices.voidedAt,
                user_email: schema.profiles.email,
                creator_email: sql<string>`(SELECT email FROM ${schema.profiles} WHERE id = ${schema.invoices.createdBy})`,
                payer_email: sql<string>`(SELECT email FROM ${schema.profiles} WHERE id = ${schema.invoices.paidBy})`,
                voider_email: sql<string>`(SELECT email FROM ${schema.profiles} WHERE id = ${schema.invoices.voidedBy})`
            })
            .from(schema.invoices)
            .leftJoin(schema.profiles, eq(schema.invoices.userId, schema.profiles.id))
            .where(eq(schema.invoices.orgId, org_id))
            .orderBy(desc(schema.invoices.updatedAt))
            .limit(limit);

        const events: any[] = [];
        for (const inv of recentInvoices) {
            events.push({
                type: 'invoice_created',
                description: `Created invoice ${inv.invoice_number}`,
                actor_email: inv.creator_email || 'System',
                target_email: inv.user_email || 'Unknown',
                timestamp: inv.created_at?.toISOString(),
                invoice_number: inv.invoice_number,
                amount: inv.total_amount
            });

            if (inv.paid_at) {
                events.push({
                    type: 'invoice_paid',
                    description: `Marked invoice ${inv.invoice_number} as paid`,
                    actor_email: inv.payer_email || 'System',
                    target_email: inv.user_email || 'Unknown',
                    timestamp: inv.paid_at.toISOString(),
                    invoice_number: inv.invoice_number,
                    amount: inv.total_amount
                });
            }

            if (inv.voided_at) {
                events.push({
                    type: 'invoice_voided',
                    description: `Voided invoice ${inv.invoice_number}`,
                    actor_email: inv.voider_email || 'System',
                    target_email: inv.user_email || 'Unknown',
                    timestamp: inv.voided_at.toISOString(),
                    invoice_number: inv.invoice_number,
                    amount: inv.total_amount
                });
            }
        }

        return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
	} catch (err) {
		console.error('Error fetching audit log:', err);
		return [];
	}
});
