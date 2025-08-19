export type ValidationError = {
	field: string;
	message: string;
};

export function validateRequired(value: unknown, field: string): ValidationError | null {
	if (value === null || value === undefined || value === '') return { field, message: 'This field is required.' };
	return null;
}

export function validateAll(validators: Array<() => ValidationError | null>): ValidationError[] {
	return validators.map((fn) => fn()).filter((v): v is ValidationError => Boolean(v));
}

