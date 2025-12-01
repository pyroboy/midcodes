import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

    const propertyId = params.id;

    // 1. Fetch Floors
    const { data: floors } = await supabase
        .from('floors')
        .select('*')
        .eq('property_id', propertyId)
        .eq('status', 'ACTIVE')
        .order('floor_number');

    // 2. Fetch Rental Units with Active Leases and Tenants
    const { data: rentalUnits } = await supabase
        .from('rental_unit')
        .select(`
			*,
			leases(
				status,
				lease_tenants(
					tenant:tenants(
						id, name, profile_picture_url, deleted_at
					)
				)
			),
			meters(*)
		`)
        .eq('property_id', propertyId)
        // We filter for units that are active in the system
        .in('rental_unit_status', ['OCCUPIED', 'VACANT', 'RESERVED']);

    // Filter leases in memory to ensure we only get ACTIVE ones for visualization
    const processedUnits = rentalUnits?.map(unit => ({
        ...unit,
        active_leases: unit.leases.filter((l: any) => l.status === 'ACTIVE')
    })) || [];

    return json({
        floors: floors || [],
        rentalUnits: processedUnits
    });
};
