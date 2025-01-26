# Events Management Routes Migration Plan

This document outlines the plan to migrate the ID Generator routes from `apps/web/src/routes/events` to `apps/id-gen/src/routes`, with special focus on dependencies and shared components.

## Current Structure

Source Directory (`apps/web/src/routes/events/`):


Target Directory (`apps/events/src/routes/`):
- Currently contains only a basic `+page.svelte`

## Dependencies Analysis

### Main Route Dependencies (+page.svelte)
- **Svelte Types**:
  - `./$types` for PageData type
- **Auth Components**:
  - `$lib/auth/roleConfig` for RoleConfig
- **UI Dependencies**:
  - Tailwind CSS classes (container, card-content, etc.)
  - Custom styling for layout and components

### Templates Route Dependencies (+page.svelte)
- **Svelte Core**:
  - `svelte/legacy` for run
  - `svelte` for onMount
- **Database**:
  - `$lib/supabaseClient` for Supabase client
  - `$lib/database` for uploadImage function
- **Store Dependencies**:
  - `$lib/stores/auth` for auth, session, profile
  - `$lib/stores/templateStore` for templateData
- **Custom Components**:
  - `$lib/TemplateForm.svelte`
  - `$lib/TemplateList.svelte`
- **Types**:
  - `$lib/stores/auth` for UserProfile
  - `$lib/stores/templateStore` for TemplateData, TemplateElement

## Required Component Migration

The following components need to be available in the new app:

1. **Core UI Components**
   - `$lib/components/ui/button` - Button component
   - `$lib/components/ui/card` - Card component
   - `$lib/components/ui/input` - Input component
   - `$lib/components/ui/label` - Label component
   - `$lib/components/ui/select` - Select component
   - `$lib/IdCanvas.svelte` - Canvas for ID card rendering
   - `$lib/ThumbnailInput.svelte` - Image upload component
   - `$lib/components/ImagePreviewModal.svelte` - Modal for image preview
   - `$lib/TemplateForm.svelte` - Template creation form
   - `$lib/TemplateList.svelte` - Template listing component
   - Table components with sorting and filtering
   - Modal components for image preview
   - Form input components with validation

2. **Store Management**
   - `$lib/stores/auth` - Authentication store (auth, session, user, profile)
   - `$lib/stores/templateStore` - Template management store
   - `$lib/stores/darkMode` - Dark mode preferences
   - `$app/stores` - SvelteKit page store
   - `$app/navigation` - SvelteKit navigation utilities
   - `$app/forms` - SvelteKit form handling
   - State management for file uploads
   - State management for selection states
   - State management for loading states

3. **Utility Functions & Services**
   - `$lib/utils/supabase` - Supabase utilities (getSupabaseStorageUrl)
   - `$lib/utils/idCardHelpers` - ID card helper functions (handleImageUploads, saveIdCardData, deleteFromStorage)
   - `$lib/database` - Database helper functions (uploadImage)
   - `$lib/supabaseClient` - Supabase client instance
   - URL handling utilities (createObjectURL, revokeObjectURL)
   - File handling utilities
   - Image position and scaling utilities
   - Debug message utilities
   - Form data initialization utilities
   - Card ID generation utilities
   - ZIP file handling utilities

4. **External Dependencies**
   - `lucide-svelte` - Icon components (Loader)
   - `jszip` - For ZIP file handling in bulk downloads
   - `@supabase/supabase-js` - Supabase client library
   - Tailwind CSS with dark mode support
   - SvelteKit legacy utilities (run, preventDefault, stopPropagation)
   - URL and Blob APIs
   - File API
   - Set and Map data structures

5. **Shared Types**
   - Template Types:
     - `Template` - Base template interface
     - `TemplateElement` - Template element interface
     - `TemplateElementSide` - Template side type
     - `TemplateData` - Template data interface
   - Form Types:
     - `SelectItem` - Select option interface
     - `FormData` - Form data interface
     - `FileUploads` - File upload interface
     - `SelectedOptions` - Selected options interface
   - Image Types:
     - `ImagePosition` - Image position interface
     - `ImagePositions` - Image positions map
     - `CachedFileUrls` - Cached file URLs map
   - Data Types:
     - `HeaderRow` - Header row interface
     - `DataRow` - Data row interface
   - Debug Types:
     - `DebugMessage` - Debug message interface
   - Auth Types:
     - `UserProfile` - User profile interface
     - `Session` - Session interface
   - SvelteKit Types:
     - PageLoad, PageData, PageServerLoad, Actions

6. **Features & Functionality**
   - Dark mode support with CSS variables
   - Responsive design utilities
   - Form handling and validation
   - File upload and preview
   - Image processing and canvas manipulation
   - Bulk operations (download, delete)
   - Search and filtering
   - Group selection management
   - Role-based access control
   - Template management system
   - ID card generation and preview
   - Drag and drop functionality
   - Image scaling and positioning
   - File caching and URL management
   - Bulk ZIP download
   - Group-based card management
   - Selection state management
   - Debug message system

7. **Styling Resources**
   - Tailwind CSS configuration
   - Dark mode specific styles
   - Component-specific CSS
   - Responsive design breakpoints
   - Custom utility classes
   - Animation classes (e.g., animate-spin)
   - Layout utilities (flex, grid)
   - State-based styling (hover, active, etc.)
   - Z-index management
   - Sticky positioning
   - Table styles
   - Dark mode variants
   - Group hover effects
   - Responsive table layouts
   - Modal overlay styles

8. **Server-Side Features**
   - Error handling (@sveltejs/kit error, fail, redirect)
   - Session management
   - File storage operations
   - Database operations
   - Role-based authorization
   - Form actions
   - File upload handling
   - Bulk operation handling
   - Template validation
   - Data persistence

## Migration Steps

1. **Component Migration**
   - Create a shared component library if not exists
   - Move or copy required components:
     ```
     $lib/
     ├── TemplateForm.svelte
     ├── TemplateList.svelte
     ├── auth/
     │   └── roleConfig.ts
     ├── stores/
     │   ├── auth.ts
     │   └── templateStore.ts
     └── database.ts
     ```

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
   - Core UI components (button, card, input, label, select)
   - SvelteKit page store and navigation utilities
   - SvelteKit form handling
   - Tailwind CSS with dark mode support
   - SvelteKit legacy utilities (run, preventDefault, stopPropagation)
   - Lucide-Svelte icon components
   - JSZip for ZIP file handling
   - Custom utility functions (Supabase utilities, database helper functions)

2. **Database Access**
   - Supabase client configuration
   - Database access patterns
   - File upload functionality

3. **Authentication**
   - Role-based access control
   - Session management
   - Profile handling

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
