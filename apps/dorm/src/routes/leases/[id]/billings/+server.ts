import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url, locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();
  if (!user) throw error(401, 'Unauthorized');

  const leaseId = params.id;
  const year = url.searchParams.get('year');
  const type = url.searchParams.get('type');

  if (!year || !type) {
    throw error(400, 'Year and type are required query parameters.');
  }

  try {
    const { data, error: dbError } = await supabase
      .from('billings')
      .select('*')
      .eq('lease_id', leaseId)
      .eq('type', type)
      .gte('billing_date', `${year}-01-01`)
      .lte('billing_date', `${year}-12-31`);

    if (dbError) {
      throw error(500, `Database error: ${dbError.message}`);
    }

    return json(data);
  } catch (err) {
    if (err instanceof Error) {
        throw error(500, err.message);
    }
    throw error(500, 'An unexpected error occurred.');
  }
};
