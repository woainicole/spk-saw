---
name: Kenangan Performance System
colors:
  surface: '#f8f9fb'
  surface-dim: '#d9dadc'
  surface-bright: '#f8f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f6'
  surface-container: '#edeef0'
  surface-container-high: '#e7e8ea'
  surface-container-highest: '#e1e2e4'
  on-surface: '#191c1e'
  on-surface-variant: '#5b403d'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f3'
  outline: '#8f706c'
  outline-variant: '#e4beba'
  surface-tint: '#b91d20'
  primary: '#a50915'
  on-primary: '#ffffff'
  primary-container: '#c92a2a'
  on-primary-container: '#ffe5e2'
  inverse-primary: '#ffb4ac'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfde'
  on-secondary-container: '#636262'
  tertiary: '#485260'
  on-tertiary: '#ffffff'
  tertiary-container: '#606a79'
  on-tertiary-container: '#e1ebfc'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb4ac'
  on-primary-fixed: '#410003'
  on-primary-fixed-variant: '#93000f'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#d9e3f4'
  tertiary-fixed-dim: '#bdc7d8'
  on-tertiary-fixed: '#121c28'
  on-tertiary-fixed-variant: '#3e4755'
  background: '#f8f9fb'
  on-background: '#191c1e'
  surface-variant: '#e1e2e4'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 12px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  margin-mobile: 16px
  gutter-mobile: 12px
  touch-target: 48px
---

## Brand & Style

The design system is engineered for high-stakes operational environments, specifically tailored for mobile-first performance evaluations. The aesthetic balances the bold, energetic heritage of the primary crimson brand color with a disciplined, minimalist framework. 

The UI prioritizes **efficiency** and **clarity**, minimizing visual noise to ensure evaluators can focus on data entry and metrics. The style is a blend of **Corporate Modern** and **Minimalism**, utilizing a "flat-plus" approach: primarily flat surfaces with subtle depth cues to indicate interactivity and hierarchy. The emotional goal is to evoke a sense of professional rigor, reliability, and modern operational excellence.

## Colors

The palette is anchored by the signature brand Crimson, used strategically for primary actions and critical status indicators. 

- **Primary (Crimson):** Used for the most important calls to action (e.g., "Submit Evaluation," "Start Audit").
- **Secondary (Black):** Reserved for primary typography and navigation elements to provide a strong visual anchor.
- **Neutral/Background (Light Gray):** The canvas of the application. Using `#F3F4F6` for the background reduces eye strain compared to pure white while providing enough contrast for the crimson and black elements.
- **Surface (White):** Used for cards and input containers to lift content off the background.
- **Semantic Colors:** Success (Green), Warning (Amber), and Error (Crimson) should be used for performance scoring feedback.

## Typography

This design system utilizes **Inter** across all levels to maintain a clean, utilitarian, and professional appearance. 

The typographic scale is designed for high legibility on small screens. **Headlines** use a bold weight and slightly tighter letter-spacing to command attention. **Body text** utilizes standard weights for maximum readability during long-form evaluation entries. **Labels** are frequently used for metadata, scoring, and field headers; these use medium and semi-bold weights to ensure they remain distinct from user-inputted content.

## Layout & Spacing

The layout follows a **Fluid Grid** model optimized for handheld devices. 

- **Grid:** A 4-column grid for mobile devices with 16px outer margins.
- **Rhythm:** An 8px spatial scale governs all padding and margins to ensure a consistent vertical rhythm.
- **Touch Targets:** All interactive elements (buttons, checkboxes) must maintain a minimum height of 48px to accommodate one-handed thumb use common in field audits.
- **Grouping:** Use 16px (md) spacing to group related fields, and 32px (xl) to separate distinct sections of the performance review.

## Elevation & Depth

This design system uses a **Low-Contrast Depth** model to maintain a minimalist feel while providing essential spatial cues.

- **Level 0 (Background):** Base layer using the light gray neutral color.
- **Level 1 (Cards/Inputs):** White surfaces with a very soft, diffused shadow (Blur: 8px, Y-Offset: 2px, Opacity: 4% Black). This is used for performance cards and primary form containers.
- **Level 2 (Active/Floating):** Used for active states or sticky bottom bars. The shadow is slightly more pronounced (Blur: 12px, Y-Offset: 4px, Opacity: 8% Black).
- **Outlines:** In lieu of heavy shadows, use a 1px solid border (#E5E7EB) for input fields to maintain a crisp, flat appearance.

## Shapes

The shape language is **Soft**, utilizing a 4px (0.25rem) base radius. This provides a professional, "app-like" feel without the playfulness of hyper-rounded corners.

- **Components (Buttons, Inputs):** 4px radius.
- **Large Containers (Cards):** 8px (0.5rem) radius for a more prominent container distinction.
- **Avatars/Indicators:** Circular (Full round) for profile photos or score status indicators.

## Components

### Buttons
- **Primary:** Crimson background, white text. Large (52px height) for mobile accessibility.
- **Secondary:** White background, crimson border (1px), crimson text. 
- **Ghost:** Crimson text, no background or border, used for less critical actions like "View History."

### Cards
- Performance metrics are displayed in cards with white backgrounds, 8px corner radius, and Level 1 elevation. Include a left-side color-accent bar (4px wide) to indicate status (e.g., Red for below target, Gray for pending).

### Input Fields
- **Text Inputs:** Large touch targets, 1px light gray border, 4px radius. Labels are positioned above the field in `label-md`. 
- **Checkboxes/Radios:** Customized to use the primary crimson color when selected.

### Chips & Badges
- Used for category tags or status (e.g., "Outlet A", "Quarterly"). Use a subtle gray background with `label-sm` typography to keep them unobtrusive.

### Evaluation Score Sliders
- Custom sliders using a thick crimson track and a large white "thumb" for tactile feedback when scoring performance metrics.