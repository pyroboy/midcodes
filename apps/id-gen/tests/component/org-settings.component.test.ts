import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import '@testing-library/jest-dom';

// Mock the remote functions
vi.mock('$lib/remote/org-settings.remote', () => ({
  getOrgSettings: vi.fn(),
  updateOrgSettings: vi.fn(),
  arePaymentsEnabled: vi.fn(),
  isPaymentBypassEnabled: vi.fn()
}));

import OrgSettingsForm from './OrgSettingsForm.test.svelte';

describe('Organization Settings Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('OrgSettingsForm Component', () => {
    it('should render form with payment settings toggles', () => {
      render(OrgSettingsForm, {
        props: {
          settings: {
            org_id: 'test-org-id',
            payments_enabled: false,
            payments_bypass: false,
            updated_by: null,
            updated_at: new Date().toISOString()
          },
          loading: false,
          userRole: 'org_admin'
        }
      });

      expect(screen.getByText('Organization Payment Settings')).toBeInTheDocument();
      expect(screen.getByLabelText('Enable Payments')).toBeInTheDocument();
      expect(screen.getByLabelText('Payment Bypass')).toBeInTheDocument();
    });

    it('should disable form for unauthorized users', () => {
      render(OrgSettingsForm, {
        props: {
          settings: {
            org_id: 'test-org-id',
            payments_enabled: false,
            payments_bypass: false,
            updated_by: null,
            updated_at: new Date().toISOString()
          },
          loading: false,
          userRole: 'id_gen_user'
        }
      });

      const paymentsToggle = screen.getByLabelText('Enable Payments') as HTMLInputElement;
      const bypassToggle = screen.getByLabelText('Payment Bypass') as HTMLInputElement;
      
      expect(paymentsToggle.disabled).toBe(true);
      expect(bypassToggle.disabled).toBe(true);
    });

    it('should enable form for org_admin users', () => {
      render(OrgSettingsForm, {
        props: {
          settings: {
            org_id: 'test-org-id',
            payments_enabled: true,
            payments_bypass: false,
            updated_by: null,
            updated_at: new Date().toISOString()
          },
          loading: false,
          userRole: 'org_admin'
        }
      });

      const paymentsToggle = screen.getByLabelText('Enable Payments') as HTMLInputElement;
      const bypassToggle = screen.getByLabelText('Payment Bypass') as HTMLInputElement;
      
      expect(paymentsToggle.disabled).toBe(false);
      expect(bypassToggle.disabled).toBe(false);
      expect(paymentsToggle.checked).toBe(true);
      expect(bypassToggle.checked).toBe(false);
    });

    it('should enable form for super_admin users', () => {
      render(OrgSettingsForm, {
        props: {
          settings: {
            org_id: 'test-org-id',
            payments_enabled: false,
            payments_bypass: true,
            updated_by: null,
            updated_at: new Date().toISOString()
          },
          loading: false,
          userRole: 'super_admin'
        }
      });

      const paymentsToggle = screen.getByLabelText('Enable Payments') as HTMLInputElement;
      const bypassToggle = screen.getByLabelText('Payment Bypass') as HTMLInputElement;
      
      expect(paymentsToggle.disabled).toBe(false);
      expect(bypassToggle.disabled).toBe(false);
      expect(paymentsToggle.checked).toBe(false);
      expect(bypassToggle.checked).toBe(true);
    });

    it('should show loading state', () => {
      render(OrgSettingsForm, {
        props: {
          settings: {
            org_id: 'test-org-id',
            payments_enabled: false,
            payments_bypass: false,
            updated_by: null,
            updated_at: new Date().toISOString()
          },
          loading: true,
          userRole: 'org_admin'
        }
      });

      expect(screen.getByText('Loading settings...')).toBeInTheDocument();
    });

    it('should emit update event when settings change', async () => {
      // Track event emissions
      let emittedEvent: any = null;
      const mockUpdateHandler = vi.fn((event: CustomEvent) => {
        emittedEvent = event.detail;
      });

      const { component } = render(OrgSettingsForm, {
        props: {
          settings: {
            org_id: 'test-org-id',
            payments_enabled: false,
            payments_bypass: false,
            updated_by: null,
            updated_at: new Date().toISOString()
          },
          loading: false,
          userRole: 'super_admin'
        }
      });

      // In Svelte 5, we need to add the event listener to the DOM element
      const componentElement = component.$$.root;
      componentElement.addEventListener('update', mockUpdateHandler);

      const paymentsToggle = screen.getByLabelText('Enable Payments') as HTMLInputElement;
      
      // Toggle the payments setting
      await fireEvent.click(paymentsToggle);

      await waitFor(() => {
        expect(mockUpdateHandler).toHaveBeenCalled();
        expect(emittedEvent).toEqual({
          payments_enabled: true,
          payments_bypass: false
        });
      });

      // Cleanup
      componentElement.removeEventListener('update', mockUpdateHandler);
    });

    it('should display warning for payment bypass', () => {
      render(OrgSettingsForm, {
        props: {
          settings: {
            org_id: 'test-org-id',
            payments_enabled: false,
            payments_bypass: true,
            updated_by: null,
            updated_at: new Date().toISOString()
          },
          loading: false,
          userRole: 'super_admin'
        }
      });

      expect(screen.getByText(/Warning: Payment bypass is enabled/)).toBeInTheDocument();
    });

    it('should validate boolean values correctly', async () => {
      const component = render(OrgSettingsForm, {
        props: {
          settings: {
            org_id: 'test-org-id',
            payments_enabled: false,
            payments_bypass: false,
            updated_by: null,
            updated_at: new Date().toISOString()
          },
          loading: false,
          userRole: 'org_admin'
        }
      });

      const paymentsToggle = screen.getByLabelText('Enable Payments') as HTMLInputElement;
      const bypassToggle = screen.getByLabelText('Payment Bypass') as HTMLInputElement;

      // Initial state
      expect(paymentsToggle.checked).toBe(false);
      expect(bypassToggle.checked).toBe(false);

      // Toggle payments
      await fireEvent.click(paymentsToggle);
      expect(paymentsToggle.checked).toBe(true);

      // Toggle bypass
      await fireEvent.click(bypassToggle);
      expect(bypassToggle.checked).toBe(true);

      // Toggle back
      await fireEvent.click(paymentsToggle);
      await fireEvent.click(bypassToggle);
      expect(paymentsToggle.checked).toBe(false);
      expect(bypassToggle.checked).toBe(false);
    });

    it('should handle null settings gracefully', () => {
      render(OrgSettingsForm, {
        props: {
          settings: null,
          loading: false,
          userRole: 'org_admin'
        }
      });

      expect(screen.getByText('No settings available')).toBeInTheDocument();
    });

    it('should display last updated information', () => {
      const testDate = '2024-08-22T10:30:00Z';
      render(OrgSettingsForm, {
        props: {
          settings: {
            org_id: 'test-org-id',
            payments_enabled: true,
            payments_bypass: false,
            updated_by: 'user-123',
            updated_at: testDate
          },
          loading: false,
          userRole: 'super_admin'
        }
      });

      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate required org_id', () => {
      const invalidSettings = {
        org_id: '', // Invalid - empty string
        payments_enabled: true,
        payments_bypass: false,
        updated_by: null,
        updated_at: new Date().toISOString()
      };

      render(OrgSettingsForm, {
        props: {
          settings: invalidSettings,
          loading: false,
          userRole: 'org_admin'
        }
      });

      expect(screen.getByText('Invalid organization ID')).toBeInTheDocument();
    });

    it('should validate boolean payment settings', () => {
      // Mock settings with invalid boolean values
      const invalidSettings = {
        org_id: 'test-org-id',
        payments_enabled: 'true' as any, // Invalid - string instead of boolean
        payments_bypass: 1 as any, // Invalid - number instead of boolean
        updated_by: null,
        updated_at: new Date().toISOString()
      };

      render(OrgSettingsForm, {
        props: {
          settings: invalidSettings,
          loading: false,
          userRole: 'org_admin'
        }
      });

      expect(screen.getByText('Invalid payment settings')).toBeInTheDocument();
    });
  });

  describe('User Experience', () => {
    it('should show appropriate help text for each setting', () => {
      render(OrgSettingsForm, {
        props: {
          settings: {
            org_id: 'test-org-id',
            payments_enabled: false,
            payments_bypass: false,
            updated_by: null,
            updated_at: new Date().toISOString()
          },
          loading: false,
          userRole: 'org_admin'
        }
      });

      expect(screen.getByText(/Controls whether payment processing is active/)).toBeInTheDocument();
      expect(screen.getByText(/Allows bypassing payment requirements/)).toBeInTheDocument();
    });

    it('should show different states based on settings combination', () => {
      const testCases = [
        {
          name: 'Free tier (no payments, no bypass)',
          settings: { payments_enabled: false, payments_bypass: false },
          expectedText: 'Free tier configuration'
        },
        {
          name: 'Paid tier (payments enabled, no bypass)',
          settings: { payments_enabled: true, payments_bypass: false },
          expectedText: 'Standard paid configuration'
        },
        {
          name: 'Development mode (no payments, bypass enabled)',
          settings: { payments_enabled: false, payments_bypass: true },
          expectedText: 'Development/testing configuration'
        },
        {
          name: 'Premium with bypass (payments enabled, bypass enabled)',
          settings: { payments_enabled: true, payments_bypass: true },
          expectedText: 'Premium configuration with bypass'
        }
      ];

      testCases.forEach(({ name, settings, expectedText }) => {
        const { unmount } = render(OrgSettingsForm, {
          props: {
            settings: {
              org_id: 'test-org-id',
              ...settings,
              updated_by: null,
              updated_at: new Date().toISOString()
            },
            loading: false,
            userRole: 'super_admin'
          }
        });

        expect(screen.getByText(expectedText)).toBeInTheDocument();
        unmount();
      });
    });

    it('should handle keyboard navigation', async () => {
      render(OrgSettingsForm, {
        props: {
          settings: {
            org_id: 'test-org-id',
            payments_enabled: false,
            payments_bypass: false,
            updated_by: null,
            updated_at: new Date().toISOString()
          },
          loading: false,
          userRole: 'org_admin'
        }
      });

      const paymentsToggle = screen.getByLabelText('Enable Payments') as HTMLInputElement;
      const bypassToggle = screen.getByLabelText('Payment Bypass') as HTMLInputElement;

      // Test Tab navigation
      paymentsToggle.focus();
      expect(document.activeElement).toBe(paymentsToggle);

      // Test Space key to toggle
      await fireEvent.keyDown(paymentsToggle, { key: ' ' });
      await waitFor(() => {
        expect(paymentsToggle.checked).toBe(true);
      });

      // Test Enter key navigation
      await fireEvent.keyDown(paymentsToggle, { key: 'Tab' });
      bypassToggle.focus();
      await fireEvent.keyDown(bypassToggle, { key: 'Enter' });
      await waitFor(() => {
        expect(bypassToggle.checked).toBe(true);
      });
    });
  });
});
