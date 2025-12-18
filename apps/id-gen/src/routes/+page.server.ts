import type { PageServerLoad, Actions } from './$types';
import { error, redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { idcards, templates, templateAssets as schemaTemplateAssets } from '$lib/server/schema';
import { eq, and, gte, sql, desc, inArray } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, depends }) => {
	// Register dependencies for selective invalidation
	depends('app:templates');
	depends('app:recent-cards');
	depends('app:template-assets');

	const { session, user, org_id } = locals;

	// Fetch template assets for the 3D card display (public - available to all users including non-signed-in)
	const templateAssets = await db
		.select({
			id: schemaTemplateAssets.id,
			imageUrl: schemaTemplateAssets.imageUrl,
			widthPixels: schemaTemplateAssets.widthPixels,
			heightPixels: schemaTemplateAssets.heightPixels,
			name: schemaTemplateAssets.name,
			orientation: schemaTemplateAssets.orientation
		})
		.from(schemaTemplateAssets)
		.where(eq(schemaTemplateAssets.isPublished, true))
		.orderBy(desc(schemaTemplateAssets.createdAt));

	if (!org_id) {
		return {
			templates: [],
			recentCards: [],
			totalCards: 0,
			totalTemplates: 0,
			weeklyCards: 0,
			templateAssets: templateAssets.map(a => ({
				...a,
				image_url: a.imageUrl,
				width_pixels: a.widthPixels,
				height_pixels: a.heightPixels
			})),
			error: null
		};
	}

	const effectiveOrgId = org_id;

	const [
		templatesData,
		recentCardsData,
		totalCardsResult,
		totalTemplatesResult,
		weeklyCardsResult
	] = await Promise.all([
		// Fetch templates for the hero section
		db.select().from(templates).where(eq(templates.orgId, effectiveOrgId)).orderBy(desc(templates.createdAt)),
		// Get recent cards
		db.select({
			id: idcards.id,
			templateId: idcards.templateId,
			frontImage: idcards.frontImage,
			backImage: idcards.backImage,
			createdAt: idcards.createdAt,
			data: idcards.data
		}).from(idcards).where(eq(idcards.orgId, effectiveOrgId)).orderBy(desc(idcards.createdAt)).limit(12),
		// Total cards
		db.select({ count: sql`count(*)` }).from(idcards).where(eq(idcards.orgId, effectiveOrgId)),
		// Total templates
		db.select({ count: sql`count(*)` }).from(templates).where(eq(templates.orgId, effectiveOrgId)),
		// This week's cards count
		db.select({ count: sql`count(*)` }).from(idcards).where(
			and(
				eq(idcards.orgId, effectiveOrgId),
				gte(idcards.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
			)
		)
	]);

	// Fetch template names for recent cards
	let templateNames: Record<string, string> = {};
	const templateIds = [...new Set(recentCardsData.map(c => c.templateId).filter(Boolean))] as string[];
	if (templateIds.length > 0) {
		const templateNamesData = await db
			.select({ id: templates.id, name: templates.name })
			.from(templates)
			.where(inArray(templates.id, templateIds));
		
		templateNames = templateNamesData.reduce((acc, t) => {
			acc[t.id] = t.name;
			return acc;
		}, {} as Record<string, string>);
	}

	const enhancedRecentCards = recentCardsData.map(card => ({
		...card,
		front_image: card.frontImage,
		back_image: card.backImage,
		created_at: card.createdAt?.toISOString(),
		template_id: card.templateId,
		template_name: (card.templateId && templateNames[card.templateId]) || 'Unknown Template'
	}));

	return {
		templates: templatesData.map(t => ({
			...t,
			user_id: t.userId,
			org_id: t.orgId,
			width_pixels: t.widthPixels,
			height_pixels: t.heightPixels,
			front_background: t.frontBackground,
			back_background: t.backBackground,
			template_elements: t.templateElements,
			created_at: t.createdAt?.toISOString()
		})),
		recentCards: enhancedRecentCards,
		totalCards: Number(totalCardsResult[0]?.count || 0),
		totalTemplates: Number(totalTemplatesResult[0]?.count || 0),
		weeklyCards: Number(weeklyCardsResult[0]?.count || 0),
		templateAssets: templateAssets.map(a => ({
			...a,
			image_url: a.imageUrl,
			width_pixels: a.widthPixels,
			height_pixels: a.heightPixels
		})),
		error: null
	};
};

export const actions: Actions = {
	duplicate: async ({ request, locals }) => {
		const { session, user, org_id } = locals;

		if (!session || !user || !org_id) {
			return fail(401, { message: 'Unauthorized' });
		}

		try {
			const formData = await request.formData();
			const templateId = formData.get('templateId') as string;
			const newName = formData.get('newName') as string;

			if (!templateId) {
				return fail(400, { message: 'Template ID is required' });
			}

			if (!newName) {
				return fail(400, { message: 'New name is required' });
			}

			// Fetch the original template
			const [original] = await db
				.select()
				.from(templates)
				.where(eq(templates.id, templateId))
				.limit(1);

			if (!original) {
				console.error('❌ Server: Template not found for duplication:', templateId);
				return fail(404, { message: 'Template not found' });
			}

			// Create the duplicate
			const [duplicated] = await db.insert(templates).values({
				userId: session.user.id,
				orgId: org_id,
				name: newName,
				widthPixels: original.widthPixels,
				heightPixels: original.heightPixels,
				dpi: original.dpi,
				frontBackground: original.frontBackground,
				backBackground: original.backBackground,
				orientation: original.orientation,
				templateElements: original.templateElements,
				createdAt: new Date(),
				updatedAt: new Date()
			}).returning();

			console.log('✅ Server: Template duplicated successfully:', {
				originalId: templateId,
				newId: duplicated.id,
				newName
			});

			return {
				success: true,
				data: {
					...duplicated,
					user_id: duplicated.userId,
					org_id: duplicated.orgId,
					width_pixels: duplicated.widthPixels,
					height_pixels: duplicated.heightPixels,
					front_background: duplicated.frontBackground,
					back_background: duplicated.backBackground,
					template_elements: duplicated.templateElements
				},
				message: 'Template duplicated successfully'
			};
		} catch (err) {
			console.error('❌ Server: Error in duplicate action:', err);
			return fail(500, { message: 'Error duplicating template' });
		}
	},

	delete: async ({ request, locals }) => {
		const { session } = locals;
		
		if (!session) {
			return fail(401, { message: 'Unauthorized' });
		}

		try {
			const formData = await request.formData();
			const templateId = formData.get('templateId') as string;
			const deleteIds = formData.get('deleteIds') === 'true';

			if (!templateId) {
				return fail(400, { message: 'Template ID is required' });
			}

			console.log('🗑️ Server: Processing template delete:', { templateId, deleteIds });

			if (deleteIds) {
				// Fetch associated IDs to get image paths
				const cards = await db
					.select({
						id: idcards.id,
						frontImage: idcards.frontImage,
						backImage: idcards.backImage
					})
					.from(idcards)
					.where(eq(idcards.templateId, templateId));

				if (cards && cards.length > 0) {
					// Delete images from R2 storage
					const { deleteFromR2 } = await import('$lib/server/s3');
					const imagesToDelete: string[] = [];
					for (const card of cards) {
						if (card.frontImage) imagesToDelete.push(card.frontImage);
						if (card.backImage) imagesToDelete.push(card.backImage);
					}

					if (imagesToDelete.length > 0) {
						// Delete from R2 - use Promise.allSettled to handle partial failures
						const deleteResults = await Promise.allSettled(
							imagesToDelete.map(key => deleteFromR2(key).catch(err => {
								console.warn(`⚠️ Failed to delete ${key}:`, err);
							}))
						);
						console.log(`✅ Attempted to delete ${imagesToDelete.length} images from R2`);
					}

					// Delete ID records
					await db.delete(idcards).where(eq(idcards.templateId, templateId));
					console.log(`✅ Server: Deleted ${cards.length} associated ID cards`);
				}
			} else {
				// Unlink IDs (keep them but remove template association)
				await db.update(idcards).set({ templateId: null }).where(eq(idcards.templateId, templateId));
				console.log('✅ Server: Unlinked associated ID cards');
			}

			// Delete the template
			await db.delete(templates).where(
				and(
					eq(templates.id, templateId),
					eq(templates.userId, session.user.id)
				)
			);

			console.log('✅ Server: Template deleted successfully:', { templateId });

			return {
				success: true,
				message: 'Template deleted successfully'
			};
		} catch (err) {
			console.error('❌ Server: Error in delete action:', err);
			return fail(500, { message: 'Error deleting template' });
		}
	}
};
