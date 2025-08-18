# QA Checklist and Rollout Plan - Payment System with Admin Controls

## Overview
This document outlines the manual QA testing procedures and deployment strategy for the payment system with admin controls, including payment toggles and bypass functionality.

## Pre-Rollout Status ✅

### Database Setup
- ✅ `org_settings` table exists with required columns
- ✅ `credit_transactions` table for audit trails
- ✅ User profiles with role-based access control
- ✅ Super admin user: `arjomagno@gmail.com`

### Implementation Status
- ✅ Admin dashboard with payment controls (`/admin`)
- ✅ Credit management page (`/admin/credits`)
- ✅ Payment remote functions with bypass logic
- ✅ Feature flag store for client-side state
- ✅ Role-based access control enforcement
- ✅ Structured logging for all admin actions

---

## Manual QA Checklist

### 🔐 Super Admin Testing (`role: super_admin`)

#### Access /admin Dashboard
- [ ] **Verify Payment Card Display**
  - Navigate to `/admin`
  - Confirm "Payments" card shows current state (Enabled/Disabled)
  - Verify bypass status display (On/Off)
  - Check that toggle controls are visible

#### Test Payment Toggle Security
- [ ] **Invalid Keyword Protection**
  - Type incorrect keyword (e.g., "test", "toggle", "wrong")
  - Confirm toggle button remains disabled
  - Verify no API calls are made with invalid keywords

- [ ] **Valid Keyword Toggle**
  - Clear input field
  - Type exactly `TOGGLE_PAYMENTS` (case-sensitive)
  - Confirm toggle button becomes enabled
  - Click "Disable Payments" (if currently enabled)
  - Verify immediate UI update showing "Disabled" status
  - Check browser console for successful API log

#### Test Bypass Functionality
- [ ] **Enable Bypass Mode**
  - With payments disabled, click "Enable Bypass"
  - Confirm button changes to "Disable Bypass"
  - Verify bypass status shows "On (simulated)"

- [ ] **Execute Bypass Purchase Flow**
  - Navigate to `/pricing`
  - Verify payment buttons show normally (bypass overrides disabled payments)
  - Select a credit package (e.g., "Starter - 25 Credits")
  - Click "Purchase Credits"
  - **Expected Result**: Immediate redirect to success page
  - **Verify**: Credits added instantly to user balance
  - **Verify**: New record in `credit_transactions` with `metadata.bypass = true`

#### Test Re-enabling Payments
- [ ] **Disable Bypass and Re-enable Payments**
  - Return to `/admin`
  - Click "Disable Bypass"
  - Type `TOGGLE_PAYMENTS` again
  - Click "Enable Payments"
  - Verify status shows "Enabled" and bypass shows "Off"

#### Test Credit Management
- [ ] **Manual Credit Adjustment**
  - Navigate to `/admin/credits`
  - Find a test user in the list
  - Enter `+10` in the credits field
  - Add reason: "QA Testing - Manual Addition"
  - Click "Apply"
  - **Verify**: User balance increased by 10
  - **Verify**: New transaction record created
  - **Verify**: Page refreshes with updated balance

### 🏢 Org Admin Testing (`role: org_admin`)

#### Access Control Verification
- [ ] **Limited Admin Access**
  - Login as org_admin user
  - Navigate to `/admin`
  - **Verify**: Payment toggle controls are NOT visible
  - **Verify**: Other admin functions work normally

- [ ] **Credit Management Restriction**
  - Attempt to navigate to `/admin/credits`
  - **Expected Result**: 403 Forbidden error
  - **Verify**: Cannot access manual credit adjustment features

### 👤 Regular User Testing (`role: id_gen_user`)

#### Payment Disabled Experience
- [ ] **Pricing Page with Payments Disabled**
  - Ensure payments are disabled via admin panel
  - Login as regular user
  - Navigate to `/pricing`
  - **Verify**: Orange warning banner appears
  - **Verify**: All purchase buttons show "Contact admin for provisioning"
  - **Verify**: Buttons are disabled/inactive

- [ ] **Direct Payment Route Protection**
  - Attempt to access payment endpoints directly via browser/curl
  - **Expected Result**: 404/403 errors or hidden functionality
  - **Verify**: No bypass of disabled payment state

#### Normal Payment Experience
- [ ] **Pricing Page with Payments Enabled**
  - Ensure payments are enabled via admin panel
  - Refresh `/pricing` page
  - **Verify**: No warning banners
  - **Verify**: Purchase buttons are active and functional
  - **Verify**: Can initiate normal payment flow

#### Credit Usage Verification
- [ ] **Card Generation Still Works**
  - Navigate to card generator
  - Create and generate an ID card
  - **Verify**: Credit deduction works regardless of payment toggle state
  - **Verify**: No impact on existing functionality

---

## Rollout Strategy

### Phase 1: Database Migration ✅
- **Status**: Already deployed
- **Verification**: `org_settings` table exists with required columns
- **Rollback**: No action needed (table already exists)

### Phase 2: Deploy Server Remote Functions
- **Files to deploy**:
  - `src/routes/admin/billing.remote.ts`
  - `src/lib/server/remotes/payments.remote.ts`
  - Any related server-side utilities

- **Deployment order**:
  1. Deploy remote functions first
  2. Test API endpoints manually
  3. Verify logging and error handling

- **Verification**:
  ```bash
  # Test billing settings endpoint
  curl -X POST /api/admin/billing/settings \
    -H "Authorization: Bearer <admin_token>" \
    -H "Content-Type: application/json"
  ```

### Phase 3: Deploy UI Updates
- **Files to deploy**:
  - `src/routes/admin/+page.svelte`
  - `src/routes/admin/credits/+page.svelte`
  - `src/routes/pricing/+page.svelte`
  - `src/routes/pricing/+page.server.ts`
  - `src/lib/stores/featureFlags.ts`

- **Default behavior**: Payments remain enabled (no downtime)

### Phase 4: Verification and Monitoring
- [ ] Run full QA checklist
- [ ] Monitor application logs for errors
- [ ] Verify no impact on existing user workflows

---

## Observability and Monitoring

### Logging Standards ✅
All toggle and manual adjustment operations already emit structured logs:

```typescript
console.info('[Payment Command]', {
  action: 'payment_toggle_changed',
  userId: user.id,
  enabled: boolean,
  updated_by: user.id,
  timestamp: new Date().toISOString()
});
```

### Optional: Admin Audit Table
For enhanced audit trails, consider adding:

```sql
CREATE TABLE admin_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  admin_id UUID NOT NULL REFERENCES profiles(id),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50), -- 'payment_toggle', 'credit_adjustment', etc.
  target_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Monitoring Alerts
Set up alerts for:
- [ ] Payment toggle changes (especially disabling)
- [ ] Large manual credit adjustments (>100 credits)
- [ ] Failed payment processing attempts
- [ ] Unusual admin activity patterns

---

## Rollback Plan

### If Issues Arise During Deployment:

1. **Server Function Issues**:
   - Revert remote function deployments
   - Payment system falls back to enabled state
   - No data loss (org_settings persist)

2. **UI Issues**:
   - Revert UI changes
   - Admin controls remain functional via direct API
   - Users can still make payments normally

3. **Database Issues**:
   - No database rollback needed (table already exists)
   - Clear problematic org_settings records if needed:
     ```sql
     UPDATE org_settings 
     SET payments_enabled = true, payments_bypass = false
     WHERE org_id = '<problematic_org>';
     ```

---

## Success Criteria

### ✅ Core Functionality
- [ ] Super admins can toggle payments with keyword protection
- [ ] Payment bypass works for testing/development
- [ ] Manual credit management available to super admins only
- [ ] Regular users see appropriate UI based on payment state
- [ ] No impact on existing card generation functionality

### ✅ Security
- [ ] Role-based access control enforced
- [ ] Keyword protection prevents accidental toggles
- [ ] Audit trails maintained for all admin actions
- [ ] No privilege escalation vulnerabilities

### ✅ User Experience
- [ ] Clear feedback when payments are disabled
- [ ] Graceful degradation of payment UI
- [ ] No confusion about payment availability
- [ ] Consistent behavior across all payment touchpoints

### ✅ Operations
- [ ] Comprehensive logging for troubleshooting
- [ ] Easy rollback procedures
- [ ] No downtime during deployment
- [ ] Monitoring and alerting in place

---

## Contact Information

For questions or issues during QA/rollout:
- **Technical Lead**: Review implementation details
- **DevOps Team**: Coordinate deployment sequence  
- **QA Team**: Execute manual testing procedures
- **Support Team**: Handle user inquiries during rollout

---

## Appendix: Test Data

### Sample Test Users
- **Super Admin**: `arjomagno@gmail.com` (role: super_admin)
- **Org Admin**: Create test user with role: org_admin  
- **Regular User**: Create test user with role: id_gen_user

### Test Credit Packages
- Starter: 25 credits, ₱125
- Popular: 100 credits, ₱450 
- Business: 500 credits, ₱2000
- Enterprise: 1000 credits, ₱3500

### Test Scenarios
1. **Bypass Flow**: Disable payments → Enable bypass → Purchase credits
2. **Toggle Flow**: Enable → Disable → Re-enable payments
3. **Access Control**: Test each role's permissions
4. **Credit Management**: Manual adjustments and audit trails
