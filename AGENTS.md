# AGENTS.md

## Build Commands
- `npm run dev` or `gulp` - Build and zip theme for development
- `npm run build` or `npm run zip` - Production build (creates zip in dist/)
- No test framework - Ghost theme tested by installing in Ghost instance

## Code Style Guidelines

### General
- Ghost theme using Handlebars (.hbs) templates with CSS custom properties
- JavaScript uses ES6+ with GSAP for animations and Lenis for smooth scrolling

### Handlebars Templates
- Use Ghost helpers: `{{#if}}`, `{{#unless}}`, `{{#foreach}}`
- Access settings with `{{@custom.setting_name}}`
- Include partials with `{{> partial-name}}`
- Reference assets with `{{asset "path/to/file"}}`

### CSS
- Use CSS custom properties in `:root` for theming
- BEM-like naming, mobile-first responsive design
- GSAP for animations, custom fonts in `assets/fonts/`

### JavaScript
- Modern ES6+ syntax, GSAP and ScrollTrigger for animations
- Debounce event handlers, camelCase for functions/variables

### File Organization
- Templates in root (.hbs), partials in `partials/components/` and `partials/icons/`
- Styles in `assets/css/` (global.css first), scripts in `assets/js/`
- Kebab-case for files/CSS classes, PascalCase for Handlebars partials