# Events Management Routes Migration Plan

This document outlines the plan to migrate the ID Generator routes from `apps/web/src/routes/events` to `apps/id-gen/src/routes`, with special focus on dependencies and shared components.

## Current Structure

Source Directory (`apps/web/src/routes/events/`):
- `[event_url]/` - Event URL handling and display
  - `+page.server.ts` - Server-side logic
  - `+page.svelte` - Main event page
  - `[reference_number]/` - Reference number specific routes
  - `name-tags/` - Name tag generation
  - `payments/` - Payment handling
  - `qr-checker/` - QR code verification
  - `register/` - Event registration
  - `test/` - Testing routes
  - `types.ts` - Shared type definitions

Target Directory (`apps/events/src/routes/`):
- Currently contains only a basic `+page.svelte`

## Dependencies Analysis
The application relies on several key dependencies and shared components that need to be migrated:

### UI Component Dependencies
- `$lib/components/ui/button` - Button component
- `$lib/components/ui/input` - Input component
- `$lib/components/ui/label` - Label component
- `$lib/components/ui/card` - Card component suite (Card, CardContent, CardDescription, CardHeader, CardTitle)
- `$lib/components/ui/table` - Table components suite (Table, TableBody, TableCell, TableHead, TableHeader, TableRow)
- `$lib/components/ui/switch` - Switch component
- Custom components:
  - `$lib/components/name-tag/PrintOutLayout.svelte` - Name tag printing layout
  - `SimplerSuccessMessage.svelte` - Registration success message
  - `PaymentInstructions.svelte` - Payment instructions display
- Icon components:
  - `lucide-svelte` - Check, Clock, AlertTriangle icons

### External Package Dependencies
- `sveltekit-superforms` - Form handling and validation
- `zod` - Schema validation
- `html5-qrcode` - QR code scanning
- `svelte-french-toast` - Toast notifications
- `@supabase/supabase-js` - Database client

### Type Definitions
- Database Types:
  - `EventTicketType`
  - `AttendeeWithScanInfo`
  - `ActionResultData`
- Form Types:
  - `RegistrationSchema`
  - `RegistrationResponse`
  - `QrScanSchema`
- Custom Types:
  - `DisplayTicket`
  - Event-related types in `types.ts`

### Utility Functions
- `$lib/utils/cn` - Class name utility
- `$lib/supabaseClient` - Database client configuration

### Store Management
- `$app/stores` - Page store
- `$app/navigation` - Navigation utilities
- Custom stores for:
  - Registration state
  - Scanner state
  - Event data

### Authentication & Security
- reCAPTCHA integration
- Supabase authentication
- Session management

### API Integration
- Event data endpoints
- Registration processing
- QR code verification
- Payment status checking

### Features by Route
1. **[event_url]/**
   - Event details display
   - Event status management

2. **[event_url]/register/**
   - Registration form with validation
   - Phone number formatting (Philippine format)
   - reCAPTCHA integration
   - Payment flow initialization

3. **[event_url]/qr-checker/**
   - QR code scanning interface
   - Attendee verification
   - Real-time scan history
   - Scanner state management

4. **[event_url]/name-tags/**
   - Name tag generation
   - PDF processing
   - Batch printing support

5. **[event_url]/payments/**
   - Payment status tracking
   - Payment instruction display
   - Transaction verification

### Required Migrations

1. **Database Schema**
   - Event tables
   - Registration tables
   - Payment tracking tables
   - Attendee tables

2. **API Endpoints**
   - Event management endpoints
   - Registration processing
   - Payment verification
   - QR code validation

3. **Environment Variables**
   - Supabase configuration
   - reCAPTCHA keys
   - Payment gateway credentials
   - API endpoints

## Migration Steps

1. **Component Migration**
??

2. **Style Migration**
   - Ensure Tailwind CSS is properly configured
   - Copy any custom CSS/SCSS files
   - Verify component-specific styles are migrated

3. **Type System**
   - Move shared types to a common location
   - Update import paths for types
   - Ensure type consistency across components

4. **Store Setup**
   - Configure auth store system
   - Set up template store
   - Verify store subscriptions and updates

## Breaking Changes & Dependencies

1. **Frontend Dependencies**
??

2. **Database Access**
??
3. **Authentication**
   - Role-based access control
   - Session management

## Post-Migration Verification

1. **Component Functionality**
   - Verify all components render correctly
   - Check component interactions
   - Test state management

2. **Style Consistency**
   - Verify CSS/Tailwind classes
   - Check responsive design
   - Ensure consistent theming

3. **Data Flow**
   - Test store updates
   - Verify component reactivity
   - Check data persistence
