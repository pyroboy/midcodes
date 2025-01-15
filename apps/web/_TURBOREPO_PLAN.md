📁 your-project/
├── 📁 apps/
│   ├── 📁 admin/                  # Admin Dashboard
│   │   ├── package.json
│   │   ├── svelte.config.js
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   └── 📁 src/
│   │       └── routes/
│   │           └── (admin)/
│   │
│   ├── 📁 auth/                   # Centralized Auth Service
│   │   ├── package.json
│   │   ├── svelte.config.js
│   │   ├── vite.config.ts
│   │   └── 📁 src/
│   │       ├── routes/
│   │       │   ├── login/
│   │       │   ├── callback/
│   │       │   ├── forgot-password/
│   │       │   ├── reset-password/
│   │       │   └── signout/
│   │       └── lib/
│   │           └── auth/
│   │
│   ├── 📁 constrack/              # Construction Tracking
│   │   ├── package.json
│   │   ├── svelte.config.js
│   │   ├── vite.config.ts
│   │   └── 📁 src/
│   │       ├── routes/
│   │       │   ├── cart/
│   │       │   └── checkout/
│   │       └── lib/
│   │
│   ├── 📁 dorm/                   # Dorm Management
│   │   ├── package.json
│   │   ├── svelte.config.js
│   │   ├── vite.config.ts
│   │   └── 📁 src/
│   │       ├── routes/
│   │       │   ├── accounts/
│   │       │   ├── budgets/
│   │       │   ├── expenses/
│   │       │   ├── floors/
│   │       │   ├── leases/
│   │       │   ├── meters/
│   │       │   ├── payments/
│   │       │   ├── properties/
│   │       │   ├── readings/
│   │       │   ├── rental-unit/
│   │       │   ├── tenants/
│   │       │   ├── transactions/
│   │       │   └── utility-billings/
│   │       └── lib/
│   │           ├── components/
│   │           └── schemas/
│   │
│   ├── 📁 events/                 # Event Management
│   │   ├── package.json
│   │   ├── svelte.config.js
│   │   ├── vite.config.ts
│   │   └── 📁 src/
│   │       ├── routes/
│   │       │   ├── [event_url]/
│   │       │   ├── name-tags/
│   │       │   ├── payments/
│   │       │   ├── qr-checker/
│   │       │   └── register/
│   │       └── lib/
│   │
│   ├── 📁 id-gen/                 # ID Generation
│   │   ├── package.json
│   │   ├── svelte.config.js
│   │   ├── vite.config.ts
│   │   └── 📁 src/
│   │       ├── routes/
│   │       │   ├── all-ids/
│   │       │   ├── templates/
│   │       │   └── use-template/
│   │       └── lib/
│   │
│   └── 📁 dokmutya/               # Marketing Site
│       ├── package.json
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       └── 📁 src/
│           ├── assets/
│           ├── components/
│           └── pages/
│
├── 📁 packages/
│   ├── 📁 auth/                   # Shared auth utilities
│   │   ├── package.json
│   │   └── 📁 src/
│   │       ├── client.ts
│   │       ├── session.ts
│   │       ├── roles.ts
│   │       └── types.ts
│   │
│   ├── 📁 ui/                     # Shared UI library
│   │   ├── package.json
│   │   └── 📁 src/
│   │       └── components/
│   │           ├── forms/
│   │           │   ├── Input.svelte
│   │           │   └── Button.svelte
│   │           └── layout/
│   │               ├── Card.svelte
│   │               └── Modal.svelte
│   │
│   ├── 📁 database/              # Database utilities
│   │   ├── package.json
│   │   └── 📁 src/
│   │       ├── client.ts
│   │       ├── schema.ts
│   │       └── types.ts
│   │
│   ├── 📁 utils/                 # Shared utilities
│   │   ├── package.json
│   │   └── 📁 src/
│   │       ├── date.ts
│   │       ├── format.ts
│   │       └── validation.ts
│   │
│   └── 📁 config/               # Shared configs
│       ├── eslint/
│       │   └── index.js
│       ├── typescript/
│       │   └── base.json
│       └── tailwind/
│           └── preset.js
│
├── 📁 supabase/                 # Supabase configurations
│   ├── config.toml
│   ├── migrations/
│   └── functions/
│
├── package.json                 # Workspace root
├── turbo.json                   # Turborepo config
├── .gitignore
├── .env.example
├── .npmrc
└── README.md