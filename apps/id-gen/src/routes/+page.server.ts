import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
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

	if (!effectiveOrgId) {
		return {
			recentCards: [],
			totalCards: 0,
			totalTemplates: 0,
			weeklyCards: 0,
			error: null
		};
	}

	// Get enhanced statistics for the dashboard
	const { data: recentCardsData, error: cardsError } = await supabase
		.from('idcards')
		.select(`
			id, 
			template_id, 
			front_image, 
			back_image, 
			created_at, 
			data
		`)
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
				templateNames = safeTemplates.reduce((acc, template: any) => {
					acc[template.id] = template.name;
					return acc;
				}, {} as Record<number, string>);
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
		recentCards: enhancedRecentCards,
		totalCards: totalCards || 0,
		totalTemplates: totalTemplates || 0,
		weeklyCards: weeklyCards || 0,
		error: cardsError || countError || templatesError || weeklyError
	};
};
