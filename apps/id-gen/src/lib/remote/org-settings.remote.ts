import { error } from '@sveltejs/kit';
import { query, command, getRequestEvent } from '$app/server';
import { 
  orgSettingsSchema, 
  orgSettingsUpdateSchema,
  type OrgSettings,
  type OrgSettingsUpdate 
} from '$lib/schemas/organization.schema';

// Audit metadata type for org settings operations
interface OrgSettingsAuditMetadata {
  previous_values: any;
  new_values: {
    org_id: string;
    updated_by: string;
    payments_enabled?: boolean;
    payments_bypass?: boolean;
  };
  operation?: 'created' | 'updated';
}

// Helper function to check admin permissions for org settings
async function requireOrgSettingsPermissions() {
  const { locals } = getRequestEvent();
  const { user } = locals;

  if (!user?.role || !['super_admin', 'org_admin'].includes(user.role)) {
    throw error(403, 'Access denied. Organization admin privileges required.');
  }

  return { user, supabase: locals.supabase, org_id: locals.org_id };
}

// Helper function to insert admin audit log
async function logAdminAction(
  supabase: any,
  orgId: string,
  adminId: string,
  action: string,
  targetId?: string,
  metadata?: any
) {
  await supabase.from('admin_audit').insert({
    org_id: orgId,
    admin_id: adminId,
    action,
    target_type: 'org_settings',
    target_id: targetId,
    metadata: metadata || {},
    created_at: new Date().toISOString()
  });
}

/**
 * Query to get organization settings
 */
export const getOrgSettings = query(async (): Promise<OrgSettings | null> => {
  const { user, supabase, org_id } = await requireOrgSettingsPermissions();

  if (!org_id) {
    throw error(500, 'Organization ID not found');
  }

  try {
    const { data, error: fetchError } = await supabase
      .from('org_settings')
      .select('*')
      .eq('org_id', org_id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        // No settings found, return default values
        return {
          org_id,
          payments_enabled: false,
          payments_bypass: false,
          updated_by: null,
          updated_at: new Date().toISOString()
        };
      }
      console.error('Error fetching org settings:', fetchError);
      throw error(500, 'Failed to load organization settings');
    }

    // Validate the response data
    const validationResult = orgSettingsSchema.safeParse(data);
    if (!validationResult.success) {
      console.error('Invalid org settings data from database:', validationResult.error);
      throw error(500, 'Invalid organization settings data');
    }

    return validationResult.data;
  } catch (err) {
    console.error('Error in getOrgSettings:', err);
    if (err instanceof Error && err.message.includes('error')) {
      throw err; // Re-throw SvelteKit errors
    }
    throw error(500, 'Failed to load organization settings');
  }
});

/**
 * Command to update organization settings
 */
export const updateOrgSettings = command('unchecked', async (settingsUpdate: any) => {
  const { user, supabase, org_id } = await requireOrgSettingsPermissions();

  if (!org_id) {
    throw error(500, 'Organization ID not found');
  }

  try {
    // Validate input data
    const validationResult = orgSettingsUpdateSchema.safeParse({
      ...settingsUpdate,
      org_id,
      updated_by: user.id
    });

    if (!validationResult.success) {
      console.error('Invalid org settings update data:', validationResult.error);
      throw error(400, 'Invalid organization settings data');
    }

    const updateData = validationResult.data;

    // Check if settings exist
    const { data: existingSettings, error: fetchError } = await supabase
      .from('org_settings')
      .select('*')
      .eq('org_id', org_id)
      .single();

    let result;
    const auditMetadata: OrgSettingsAuditMetadata = {
      previous_values: existingSettings || null,
      new_values: updateData
    };

    if (fetchError && fetchError.code === 'PGRST116') {
      // No existing settings, create new
      const newSettings = {
        org_id,
        payments_enabled: updateData.payments_enabled ?? false,
        payments_bypass: updateData.payments_bypass ?? false,
        updated_by: updateData.updated_by,
        updated_at: new Date().toISOString()
      };

      const { data, error: insertError } = await supabase
        .from('org_settings')
        .insert(newSettings)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating org settings:', insertError);
        throw error(500, 'Failed to create organization settings');
      }

      result = data;
      auditMetadata.operation = 'created';
    } else if (fetchError) {
      console.error('Error fetching existing org settings:', fetchError);
      throw error(500, 'Failed to check existing organization settings');
    } else {
      // Update existing settings
      const updatePayload: any = {
        updated_by: updateData.updated_by,
        updated_at: new Date().toISOString()
      };

      if (updateData.payments_enabled !== undefined) {
        updatePayload.payments_enabled = updateData.payments_enabled;
      }
      if (updateData.payments_bypass !== undefined) {
        updatePayload.payments_bypass = updateData.payments_bypass;
      }

      const { data, error: updateError } = await supabase
        .from('org_settings')
        .update(updatePayload)
        .eq('org_id', org_id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating org settings:', updateError);
        throw error(500, 'Failed to update organization settings');
      }

      result = data;
      auditMetadata.operation = 'updated';
    }

    // Log the admin action
    await logAdminAction(
      supabase,
      org_id,
      user.id,
      'org_settings_updated',
      org_id,
      auditMetadata
    );

    // Refresh the query to ensure UI consistency
    await getOrgSettings().refresh();

    return {
      success: true,
      message: 'Organization settings updated successfully',
      data: result
    };
  } catch (err) {
    console.error('Error in updateOrgSettings:', err);
    if (err instanceof Error && err.message.includes('error')) {
      throw err; // Re-throw SvelteKit errors
    }
    throw error(500, 'Failed to update organization settings');
  }
});

/**
 * Query to get organization settings audit trail
 */
export const getOrgSettingsAudit = query(async () => {
  const { user, supabase, org_id } = await requireOrgSettingsPermissions();

  if (!org_id) {
    throw error(500, 'Organization ID not found');
  }

  try {
    const { data, error: fetchError } = await supabase
      .from('admin_audit')
      .select(`
        id,
        action,
        created_at,
        metadata,
        profiles:admin_id (
          id,
          email
        )
      `)
      .eq('org_id', org_id)
      .eq('target_type', 'org_settings')
      .order('created_at', { ascending: false })
      .limit(50);

    if (fetchError) {
      console.error('Error fetching org settings audit:', fetchError);
      throw error(500, 'Failed to load settings audit trail');
    }

    return data || [];
  } catch (err) {
    console.error('Error in getOrgSettingsAudit:', err);
    if (err instanceof Error && err.message.includes('error')) {
      throw err; // Re-throw SvelteKit errors
    }
    throw error(500, 'Failed to load settings audit trail');
  }
});

/**
 * Query to check if payments are enabled for the organization
 */
export const arePaymentsEnabled = query(async (): Promise<boolean> => {
  try {
    const settings = await getOrgSettings();
    return settings?.payments_enabled || false;
  } catch (err) {
    // If we can't fetch settings, default to disabled for safety
    console.warn('Could not check payment settings, defaulting to disabled:', err);
    return false;
  }
});

/**
 * Query to check if payment bypass is enabled for the organization
 */
export const isPaymentBypassEnabled = query(async (): Promise<boolean> => {
  try {
    const settings = await getOrgSettings();
    return settings?.payments_bypass || false;
  } catch (err) {
    // If we can't fetch settings, default to disabled for safety
    console.warn('Could not check payment bypass settings, defaulting to disabled:', err);
    return false;
  }
});
