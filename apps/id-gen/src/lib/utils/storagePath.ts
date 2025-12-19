/**
 * Structured Storage Paths for Asset Management (Option B)
 */

export type AssetVariant = 'full' | 'preview' | 'thumb' | 'sample' | 'blank';
export type AssetSide = 'front' | 'back';

/**
 * Generate a structured path for an ID card's raw uploaded assets (photo, signature)
 * Path: cards/[orgId]/[templateId]/[cardId]/raw/[variableName].[extension]
 */
export function getCardRawAssetPath(
	orgId: string,
	templateId: string,
	cardId: string,
	variableName: string,
	extension: string = 'png'
): string {
	return `cards/${orgId}/${templateId}/${cardId}/raw/${variableName}.${extension}`;
}

/**
 * Generates the storage path for a template asset.
 * Path: system/templates/[templateId]/[variant]-[side].[extension]
 */
export function getTemplateAssetPath(
    templateId: string,
    variant: AssetVariant,
    side: AssetSide,
    extension: string = 'png'
): string {
    const filename = variant === 'full' ? `${side}.${extension}` : `${variant}-${side}.${extension}`;
    return `system/templates/${templateId}/${filename}`;
}

/**
 * Generates the storage path for an ID card asset.
 * Path: cards/[orgId]/[templateId]/[cardId]/[variant]-[side].[extension]
 */
export function getCardAssetPath(
    orgId: string,
    templateId: string,
    cardId: string,
    variant: AssetVariant | 'master',
    side: AssetSide,
    extension: string = 'png'
): string {
    const prefix = variant === 'master' || variant === 'full' ? side : `${variant}-${side}`;
    return `cards/${orgId}/${templateId}/${cardId}/${prefix}.${extension}`;
}

/**
 * Generates path for global assets
 */
export function getGlobalAssetPath(category: 'icons' | 'fonts', filename: string): string {
    return `system/global-assets/${category}/${filename}`;
}

/**
 * Generates path for organization branding
 */
export function getOrgBrandingPath(orgId: string, filename: string): string {
    return `orgs/${orgId}/branding/${filename}`;
}
