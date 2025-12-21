/**
 * Structured Storage Paths for Asset Management (Option B)
 */

export type AssetVariant = 'full' | 'preview' | 'thumb' | 'sample' | 'blank';
export type AssetSide = 'front' | 'back';

export const TEMPLATES_BUCKET = 'templates';
export const CARDS_BUCKET = 'cards';

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
	// Doc: template-front.png, template-front-preview.png
	const prefix = `template-${side}`;
	const filename =
		variant === 'full' ? `${prefix}.${extension}` : `${prefix}-${variant}.${extension}`;
	return `templates/${templateId}/${filename}`;
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
	return `global-assets/${category}/${filename}`;
}

/**
 * Generates path for organization branding
 */
export function getOrgBrandingPath(orgId: string, filename: string): string {
	return `orgs/${orgId}/branding/${filename}`;
}

/**
 * Generates path for decomposed layers
 * Path: templates/[templateId]/decompose/[generationId]/layer_[index].png
 */
export function getDecomposedLayerPath(
	templateId: string,
	generationId: string,
	layerIndex: number,
	extension: string = 'png'
): string {
	return `templates/${templateId}/decompose/${generationId}/layer_${layerIndex}.${extension}`;
}
