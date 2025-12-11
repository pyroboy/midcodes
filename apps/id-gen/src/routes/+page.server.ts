import type { PageServerLoad, Actions } from './$types';
import { error, redirect, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, depends, setHeaders }) => {
	// Cache for 2 minutes - data doesn't change that frequently
	setHeaders({
		'cache-control': 'private, max-age=120'
	});

	// Register dependencies for selective invalidation
	depends('app:templates');
	depends('app:recent-cards');
	depends('app:template-assets');

	const { supabase, session, user, org_id, permissions } = locals;

	// Check if user has admin role and redirect to admin dashboard
	if (user && user.app_metadata && user.app_metadata.role) {
		const userRole = user.app_metadata.role;
		console.log('User role detected:', userRole);

		// Redirect super admins to admin dashboard
		// TEMPORARILY DISABLED FOR DEBUGGING
		// if (['super_admin', 'org_admin', 'id_gen_admin'].includes(userRole)) {
		//     console.log('Redirecting admin user to /admin dashboard');
		//     throw redirect(302, '/admin');
		// }
	}

	console.log('session:', session);
	console.log('user:', user);
	console.log('org_id:', org_id);

	const effectiveOrgId = org_id;

	// Get the effective organization ID (either emulated or actual)

	// console.log('effectiveOrgId:', effectiveOrgId);

	// if (!effectiveOrgId) {
	//     throw error(500, 'Organization ID not found - User is not associated with any organization');
	// }

	// Fetch template assets for the 3D card display (public - available to all users including non-signed-in)
	let templateAssets: any[] = [];
	try {
		const { data, error: assetsError } = await supabase
			.from('template_assets')
			.select('id, image_url, width_pixels, height_pixels, name, orientation')
			.eq('is_published', true)
			.order('created_at', { ascending: false });

		if (assetsError) {
			console.error('Error fetching template assets:', assetsError);
		} else {
			templateAssets = data ?? [];
		}
	} catch (err) {
		console.error('Exception fetching template assets:', err);
	}

	if (!effectiveOrgId) {
		return {
			templates: [],
			recentCards: [],
			totalCards: 0,
			totalTemplates: 0,
			weeklyCards: 0,
			templateAssets,
			error: null
		};
	}

	// Fetch templates for the hero section
	const { data: templatesData, error: templatesListError } = await supabase
		.from('templates')
		.select(
			`
			id,
			name,
			user_id,
			org_id,
			width_pixels,
			height_pixels,
			dpi,
			orientation,
			created_at,
			front_background,
			back_background,
			template_elements
		`
		)
		.eq('org_id', effectiveOrgId)
		.order('created_at', { ascending: false });

	if (templatesListError) {
		console.error('❌ [SERVER] Error fetching templates:', templatesListError);
	}

	// Get enhanced statistics for the dashboard
	const { data: recentCardsData, error: cardsError } = await supabase
		.from('idcards')
		.select(
			`
			id, 
			template_id, 
			front_image, 
			back_image, 
			created_at, 
			data
		`
		)
		.eq('org_id', effectiveOrgId)
		.order('created_at', { ascending: false })
		.limit(12); // Increased to 12 for better grid display

	// Cast recent cards to a flexible type for template lookups
	const recentCards = recentCardsData as any[] | null;

	// Get template names separately to avoid circular references
	let templateNames: Record<number, string> = {};
	if (recentCards && recentCards.length > 0) {
		const templateIds = [...new Set(recentCards.map((card) => card.template_id).filter(Boolean))];
		if (templateIds.length > 0) {
			const { data: templates } = await supabase
				.from('templates')
				.select('id, name')
				.in('id', templateIds);

			if (templates) {
				const safeTemplates = templates as any[];
				templateNames = safeTemplates.reduce(
					(acc, template: any) => {
						acc[template.id] = template.name;
						return acc;
					},
					{} as Record<number, string>
				);
			}
		}
	}

	const { count: totalCards, error: countError } = await supabase
		.from('idcards')
		.select('*', { count: 'exact', head: true })
		.eq('org_id', effectiveOrgId);

	// Get template count for statistics
	const { count: totalTemplates, error: templatesError } = await supabase
		.from('templates')
		.select('*', { count: 'exact', head: true })
		.eq('org_id', effectiveOrgId);

	// Get this week's cards count
	const oneWeekAgo = new Date();
	oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
	const { count: weeklyCards, error: weeklyError } = await supabase
		.from('idcards')
		.select('*', { count: 'exact', head: true })
		.eq('org_id', effectiveOrgId)
		.gte('created_at', oneWeekAgo.toISOString());


	// Enhanced error logging for debugging
	if (cardsError) {
		console.error('❌ [SERVER] Error fetching recent cards:', {
			error: cardsError,
			message: cardsError.message,
			code: cardsError.code,
			details: cardsError.details,
			hint: cardsError.hint
		});
	}

	if (countError) {
		console.error('❌ [SERVER] Error fetching total cards:', {
			error: countError,
			message: countError.message,
			code: countError.code
		});
	}

	if (templatesError) {
		console.error('❌ [SERVER] Error fetching templates count:', {
			error: templatesError,
			message: templatesError.message,
			code: templatesError.code
		});
	}

	if (weeklyError) {
		console.error('❌ [SERVER] Error fetching weekly cards:', {
			error: weeklyError,
			message: weeklyError.message,
			code: weeklyError.code
		});
	}

	// Debug successful queries too
	console.log('✅ [SERVER] Dashboard data loaded:', {
		recentCardsCount: recentCards?.length || 0,
		totalCards: totalCards || 0,
		totalTemplates: totalTemplates || 0,
		weeklyCards: weeklyCards || 0,
		orgId: effectiveOrgId
	});

	// Transform recent cards data to include template names
	const enhancedRecentCards = (recentCards || []).map((card) => ({
		...card,
		template_name: templateNames[card.template_id] || 'Unknown Template'
	}));

	return {
		templates: (templatesData as any[]) || [],
		recentCards: enhancedRecentCards,
		totalCards: totalCards || 0,
		totalTemplates: totalTemplates || 0,
		weeklyCards: weeklyCards || 0,
		templateAssets: templateAssets ?? [],
		error: cardsError || countError || templatesError || weeklyError
	};
};

export const actions: Actions = {
	duplicate: async ({ request, locals }) => {
		const { supabase, session, org_id } = locals;

		if (!session) {
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
			const { data: original, error: fetchError } = await supabase
				.from('templates')
				.select('*')
				.eq('id', templateId)
				.single();

			if (fetchError || !original) {
				console.error('❌ Server: Error fetching template to duplicate:', fetchError);
				return fail(500, { message: 'Failed to fetch template' });
			}

			const originalAny = original as any;

			// Create the duplicate
			const now = new Date().toISOString();
			const duplicatePayload = {
				user_id: session.user.id,
				org_id: org_id,
				name: newName,
				width_pixels: originalAny.width_pixels,
				height_pixels: originalAny.height_pixels,
				dpi: originalAny.dpi,
				front_background: originalAny.front_background,
				back_background: originalAny.back_background,
				orientation: originalAny.orientation,
				template_elements: originalAny.template_elements,
				created_at: now,
				updated_at: now
			};

			const { data: duplicated, error: insertError } = await (supabase as any)
				.from('templates')
				.insert(duplicatePayload)
				.select('*')
				.single();

			if (insertError) {
				console.error('❌ Server: Error duplicating template:', insertError);
				return fail(500, { message: 'Failed to duplicate template' });
			}

			console.log('✅ Server: Template duplicated successfully:', {
				originalId: templateId,
				newId: (duplicated as any)?.id,
				newName
			});

			return {
				success: true,
				data: duplicated,
				message: 'Template duplicated successfully'
			};
		} catch (err) {
			console.error('❌ Server: Error in duplicate action:', err);
			return fail(500, { message: 'Error duplicating template' });
		}
	},

	delete: async ({ request, locals }) => {
		const { supabase, session } = locals;

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
				const { data: cards, error: fetchError } = await supabase
					.from('idcards')
					.select('id, front_image, back_image')
					.eq('template_id', templateId);

				if (fetchError) {
					console.error('❌ Server: Error fetching associated cards:', fetchError);
					return fail(500, { message: 'Error fetching associated cards' });
				}

				if (cards && cards.length > 0) {
					// Delete images from storage
					const imagesToDelete: string[] = [];
					for (const card of cards as any[]) {
						if (card.front_image) imagesToDelete.push(card.front_image);
						if (card.back_image) imagesToDelete.push(card.back_image);
					}

					if (imagesToDelete.length > 0) {
						const { error: storageError } = await supabase.storage
							.from('rendered-id-cards')
							.remove(imagesToDelete);

						if (storageError) {
							console.warn('⚠️ Server: Error deleting card images (non-fatal):', storageError);
						}
					}

					// Delete ID records
					const { error: deleteCardsError } = await supabase
						.from('idcards')
						.delete()
						.eq('template_id', templateId);

					if (deleteCardsError) {
						console.error('❌ Server: Error deleting associated cards:', deleteCardsError);
						return fail(500, { message: 'Error deleting associated cards' });
					}
					console.log(`✅ Server: Deleted ${cards.length} associated ID cards`);
				}
			} else {
				// Unlink IDs (keep them but remove template association)
				const { error: updateError } = await (supabase as any)
					.from('idcards')
					.update({ template_id: null })
					.eq('template_id', templateId);

				if (updateError) {
					console.error('❌ Server: Error updating ID cards:', updateError);
					return fail(500, { message: 'Error updating ID cards' });
				}
				console.log('✅ Server: Unlinked associated ID cards');
			}

			// Delete the template
			const { error: deleteError } = await (supabase as any)
				.from('templates')
				.delete()
				.match({ id: templateId })
				.eq('user_id', session.user.id);

			if (deleteError) {
				console.error('❌ Server: Database error:', deleteError);
				return fail(500, { message: 'Error deleting template' });
			}

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
