# Phase 1: Component Splitting (Scaffold)

This document tracks the Phase 1 scaffolding for splitting large, monolithic components into smaller, maintainable units. No existing files were modified; new components were scaffolded to enable incremental migration.

## New Component Structure

- template form
  - `src/lib/components/template-form/TemplateForm.svelte`
  - `src/lib/components/template-form/TemplateFormHeader.svelte`
  - `src/lib/components/template-form/TemplateFormFields.svelte`
  - `src/lib/components/template-form/TemplateFormActions.svelte`
  - `src/lib/components/template-form/TemplateFormValidation.ts`
  - `src/lib/components/template-form/index.ts`

- templates page
  - `src/lib/components/templates/TemplateManagementPage.svelte`
  - `src/lib/components/templates/TemplateListView.svelte`
  - `src/lib/components/templates/TemplateEditModal.svelte`
  - `src/lib/components/templates/TemplateActions.svelte`
  - `src/lib/components/templates/index.ts`

- background manager
  - `src/lib/components/background/BackgroundManager.svelte`
  - `src/lib/components/background/ImageUploader.svelte`
  - `src/lib/components/background/ImageCropper.svelte`
  - `src/lib/components/background/ThumbnailPreview.svelte`
  - `src/lib/components/background/index.ts`

## Next Steps

- Begin migrating logic from:
  - `src/lib/components/BackgroundThumbnail.svelte` → background/*
  - `src/lib/components/TemplateForm.svelte` → template-form/*
  - `src/routes/templates/+page.svelte` → templates/*
- Create unit tests for new components as functionality is migrated.
- Wire feature flags to switch between legacy and new components.

## Notes

- Components use Svelte 5 runes and TypeScript.
- Kept styling minimal to focus on structure.