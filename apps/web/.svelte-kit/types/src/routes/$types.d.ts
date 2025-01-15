import type * as Kit from '@sveltejs/kit';

type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
// @ts-ignore
type MatcherParam<M> = M extends (param : string) => param is infer U ? U extends string ? U : string : string;
type RouteParams = {  };
type RouteId = '/';
type MaybeWithVoid<T> = {} extends T ? T | void : T;
export type RequiredKeys<T> = { [K in keyof T]-?: {} extends { [P in K]: T[K] } ? never : K; }[keyof T];
type OutputDataShape<T> = MaybeWithVoid<Omit<App.PageData, RequiredKeys<T>> & Partial<Pick<App.PageData, keyof T & keyof App.PageData>> & Record<string, any>>
type EnsureDefined<T> = T extends null | undefined ? {} : T;
type OptionalUnion<U extends Record<string, any>, A extends keyof U = U extends U ? keyof U : never> = U extends unknown ? { [P in Exclude<A, keyof U>]?: never } & U : never;
export type Snapshot<T = any> = Kit.Snapshot<T>;
type PageParentData = EnsureDefined<LayoutData>;
type LayoutRouteId = RouteId | "/" | "/(admin)/midcodes" | "/auth" | "/auth/forgot-password" | "/auth/reset-password" | "/constrack" | "/constrack/cart" | "/constrack/checkout/success" | "/dorm" | "/dorm/accounts" | "/dorm/budgets" | "/dorm/expenses" | "/dorm/floors" | "/dorm/leases" | "/dorm/meters" | "/dorm/overview/monthly" | "/dorm/payments" | "/dorm/properties" | "/dorm/readings" | "/dorm/rental_unit" | "/dorm/tenants" | "/dorm/transactions" | "/dorm/utility-billings" | "/events/[event_url]" | "/events/[event_url]/[reference_number]" | "/events/[event_url]/name-tags" | "/events/[event_url]/payments" | "/events/[event_url]/qr-checker" | "/events/[event_url]/register" | "/events/[event_url]/test" | "/id-gen" | "/id-gen/all-ids" | "/id-gen/templates" | "/id-gen/use-template" | "/id-gen/use-template/[id]" | null
type LayoutParams = RouteParams & { event_url?: string; reference_number?: string; id?: string }
type LayoutServerParentData = EnsureDefined<{}>;
type LayoutParentData = EnsureDefined<{}>;

export type PageServerData = null;
export type PageData = Expand<PageParentData>;
export type LayoutServerLoad<OutputData extends Partial<App.PageData> & Record<string, any> | void = Partial<App.PageData> & Record<string, any> | void> = Kit.ServerLoad<LayoutParams, LayoutServerParentData, OutputData, LayoutRouteId>;
export type LayoutServerLoadEvent = Parameters<LayoutServerLoad>[0];
export type LayoutServerData = Expand<OptionalUnion<EnsureDefined<Kit.LoadProperties<Awaited<ReturnType<typeof import('./proxy+layout.server.js').load>>>>>>;
export type LayoutLoad<OutputData extends OutputDataShape<LayoutParentData> = OutputDataShape<LayoutParentData>> = Kit.Load<LayoutParams, LayoutServerData, LayoutParentData, OutputData, LayoutRouteId>;
export type LayoutLoadEvent = Parameters<LayoutLoad>[0];
export type LayoutData = Expand<Omit<LayoutParentData, keyof Kit.LoadProperties<Awaited<ReturnType<typeof import('./proxy+layout.js').load>>>> & OptionalUnion<EnsureDefined<Kit.LoadProperties<Awaited<ReturnType<typeof import('./proxy+layout.js').load>>>>>>;
export type RequestEvent = Kit.RequestEvent<RouteParams, RouteId>;