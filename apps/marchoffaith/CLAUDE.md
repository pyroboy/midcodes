# March of Faith Incorporated - Development Guide

## Project Overview
March of Faith Incorporated is the headquarters church website located in Tagbilaran City, Bohol, Philippines. This SvelteKit application serves as the digital presence for the church organization founded in 1974.

## Brand Identity & Design System

### Organization Details
- **Name:** March of Faith, Inc.
- **Location:** San Isidro District, Tagbilaran City, Bohol
- **Founded:** January 1, 1974 (SEC Reg. No. 0000058834)
- **Founder:** Rev. Rudy Salomon Trigo, D.D. (July 15, 1938 – April 7, 2011)
- **Contact:** +63 99 9953 6700
- **Email:** marchoffaithincorporated@gmail.com
- **Social:** @marchoffaithinc

### Brand Colors (Use consistently across all components)
```css
/* Primary Brand Colors */
--deep-red: #981B1E;      /* Primary backgrounds, headers */
--bright-red: #C1272D;    /* Accents, buttons, highlights */
--white: #FFFFFF;         /* Text on colored backgrounds */
--dark-gray: #333333;     /* Body text, secondary elements */
--light-gray: #F8F9FA;    /* Section backgrounds */

/* Usage Examples */
.primary-button {
  background: linear-gradient(45deg, #C1272D, #981B1E);
  color: white;
  border-radius: 50px;
}

.hero-section {
  background: #981B1E;
  color: white;
}
```

### Typography System
- **Font Family:** Montserrat (primary), system sans-serif fallbacks
- **Headers:** Montserrat Extra Bold (800), uppercase for main titles
- **Subheadings:** Montserrat Bold (700)
- **Body Text:** Montserrat Regular (400), minimum 16px
- **Buttons:** Montserrat Semibold (600)

### Design Principles
1. **Professional & Traditional:** Reflect the church's heritage and authority
2. **Modern Accessibility:** Clean layouts with high contrast ratios
3. **Faith-Centered:** Color scheme and imagery support spiritual messaging
4. **Community Focus:** Emphasize fellowship and local presence in Bohol

## Development Guidelines

### Code Style
- Use consistent indentation (tabs)
- Follow SvelteKit conventions for file structure
- Implement responsive design mobile-first
- Maintain semantic HTML structure
- Use CSS custom properties for brand colors

### Component Standards
```svelte
<!-- Example component structure -->
<script>
  // TypeScript preferred for type safety
  import type { ComponentProps } from 'svelte';
</script>

<!-- Semantic HTML with proper ARIA labels -->
<section class="component-name" role="region" aria-labelledby="section-title">
  <h2 id="section-title">Section Title</h2>
  <!-- Content -->
</section>

<style>
  /* Use brand color variables */
  .component-name {
    background-color: var(--light-gray);
    color: var(--dark-gray);
  }
  
  /* Responsive design */
  @media (max-width: 768px) {
    .component-name {
      padding: 1rem;
    }
  }
</style>
```

### Button Styles (Consistent across site)
```css
.btn {
  padding: 1rem 2rem;
  border-radius: 50px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  display: inline-block;
}

.btn-primary {
  background: linear-gradient(45deg, #C1272D, #981B1E);
  color: white;
  border: none;
  box-shadow: 0 4px 15px rgba(193, 39, 45, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(193, 39, 45, 0.4);
}

.btn-secondary {
  background: transparent;
  color: #C1272D;
  border: 2px solid #C1272D;
}

.btn-secondary:hover {
  background: #C1272D;
  color: white;
}
```

### Card Components (Professional & Minimal Design)

**Design Philosophy:**
- Remove decorative elements (emojis, icons) for professional appearance
- Focus on clear typography and content hierarchy
- Minimal spacing with zero gaps between cards
- Professional contact information presentation

```css
.card-container {
  display: grid;
  gap: 0; /* Zero gap between cards */
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.card {
  background: white;
  border: 1px solid #e2e8f0;
  margin: 0; /* Remove default margins */
  padding: 1.75rem; /* Generous internal padding for readability */
  transition: all 0.2s ease;
}

.card:hover {
  border-color: var(--bright-red);
  box-shadow: 0 2px 8px rgba(193, 39, 45, 0.1);
}

/* Professional contact card styling */
.method-card h3 {
  font-family: 'Montserrat', sans-serif;
  color: var(--deep-red);
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.method-info {
  font-family: 'Montserrat', sans-serif;
  color: var(--dark-gray);
  font-weight: 700;
  margin-bottom: 0.5rem;
  font-size: 1rem;
  line-height: 1.4;
}

.method-desc {
  font-family: 'Montserrat', sans-serif;
  color: #555555;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0 0 0.5rem 0;
}

.method-hours {
  font-family: 'Montserrat', sans-serif;
  color: var(--bright-red);
  font-size: 0.8rem;
  font-weight: 600;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* For flexbox layouts */
.card-grid-flex {
  display: flex;
  flex-wrap: wrap;
  gap: 0; /* Zero gap */
  margin: 0;
}

.card-grid-flex .card {
  flex: 1 1 250px;
  margin: 0;
}
```

**Professional Card Content Guidelines:**
- Use clear, descriptive titles (Phone, Email, Visit Us)
- NO emojis or decorative icons
- Include operational details (hours, response times)
- Maintain professional language while being welcoming
- Focus on actionable information

### Contact Page Implementation Notes

**Recent Improvements (Contact Page Redesign):**

1. **Removed Unprofessional Elements:**
   - Eliminated emoji icons (📞, ✉️, 📍, ⏰) from contact method cards
   - Removed decorative "method-icon" styling
   - Streamlined to typography-only design

2. **Enhanced Professional Structure:**
   - Removed redundant "Welcome Home" introductory section
   - Removed "Ways to Connect" card grid to eliminate visual clutter
   - Focused layout on essential contact form and sidebar information

3. **Improved Content Hierarchy:**
   - Added `.method-hours` styling for operational information
   - Professional red accent color for business hours/response times
   - Clear information architecture with primary and secondary text

4. **Modern Business Aesthetic:**
   - Clean, corporate-style contact cards
   - Consistent with professional organization standards
   - Generous internal padding (1.75rem) for readability
   - Maintains church warmth through content, not design elements

## Content Guidelines

### Voice & Tone
- **Formal yet approachable:** Balance professionalism with warmth
- **Faith-centered:** Incorporate appropriate spiritual language
- **Community-focused:** Emphasize local Bohol connections
- **Respectful:** Honor the church's history and founder's legacy

### Key Messaging
- Primary: "Strengthening faith, building community"
- Location: Always reference Tagbilaran, Bohol connection
- Heritage: Acknowledge 50+ year history since 1974
- Community: Emphasize fellowship and spiritual growth

## Technical Implementation

### Required Dependencies
```json
{
  "@sveltejs/kit": "^2.12.1",
  "svelte": "^5.19.5",
  "tailwindcss": "^3.4.9",
  "typescript": "^5.5.0"
}
```

### Environment Configuration
- Development server: http://127.0.0.1:5173 (Windows compatibility)
- Build target: Static site for deployment
- Image optimization: Use Cloudinary for media assets

### File Structure Standards
```
src/
  routes/
    +page.svelte (Homepage with hero, services, footer)
    +layout.svelte (Navigation, consistent styling)
    about/
    churches/
    contact/
  lib/
    components/
      Header.svelte
      Footer.svelte (with complete church info)
    config.js (site-wide settings)
```

### SEO & Accessibility
- Include proper meta descriptions mentioning Bohol location
- Use semantic HTML structure
- Maintain WCAG 2.1 AA compliance
- Optimize for local search (Tagbilaran, Bohol keywords)

## Asset Management

### Images
- **Logo:** Use official MOFI logo from Cloudinary
- **Photography:** Professional church and community images
- **Optimization:** WebP format, responsive sizing
- **Alt text:** Descriptive text for all images

### Icons
- **Style:** Minimal line icons, 2px stroke width
- **Color:** White on colored backgrounds, brand red on light backgrounds
- **Size:** 24px standard for UI elements
- **Format:** SVG preferred for scalability

## Deployment & Maintenance

### Build Process
```bash
npm run build    # Generate static files
npm run preview  # Test production build
npm run lint     # Check code quality
npm run format   # Apply consistent formatting
```

### Performance Targets
- **Core Web Vitals:** Green scores on all metrics
- **Load Time:** < 3 seconds on 3G connections
- **Accessibility:** 100% Lighthouse accessibility score
- **SEO:** 95+ Lighthouse SEO score

### Regular Maintenance
- Update church service times and events
- Refresh community photos and testimonials
- Monitor site performance and accessibility
- Keep dependencies updated for security

---

## Quick Reference

### Brand Colors
- Deep Red: `#981B1E` (primary backgrounds)
- Bright Red: `#C1272D` (buttons, accents)
- White: `#FFFFFF` (text on colored backgrounds)

### Contact Information
- Phone: +63 99 9953 6700
- Email: marchoffaithincorporated@gmail.com
- Location: San Isidro District, Tagbilaran City, Bohol

### Key Files
- Brand guidelines: `BRAND_STYLE_GUIDE.md`
- Homepage: `src/routes/+page.svelte`
- Layout: `src/routes/+layout.svelte`
- Config: `src/lib/config.js`