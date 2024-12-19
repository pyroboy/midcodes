import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { floorSchema } from './formSchema';
import { supabase } from '$lib/supabaseClient';

export const load = async ({ locals }) => {
  const session = await locals.getSession();
  if (!session) {
    return fail(401, { message: 'Unauthorized' });
  }

  const [{ data: floors }, { data: properties }, { data: userRole }] = await Promise.all([
    supabase
      .from('floors')
      .select('*, property:properties(name)')
      .order('property_id, floor_number'),
    
    supabase
      .from('properties')
      .select('id, name')
      .eq('status', 'ACTIVE')
      .order('name'),

    supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
  ]);

  const form = await superValidate(zod(floorSchema));
  const isAdminLevel = ['super_admin', 'property_admin'].includes(userRole?.role || '');
  const isStaffLevel = ['property_manager', 'property_maintenance'].includes(userRole?.role || '');

  return {
    form,
    floors,
    properties,
    userRole: userRole?.role || 'user',
    isAdminLevel,
    isStaffLevel
  };
};

export const actions = {
  create: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!session) {
      return fail(401, { message: 'Unauthorized' });
    }

    const { data: userRole } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!['super_admin', 'property_admin', 'property_manager'].includes(userRole?.role || '')) {
      return fail(403, { message: 'Insufficient permissions' });
    }

    const form = await superValidate(request, zod(floorSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const { error } = await supabase
        .from('floors')
        .insert({
          property_id: form.data.property_id,
          floor_number: form.data.floor_number,
          wing: form.data.wing,
          status: form.data.status
        });

      if (error) throw error;
      return { form };
    } catch (err) {
      console.error(err);
      return fail(500, { form });
    }
  },

  update: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!session) {
      return fail(401, { message: 'Unauthorized' });
    }

    const { data: userRole } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!['super_admin', 'property_admin', 'property_manager'].includes(userRole?.role || '')) {
      return fail(403, { message: 'Insufficient permissions' });
    }

    const form = await superValidate(request, zod(floorSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const { error } = await supabase
        .from('floors')
        .update({
          property_id: form.data.property_id,
          floor_number: form.data.floor_number,
          wing: form.data.wing,
          status: form.data.status
        })
        .eq('id', form.data.id);

      if (error) throw error;
      return { form };
    } catch (err) {
      console.error(err);
      return fail(500, { form });
    }
  },

  delete: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!session) {
      return fail(401, { message: 'Unauthorized' });
    }

    const { data: userRole } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!['super_admin', 'property_admin'].includes(userRole?.role || '')) {
      return fail(403, { message: 'Insufficient permissions' });
    }

    const form = await superValidate(request, zod(floorSchema));

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
      console.error(err);
      return fail(500, { form });
    }
  }
};
