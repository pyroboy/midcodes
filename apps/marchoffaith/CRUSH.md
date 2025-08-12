# March of Faith Incorporated - Crush Development Guide

## Build Commands
npm run build          # Generate static files for production
npm run dev           # Start development server
npm run preview       # Test production build locally

## Linting & Formatting Commands
npm run lint          # Check code quality and formatting issues
npm run format        # Apply consistent formatting across all files
npm run check         # Run SvelteKit sync and svelte-check
npm run check:watch   # Watch mode for svelte-check

## Test Commands
npm run test                    # Run both integration and unit tests
npm run test:unit               # Run unit tests with vitest
npm run test:integration        # Run integration tests with Playwright

## Code Style Guidelines

### Imports
- Use absolute imports when possible
- Group imports: libraries first, then local imports
- Use import type {} for TypeScript types

### Formatting
- Use tabs for indentation (not spaces)
- Follow Prettier formatting standards
- Implement mobile-first responsive design

### Types
- TypeScript preferred for type safety
- Use explicit typing over implicit where possible
- Define component props with type interfaces

### Naming Conventions
- Component files: PascalCase (.svelte)
- Variables and functions: camelCase
- CSS classes: kebab-case
- Constants: UPPER_SNAKE_CASE

### Error Handling
- Use try/catch blocks appropriately
- Implement proper user feedback for errors
- Log errors with contextual information

### Brand Implementation
- Use brand colors: --deep-red (#981B1E), --bright-red (#C1272D), --white (#FFFFFF), --dark-gray (#333333), --light-gray (#F8F9FA)
- Montserrat font family for all text
- Maintain high contrast ratios for accessibility
- Consistent button styles: linear-gradient(45deg, #C1272D, #981B1E) for primary buttons
- Always reference Tagbilaran, Bohol connection in content

### Component Standards
- Semantic HTML structure with proper ARIA labels
- TypeScript for enhanced type safety
- Responsive design with appropriate breakpoints
- Follow existing patterns in the codebase

## CSS Custom Properties
Use these brand color variables consistently:
--deep-red: #981B1E      /* Primary backgrounds, headers */
--bright-red: #C1272D    /* Accents, buttons, highlights */
--white: #FFFFFF         /* Text on colored backgrounds */
--dark-gray: #333333     /* Body text, secondary elements */
--light-gray: #F8F9FA    /* Section backgrounds */