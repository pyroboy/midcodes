import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { floorSchema, type Floor, type FloorWithProperty } from './formSchema';
import type { Actions, PageServerLoad } from './$types';
import { checkAccess } from '$lib/utils/roleChecks';
import type { Database } from '$lib/database.types';

type DBFloor = Database['public']['Tables']['floors']['Row'];
type DBProperty = Database['public']['Tables']['properties']['Row'];

type FloorsResponse = DBFloor & {
  property: Pick<DBProperty, 'id' | 'name'>;
  rooms: Array<{
    id: number;
    number: string;
  }>;
};

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
  const { user, profile } = await safeGetSession();

  const hasAccess = checkAccess(profile?.role, 'staff');
  if (!hasAccess) {
    throw redirect(302, '/unauthorized');
  }

  const [floorsResult, propertiesResult] = await Promise.all([
    supabase
      .from('floors')
      .select(`
        *,
        property:properties!inner(
          id,
          name
        ),
        rooms:rooms!inner(
          id,
          number
        )
      `)
      .order('property_id, floor_number'),
    
    supabase
      .from('properties')
      .select('id, name')
      .order('name')
  ]);

  // Type assertion with proper type checking
  const floors = (floorsResult.data as FloorsResponse[] || []).map(floor => ({
    ...floor,
    property: {
      id: floor.property.id,
      name: floor.property.name
    },
    rooms: floor.rooms || []
  })) satisfies FloorWithProperty[];

  const properties = propertiesResult.data || [];

  const form = await superValidate(zod(floorSchema));
  const isAdminLevel = checkAccess(profile?.role, 'admin');
  const isStaffLevel = checkAccess(profile?.role, 'staff') && !isAdminLevel;

  return {
    form,
    floors,
    properties,
    user: {
      role: profile?.role || 'user'
    },
    isAdminLevel,
    isStaffLevel
  };
};

export const actions: Actions = {
  create: async ({ request, locals: { supabase, profile } }) => {
    const hasAccess = checkAccess(profile?.role, 'admin');
    if (!hasAccess) {
      return fail(403, { message: 'Insufficient permissions' });
    }

    const form = await superValidate(request, zod(floorSchema));
    console.log('CREATE', form);

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const { error } = await supabase
        .from('floors')
        .insert({
          property_id: form.data.property_id,
          floor_number: form.data.floor_number,
          wing: form.data.wing || null,
          status: form.data.status
        } satisfies Database['public']['Tables']['floors']['Insert']);

      if (error) throw error;
      return { form };
    } catch (err) {
      console.error('Error creating floor:', err);
      return fail(500, { form, message: 'Failed to create floor' });
    }
  },

  update: async ({ request, locals: { supabase, profile } }) => {
    const hasAccess = checkAccess(profile?.role, 'admin');
    if (!hasAccess) {
      return fail(403, { message: 'Insufficient permissions' });
    }

    const form = await superValidate(request, zod(floorSchema));
    console.log('UPDATE', form);

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const { error } = await supabase
        .from('floors')
        .update({
          property_id: form.data.property_id,
          floor_number: form.data.floor_number,
          wing: form.data.wing || null,
          status: form.data.status,
          updated_at: new Date().toISOString()
        } satisfies Database['public']['Tables']['floors']['Update'])
        .eq('id', form.data.id);

      if (error) throw error;
      return { form };
    } catch (err) {
      console.error('Error updating floor:', err);
      return fail(500, { form, message: 'Failed to update floor' });
    }
  },

  delete: async ({ request, locals: { supabase, profile } }) => {
    const hasAccess = checkAccess(profile?.role, 'admin');
    if (!hasAccess) {
      return fail(403, { message: 'Insufficient permissions' });
    }

    const form = await superValidate(request, zod(floorSchema));
    console.log('DELETE', form);

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const { error } = await supabase
        .from('floors')
        .delete()
        .eq('id', form.data.id);

      if (error) throw error;
      return { form };
    } catch (err) {
      console.error('Error deleting floor:', err);
      return fail(500, { form, message: 'Failed to delete floor' });
    }
  }
};