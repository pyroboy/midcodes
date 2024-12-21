// src/routes/dorm/tenants/+page.server.ts

import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { tenantSchema } from './formSchema';
import type { Actions, PageServerLoad } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import type { Database } from '$lib/database.types';

type Tenant = Database['public']['Tables']['tenants']['Row'];
type EmergencyContact = {
  name: string;
  relationship: string;
  phone: string;
  email: string;
  address: string;
};

type PaymentSchedule = {
  due_date: string;
  amount: number;
  type: 'RENT' | 'UTILITY' | 'MAINTENANCE';
  status: 'PENDING' | 'PAID' | 'OVERDUE';
};

export const load: PageServerLoad = async ({ locals: { getSession, supabase } }) => {
  const session = await getSession();

  if (!session) {
    throw error(401, { message: 'Unauthorized' });
  }

  const form = await superValidate(zod(tenantSchema));

  // Fetch properties for room selection
  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('*')
    .order('name');

  if (propertiesError) {
    console.error('Error fetching properties:', propertiesError);
    throw error(500, { message: 'Error fetching properties' });
  }

  // Fetch rooms for assignment
  const { data: rooms, error: roomsError } = await supabase
    .from('rooms')
    .select('*')
    .order('number');

  if (roomsError) {
    console.error('Error fetching rooms:', roomsError);
    throw error(500, { message: 'Error fetching rooms' });
  }

  // Fetch user profiles for admin/staff check
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*');

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    throw error(500, { message: 'Error fetching profiles' });
  }

  const userProfile = profiles.find(profile => profile.id === session.user.id);
  const isAdminLevel = userProfile?.role === 'ADMIN';
  const isStaffLevel = userProfile?.role === 'STAFF' || isAdminLevel;

  return {
    form,
    properties,
    rooms,
    profiles,
    isAdminLevel,
    isStaffLevel
  };
};

export const actions: Actions = {
  create: async ({ request, locals: { supabase, getSession } }) => {
    const session = await getSession();
    if (!session) {
      return fail(401, { message: 'Unauthorized' });
    }

    const formData = await superValidate(request, zod(tenantSchema));
    if (!formData.valid) {
      return fail(400, { form: formData });
    }

    try {
      // 1. Create tenant record
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: formData.data.name,
          contact_number: formData.data.contact_number,
          email: formData.data.email,
          auth_id: formData.data.auth_id,
          tenant_status: formData.data.tenant_status,
          created_by: session.user.id
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // 2. Create lease record
      const { error: leaseError } = await supabase
        .from('leases')
        .insert({
          tenant_id: tenant.id,
          location_id: formData.data.location_id,
          lease_type: formData.data.lease_type,
          lease_status: formData.data.lease_status,
          start_date: formData.data.start_date,
          end_date: formData.data.end_date,
          rent_amount: formData.data.rent_amount,
          security_deposit: formData.data.security_deposit,
          created_by: session.user.id
        });

      if (leaseError) throw leaseError;

      // 3. Create emergency contact record
      const emergencyContact = formData.data.emergency_contact as EmergencyContact;
      const { error: emergencyContactError } = await supabase
        .from('emergency_contacts')
        .insert({
          tenant_id: tenant.id,
          name: emergencyContact.name,
          relationship: emergencyContact.relationship,
          phone: emergencyContact.phone,
          email: emergencyContact.email,
          address: emergencyContact.address
        });

      if (emergencyContactError) throw emergencyContactError;

      // 4. Create initial status history record
      const { error: statusHistoryError } = await supabase
        .from('tenant_status_history')
        .insert({
          tenant_id: tenant.id,
          status: formData.data.tenant_status,
          changed_by: session.user.id,
          reason: 'Initial tenant creation'
        });

      if (statusHistoryError) throw statusHistoryError;

      // 5. Update room status if location is assigned
      if (formData.data.location_id) {
        const { error: roomError } = await supabase
          .from('rooms')
          .update({ room_status: 'OCCUPIED' })
          .eq('id', formData.data.location_id);

        if (roomError) throw roomError;
      }

      // 6. Create payment schedules if provided
      const paymentSchedules = formData.data.payment_schedules as PaymentSchedule[] | undefined;
      if (paymentSchedules?.length) {
        const { error: paymentScheduleError } = await supabase
          .from('payment_schedules')
          .insert(
            paymentSchedules.map(schedule => ({
              tenant_id: tenant.id,
              due_date: schedule.due_date,
              amount: schedule.amount,
              type: schedule.type,
              status: schedule.status
            }))
          );

        if (paymentScheduleError) throw paymentScheduleError;
      }

      return { form: formData };
    } catch (err) {
      console.error('Error creating tenant:', err);
      return fail(500, {
        form: formData,
        message: 'Error creating tenant. Transaction rolled back.'
      });
    }
  },

  update: async ({ request, locals: { supabase, getSession } }) => {
    const session = await getSession();
    if (!session) {
      return fail(401, { message: 'Unauthorized' });
    }

    const formData = await superValidate(request, zod(tenantSchema));
    if (!formData.valid) {
      return fail(400, { form: formData });
    }

    try {
      // Get current tenant data for comparison
      const { data: currentTenant, error: currentTenantError } = await supabase
        .from('tenants')
        .select(`
          *,
          lease:leases (
            id,
            location_id,
            status
          )
        `)
        .eq('id', formData.data.id)
        .single();

      if (currentTenantError) throw currentTenantError;

      // Update tenant record
      const { error: tenantError } = await supabase
        .from('tenants')
        .update({
          name: formData.data.name,
          contact_number: formData.data.contact_number,
          email: formData.data.email,
          auth_id: formData.data.auth_id,
          tenant_status: formData.data.tenant_status,
          updated_at: new Date().toISOString()
        })
        .eq('id', formData.data.id);

      if (tenantError) throw tenantError;

      // Handle room status updates
      if (currentTenant?.lease?.location_id !== formData.data.location_id) {
        // Update old room to VACANT if it exists
        if (currentTenant?.lease?.location_id) {
          const { error: oldRoomError } = await supabase
            .from('rooms')
            .update({ room_status: 'VACANT' })
            .eq('id', currentTenant.lease.location_id);

          if (oldRoomError) throw oldRoomError;
        }

        // Update new room to OCCUPIED if it exists
        if (formData.data.location_id) {
          const { error: newRoomError } = await supabase
            .from('rooms')
            .update({ room_status: 'OCCUPIED' })
            .eq('id', formData.data.location_id);

          if (newRoomError) throw newRoomError;
        }
      }

      // Update lease status and handle room status
      if (formData.data.lease_status === 'TERMINATED' || formData.data.lease_status === 'EXPIRED') {
        // Set room to VACANT if lease is terminated or expired
        if (currentTenant?.lease?.location_id) {
          const { error: roomError } = await supabase
            .from('rooms')
            .update({ room_status: 'VACANT' })
            .eq('id', currentTenant.lease.location_id);

          if (roomError) throw roomError;
        }
      }

      // Update lease record
      const { error: leaseError } = await supabase
        .from('leases')
        .update({
          location_id: formData.data.location_id,
          lease_type: formData.data.lease_type,
          lease_status: formData.data.lease_status,
          start_date: formData.data.start_date,
          end_date: formData.data.end_date,
          rent_amount: formData.data.rent_amount,
          security_deposit: formData.data.security_deposit,
          updated_at: new Date().toISOString()
        })
        .eq('tenant_id', formData.data.id);

      if (leaseError) throw leaseError;

      // 3. Update emergency contact record
      const emergencyContact = formData.data.emergency_contact as EmergencyContact;
      const { error: emergencyContactError } = await supabase
        .from('emergency_contacts')
        .update({
          name: emergencyContact.name,
          relationship: emergencyContact.relationship,
          phone: emergencyContact.phone,
          email: emergencyContact.email,
          address: emergencyContact.address
        })
        .eq('tenant_id', formData.data.id);

      if (emergencyContactError) throw emergencyContactError;

      // 4. Add status history record if status changed
      const statusHistory = formData.data.status_history as { status: string; reason: string }[] | undefined;
      if (statusHistory?.length) {
        const latestStatus = statusHistory[statusHistory.length - 1];
        const { error: statusHistoryError } = await supabase
          .from('tenant_status_history')
          .insert({
            tenant_id: formData.data.id,
            status: latestStatus.status,
            changed_by: session.user.id,
            reason: latestStatus.reason
          });

        if (statusHistoryError) throw statusHistoryError;
      }

      // 5. Update room statuses
      const { data: currentLease } = await supabase
        .from('leases')
        .select('location_id')
        .eq('tenant_id', formData.data.id)
        .single();

      if (currentLease && currentLease.location_id !== formData.data.location_id) {
        // Update old room to vacant
        if (currentLease.location_id) {
          const { error: oldRoomError } = await supabase
            .from('rooms')
            .update({ room_status: 'VACANT' })
            .eq('id', currentLease.location_id);

          if (oldRoomError) throw oldRoomError;
        }

        // Update new room to occupied
        if (formData.data.location_id) {
          const { error: newRoomError } = await supabase
            .from('rooms')
            .update({ room_status: 'OCCUPIED' })
            .eq('id', formData.data.location_id);

          if (newRoomError) throw newRoomError;
        }
      }

      // 6. Update payment schedules
      const paymentSchedules = formData.data.payment_schedules as PaymentSchedule[] | undefined;
      if (paymentSchedules?.length) {
        // Delete existing schedules
        const { error: deleteScheduleError } = await supabase
          .from('payment_schedules')
          .delete()
          .eq('tenant_id', formData.data.id);

        if (deleteScheduleError) throw deleteScheduleError;

        // Insert new schedules
        const { error: paymentScheduleError } = await supabase
          .from('payment_schedules')
          .insert(
            paymentSchedules.map(schedule => ({
              tenant_id: formData.data.id,
              due_date: schedule.due_date,
              amount: schedule.amount,
              type: schedule.type,
              status: schedule.status
            }))
          );

        if (paymentScheduleError) throw paymentScheduleError;
      }

      return { form: formData };
    } catch (err) {
      console.error('Error updating tenant:', err);
      return fail(500, {
        form: formData,
        message: 'Error updating tenant. Transaction rolled back.'
      });
    }
  }
};
