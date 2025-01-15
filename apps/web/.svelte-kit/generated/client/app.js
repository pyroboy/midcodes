export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9'),
	() => import('./nodes/10'),
	() => import('./nodes/11'),
	() => import('./nodes/12'),
	() => import('./nodes/13'),
	() => import('./nodes/14'),
	() => import('./nodes/15'),
	() => import('./nodes/16'),
	() => import('./nodes/17'),
	() => import('./nodes/18'),
	() => import('./nodes/19'),
	() => import('./nodes/20'),
	() => import('./nodes/21'),
	() => import('./nodes/22'),
	() => import('./nodes/23'),
	() => import('./nodes/24'),
	() => import('./nodes/25'),
	() => import('./nodes/26'),
	() => import('./nodes/27'),
	() => import('./nodes/28'),
	() => import('./nodes/29'),
	() => import('./nodes/30'),
	() => import('./nodes/31'),
	() => import('./nodes/32'),
	() => import('./nodes/33'),
	() => import('./nodes/34'),
	() => import('./nodes/35'),
	() => import('./nodes/36'),
	() => import('./nodes/37')
];

export const server_loads = [0];

export const dictionary = {
		"/": [3],
		"/auth": [~5],
		"/auth/forgot-password": [~6],
		"/auth/reset-password": [~7],
		"/constrack": [~8],
		"/constrack/cart": [~9],
		"/constrack/checkout/success": [10],
		"/dorm": [~11],
		"/dorm/accounts": [~12],
		"/dorm/budgets": [~13],
		"/dorm/expenses": [~14],
		"/dorm/floors": [~15],
		"/dorm/leases": [~16],
		"/dorm/meters": [~17],
		"/dorm/overview/monthly": [~18],
		"/dorm/payments": [~19],
		"/dorm/properties": [~20],
		"/dorm/readings": [~21],
		"/dorm/rental_unit": [~22],
		"/dorm/tenants": [~23],
		"/dorm/transactions": [~24],
		"/dorm/utility-billings": [~25],
		"/events/[event_url]": [~26],
		"/events/[event_url]/name-tags": [~28],
		"/events/[event_url]/payments": [~29],
		"/events/[event_url]/qr-checker": [~30],
		"/events/[event_url]/register": [~31],
		"/events/[event_url]/test": [~32],
		"/events/[event_url]/[reference_number]": [~27],
		"/id-gen": [~33],
		"/id-gen/all-ids": [~34],
		"/id-gen/templates": [~35],
		"/id-gen/use-template": [~36],
		"/id-gen/use-template/[id]": [~37],
		"/(admin)/midcodes": [~4,[2]]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),
	
	reroute: (() => {}),
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export { default as root } from '../root.svelte';