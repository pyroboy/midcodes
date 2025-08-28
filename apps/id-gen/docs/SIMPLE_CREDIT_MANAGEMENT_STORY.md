# User Story: Simple Admin Credit Management

## Story
As an organization admin, I want a simple interface to manage user credits so that I can quickly control user spending and grant unlimited access when needed.

## Acceptance Criteria
- [ ] Admin can see current credit balance for each user in the users table
- [ ] Admin can manually edit any user's credit balance with a simple dialog
- [ ] Admin can toggle unlimited credits on/off for any user
- [ ] Changes are saved immediately and reflected in the UI
- [ ] All actions respect existing role permissions (super_admin, org_admin only)

## Tasks
- [ ] **Task 1**: Add credits column to admin users table
  - [ ] Display current `credits_balance` field from profiles table
  - [ ] Show "Unlimited" badge when `unlimited_templates` is true
  - [ ] Add responsive design for mobile view
  - [ ] Update TypeScript interface to include credit fields
  
- [ ] **Task 2**: Create credit editing dialog
  - [ ] Simple input field for credit amount (number type, min=0)
  - [ ] Toggle switch for unlimited credits using shadcn-svelte Switch
  - [ ] Save/Cancel buttons with loading states
  - [ ] Form validation (positive numbers only)
  - [ ] Auto-populate current values when dialog opens
  
- [ ] **Task 3**: Implement server-side actions
  - [ ] Add `updateUserCredits` action to `/admin/users/+page.server.ts`
  - [ ] Validate permissions (admin roles only: super_admin, org_admin)
  - [ ] Update both `credits_balance` and `unlimited_templates` fields in profiles table
  - [ ] Return updated user list for UI refresh
  - [ ] Add proper error handling and validation
  
- [ ] **Task 4**: Add client-side functionality
  - [ ] Credit edit button with dialog trigger in Actions column
  - [ ] Form handling with validation and error display
  - [ ] Success/error message display using existing message system
  - [ ] Optimistic UI updates after successful save
  - [ ] Add Credits button to both desktop and mobile views

## Dev Notes
- **Database Fields**: Use existing `credits_balance` (number) and `unlimited_templates` (boolean) in profiles table
- **UI Integration**: Extend current `/admin/users` page - don't create new routes
- **Component Library**: Follow existing UI patterns using shadcn-svelte components
- **Permissions**: Respect existing role-based permissions (super_admin, org_admin only)
- **API Pattern**: Follow existing server action patterns in the file

## Technical Details

### Database Schema (Existing)
```sql
-- profiles table already has:
credits_balance: number (default 0)
unlimited_templates: boolean (default false)
```

### UI Components Needed
- Import `* as Switch from '$lib/components/ui/switch'` for unlimited toggle
- Use existing `Dialog`, `Button`, `Input`, `Badge` components
- Credit display: Show number or "Unlimited" badge

### Server Action Structure
```typescript
updateUserCredits: async ({ request, locals }) => {
  // Permission check (super_admin, org_admin only)
  // Form data extraction (userId, creditsBalance, unlimitedCredits)
  // Validation (positive numbers, user exists in org)
  // Database update
  // Return success/error response
}
```

### Client Integration
- Add "Credits" button to existing Actions column
- Add Credits column to table header and body
- Handle unlimited vs. numeric display logic
- Use existing error/success message system

## Testing Checklist
- [ ] Test credit display shows correct values (numeric vs unlimited)
- [ ] Test manual credit editing saves correctly
- [ ] Test unlimited toggle works and disables numeric input
- [ ] Test permissions (non-admins cannot access credit management)
- [ ] Test responsive design on mobile devices
- [ ] Test error handling for invalid inputs (negative numbers, non-numeric)
- [ ] Test organization scoping (can only edit users in same org)

## Definition of Done
- [ ] All tasks completed and tested
- [ ] Code follows existing patterns and conventions
- [ ] UI is responsive and matches existing design system
- [ ] Permissions properly enforced
- [ ] Error handling implemented
- [ ] Success/error feedback provided to users
- [ ] No breaking changes to existing functionality

## Status
Draft

## Dev Agent Record

### File List
*Files to be created/modified during implementation*
- `src/routes/admin/users/+page.server.ts` (modified - add updateUserCredits action)
- `src/routes/admin/users/+page.svelte` (modified - add UI components and handlers)

### Debug Log References
*Links to debug sessions or logs*

### Completion Notes
*Notes about implementation decisions and any deviations from the plan*

### Change Log
*List of changes made during implementation*

## Agent Model Used
*To be filled by dev agent during implementation*