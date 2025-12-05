# ID-Gen File Tree Documentation

Complete function-level documentation for all source files in the ID Generation application.

---

## Root Files (`src/`)

### `app.css`
Global Tailwind CSS styles and custom CSS variables for theming.

### `app.d.ts`
TypeScript ambient declarations for SvelteKit app types.
- **`App.Locals`** - Server-side request context (supabase client, session, user, org_id, permissions)
- **`App.PageData`** - Data available to all pages (user, org_id, permissions)
- **`App.Error`** - Custom error shape with message
- **`NodeJS.ProcessEnv`** - Environment variable types

### `app.html`
HTML shell template for SvelteKit application.

### `env.d.ts`
Environment variable type declarations.

### `hooks.server.ts`
Server-side request hooks for authentication and authorization.

| Function | Description |
|----------|-------------|
| `initializeSupabase` | Creates Supabase server client with cookie-based auth, handles cookie get/set/remove |
| `safeGetSession` | Parallel fetch of user and session, handles token refresh, decodes JWT for roles, fetches permissions |
| `authGuard` | Sets security headers, protects routes, redirects unauthenticated users to /auth |
| `handle` | Sequenced hook combining initializeSupabase and authGuard |

**Exported Types:**
- `GetSessionResult` - Session fetch result with user, session, org_id, permissions, error

---

## Library (`src/lib/`)

### `index.ts`
Empty barrel export file for `$lib` alias.

### `database.ts`
Client-side database operations for templates.

| Function | Description |
|----------|-------------|
| `uploadImage(file, path, userId?)` | Uploads image to Supabase storage, returns full URL |
| `deleteTemplate(id)` | Deletes template by ID |
| `saveTemplate(template)` | Upserts template data, returns saved record |
| `getTemplate(id)` | Fetches single template by ID |
| `listTemplates()` | Lists all templates ordered by created_at desc |

### `supabaseClient.ts`
Browser-side Supabase client singleton initialization.

### `utils.ts`
Utility exports including `cn()` for className merging (clsx + tailwind-merge).

---

## Components (`src/lib/components/`)

### `BackgroundThumbnail.svelte`
Interactive thumbnail for positioning/scaling background images on ID templates.

| Function | Description |
|----------|-------------|
| `loadImage()` | Loads image from URL, triggers proxy generation |
| `generateProxyImage()` | Creates low-res proxy for drag performance |
| `startPerformanceDrag()` | Switches to low-res mode during drag |
| `endPerformanceDrag()` | Restores full quality after drag |
| `drawThumbnail()` | Renders image to canvas with crop frame overlay |
| `handleStart(event, mode)` | Initiates move/resize drag operation |
| `handleRedBoxDrag(event)` | Handles dragging the crop area |
| `handleResize(event, handle)` | Handles corner resize operations |
| `autoFit()` | Resets position to default (0,0, scale 1) |

**Props:** `imageUrl`, `templateDimensions`, `position`, `onPositionChange`, `maxThumbnailWidth`, `disabled`, `debugMode`

### `BottomNavigation.svelte`
Mobile/tablet bottom navigation bar with Home, Templates, Account links.

| Function | Description |
|----------|-------------|
| `isActive(href, currentPath)` | Checks if route is currently active |

**Props:** `user`, `class`

### `ClientOnly.svelte`
Wrapper that only renders children after client-side mount (SSR safety).

**Props:** `children` (snippet)

### `ColorInput.svelte`
Color picker with hex input, opacity control, and visibility toggle.

| Function | Description |
|----------|-------------|
| `updateColor(newColor)` | Updates color and dispatches change event |
| `updateOpacity(newOpacity)` | Updates opacity (0-100) and dispatches event |
| `toggleVisibility()` | Toggles visible state |
| `handleColorPickerChange(event)` | Handles native color picker input |

**Props:** `color`, `opacity`, `visible` (all bindable)

### `CroppingConfirmationDialog.svelte`
Dialog for confirming image crop operations with preview.

**Props:** `open`, `imageUrl`, `cropData`, `onConfirm`, `onCancel`

### `DashboardStatsCard.svelte`
Card component displaying a statistic with icon, value, and label.

**Props:** `icon`, `value`, `label`, `trend`, `trendDirection`

### `DesktopHeader.svelte`
Desktop navigation header with logo, nav links, search, notifications, user menu.

**Props:** `user`, `org_id`, `permissions`

### `ElementList.svelte`
Sidebar list of template elements with drag-to-reorder and selection.

| Function | Description |
|----------|-------------|
| `handleDragStart(element)` | Initiates element drag |
| `handleDragOver(element)` | Handles drag over another element |
| `handleDrop()` | Completes reorder operation |
| `selectElement(element)` | Sets element as selected |
| `deleteElement(element)` | Removes element from template |

**Props:** `elements`, `selectedElement`, `onSelect`, `onDelete`, `onReorder`

### `FontSettings.svelte`
Font configuration panel for text elements (family, size, weight, style, alignment).

| Function | Description |
|----------|-------------|
| `updateFontFamily(family)` | Updates font family |
| `updateFontSize(size)` | Updates font size |
| `updateFontWeight(weight)` | Updates font weight |
| `updateAlignment(align)` | Updates text alignment |
| `updateFontStyle(style)` | Updates italic/normal |
| `updateTextDecoration(decoration)` | Updates underline |
| `updateTextTransform(transform)` | Updates case transform |

**Props:** `element`, `onChange`

### `HamburgerMenu.svelte`
Mobile hamburger menu button with slide-out navigation drawer.

**Props:** `user`, `isOpen`, `onToggle`

### `IDCard.svelte`
Full ID card renderer with front/back sides, all element types, and export capability.

| Function | Description |
|----------|-------------|
| `renderElement(element, side)` | Renders single element based on type |
| `exportAsImage(format, quality)` | Exports card as PNG/JPEG blob |
| `flipCard()` | Toggles front/back view |

**Props:** `template`, `data`, `side`, `scale`, `editable`

### `IDPreviewModal.svelte`
Modal dialog for previewing generated ID cards with download options.

| Function | Description |
|----------|-------------|
| `downloadCard(format)` | Triggers card download as image |
| `printCard()` | Opens print dialog |

**Props:** `open`, `idCard`, `onClose`

### `IDThumbnailCard.svelte`
Compact ID card thumbnail for list views with status badge.

**Props:** `idCard`, `onClick`, `selected`

### `IdCanvas.svelte`
Main canvas-based ID card editor with drag/drop elements, zoom, and pan.

| Function | Description |
|----------|-------------|
| `initCanvas()` | Initializes canvas context and dimensions |
| `drawBackground()` | Renders background image with position/scale |
| `drawElements()` | Renders all template elements |
| `handleMouseDown(event)` | Starts element drag or selection |
| `handleMouseMove(event)` | Updates drag position or cursor |
| `handleMouseUp(event)` | Completes drag operation |
| `handleWheel(event)` | Zoom in/out with scroll |
| `updateElementPosition(element, x, y)` | Updates element coordinates |

**Props:** `template`, `selectedElement`, `onElementSelect`, `onElementUpdate`, `zoom`, `editable`

### `ImagePreviewModal.svelte`
Modal for previewing uploaded images before use.

**Props:** `open`, `imageUrl`, `onClose`, `onConfirm`

### `Logo.svelte`
Application logo component with optional text.

**Props:** `size`, `showText`, `class`

### `MobileHeader.svelte`
Mobile header with hamburger menu, logo, and action buttons.

**Props:** `user`, `onMenuToggle`

### `NotificationButton.svelte`
Bell icon button with unread notification count badge.

| Function | Description |
|----------|-------------|
| `fetchNotifications()` | Loads notifications from API |
| `markAsRead(id)` | Marks notification as read |

**Props:** `count`, `onClick`

### `PositionGroup.svelte`
X/Y coordinate inputs for element positioning.

| Function | Description |
|----------|-------------|
| `updateX(value)` | Updates X coordinate |
| `updateY(value)` | Updates Y coordinate |

**Props:** `x`, `y`, `onChange`

### `PublicFooter.svelte`
Footer for public pages with links and copyright.

### `PublicHeader.svelte`
Header for public/marketing pages with navigation links.

**Props:** `user`

### `QuickActions.svelte`
Floating action buttons for common operations (add element, save, etc).

**Props:** `actions`, `onAction`

### `SearchTrigger.svelte`
Search button that opens search modal/command palette.

| Function | Description |
|----------|-------------|
| `openSearch()` | Opens search dialog |

**Props:** `placeholder`

### `SimpleIDCard.svelte`
Simplified ID card renderer for thumbnails and previews (no interactivity).

**Props:** `template`, `data`, `side`, `scale`

### `SizeSelectionDialog.svelte`
Dialog for selecting template size from presets or custom dimensions.

| Function | Description |
|----------|-------------|
| `selectPreset(preset)` | Applies preset dimensions |
| `applyCustomSize()` | Validates and applies custom dimensions |

**Props:** `open`, `onSelect`, `onCancel`

### `TemplateEdit.svelte`
Full template editor interface with canvas, element panel, and properties.

| Function | Description |
|----------|-------------|
| `addElement(type)` | Creates new element of specified type |
| `updateElement(element)` | Saves element changes |
| `deleteElement(element)` | Removes element |
| `saveTemplate()` | Persists template to database |
| `handleBackgroundUpload(file, side)` | Uploads and sets background image |

**Props:** `template`, `onSave`, `onCancel`

### `TemplateForm.svelte`
Form for template metadata (name, dimensions, DPI).

| Function | Description |
|----------|-------------|
| `handleSubmit()` | Validates and submits form data |

**Props:** `initialData`, `onSubmit`, `onCancel`

### `TemplateList.svelte`
Grid/list view of templates with search, filter, and actions.

| Function | Description |
|----------|-------------|
| `filterTemplates(query)` | Filters by search query |
| `sortTemplates(field, direction)` | Sorts by field |
| `deleteTemplate(id)` | Deletes with confirmation |

**Props:** `templates`, `onSelect`, `onDelete`, `onEdit`

### `ThemeToggle.svelte`
Light/dark mode toggle button.

| Function | Description |
|----------|-------------|
| `toggleTheme()` | Switches between light/dark |

### `ThumbnailInput.svelte`
Image upload input with drag-drop, preview, and cropping.

| Function | Description |
|----------|-------------|
| `handleFileSelect(event)` | Processes selected file |
| `handleDrop(event)` | Handles drag-drop upload |
| `openCropper()` | Opens crop dialog |
| `applyCrop(cropData)` | Applies crop and updates preview |

**Props:** `value`, `onChange`, `aspectRatio`, `maxSize`

### `UserDropdown.svelte`
User avatar dropdown menu with profile, settings, and logout links.

**Props:** `user`, `org_id`

### `ViewModeToggle.svelte`
Toggle between grid and list view modes.

| Function | Description |
|----------|-------------|
| `setMode(mode)` | Updates view mode |

**Props:** `mode`, `onChange`

---

## Empty States (`src/lib/components/empty-states/`)

### `EmptyCredits.svelte`
Empty state for no credits purchased - shows pricing CTA.

### `EmptyIDs.svelte`
Empty state for no generated IDs - shows create CTA.

### `EmptySearch.svelte`
Empty state for no search results - shows clear filters option.

### `EmptyTemplates.svelte`
Empty state for no templates - shows create template CTA.

### `EmptyUsers.svelte`
Empty state for no users in admin view.

---

## Custom UI (`src/lib/components/ui/`)

### `Breadcrumb.svelte`
Navigation breadcrumb trail component.

**Props:** `items` (array of {label, href})

### `CreditsDisplay.svelte`
Displays user's current credit balance with icon.

**Props:** `credits`, `showIcon`

### `EmptyState.svelte`
Generic empty state component with icon, title, description, and action.

**Props:** `icon`, `title`, `description`, `actionLabel`, `onAction`

### `PurchaseButton.svelte`
Credit purchase button that opens payment flow.

| Function | Description |
|----------|-------------|
| `handlePurchase()` | Initiates payment checkout |

**Props:** `amount`, `price`, `disabled`

### `RoleGuard.svelte`
Conditionally renders children based on user role/permissions.

**Props:** `roles`, `permissions`, `fallback`

### `StaffModeBadge.svelte`
Badge indicating staff/admin mode is active.

**Props:** `role`

---

## Config (`src/lib/config/`)

### `environment.ts`
Environment configuration and feature flags.

| Export | Description |
|--------|-------------|
| `isDev` | Boolean for development mode |
| `isProd` | Boolean for production mode |
| `config` | Configuration object with API URLs |

### `fonts.ts`
Available fonts for text elements.

| Export | Description |
|--------|-------------|
| `AVAILABLE_FONTS` | Array of font family options |
| `loadFont(family)` | Dynamically loads font via WebFontLoader |

### `paymongo-client.ts`
PayMongo payment gateway client configuration.

| Export | Description |
|--------|-------------|
| `paymongoConfig` | API keys and webhook configuration |

---

## Hooks (`src/lib/hooks/`)

### `is-mobile.svelte.ts`
Svelte 5 rune for detecting mobile viewport.

| Export | Description |
|--------|-------------|
| `useIsMobile()` | Returns reactive boolean for mobile detection |

---

## Payments (`src/lib/payments/`)

### `catalog.ts`
Credit package catalog and pricing.

| Export | Description |
|--------|-------------|
| `CREDIT_PACKAGES` | Array of available credit packages with prices |
| `getPackageById(id)` | Finds package by ID |

### `schemas.ts`
Zod schemas for payment validation.

| Export | Description |
|--------|-------------|
| `paymentIntentSchema` | Validates payment intent data |
| `checkoutSessionSchema` | Validates checkout session |

### `types.ts`
TypeScript types for payments.

| Export | Description |
|--------|-------------|
| `CreditPackage` | Package definition type |
| `PaymentIntent` | Payment intent type |
| `PaymentStatus` | Status enum |

---

## Remote (`src/lib/remote/`)

### `admin.remote.ts`
Admin API calls.

| Function | Description |
|----------|-------------|
| `getUsers(org_id)` | Fetches organization users |
| `updateUserRole(userId, role)` | Updates user role |
| `getAuditLog(org_id)` | Fetches admin audit log |

### `billing.remote.ts`
Billing API calls.

| Function | Description |
|----------|-------------|
| `getCredits(userId)` | Fetches user credit balance |
| `getTransactionHistory(userId)` | Fetches payment history |

### `payments.remote.ts`
Payment API calls.

| Function | Description |
|----------|-------------|
| `createCheckoutSession(packageId)` | Creates PayMongo checkout |
| `verifyPayment(sessionId)` | Verifies payment completion |

### `profile.remote.ts`
Profile API calls.

| Function | Description |
|----------|-------------|
| `getProfile(userId)` | Fetches user profile |
| `updateProfile(userId, data)` | Updates profile data |

---

## Schemas (`src/lib/schemas/`)

### `admin.schema.ts`
Admin operation Zod schemas.

| Export | Description |
|--------|-------------|
| `userRoleUpdateSchema` | Role update validation |
| `auditLogEntrySchema` | Audit log entry shape |

### `auth.schema.ts`
Authentication Zod schemas.

| Export | Description |
|--------|-------------|
| `loginSchema` | Login form validation |
| `signupSchema` | Signup form validation |
| `passwordResetSchema` | Password reset validation |

### `billing.schema.ts`
Billing Zod schemas.

| Export | Description |
|--------|-------------|
| `creditPurchaseSchema` | Purchase validation |
| `transactionSchema` | Transaction record shape |

### `display-conversion.schema.ts`
Display unit conversion schemas.

| Export | Description |
|--------|-------------|
| `dimensionConversionSchema` | Unit conversion validation |
| `displayFormatSchema` | Display formatting options |
| `pixelsToDisplayUnit(px, unit, dpi)` | Converts pixels to physical units |

### `idcard.schema.ts`
ID card Zod schemas.

| Export | Description |
|--------|-------------|
| `idCardSchema` | Full ID card validation |
| `idCardDataSchema` | ID card field data |

### `index.ts`
Barrel exports for all schemas.

### `organization.schema.ts`
Organization Zod schemas.

| Export | Description |
|--------|-------------|
| `organizationSchema` | Organization validation |
| `orgMemberSchema` | Member record shape |

### `template-creation.schema.ts`
Template creation Zod schemas.

| Export | Description |
|--------|-------------|
| `templateCreationInputSchema` | User input validation |
| `templateCreationDataSchema` | Database insert shape |
| `templatePresetSchema` | Preset template validation |
| `DEFAULT_DPI`, `MIN_DIMENSION_PX`, `MAX_DIMENSION_PX` | Constants |

### `template-element.schema.ts`
Template element Zod schemas (discriminated union by type).

| Export | Description |
|--------|-------------|
| `templateElementSchema` | Union of all element types |
| `textElementSchema` | Text element validation |
| `imageElementSchema` | Image element validation |
| `qrElementSchema` | QR code element validation |
| `photoElementSchema` | Photo placeholder validation |
| `signatureElementSchema` | Signature element validation |
| `selectionElementSchema` | Selection/dropdown validation |

### `template-update.schema.ts`
Template update Zod schemas.

| Export | Description |
|--------|-------------|
| `templateUpdateInputSchema` | Partial update validation |
| `templatePatchSchema` | Field-level patches |
| `templateBulkOperationSchema` | Bulk operations |

---

## Server (`src/lib/server/`)

### `supabase.ts`
Server-side Supabase client with service role.

| Export | Description |
|--------|-------------|
| `createServerSupabaseClient(cookies)` | Creates authenticated server client |
| `getServiceRoleClient()` | Gets admin client with service role |

### `credits/bypass-helpers.ts`
Credit bypass utilities for testing/development.

| Function | Description |
|----------|-------------|
| `shouldBypassCredits(userId)` | Checks if user has credit bypass |
| `grantBypass(userId)` | Grants credit bypass to user |

### `payments/persistence.ts`
Payment record persistence.

| Function | Description |
|----------|-------------|
| `savePaymentRecord(payment)` | Saves payment to database |
| `getPaymentBySessionId(sessionId)` | Fetches payment record |
| `updatePaymentStatus(id, status)` | Updates payment status |

### `payments/webhook.ts`
PayMongo webhook handler.

| Function | Description |
|----------|-------------|
| `handlePaymongoWebhook(payload, signature)` | Verifies and processes webhook |
| `processPaymentSuccess(data)` | Credits user account on success |
| `processPaymentFailed(data)` | Handles failed payment |

### `paymongo/client.ts`
PayMongo API client.

| Function | Description |
|----------|-------------|
| `createPaymentIntent(amount, description)` | Creates payment intent |
| `createCheckoutSession(data)` | Creates hosted checkout |
| `retrievePaymentIntent(id)` | Fetches payment intent status |

### `utils/crypto.ts`
Cryptographic utilities.

| Function | Description |
|----------|-------------|
| `verifyWebhookSignature(payload, signature, secret)` | Verifies webhook HMAC |
| `generateSecureToken(length)` | Generates random token |

---

## Services (`src/lib/services/`)

### `payments.ts`
Payment service orchestration.

| Function | Description |
|----------|-------------|
| `purchaseCredits(userId, packageId)` | Orchestrates credit purchase flow |
| `checkPaymentStatus(sessionId)` | Polls payment status |

### `permissions.ts`
Permission checking service with caching.

| Function | Description |
|----------|-------------|
| `getUserPermissions(roles, supabase)` | Fetches permissions for roles (cached 5min) |
| `cleanupPermissionCache()` | Removes expired cache entries |
| `clearPermissionCache()` | Clears entire cache |

---

## Stores (`src/lib/stores/`)

### `auth.ts`
Authentication Svelte store.

| Export | Description |
|--------|-------------|
| `auth` | Writable store with user, session, profile, roleEmulation |
| `session` | Derived session subscriber |
| `user` | Derived user subscriber |
| `profile` | Derived profile subscriber |

### `auth.svelte.ts`
Svelte 5 rune-based auth state.

| Export | Description |
|--------|-------------|
| `authState` | Reactive auth state using $state |

### `darkMode.ts`
Dark mode preference store.

| Export | Description |
|--------|-------------|
| `darkMode` | Writable boolean for dark mode |
| `toggleDarkMode()` | Toggles dark mode |
| `initDarkMode()` | Initializes from localStorage/system |

### `featureFlags.ts`
Feature flag store.

| Export | Description |
|--------|-------------|
| `featureFlags` | Writable store of enabled features |
| `isFeatureEnabled(flag)` | Checks if feature is enabled |

### `templateStore.ts`
Current template editing store.

| Export | Description |
|--------|-------------|
| `templateData` | Writable store with TemplateData |
| `TemplateElement` | Element interface type |
| `TemplateData` | Template interface type |

**TemplateElement interface:** id, type, x, y, width, height, content, variableName, fontSize, fontFamily, fontWeight, fontStyle, color, textDecoration, textTransform, opacity, visible, alignment, options, side, letterSpacing, lineHeight

### `theme.ts`
Theme configuration store.

| Export | Description |
|--------|-------------|
| `theme` | Writable store with theme settings |

### `viewMode.ts`
View mode store (grid/list).

| Export | Description |
|--------|-------------|
| `viewMode` | Writable store ('grid' | 'list') |

---

## Types (`src/lib/types/`)

### `auth.ts`
Authentication types.

| Export | Description |
|--------|-------------|
| `UserJWTPayload` | Decoded JWT token shape |
| `GetSessionResult` | Session fetch result type |

### `auth.schema.ts`
Auth schema type exports (re-exports from schemas).

### `admin.schema.ts`
Admin schema type exports.

### `billing.schema.ts`
Billing schema type exports.

### `database.ts`
Database helper types.

### `database.types.ts`
Generated Supabase database types.

| Export | Description |
|--------|-------------|
| `Database` | Full database schema type |
| `Tables` | Table row types |
| `Enums` | Database enum types |

### `index.ts`
Barrel exports for types.

### `profile.schema.ts`
Profile type exports.

### `roleEmulation.ts`
Role emulation types for staff testing.

| Export | Description |
|--------|-------------|
| `ProfileData` | User profile data shape |
| `EmulatedProfile` | Emulated profile with original |
| `RoleEmulationState` | Emulation state |

### `session.ts`
Session types.

| Export | Description |
|--------|-------------|
| `SessionData` | Session data shape |

### `types.ts`
Misc shared types.

---

## Utils (`src/lib/utils/`)

### `adaptiveElements.ts`
Element adaptation for different template sizes.

| Function | Description |
|----------|-------------|
| `scaleElement(element, scaleFactor)` | Scales element dimensions |
| `adaptElementsToSize(elements, from, to)` | Adapts elements to new size |

### `backgroundDebug.ts`
Background positioning debug utilities.

| Function | Description |
|----------|-------------|
| `logDebugInfo(info)` | Logs debug information |
| `DebugInfo` | Debug info type |

### `backgroundGeometry.ts`
Background image geometry calculations.

| Function | Description |
|----------|-------------|
| `calculateCropFrame(imageDims, containerDims, position)` | Calculates visible crop area |
| `validateCropFrameAlignment(imageDims, containerDims, position)` | Validates crop alignment |
| `calculatePositionFromFrame(...)` | Converts frame to position |
| `coverBase(imageDims, containerDims)` | Calculates cover-fit scale |
| `computeDraw(...)` | Computes drawing coordinates |
| `computeVisibleRectInImage(...)` | Computes visible image area |
| `computeContainerViewportInImage(...)` | Computes viewport in image coords |
| `mapImageRectToThumb(rect, imageDims, thumbDims)` | Maps image rect to thumbnail |
| `clampBackgroundPosition(...)` | Clamps position to valid range |

### `canvasPerformance.ts`
Canvas rendering performance utilities.

| Function | Description |
|----------|-------------|
| `measureRenderTime(fn)` | Measures function execution time |
| `requestIdleCallback(fn)` | Schedules low-priority work |

### `cardGeometry.ts`
ID card geometry calculations.

| Function | Description |
|----------|-------------|
| `calculateCardDimensions(width, height, dpi)` | Calculates pixel dimensions |
| `getAspectRatio(width, height)` | Calculates aspect ratio |

### `coordinateSystem.ts`
Coordinate system transformations.

| Function | Description |
|----------|-------------|
| `screenToCanvas(screenX, screenY, canvas, zoom)` | Converts screen to canvas coords |
| `canvasToScreen(canvasX, canvasY, canvas, zoom)` | Converts canvas to screen coords |

### `credits.ts`
Credit utilities.

| Function | Description |
|----------|-------------|
| `formatCredits(amount)` | Formats credit amount for display |
| `calculateCost(operation)` | Calculates operation credit cost |

### `dateFormat.ts`
Date formatting utilities.

| Function | Description |
|----------|-------------|
| `formatDate(date, format)` | Formats date string |
| `formatRelative(date)` | Formats as relative time |
| `parseDate(str)` | Parses date string |

### `dragPerformanceMonitor.ts`
Drag operation performance monitoring.

| Function | Description |
|----------|-------------|
| `usePerformanceMonitoring()` | Hook for monitoring drag FPS |
| `startDrag(id)` | Starts monitoring session |
| `endDrag()` | Ends session, returns metrics |
| `getCurrentFPS()` | Returns current frame rate |

### `errorHandling.ts`
Error handling utilities.

| Function | Description |
|----------|-------------|
| `handleError(error, context)` | Logs and formats errors |
| `isNetworkError(error)` | Checks if error is network-related |
| `getUserMessage(error)` | Gets user-friendly message |

### `fileValidation.ts`
File upload validation.

| Function | Description |
|----------|-------------|
| `validateImageFile(file)` | Validates image file type/size |
| `validateFileSize(file, maxSize)` | Checks file size limit |
| `getImageDimensions(file)` | Gets image width/height |

### `idCardHelpers.ts`
ID card operation helpers.

| Function | Description |
|----------|-------------|
| `generateIdCardId()` | Generates unique ID card identifier |
| `prepareIdCardData(template, formData)` | Merges form data with template |

### `imageCache.ts`
Image caching for performance.

| Function | Description |
|----------|-------------|
| `getCachedImage(url)` | Gets image from cache |
| `cacheImage(url, image)` | Adds image to cache |
| `clearImageCache()` | Clears all cached images |

### `imageCropper.ts`
Image cropping utilities.

| Function | Description |
|----------|-------------|
| `cropImage(image, cropData)` | Crops image to specified area |
| `getCropPreview(image, cropData)` | Generates crop preview |

### `imageCropper.improved.ts`
Enhanced image cropper with better performance.

| Function | Description |
|----------|-------------|
| `cropImageImproved(image, cropData, options)` | Crops with quality options |

### `imageProxy.ts`
Image proxy for performance optimization.

| Function | Description |
|----------|-------------|
| `globalProxyManager` | Singleton proxy manager |
| `getOrCreateProxy(image, key, options)` | Gets or creates low-res proxy |
| `proxyPerformanceMonitor` | Monitors proxy generation |

### `inventoryReports.ts`
Inventory and usage reporting.

| Function | Description |
|----------|-------------|
| `generateUsageReport(org_id, dateRange)` | Generates usage statistics |

### `logger.ts`
Logging utility with levels.

| Function | Description |
|----------|-------------|
| `logger.info(message, data)` | Info level log |
| `logger.warn(message, data)` | Warning level log |
| `logger.error(message, data)` | Error level log |
| `logger.debug(message, data)` | Debug level log |

### `setup-logging.ts`
Initializes logging configuration.

### `sizeConversion.ts`
Size unit conversions.

| Function | Description |
|----------|-------------|
| `inchesToPixels(inches, dpi)` | Converts inches to pixels |
| `pixelsToInches(pixels, dpi)` | Converts pixels to inches |
| `mmToPixels(mm, dpi)` | Converts mm to pixels |
| `pixelsToMm(pixels, dpi)` | Converts pixels to mm |

### `supabase.ts`
Supabase storage utilities.

| Function | Description |
|----------|-------------|
| `uploadFile(bucket, path, file)` | Uploads file to storage |
| `deleteFile(bucket, path)` | Deletes file from storage |
| `getSupabaseStorageUrl(path, bucket)` | Gets public URL for file |

---

## Routes (`src/routes/`)

### `+layout.server.ts`
Root layout server load - passes session, user, org_id, permissions to all pages.

### `+layout.svelte`
Root layout with theme provider, header, navigation, toast notifications.

### `+page.server.ts`
Landing page server load - minimal, public route.

### `+page.svelte`
Landing/marketing page with hero, features, pricing preview.

---

### `/account/`

#### `+page.server.ts`
Account page server load - fetches user profile data.

#### `+page.svelte`
Account settings page with profile form, password change, notification preferences.

---

### `/admin/`

#### `+layout.server.ts`
Admin layout guard - redirects non-admin users.

#### `+layout.svelte`
Admin layout with admin sidebar navigation.

#### `+page.server.ts`
Admin dashboard load - fetches org stats, recent activity.

#### `+page.svelte`
Admin dashboard with stats cards, recent users, quick actions.

#### `admin.remote.ts`
Route-specific admin API helpers.

#### `/credits/+page.server.ts`
Admin credits management - fetches all user credit balances.

#### `/credits/+page.svelte`
Credit management table with search, grant/revoke actions.

#### `/users/+page.server.ts`
Admin users list - fetches org users with roles.

**Actions:** `updateRole` - Updates user role

#### `/users/+page.svelte`
User management table with role editing, search, filters.

---

### `/all-ids/`

#### `+page.server.ts`
All IDs page load - fetches user's generated ID cards.

#### `+page.svelte`
ID cards grid/list view with search, filter, preview, delete.

#### `+page.ts`
Client-side page initialization.

---

### `/api/id-cards/[id]/`

#### `+server.ts`
ID card API endpoint.

| Method | Description |
|--------|-------------|
| `GET` | Fetches single ID card by ID |
| `DELETE` | Deletes ID card |
| `PATCH` | Updates ID card data |

---

### `/auth/`

#### `+page.server.ts`
Auth page server - handles login/signup form submissions.

**Actions:** `login`, `signup` - Processes auth forms

#### `+page.svelte`
Combined login/signup page with tabbed forms.

#### `/callback/+server.ts`
OAuth callback handler - exchanges code for session.

| Method | Description |
|--------|-------------|
| `GET` | Processes OAuth callback, sets session cookie, redirects |

#### `/forgot-password/+page.server.ts`
Password reset request handler.

**Actions:** `default` - Sends password reset email

#### `/forgot-password/+page.svelte`
Forgot password form.

#### `/forgot-password/types.ts`
Types for forgot password flow.

#### `/reset-password/+page.server.ts`
Password reset completion handler.

**Actions:** `default` - Updates password with reset token

#### `/reset-password/+page.svelte`
New password entry form.

#### `/signout/+server.ts`
Signout endpoint.

| Method | Description |
|--------|-------------|
| `POST` | Signs out user, clears session, redirects to /auth |

---

### `/credits/`

#### `+page.server.ts`
Credits page load - fetches user credits and transaction history.

---

### `/debug-user/`

#### `+page.server.ts`
Debug page load - fetches detailed user/session info (dev only).

#### `+page.svelte`
Debug page showing raw user data, session, JWT claims.

---

### `/features/`

#### `+page.server.ts`
Features page load - public route.

#### `+page.svelte`
Features marketing page with feature cards and demos.

---

### `/pricing/`

#### `+page.server.ts`
Pricing page load - fetches credit packages.

#### `+page.svelte`
Pricing page with package cards, comparison table, FAQ.

---

### `/profile/`

#### `+page.server.ts`
Profile page load - fetches user profile.

**Actions:** `update` - Updates profile data

#### `+page.svelte`
Profile edit form with avatar upload, name, email, preferences.

---

### `/templates/`

#### `+page.server.ts`
Templates page load - fetches org templates.

**Actions:** `create` - Creates/updates template, `delete` - Deletes template, `select` - Fetches single template

#### `+page.svelte`
Template management page with grid, editor modal, delete confirmation.

---

### `/use-template/`

#### `+page.server.ts`
Template selection page load - fetches available templates.

#### `/[id]/+page.server.ts`
ID generation page load - fetches template by ID.

**Actions:** `generate` - Creates ID card from template + form data

#### `/[id]/+page.svelte`
ID generation form with dynamic fields based on template elements.

#### `/[id]/+page.ts`
Client-side initialization for ID generation.

#### `/[id]/types.ts`
Types for ID generation flow.

#### `/[id]/utils.ts`
Utilities for ID generation (form building, data mapping).

---

### `/webhooks/paymongo/`

#### `+server.ts`
PayMongo webhook endpoint.

| Method | Description |
|--------|-------------|
| `POST` | Receives PayMongo events, verifies signature, processes payment updates |

---

## Summary

| Category | File Count |
|----------|------------|
| Core Files | 5 |
| Components | 35 |
| Empty States | 5 |
| Custom UI | 6 |
| Config | 3 |
| Hooks | 1 |
| Payments | 3 |
| Remote | 4 |
| Schemas | 11 |
| Server | 6 |
| Services | 2 |
| Stores | 7 |
| Types | 11 |
| Utils | 21 |
| Routes | 40+ |
| **Total** | **155+** |
