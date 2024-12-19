// src/routes/dorm/tenants/+page.server.ts

import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { tenantSchema } from './formSchema';
import { supabase } from '$lib/supabaseClient';

export const load = async ({ locals }) => {
  const session = await locals.getSession();
  if (!session) {
    return fail(401, { message: 'Unauthorized' });
  }

  const [{ data: userRole }, { data: tenants }, { data: properties }, { data: rooms }, { data: users }] = await Promise.all([
    supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single(),

    supabase
      .from('tenants')
      .select(`
        *,
        property:properties(name),
        room:rooms(room_number, floor:floors(floor_number, wing)),
        user:profiles(full_name, email, phone),
        created_by_user:profiles!created_by(full_name)
      `)
      .order('contract_start_date', { ascending: false }),
    
    supabase
      .from('properties')
      .select('id, name')
      .eq('status', 'ACTIVE')
      .order('name'),

    supabase
      .from('rooms')
      .select('id, property_id, room_number, room_status')
      .in('room_status', ['VACANT', 'RESERVED'])
      .order('property_id, room_number'),

    supabase
      .from('profiles')
      .select('id, full_name, email, phone')
      .order('full_name')
  ]);

  const form = await superValidate(zod(tenantSchema));
  const isAdminLevel = ['super_admin', 'property_admin'].includes(userRole?.role || '');
  const isStaffLevel = ['property_manager', 'property_frontdesk'].includes(userRole?.role || '');

  return {
    form,
    tenants,
    properties,
    rooms,
    users,
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

    if (!['super_admin', 'property_admin', 'property_frontdesk'].includes(userRole?.role || '')) {
      return fail(403, { message: 'Insufficient permissions' });
    }

    const form = await superValidate(request, zod(tenantSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const { data: room } = await supabase
        .from('rooms')
        .select('room_status')
        .eq('id', form.data.room_id)
        .single();

      if (!room || !['VACANT', 'RESERVED'].includes(room.room_status)) {
        return fail(400, { 
          form,
          message: 'Selected room is not available for new tenants'
        });
      }

      // Start a transaction
      const { error: roomError } = await supabase
        .from('rooms')
        .update({ room_status: 'OCCUPIED' })
        .eq('id', form.data.room_id);

      if (roomError) throw roomError;

      const { error: tenantError } = await supabase
        .from('tenants')
        .insert({
          ...form.data,
          created_by: session.user.id
        });

      if (tenantError) {
        // Rollback room status if tenant creation fails
        await supabase
          .from('rooms')
          .update({ room_status: room.room_status })
          .eq('id', form.data.room_id);
        throw tenantError;
      }

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

    if (!['super_admin', 'property_admin'].includes(userRole?.role || '')) {
      return fail(403, { message: 'Insufficient permissions' });
    }

    const form = await superValidate(request, zod(tenantSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const { data: currentTenant } = await supabase
        .from('tenants')
        .select('room_id')
        .eq('id', form.data.id)
        .single();

      // If room is changing, update both old and new room statuses
      if (currentTenant && currentTenant.room_id !== form.data.room_id) {
        const { error: oldRoomError } = await supabase
          .from('rooms')
          .update({ room_status: 'VACANT' })
          .eq('id', currentTenant.room_id);

        if (oldRoomError) throw oldRoomError;

        const { error: newRoomError } = await supabase
          .from('rooms')
          .update({ room_status: 'OCCUPIED' })
          .eq('id', form.data.room_id);

        if (newRoomError) throw newRoomError;
      }

      const { error } = await supabase
        .from('tenants')
        .update({
          property_id: form.data.property_id,
          room_id: form.data.room_id,
          user_id: form.data.user_id,
          tenant_status: form.data.tenant_status,
          contract_start_date: form.data.contract_start_date,
          contract_end_date: form.data.contract_end_date,
          monthly_rate: form.data.monthly_rate,
          security_deposit: form.data.security_deposit,
          emergency_contact: form.data.emergency_contact,
          notes: form.data.notes
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

    const form = await superValidate(request, zod(tenantSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('room_id')
        .eq('id', form.data.id)
        .single();

      if (tenant) {
        // Update room status back to vacant
        const { error: roomError } = await supabase
          .from('rooms')
          .update({ room_status: 'VACANT' })
          .eq('id', tenant.room_id);

        if (roomError) throw roomError;
      }

      const { error } = await supabase
        .from('tenants')
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
