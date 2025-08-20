/**
 * Template Data Handling Schemas
 * 
 * This module exports all template-related Zod schemas and their inferred TypeScript types.
 * All schemas follow the pixel + DPI approach for consistent dimension handling.
 * 
 * Usage:
 * - Import schemas for validation: `import { templateCreationInputSchema } from '@/schemas'`
 * - Import types for TypeScript: `import type { TemplateElement } from '@/schemas'`
 */

// Re-export all schemas and types from individual schema modules

// Template Creation Schemas & Types
export {
	dpiSchema,
	pixelDimensionSchema,
	templateCreationInputSchema,
	templateCreationDataSchema,
	templatePresetSchema,
	dpiOptionSchema,
	type TemplateCreationInput,
	type TemplateCreationData,
	type TemplatePreset,
	type DpiOption
} from './template-creation.schema.js';

// Template Element Schemas & Types
export {
	elementTypeSchema,
	positionSchema,
	dimensionSchema,
	fontSizeSchema,
	fontFamilySchema,
	fontWeightSchema,
	fontStyleSchema,
	textDecorationSchema,
	textTransformSchema,
	textAlignmentSchema,
	colorSchema,
	opacitySchema,
	sideSchema,
	variableNameSchema,
	baseTemplateElementSchema,
	textElementSchema,
	imageElementSchema,
	qrElementSchema,
	photoElementSchema,
	signatureElementSchema,
	selectionElementSchema,
	templateElementSchema,
	templateElementInputSchema,
	templateElementUpdateSchema,
	type ElementType,
	type TemplateElement,
	type TemplateElementInput,
	type TemplateElementUpdate,
	type TextElement,
	type ImageElement,
	type QrElement,
	type PhotoElement,
	type SignatureElement,
	type SelectionElement
} from './template-element.schema.js';

// Template Update Schemas & Types
export {
	templateUpdateInputSchema,
	templateUpdateDataSchema,
	templatePatchSchema,
	templateDuplicateSchema,
	templatePublishSchema,
	templateArchiveSchema,
	templateBulkOperationSchema,
	templateValidationSchema,
	templateExportSchema,
	templateImportSchema,
	type TemplateUpdateInput,
	type TemplateUpdateData,
	type TemplatePatch,
	type TemplateDuplicate,
	type TemplatePublish,
	type TemplateArchive,
	type TemplateBulkOperation,
	type TemplateValidation,
	type TemplateExport,
	type TemplateImport
} from './template-update.schema.js';

// Display & Conversion Schemas & Types
export {
	displayUnitSchema,
	pixelDimensionsSchema,
	physicalDimensionsSchema,
	dimensionConversionSchema,
	dimensionInputSchema,
	displayFormatSchema,
	formattedDimensionSchema,
	sizePresetSchema,
	dpiQualitySchema,
	unitConversionSchema,
	templateDimensionSummarySchema,
	imageUploadValidationSchema,
	dimensionValidationSchema,
	printSpecificationSchema,
	type DisplayUnit,
	type PixelDimensions,
	type PhysicalDimensions,
	type DimensionConversion,
	type DimensionInput,
	type DisplayFormat,
	type FormattedDimension,
	type SizePreset,
	type DpiQuality,
	type UnitConversion,
	type TemplateDimensionSummary,
	type ImageUploadValidation,
	type DimensionValidation,
	type PrintSpecification
} from './display-conversion.schema.js';

// ID Card Schemas & Types
export {
	idCardCreationInputSchema,
	idCardDataSchema,
	idCardResponseSchema,
	idCardFormDataSchema,
	idCardGenerationRequestSchema,
	idCardSearchSchema,
	idCardBulkOperationSchema,
	imageUploadSchema,
	imageUploadResultSchema,
	imageUploadErrorSchema,
	storageDeleteSchema,
	storageUploadSchema,
	idCardValidationSchema,
	idCardStatsSchema,
	type IdCardCreationInput,
	type IdCardData,
	type IdCardResponse,
	type IdCardFormData,
	type IdCardGenerationRequest,
	type IdCardSearch,
	type IdCardBulkOperation,
	type ImageUpload,
	type ImageUploadResult,
	type ImageUploadError,
	type StorageDelete,
	type StorageUpload,
	type IdCardValidation,
	type IdCardStats
} from './idcard.schema.js';

// Organization Schemas & Types
export {
	organizationCreationSchema,
	organizationDataSchema,
	organizationResponseSchema,
	organizationUpdateSchema,
	orgSettingsSchema,
	orgSettingsUpdateSchema,
	organizationMemberSchema,
	organizationInviteSchema,
	organizationMemberUpdateSchema,
	organizationStatsSchema,
	organizationLimitsSchema,
	organizationBillingSchema,
	organizationSearchSchema,
	type OrganizationCreation,
	type OrganizationData,
	type OrganizationResponse,
	type OrganizationUpdate,
	type OrgSettings,
	type OrgSettingsUpdate,
	type OrganizationMember,
	type OrganizationInvite,
	type OrganizationMemberUpdate,
	type OrganizationStats,
	type OrganizationLimits,
	type OrganizationBilling,
	type OrganizationSearch
} from './organization.schema.js';

// Authentication Schemas & Types
export {
	userRoleSchema,
	loginSchema,
	registerSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
	userProfileSchema,
	userProfileUpdateSchema,
	userRoleAssignmentSchema,
	rolePermissionSchema,
	sessionSchema,
	authStateSchema,
	permissionCheckSchema,
	userInvitationSchema,
	creditTransactionSchema,
	changePasswordSchema,
	updateAccountSchema,
	deleteAccountSchema,
	enable2FASchema,
	verify2FASchema,
	type UserRole,
	type Login,
	type Register,
	type ForgotPassword,
	type ResetPassword,
	type UserProfile,
	type UserProfileUpdate,
	type UserRoleAssignment,
	type RolePermission,
	type Session,
	type AuthState,
	type PermissionCheck,
	type UserInvitation,
	type CreditTransaction,
	type ChangePassword,
	type UpdateAccount,
	type DeleteAccount,
	type Enable2FA,
	type Verify2FA
} from './auth.schema.js';

// Admin Schemas & Types
export {
	adminAuditSchema,
	adminAuditInputSchema,
	adminAuditSearchSchema,
	adminActionSchema,
	adminStatsSchema,
	systemOverviewSchema,
	adminActionWithContextSchema,
	type AdminAudit,
	type AdminAuditInput,
	type AdminAuditSearch,
	type AdminAction,
	type AdminStats,
	type SystemOverview,
	type AdminActionWithContext
} from './admin.schema.js';

// Billing & Payment Schemas & Types  
export {
	creditTransactionSchema,
	creditTransactionInputSchema,
	paymentMethodSchema,
	paymentSchema,
	paymentInputSchema,
	webhookEventSchema,
	webhookProcessingResultSchema,
	creditPackageSchema,
	billingSummarySchema,
	usageAnalyticsSchema,
	paymentRefundSchema,
	creditAdjustmentSchema,
	type CreditTransaction,
	type CreditTransactionInput,
	type PaymentMethod,
	type Payment,
	type PaymentInput,
	type WebhookEvent,
	type WebhookProcessingResult,
	type CreditPackage,
	type BillingSummary,
	type UsageAnalytics,
	type PaymentRefund,
	type CreditAdjustment
} from './billing.schema.js';

// Utility type helpers for common use cases
export type Template = TemplateCreationData & {
	template_elements: TemplateElement[];
};

export type TemplateWithDimensions = Template & {
	dimensions: TemplateDimensionSummary;
};

export type ElementsByType = {
	text: TextElement[];
	image: ImageElement[];
	qr: QrElement[];
	photo: PhotoElement[];
	signature: SignatureElement[];
	selection: SelectionElement[];
};

export type TemplateFormData = {
	basic: Pick<TemplateCreationInput, 'name' | 'description'>;
	dimensions: Pick<TemplateCreationInput, 'width_pixels' | 'height_pixels' | 'dpi'>;
	backgrounds: {
		front?: string;
		back?: string;
	};
	elements: TemplateElement[];
};

// Schema validation helpers
export type ValidationResult<T> = {
	success: boolean;
	data?: T;
	errors?: Array<{
		path: string[];
		message: string;
		code?: string;
	}>;
};

// Common dimension presets (exported as const for tree-shaking)
export const COMMON_DPI_VALUES = [72, 150, 300, 600] as const;
export const COMMON_CARD_SIZES = {
	creditCard: { width: 1013, height: 638 },
	businessCard: { width: 1050, height: 600 },
	idBadge: { width: 900, height: 1200 },
	lanyardCard: { width: 780, height: 1170 }
} as const;

// Default values
export const DEFAULT_DPI = 300;
export const DEFAULT_TEMPLATE_SIZE = COMMON_CARD_SIZES.creditCard;
export const MIN_DIMENSION_PX = 100;
export const MAX_DIMENSION_PX = 7200;
export const MIN_DPI = 72;
export const MAX_DPI = 600;