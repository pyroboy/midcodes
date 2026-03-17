// @ts-nocheck - Generated Supabase types with complex helper utilities
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	// Allows to automatically instantiate createClient with right options
	// instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
	__InternalSupabase: {
		PostgrestVersion: '12.2.12 (cd3cf9e)';
	};
	public: {
		Tables: {
			admin_audit: {
				Row: {
					action: string;
					admin_id: string;
					created_at: string | null;
					id: string;
					metadata: Json | null;
					org_id: string;
					target_id: string | null;
					target_type: string | null;
				};
				Insert: {
					action: string;
					admin_id: string;
					created_at?: string | null;
					id?: string;
					metadata?: Json | null;
					org_id: string;
					target_id?: string | null;
					target_type?: string | null;
				};
				Update: {
					action?: string;
					admin_id?: string;
					created_at?: string | null;
					id?: string;
					metadata?: Json | null;
					org_id?: string;
					target_id?: string | null;
					target_type?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'admin_audit_admin_id_fkey';
						columns: ['admin_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'admin_audit_org_id_fkey';
						columns: ['org_id'];
						isOneToOne: false;
						referencedRelation: 'organizations';
						referencedColumns: ['id'];
					}
				];
			};
			ai_prompts: {
				Row: {
					prompt_id: string;
					prompt_text: string;
					updated_at: string;
				};
				Insert: {
					prompt_id: string;
					prompt_text: string;
					updated_at?: string;
				};
				Update: {
					prompt_id?: string;
					prompt_text?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			attendees: {
				Row: {
					attendance_status: string | null;
					basic_info: Json | null;
					created_at: string | null;
					event_id: string;
					id: string;
					is_paid: boolean | null;
					is_printed: boolean | null;
					org_id: string;
					qr_link: string | null;
					qr_scan_info: Json[] | null;
					received_by: string | null;
					reference_code_url: string | null;
					ticket_info: Json | null;
					updated_at: string | null;
				};
				Insert: {
					attendance_status?: string | null;
					basic_info?: Json | null;
					created_at?: string | null;
					event_id: string;
					id?: string;
					is_paid?: boolean | null;
					is_printed?: boolean | null;
					org_id: string;
					qr_link?: string | null;
					qr_scan_info?: Json[] | null;
					received_by?: string | null;
					reference_code_url?: string | null;
					ticket_info?: Json | null;
					updated_at?: string | null;
				};
				Update: {
					attendance_status?: string | null;
					basic_info?: Json | null;
					created_at?: string | null;
					event_id?: string;
					id?: string;
					is_paid?: boolean | null;
					is_printed?: boolean | null;
					org_id?: string;
					qr_link?: string | null;
					qr_scan_info?: Json[] | null;
					received_by?: string | null;
					reference_code_url?: string | null;
					ticket_info?: Json | null;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'attendees_event_id_fkey';
						columns: ['event_id'];
						isOneToOne: false;
						referencedRelation: 'events';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'attendees_event_id_fkey';
						columns: ['event_id'];
						isOneToOne: false;
						referencedRelation: 'public_events';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'attendees_org_id_fkey';
						columns: ['org_id'];
						isOneToOne: false;
						referencedRelation: 'organizations';
						referencedColumns: ['id'];
					}
				];
			};
			billings: {
				Row: {
					amount: number;
					balance: number;
					billing_date: string;
					created_at: string;
					due_date: string;
					id: number;
					lease_id: number;
					meter_id: number | null;
					notes: string | null;
					paid_amount: number | null;
					penalty_amount: number | null;
					status: Database['public']['Enums']['payment_status'];
					type: Database['public']['Enums']['billing_type'];
					updated_at: string | null;
					utility_type: Database['public']['Enums']['utility_type'] | null;
				};
				Insert: {
					amount: number;
					balance: number;
					billing_date: string;
					created_at?: string;
					due_date: string;
					id?: number;
					lease_id: number;
					meter_id?: number | null;
					notes?: string | null;
					paid_amount?: number | null;
					penalty_amount?: number | null;
					status?: Database['public']['Enums']['payment_status'];
					type: Database['public']['Enums']['billing_type'];
					updated_at?: string | null;
					utility_type?: Database['public']['Enums']['utility_type'] | null;
				};
				Update: {
					amount?: number;
					balance?: number;
					billing_date?: string;
					created_at?: string;
					due_date?: string;
					id?: number;
					lease_id?: number;
					meter_id?: number | null;
					notes?: string | null;
					paid_amount?: number | null;
					penalty_amount?: number | null;
					status?: Database['public']['Enums']['payment_status'];
					type?: Database['public']['Enums']['billing_type'];
					updated_at?: string | null;
					utility_type?: Database['public']['Enums']['utility_type'] | null;
				};
				Relationships: [
					{
						foreignKeyName: 'billings_lease_id_fkey';
						columns: ['lease_id'];
						isOneToOne: false;
						referencedRelation: 'leases';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'billings_meter_id_fkey';
						columns: ['meter_id'];
						isOneToOne: false;
						referencedRelation: 'meters';
						referencedColumns: ['id'];
					}
				];
			};
			credit_transactions: {
				Row: {
					amount: number;
					created_at: string | null;
					credits_after: number;
					credits_before: number;
					description: string | null;
					id: string;
					invoice_id: string | null;
					metadata: Json | null;
					org_id: string;
					reference_id: string | null;
					transaction_type: string;
					updated_at: string | null;
					usage_type: string | null;
					user_id: string;
				};
				Insert: {
					amount: number;
					created_at?: string | null;
					credits_after: number;
					credits_before: number;
					description?: string | null;
					id?: string;
					invoice_id?: string | null;
					metadata?: Json | null;
					org_id: string;
					reference_id?: string | null;
					transaction_type: string;
					updated_at?: string | null;
					usage_type?: string | null;
					user_id: string;
				};
				Update: {
					amount?: number;
					created_at?: string | null;
					credits_after?: number;
					credits_before?: number;
					description?: string | null;
					id?: string;
					invoice_id?: string | null;
					metadata?: Json | null;
					org_id?: string;
					reference_id?: string | null;
					transaction_type?: string;
					updated_at?: string | null;
					usage_type?: string | null;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'credit_transactions_invoice_id_fkey';
						columns: ['invoice_id'];
						isOneToOne: false;
						referencedRelation: 'invoices';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'credit_transactions_org_id_fkey';
						columns: ['org_id'];
						isOneToOne: false;
						referencedRelation: 'organizations';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'credit_transactions_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			events: {
				Row: {
					created_at: string | null;
					created_by: string;
					event_long_name: string | null;
					event_name: string;
					event_url: string | null;
					id: string;
					is_public: boolean | null;
					org_id: string;
					other_info: Json | null;
					payment_timeout_minutes: number | null;
					ticketing_data: Json[] | null;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					created_by: string;
					event_long_name?: string | null;
					event_name: string;
					event_url?: string | null;
					id?: string;
					is_public?: boolean | null;
					org_id: string;
					other_info?: Json | null;
					payment_timeout_minutes?: number | null;
					ticketing_data?: Json[] | null;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					created_by?: string;
					event_long_name?: string | null;
					event_name?: string;
					event_url?: string | null;
					id?: string;
					is_public?: boolean | null;
					org_id?: string;
					other_info?: Json | null;
					payment_timeout_minutes?: number | null;
					ticketing_data?: Json[] | null;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'events_org_id_fkey';
						columns: ['org_id'];
						isOneToOne: false;
						referencedRelation: 'organizations';
						referencedColumns: ['id'];
					}
				];
			};
			idcards: {
				Row: {
					back_image: string | null;
					created_at: string | null;
					data: Json | null;
					front_image: string | null;
					id: string;
					org_id: string;
					template_id: string | null;
				};
				Insert: {
					back_image?: string | null;
					created_at?: string | null;
					data?: Json | null;
					front_image?: string | null;
					id?: string;
					org_id: string;
					template_id?: string | null;
				};
				Update: {
					back_image?: string | null;
					created_at?: string | null;
					data?: Json | null;
					front_image?: string | null;
					id?: string;
					org_id?: string;
					template_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'idcards_org_id_fkey';
						columns: ['org_id'];
						isOneToOne: false;
						referencedRelation: 'organizations';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'idcards_template_id_fkey';
						columns: ['template_id'];
						isOneToOne: false;
						referencedRelation: 'templates';
						referencedColumns: ['id'];
					}
				];
			};
			invoices: {
				Row: {
					amount_paid: number;
					created_at: string | null;
					created_by: string | null;
					discount_amount: number;
					due_date: string | null;
					id: string;
					internal_notes: string | null;
					invoice_number: string;
					invoice_type: string;
					issue_date: string | null;
					notes: string | null;
					org_id: string;
					paid_at: string | null;
					paid_by: string | null;
					payment_method: string | null;
					payment_reference: string | null;
					status: string;
					subtotal: number;
					tax_amount: number;
					total_amount: number;
					updated_at: string | null;
					user_id: string;
					voided_at: string | null;
					voided_by: string | null;
				};
				Insert: {
					amount_paid?: number;
					created_at?: string | null;
					created_by?: string | null;
					discount_amount?: number;
					due_date?: string | null;
					id?: string;
					internal_notes?: string | null;
					invoice_number: string;
					invoice_type?: string;
					issue_date?: string | null;
					notes?: string | null;
					org_id: string;
					paid_at?: string | null;
					paid_by?: string | null;
					payment_method?: string | null;
					payment_reference?: string | null;
					status?: string;
					subtotal?: number;
					tax_amount?: number;
					total_amount?: number;
					updated_at?: string | null;
					user_id: string;
					voided_at?: string | null;
					voided_by?: string | null;
				};
				Update: {
					amount_paid?: number;
					created_at?: string | null;
					created_by?: string | null;
					discount_amount?: number;
					due_date?: string | null;
					id?: string;
					internal_notes?: string | null;
					invoice_number?: string;
					invoice_type?: string;
					issue_date?: string | null;
					notes?: string | null;
					org_id?: string;
					paid_at?: string | null;
					paid_by?: string | null;
					payment_method?: string | null;
					payment_reference?: string | null;
					status?: string;
					subtotal?: number;
					tax_amount?: number;
					total_amount?: number;
					updated_at?: string | null;
					user_id?: string;
					voided_at?: string | null;
					voided_by?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'invoices_created_by_fkey';
						columns: ['created_by'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'invoices_org_id_fkey';
						columns: ['org_id'];
						isOneToOne: false;
						referencedRelation: 'organizations';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'invoices_paid_by_fkey';
						columns: ['paid_by'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'invoices_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'invoices_voided_by_fkey';
						columns: ['voided_by'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			invoice_items: {
				Row: {
					created_at: string | null;
					credits_granted: number | null;
					description: string;
					id: string;
					invoice_id: string;
					item_type: string;
					metadata: Json | null;
					quantity: number;
					sku_id: string | null;
					total_price: number;
					unit_price: number;
				};
				Insert: {
					created_at?: string | null;
					credits_granted?: number | null;
					description: string;
					id?: string;
					invoice_id: string;
					item_type: string;
					metadata?: Json | null;
					quantity?: number;
					sku_id?: string | null;
					total_price?: number;
					unit_price?: number;
				};
				Update: {
					created_at?: string | null;
					credits_granted?: number | null;
					description?: string;
					id?: string;
					invoice_id?: string;
					item_type?: string;
					metadata?: Json | null;
					quantity?: number;
					sku_id?: string | null;
					total_price?: number;
					unit_price?: number;
				};
				Relationships: [
					{
						foreignKeyName: 'invoice_items_invoice_id_fkey';
						columns: ['invoice_id'];
						isOneToOne: false;
						referencedRelation: 'invoices';
						referencedColumns: ['id'];
					}
				];
			};
			org_settings: {
				Row: {
					org_id: string;
					payments_bypass: boolean;
					payments_enabled: boolean;
					updated_at: string;
					updated_by: string | null;
				};
				Insert: {
					org_id: string;
					payments_bypass?: boolean;
					payments_enabled?: boolean;
					updated_at?: string;
					updated_by?: string | null;
				};
				Update: {
					org_id?: string;
					payments_bypass?: boolean;
					payments_enabled?: boolean;
					updated_at?: string;
					updated_by?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'org_settings_org_id_fkey';
						columns: ['org_id'];
						isOneToOne: true;
						referencedRelation: 'organizations';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'org_settings_updated_by_fkey';
						columns: ['updated_by'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			organizations: {
				Row: {
					created_at: string | null;
					id: string;
					name: string;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					id?: string;
					name: string;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					id?: string;
					name?: string;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			payment_records: {
				Row: {
					amount_php: number;
					created_at: string;
					currency: string;
					id: string;
					idempotency_key: string;
					kind: string;
					metadata: Json | null;
					method: string | null;
					method_allowed: string[];
					paid_at: string | null;
					provider_payment_id: string | null;
					raw_event: Json | null;
					reason: string | null;
					session_id: string;
					sku_id: string;
					status: string;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					amount_php: number;
					created_at?: string;
					currency?: string;
					id?: string;
					idempotency_key: string;
					kind: string;
					metadata?: Json | null;
					method?: string | null;
					method_allowed: string[];
					paid_at?: string | null;
					provider_payment_id?: string | null;
					raw_event?: Json | null;
					reason?: string | null;
					session_id: string;
					sku_id: string;
					status?: string;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					amount_php?: number;
					created_at?: string;
					currency?: string;
					id?: string;
					idempotency_key?: string;
					kind?: string;
					metadata?: Json | null;
					method?: string | null;
					method_allowed?: string[];
					paid_at?: string | null;
					provider_payment_id?: string | null;
					raw_event?: Json | null;
					reason?: string | null;
					session_id?: string;
					sku_id?: string;
					status?: string;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [];
			};
			profiles: {
				Row: {
					avatar_url: string | null;
					card_generation_count: number;
					context: Json | null;
					created_at: string | null;
					credits_balance: number;
					email: string | null;
					id: string;
					org_id: string | null;
					remove_watermarks: boolean;
					role: Database['public']['Enums']['user_role'] | null;
					template_count: number;
					unlimited_templates: boolean;
					updated_at: string | null;
				};
				Insert: {
					avatar_url?: string | null;
					card_generation_count?: number;
					context?: Json | null;
					created_at?: string | null;
					credits_balance?: number;
					email?: string | null;
					id: string;
					org_id?: string | null;
					remove_watermarks?: boolean;
					role?: Database['public']['Enums']['user_role'] | null;
					template_count?: number;
					unlimited_templates?: boolean;
					updated_at?: string | null;
				};
				Update: {
					avatar_url?: string | null;
					card_generation_count?: number;
					context?: Json | null;
					created_at?: string | null;
					credits_balance?: number;
					email?: string | null;
					id?: string;
					org_id?: string | null;
					remove_watermarks?: boolean;
					role?: Database['public']['Enums']['user_role'] | null;
					template_count?: number;
					unlimited_templates?: boolean;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'profiles_org_id_fkey';
						columns: ['org_id'];
						isOneToOne: false;
						referencedRelation: 'organizations';
						referencedColumns: ['id'];
					}
				];
			};
			role_permissions: {
				Row: {
					id: number;
					permission: Database['public']['Enums']['app_permission'];
					role: Database['public']['Enums']['app_role'];
				};
				Insert: {
					id?: number;
					permission: Database['public']['Enums']['app_permission'];
					role: Database['public']['Enums']['app_role'];
				};
				Update: {
					id?: number;
					permission?: Database['public']['Enums']['app_permission'];
					role?: Database['public']['Enums']['app_role'];
				};
				Relationships: [];
			};
			template_assets: {
				Row: {
					category: string | null;
					created_at: string;
					description: string | null;
					height_pixels: number;
					id: string;
					image_path: string;
					image_url: string;
					is_published: boolean;
					name: string;
					orientation: Database['public']['Enums']['template_orientation'];
					published_at: string | null;
					sample_type: Database['public']['Enums']['template_sample_type'];
					size_preset_id: string | null;
					tags: string[] | null;
					updated_at: string;
					uploaded_by: string | null;
					width_pixels: number;
				};
				Insert: {
					category?: string | null;
					created_at?: string;
					description?: string | null;
					height_pixels: number;
					id?: string;
					image_path: string;
					image_url: string;
					is_published?: boolean;
					name: string;
					orientation: Database['public']['Enums']['template_orientation'];
					published_at?: string | null;
					sample_type: Database['public']['Enums']['template_sample_type'];
					size_preset_id?: string | null;
					tags?: string[] | null;
					updated_at?: string;
					uploaded_by?: string | null;
					width_pixels: number;
				};
				Update: {
					category?: string | null;
					created_at?: string;
					description?: string | null;
					height_pixels?: number;
					id?: string;
					image_path?: string;
					image_url?: string;
					is_published?: boolean;
					name?: string;
					orientation?: Database['public']['Enums']['template_orientation'];
					published_at?: string | null;
					sample_type?: Database['public']['Enums']['template_sample_type'];
					size_preset_id?: string | null;
					tags?: string[] | null;
					updated_at?: string;
					uploaded_by?: string | null;
					width_pixels?: number;
				};
				Relationships: [
					{
						foreignKeyName: 'template_assets_size_preset_id_fkey';
						columns: ['size_preset_id'];
						isOneToOne: false;
						referencedRelation: 'template_size_presets';
						referencedColumns: ['id'];
					}
				];
			};
			template_size_presets: {
				Row: {
					aspect_ratio: number | null;
					created_at: string | null;
					description: string | null;
					dpi: number;
					height_inches: number;
					height_mm: number;
					height_pixels: number;
					id: string;
					is_active: boolean;
					name: string;
					slug: string;
					sort_order: number;
					updated_at: string | null;
					width_inches: number;
					width_mm: number;
					width_pixels: number;
				};
				Insert: {
					aspect_ratio?: number | null;
					created_at?: string | null;
					description?: string | null;
					dpi?: number;
					height_inches: number;
					height_mm: number;
					height_pixels: number;
					id?: string;
					is_active?: boolean;
					name: string;
					slug: string;
					sort_order?: number;
					updated_at?: string | null;
					width_inches: number;
					width_mm: number;
					width_pixels: number;
				};
				Update: {
					aspect_ratio?: number | null;
					created_at?: string | null;
					description?: string | null;
					dpi?: number;
					height_inches?: number;
					height_mm?: number;
					height_pixels?: number;
					id?: string;
					is_active?: boolean;
					name?: string;
					slug?: string;
					sort_order?: number;
					updated_at?: string | null;
					width_inches?: number;
					width_mm?: number;
					width_pixels?: number;
				};
				Relationships: [];
			};
			templates: {
				Row: {
					back_background: string | null;
					created_at: string | null;
					dpi: number | null;
					front_background: string | null;
					height_pixels: number | null;
					id: string;
					name: string;
					org_id: string | null;
					orientation: string | null;
					template_elements: Json;
					updated_at: string | null;
					user_id: string | null;
					width_pixels: number | null;
				};
				Insert: {
					back_background?: string | null;
					created_at?: string | null;
					dpi?: number | null;
					front_background?: string | null;
					height_pixels?: number | null;
					id?: string;
					name: string;
					org_id?: string | null;
					orientation?: string | null;
					template_elements: Json;
					updated_at?: string | null;
					user_id?: string | null;
					width_pixels?: number | null;
				};
				Update: {
					back_background?: string | null;
					created_at?: string | null;
					dpi?: number | null;
					front_background?: string | null;
					height_pixels?: number | null;
					id?: string;
					name?: string;
					org_id?: string | null;
					orientation?: string | null;
					template_elements?: Json;
					updated_at?: string | null;
					user_id?: string | null;
					width_pixels?: number | null;
				};
				Relationships: [
					{
						foreignKeyName: 'templates_org_id_fkey';
						columns: ['org_id'];
						isOneToOne: false;
						referencedRelation: 'organizations';
						referencedColumns: ['id'];
					}
				];
			};
			user_roles: {
				Row: {
					id: number;
					role: Database['public']['Enums']['app_role'];
					user_id: string;
				};
				Insert: {
					id?: number;
					role: Database['public']['Enums']['app_role'];
					user_id: string;
				};
				Update: {
					id?: number;
					role?: Database['public']['Enums']['app_role'];
					user_id?: string;
				};
				Relationships: [];
			};
			webhook_events: {
				Row: {
					created_at: string;
					event_id: string;
					event_type: string;
					id: string;
					processed_at: string;
					provider: string;
					raw_payload: Json;
				};
				Insert: {
					created_at?: string;
					event_id: string;
					event_type: string;
					id?: string;
					processed_at?: string;
					provider?: string;
					raw_payload: Json;
				};
				Update: {
					created_at?: string;
					event_id?: string;
					event_type?: string;
					id?: string;
					processed_at?: string;
					provider?: string;
					raw_payload?: Json;
				};
				Relationships: [];
			};
		};
		Views: {
			public_events: {
				Row: {
					event_long_name: string | null;
					event_name: string | null;
					event_url: string | null;
					id: string | null;
					is_public: boolean | null;
					org_id: string | null;
					organization_name: string | null;
					other_info: Json | null;
					ticketing_data: Json[] | null;
				};
				Relationships: [
					{
						foreignKeyName: 'events_org_id_fkey';
						columns: ['org_id'];
						isOneToOne: false;
						referencedRelation: 'organizations';
						referencedColumns: ['id'];
					}
				];
			};
		};
		Functions: {
			authorize: {
				Args: {
					requested_permission: Database['public']['Enums']['app_permission'];
				};
				Returns: boolean;
			};
			custom_access_token_hook: { Args: { event: Json }; Returns: Json };
			generate_invoice_number: { Args: Record<PropertyKey, never>; Returns: string };
			get_current_context: { Args: Record<PropertyKey, never>; Returns: Json };
			get_effective_role: {
				Args: { user_uuid: string };
				Returns: Database['public']['Enums']['user_role'];
			};
			get_idcards_by_org: {
				Args: { org_id: string; page_limit?: number; page_offset?: number };
				Returns: Json;
			};
			get_template_by_id: {
				Args: { p_template_id: string; p_user_id: string };
				Returns: {
					back_background: string | null;
					created_at: string | null;
					dpi: number | null;
					front_background: string | null;
					height_pixels: number | null;
					id: string;
					name: string;
					org_id: string | null;
					orientation: string | null;
					template_elements: Json;
					updated_at: string | null;
					user_id: string | null;
					width_pixels: number | null;
				}[];
			};
			insert_admin_audit: {
				Args: {
					p_action: string;
					p_admin_id: string;
					p_metadata?: Json;
					p_org_id: string;
					p_target_id?: string;
					p_target_type?: string;
				};
				Returns: string;
			};
			is_admin_level: { Args: Record<PropertyKey, never>; Returns: boolean };
			is_staff_level: { Args: Record<PropertyKey, never>; Returns: boolean };
		};
		Enums: {
			app_permission:
				| 'properties.create'
				| 'properties.read'
				| 'properties.update'
				| 'properties.delete'
				| 'floors.create'
				| 'floors.read'
				| 'floors.update'
				| 'floors.delete'
				| 'rental_units.create'
				| 'rental_units.read'
				| 'rental_units.update'
				| 'rental_units.delete'
				| 'maintenance.create'
				| 'maintenance.read'
				| 'maintenance.update'
				| 'maintenance.delete'
				| 'expenses.create'
				| 'expenses.read'
				| 'expenses.update'
				| 'expenses.delete'
				| 'tenants.create'
				| 'tenants.read'
				| 'tenants.update'
				| 'tenants.delete'
				| 'leases.create'
				| 'leases.read'
				| 'leases.update'
				| 'leases.delete'
				| 'billings.create'
				| 'billings.read'
				| 'billings.update'
				| 'billings.delete'
				| 'payments.create'
				| 'payments.read'
				| 'payments.update'
				| 'payments.delete'
				| 'payment_schedules.manage'
				| 'payment_schedules.read'
				| 'penalties.configure'
				| 'meters.create'
				| 'meters.read'
				| 'meters.update'
				| 'meters.delete'
				| 'readings.create'
				| 'readings.read'
				| 'readings.update'
				| 'readings.delete'
				| 'events.create'
				| 'events.read'
				| 'events.update'
				| 'events.delete'
				| 'attendees.create'
				| 'attendees.read'
				| 'attendees.update'
				| 'attendees.delete'
				| 'attendees.check_qr'
				| 'templates.create'
				| 'templates.read'
				| 'templates.update'
				| 'templates.delete'
				| 'idcards.create'
				| 'idcards.read'
				| 'idcards.update'
				| 'idcards.delete'
				| 'organizations.create'
				| 'organizations.read'
				| 'organizations.update'
				| 'organizations.delete'
				| 'profiles.read'
				| 'profiles.update'
				| 'bookings.read'
				| 'bookings.update'
				| 'bookings.delete';
			app_role:
				| 'super_admin'
				| 'org_admin'
				| 'user'
				| 'event_admin'
				| 'event_qr_checker'
				| 'property_admin'
				| 'property_user'
				| 'id_gen_admin'
				| 'id_gen_user';
			billing_type: 'RENT' | 'UTILITY' | 'PENALTY' | 'MAINTENANCE' | 'SERVICE' | 'SECURITY_DEPOSIT';
			payment_status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'PENALIZED';
			template_orientation: 'landscape' | 'portrait';
			template_sample_type: 'data_filled' | 'blank_template';
			user_role:
				| 'super_admin'
				| 'org_admin'
				| 'user'
				| 'event_admin'
				| 'event_qr_checker'
				| 'property_admin'
				| 'property_manager'
				| 'property_accountant'
				| 'property_maintenance'
				| 'property_utility'
				| 'property_frontdesk'
				| 'property_tenant'
				| 'property_guest'
				| 'id_gen_admin'
				| 'id_gen_user';
			utility_type: 'ELECTRICITY' | 'WATER' | 'INTERNET';
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DefaultSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		| { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
				Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof Database;
}
	? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
			Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof Database;
}
	? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof Database;
}
	? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof Database },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
		: never = never
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof Database;
}
	? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
		? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
		: never;
