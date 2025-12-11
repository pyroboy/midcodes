# Apps Directory

This directory contains multiple SvelteKit applications within the Midcodes monorepo. Each app serves different purposes and target audiences, all built with modern web technologies.

## 🚀 Applications Overview

### Core Web Applications

#### 1. **Dorm** (`/apps/dorm`)
- **Purpose**: Dormitory management system
- **Tech Stack**: SvelteKit + Supabase + Tailwind CSS + TypeScript
- **Key Features**: 
  - Role-based authentication
  - Comprehensive caching system
  - Profile picture management
  - Security deposit tracking
  - Optimized performance with HMR
- **Database**: Supabase with complex schema
- **Version**: 0.0.1

#### 2. **Events** (`/apps/events`)
- **Purpose**: Event management platform
- **Tech Stack**: SvelteKit + Supabase + Tailwind CSS + Three.js
- **Key Features**:
  - Event creation and management
  - 3D visualizations with Three.js
  - QR code integration
  - Date management with internationalized dates
- **Version**: 2

#### 3. **ID Generator** (`/apps/id-gen`)
- **Purpose**: Professional ID card generation system
- **Tech Stack**: SvelteKit + Supabase + Tailwind CSS + Advanced UI Components
- **Key Features**:
  - Command palette interface (cmdk-sv)
  - Multi-font support (Lato, Montserrat, Open Sans, Roboto)
  - Advanced table controls with TanStack
  - Form handling with Formsnap
  - Toast notifications with Svelte Sonner
- **Version**: 2

#### 4. **March of Faith Inc** (`/apps/marchoffaith`)
- **Purpose**: Organization/corporate website
- **Tech Stack**: SvelteKit + Supabase + Tailwind CSS + Three.js
- **Key Features**:
  - Corporate presentation
  - 3D elements and animations
  - Content management
- **Package Name**: marchoffaithinc
- **Version**: 0.0.1

#### 5. **UBytes Project** (`/apps/ubytes-project`)
- **Purpose**: Data visualization and analytics platform
- **Tech Stack**: SvelteKit + Supabase + Chart.js + Recharts
- **Key Features**:
  - Advanced data visualization
  - Search and filtering with Fuse.js
  - Command interface with cmdk-sv
  - Authentication with Supabase
  - Toast notifications
- **Version**: 1.0.0

### Document & Content Applications

#### 6. **School Docs** (`/apps/schooldocs`)
- **Purpose**: Academic document management (transcripts, records)
- **Tech Stack**: SvelteKit + Supabase + ECharts + CVA
- **Key Features**:
  - Document processing and management
  - Data visualization with ECharts
  - Clean minimal interface
- **Package Name**: transripts
- **Version**: 0.0.1

#### 7. **Side Projects** (`/apps/sideprojects`)
- **Purpose**: Portfolio/showcase for side projects
- **Tech Stack**: SvelteKit + MDSvex + Tailwind CSS
- **Key Features**:
  - Markdown-based content with MDSvex
  - Portfolio presentation
  - Clean, minimal design
- **Version**: 1.0.0

### Utility & Tools

#### 8. **Dokmutya** (`/apps/dokmutya`)
- **Purpose**: Simple documentation/content app
- **Tech Stack**: SvelteKit + Tailwind CSS + Lucide Icons
- **Key Features**:
  - Lightweight design
  - Icon integration with Lucide
  - Quick documentation
- **Version**: 1.0.0

#### 9. **Travel** (`/apps/travel`)
- **Purpose**: Travel website (Cabilao Travel)
- **Tech Stack**: SvelteKit + MDSvex + Tailwind CSS + Neoconfetti
- **Key Features**:
  - Travel content management
  - Markdown support
  - Interactive animations with Neoconfetti
- **Package Name**: cabilao-travel
- **Version**: 0.5.0

#### 10. **Web** (`/apps/web`)
- **Purpose**: Basic web application (minimal structure)
- **Status**: Basic structure only
- **Tech Stack**: TBD

## 🛠️ Common Technology Stack

### Core Framework
- **SvelteKit**: Primary framework for all applications
- **Svelte 5.x**: Latest version used across applications
- **TypeScript**: Type safety and development experience

### Styling & UI
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn-Svelte**: Reusable UI component library
- **Bits-UI**: Advanced component primitives
- **Tailwind Variants**: Component styling patterns
- **Lucide Icons**: Consistent iconography

### Backend & Data
- **Supabase**: Backend-as-a-Service (most applications)
- **Supabase SSR**: Server-side rendering support
- **PostgreSQL**: Database (via Supabase)

### Specialized Libraries
- **Three.js + Threlte**: 3D graphics and animations
- **Chart.js/Recharts/ECharts**: Data visualization
- **MDSvex**: Markdown processing
- **Fuse.js**: Fuzzy search capabilities
- **Date-fns**: Date manipulation
- **Zod**: Schema validation

### Development Tools
- **Vite**: Build tool and dev server
- **ESLint + Prettier**: Code formatting and linting
- **Playwright**: End-to-end testing
- **Vitest**: Unit testing
- **pnpm**: Package management

## 🏗️ Architecture Patterns

### Monorepo Structure
- Each app is independently deployable
- Shared dependencies managed at workspace level
- Consistent tooling and configuration

### Common Features
- **Authentication**: Supabase Auth integration
- **Database**: PostgreSQL with Supabase
- **Deployment**: Vercel adapter for most apps
- **Responsive Design**: Mobile-first approach
- **Performance**: Optimized builds and caching

### Quality Assurance
- TypeScript for type safety
- ESLint/Prettier for code quality
- Automated testing with Playwright and Vitest
- Consistent build pipelines

## 📦 Package Management

All applications use:
- **Node.js**: >=20.0.0
- **pnpm**: Workspace package manager
- **Turbo**: Build system coordination (root level)

## 🚀 Development Workflow

### Starting Development
```bash
# Install dependencies
pnpm install

# Start specific app
pnpm --filter <app-name> dev

# Examples:
pnpm --filter dorm dev
pnpm --filter events dev
```

### Building Applications
```bash
# Build specific app
pnpm --filter <app-name> build

# Build all apps
pnpm build
```

### Testing
```bash
# Run tests for specific app
pnpm --filter <app-name> test

# Type checking
pnpm --filter <app-name> check
```

## 📋 Application Status

| Application | Status | Complexity | Primary Use Case |
|-------------|--------|------------|------------------|
| Dorm | 🟢 Active | High | Business Management |
| Events | 🟢 Active | Medium | Event Platform |
| ID-Gen | 🟢 Active | High | Professional Tools |
| March of Faith | 🟢 Active | Medium | Corporate Site |
| UBytes | 🟢 Active | High | Analytics Platform |
| School Docs | 🟢 Active | Medium | Document Management |
| Side Projects | 🟢 Active | Low | Portfolio |
| Dokmutya | 🟢 Active | Low | Documentation |
| Travel | 🟢 Active | Low | Travel Site |
| Web | 🟡 Minimal | Low | TBD |

## 🔧 Configuration Notes

### Common Issues & Solutions
- **Peer Dependencies**: Some apps may show warnings for Svelte 5 compatibility
- **Build Optimization**: Optional rollup dependencies for Linux deployments
- **HMR Issues**: Dorm app includes specific HMR troubleshooting scripts

### Deployment
- Most apps configured for Vercel deployment
- Environment variables managed per application
- Supabase projects may vary per application

---

*Last updated: December 2024*
*Apps count: 10 applications*
*Total dependencies: ~1099 packages*