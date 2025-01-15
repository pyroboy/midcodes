export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["android-chrome-192x192.png","android-chrome-512x512.png","apple-touch-icon.png","favicon-16x16.png","favicon-32x32.png","favicon.ico","site.webmanifest"]),
	mimeTypes: {".png":"image/png",".webmanifest":"application/manifest+json"},
	_: {
		client: {"start":"_app/immutable/entry/start.iMvf7pAN.js","app":"_app/immutable/entry/app.B9FVI0vD.js","imports":["_app/immutable/entry/start.iMvf7pAN.js","_app/immutable/chunks/entry.B5jMEGBp.js","_app/immutable/chunks/scheduler.Bl--k1HL.js","_app/immutable/chunks/index.CtH2YV38.js","_app/immutable/entry/app.B9FVI0vD.js","_app/immutable/chunks/36.jKjWACjA.js","_app/immutable/chunks/scheduler.Bl--k1HL.js","_app/immutable/chunks/index.DR8de1tj.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
		nodes: [
			__memo(() => import('../output/server/nodes/0.js')),
			__memo(() => import('../output/server/nodes/1.js')),
			__memo(() => import('../output/server/nodes/2.js')),
			__memo(() => import('../output/server/nodes/3.js')),
			__memo(() => import('../output/server/nodes/4.js')),
			__memo(() => import('../output/server/nodes/5.js')),
			__memo(() => import('../output/server/nodes/6.js')),
			__memo(() => import('../output/server/nodes/7.js')),
			__memo(() => import('../output/server/nodes/8.js')),
			__memo(() => import('../output/server/nodes/9.js')),
			__memo(() => import('../output/server/nodes/10.js')),
			__memo(() => import('../output/server/nodes/11.js')),
			__memo(() => import('../output/server/nodes/12.js')),
			__memo(() => import('../output/server/nodes/13.js')),
			__memo(() => import('../output/server/nodes/14.js')),
			__memo(() => import('../output/server/nodes/15.js')),
			__memo(() => import('../output/server/nodes/16.js')),
			__memo(() => import('../output/server/nodes/17.js')),
			__memo(() => import('../output/server/nodes/18.js')),
			__memo(() => import('../output/server/nodes/19.js')),
			__memo(() => import('../output/server/nodes/20.js')),
			__memo(() => import('../output/server/nodes/21.js')),
			__memo(() => import('../output/server/nodes/22.js')),
			__memo(() => import('../output/server/nodes/23.js')),
			__memo(() => import('../output/server/nodes/24.js')),
			__memo(() => import('../output/server/nodes/25.js')),
			__memo(() => import('../output/server/nodes/26.js')),
			__memo(() => import('../output/server/nodes/27.js')),
			__memo(() => import('../output/server/nodes/28.js')),
			__memo(() => import('../output/server/nodes/29.js')),
			__memo(() => import('../output/server/nodes/30.js')),
			__memo(() => import('../output/server/nodes/31.js')),
			__memo(() => import('../output/server/nodes/32.js')),
			__memo(() => import('../output/server/nodes/33.js')),
			__memo(() => import('../output/server/nodes/34.js')),
			__memo(() => import('../output/server/nodes/35.js')),
			__memo(() => import('../output/server/nodes/36.js')),
			__memo(() => import('../output/server/nodes/37.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/api/config",
				pattern: /^\/api\/config\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/config/_server.ts.js'))
			},
			{
				id: "/api/events",
				pattern: /^\/api\/events\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/events/_server.ts.js'))
			},
			{
				id: "/api/id-cards/[id]",
				pattern: /^\/api\/id-cards\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/id-cards/_id_/_server.ts.js'))
			},
			{
				id: "/api/organizations",
				pattern: /^\/api\/organizations\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/organizations/_server.ts.js'))
			},
			{
				id: "/api/role-emulation",
				pattern: /^\/api\/role-emulation\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/role-emulation/_server.ts.js'))
			},
			{
				id: "/api/templates/[id]",
				pattern: /^\/api\/templates\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/templates/_id_/_server.ts.js'))
			},
			{
				id: "/auth",
				pattern: /^\/auth\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/auth/callback",
				pattern: /^\/auth\/callback\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/auth/callback/_server.ts.js'))
			},
			{
				id: "/auth/forgot-password",
				pattern: /^\/auth\/forgot-password\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/auth/reset-password",
				pattern: /^\/auth\/reset-password\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/auth/signout",
				pattern: /^\/auth\/signout\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/auth/signout/_server.ts.js'))
			},
			{
				id: "/constrack",
				pattern: /^\/constrack\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 8 },
				endpoint: null
			},
			{
				id: "/constrack/cart",
				pattern: /^\/constrack\/cart\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 9 },
				endpoint: null
			},
			{
				id: "/constrack/checkout/success",
				pattern: /^\/constrack\/checkout\/success\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 10 },
				endpoint: null
			},
			{
				id: "/dorm",
				pattern: /^\/dorm\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 11 },
				endpoint: null
			},
			{
				id: "/dorm/accounts",
				pattern: /^\/dorm\/accounts\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 12 },
				endpoint: null
			},
			{
				id: "/dorm/budgets",
				pattern: /^\/dorm\/budgets\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 13 },
				endpoint: null
			},
			{
				id: "/dorm/expenses",
				pattern: /^\/dorm\/expenses\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 14 },
				endpoint: null
			},
			{
				id: "/dorm/floors",
				pattern: /^\/dorm\/floors\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 15 },
				endpoint: null
			},
			{
				id: "/dorm/leases",
				pattern: /^\/dorm\/leases\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 16 },
				endpoint: null
			},
			{
				id: "/dorm/meters",
				pattern: /^\/dorm\/meters\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 17 },
				endpoint: null
			},
			{
				id: "/dorm/overview/monthly",
				pattern: /^\/dorm\/overview\/monthly\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 18 },
				endpoint: null
			},
			{
				id: "/dorm/payments",
				pattern: /^\/dorm\/payments\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 19 },
				endpoint: null
			},
			{
				id: "/dorm/properties",
				pattern: /^\/dorm\/properties\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 20 },
				endpoint: null
			},
			{
				id: "/dorm/readings",
				pattern: /^\/dorm\/readings\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 21 },
				endpoint: null
			},
			{
				id: "/dorm/rental_unit",
				pattern: /^\/dorm\/rental_unit\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 22 },
				endpoint: null
			},
			{
				id: "/dorm/tenants",
				pattern: /^\/dorm\/tenants\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 23 },
				endpoint: null
			},
			{
				id: "/dorm/transactions",
				pattern: /^\/dorm\/transactions\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 24 },
				endpoint: null
			},
			{
				id: "/dorm/utility-billings",
				pattern: /^\/dorm\/utility-billings\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 25 },
				endpoint: null
			},
			{
				id: "/events/[event_url]",
				pattern: /^\/events\/([^/]+?)\/?$/,
				params: [{"name":"event_url","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 26 },
				endpoint: null
			},
			{
				id: "/events/[event_url]/name-tags",
				pattern: /^\/events\/([^/]+?)\/name-tags\/?$/,
				params: [{"name":"event_url","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 28 },
				endpoint: null
			},
			{
				id: "/events/[event_url]/payments",
				pattern: /^\/events\/([^/]+?)\/payments\/?$/,
				params: [{"name":"event_url","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 29 },
				endpoint: null
			},
			{
				id: "/events/[event_url]/qr-checker",
				pattern: /^\/events\/([^/]+?)\/qr-checker\/?$/,
				params: [{"name":"event_url","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 30 },
				endpoint: null
			},
			{
				id: "/events/[event_url]/register",
				pattern: /^\/events\/([^/]+?)\/register\/?$/,
				params: [{"name":"event_url","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 31 },
				endpoint: null
			},
			{
				id: "/events/[event_url]/test",
				pattern: /^\/events\/([^/]+?)\/test\/?$/,
				params: [{"name":"event_url","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 32 },
				endpoint: null
			},
			{
				id: "/events/[event_url]/[reference_number]",
				pattern: /^\/events\/([^/]+?)\/([^/]+?)\/?$/,
				params: [{"name":"event_url","optional":false,"rest":false,"chained":false},{"name":"reference_number","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 27 },
				endpoint: null
			},
			{
				id: "/id-gen",
				pattern: /^\/id-gen\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 33 },
				endpoint: null
			},
			{
				id: "/id-gen/all-ids",
				pattern: /^\/id-gen\/all-ids\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 34 },
				endpoint: null
			},
			{
				id: "/id-gen/templates",
				pattern: /^\/id-gen\/templates\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 35 },
				endpoint: null
			},
			{
				id: "/id-gen/use-template",
				pattern: /^\/id-gen\/use-template\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 36 },
				endpoint: null
			},
			{
				id: "/id-gen/use-template/[id]",
				pattern: /^\/id-gen\/use-template\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 37 },
				endpoint: null
			},
			{
				id: "/(admin)/midcodes",
				pattern: /^\/midcodes\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 4 },
				endpoint: null
			}
		],
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
