# Claude Code Prompt — Full Rally Rebrand Implementation

```text
You are working on the existing Rally codebase. Do not rebuild the app from scratch.

Your job is to fully rebrand Rally’s visual identity and design system across the product.

This is not a minor tweak.
This is a complete brand refresh of the existing app UI, theme system, and visual language.

Important:
- Preserve the app’s core product direction and flows
- Do not rewrite the product from zero
- Do not ask me questions
- Make strong design and implementation decisions yourself
- Keep the result polished, coherent, and production-quality
- Keep the experience mobile-first

==================================================
BRAND IDENTITY TO IMPLEMENT
==================================================

Rally should feel like:
- playful
- cozy
- trendy
- youthful
- neutral / unisex
- stylish and expressive
- soft and romantic for date planning
- premium without becoming formal
- social and charming without becoming childish

Rally is:
- a cute social app for friends and dates
- a planner for spontaneous nights
- an idea-generator for people who do not know what to do for a hangout or date

The emotional experience should be:
- excited
- inspired
- playful
- confident

If Rally were a real-world place, it would feel like:
- a cool downtown bookstore café
- a modern teen / young-adult hangout spot

Design inspiration:
- Apple
- Figma
- Google apps
- modern trending consumer app UI

Important constraints:
- No neon
- No super-bright, loud color identity
- No harsh nightlife aesthetic
- No corporate stiffness
- No childish/cartoonish redesign

The new identity should be:
- white-first in light mode
- soft pastel accents
- dark gray in dark mode
- whimsical and animated
- lightly glassy in the right places
- clean, memorable, expressive, and premium

==================================================
PART 1 — IMPLEMENT A NEW COLOR SYSTEM
==================================================

Completely redo the app’s current color scheme into a soft pastel lifestyle brand system.

Light mode must be the main identity.
Dark mode must feel like the same brand at night.

Use this as the core palette:

Light neutrals:
- Cloud White: #FCFBF8
- Soft Cream White: #F8F7F4
- Mist Gray: #E8E7EC
- Soft Slate: #5F6270
- Ink: #2C2A2E

Light pastel accents:
- Blush: #F6D7E7
- Peach Cream: #F8DFC8
- Butter: #F7E8B5
- Sage Mist: #DCEAD8
- Powder Blue: #DCE8F7
- Lavender Haze: #E6DDF8

Dark neutrals:
- Charcoal: #1F2126
- Graphite: #2A2D34
- Slate Night: #343844
- Soft Border Gray: #3A3E47
- Fog Text: #D9DCE4

Dark muted accents:
- Dusty Blush: #CFA8BB
- Muted Peach: #D8B8A2
- Muted Butter: #D6C48C
- Dusty Sage: #AFC4B1
- Hazy Blue: #AFC2DB
- Dusty Lavender: #BDB0DA

Requirements:
- Do not center the identity around one loud accent color
- Use a contextual pastel system that feels mood-based and flexible
- Date/romantic moments can lean blush/lavender/peach
- Social/friend moments can lean butter/blue/peach
- Cozy/solo moments can lean sage/lavender/cream
- Update all major surfaces, text, borders, states, and accents accordingly

==================================================
PART 2 — CREATE / REFINE DESIGN TOKENS
==================================================

Create or refactor a consistent design token system for Rally.

Include tokens for:
- background colors
- surface colors
- elevated/glass surfaces
- text colors
- border colors
- accent colors
- semantic states
- shadows
- blur levels
- radii
- spacing where helpful

Recommended radius style:
- soft, rounded, modern
- medium-to-large radii should dominate
- pills for chips and segmented controls

Recommended radii:
- 12px
- 18px
- 24px
- 32px
- full pill

Refactor theme values so the new identity is consistent, reusable, and maintainable.

==================================================
PART 3 — UPDATE GRADIENTS
==================================================

Replace the current gradient language with soft, hazy, premium pastel gradients.

Use gradients like:
- blush to peach
- lavender to powder blue
- butter to cream
- sage to cream
- blush + lavender + peach multi-stop gradient for premium/date moments

Example gradient directions:
- Blush Mist
- Dreamy Sky
- Golden Cream
- Soft Meadow
- Date Night Glow

Use gradients tastefully in:
- hero sections
- feature highlights
- premium cards
- route reveal moments
- CTA emphasis
- ambient blobs / decorative objects

Do not turn the app into a loud gradient bomb.

==================================================
PART 4 — REDO MOTION STYLE
==================================================

Refine the app’s motion language to match the new brand.

Motion should feel:
- buoyant
- soft
- slightly whimsical
- youthful
- premium
- rewarding

Create or refine a motion system for:
- page transitions
- hero reveals
- card reveals
- chip/button tap states
- modal / bottom sheet transitions
- route reveal transitions
- save/favorite/success states
- map overlays
- drag-and-drop reorder interactions

Motion rules:
- gentle spring motion
- soft overshoot where appropriate
- layered staggered reveals
- subtle glow / blur motion only where tasteful
- reduced-motion support required

The app should feel lively, but never busy or tacky.

==================================================
PART 5 — UPDATE TYPOGRAPHY HIERARCHY
==================================================

Keep typography clean, modern, and premium.

Direction:
- use a modern sans style like Inter / SF Pro / similarly clean UI font system
- avoid quirky or handwritten fonts
- keep the whimsy in color, shape, and motion instead of novelty fonts

Refine the hierarchy for:
- display/hero text
- headings
- subheadings
- body copy
- captions
- chips / UI labels
- pricing / premium cards

Typography should feel:
- readable
- modern
- friendly
- youthful
- clean but not cold

==================================================
PART 6 — REDESIGN CARDS
==================================================

Update Rally’s card design language so cards feel like little social objects.

Cards should feel:
- soft
- floating
- rounded
- layered
- pleasant to tap
- subtly premium

Update card styling across:
- homepage feature cards
- route stop cards
- saved/history cards
- premium cards
- profile panels
- map overlays
- route detail cards

Card traits:
- large rounded corners
- soft low-contrast shadows
- subtle borders
- some cards can use pastel-tinted washes
- premium cards can use light glassmorphism and dreamier gradients
- interaction states should feel tactile and smooth

==================================================
PART 7 — REDESIGN BUTTONS
==================================================

Update button styling to match the new identity.

Primary buttons should feel:
- rounded
- soft
- expressive
- clearly tappable
- slightly playful
- premium

Secondary buttons should feel:
- clean
- soft-surface or glassy
- lightly bordered
- consistent with the new palette

Update:
- primary CTA buttons
- secondary buttons
- chip buttons
- segmented controls
- icon buttons
- sticky bottom CTAs
- premium upgrade buttons
- save / favorite / save-for-later actions

Add refined microinteractions:
- subtle lift
- soft press animation
- tiny bounce/pop on success where appropriate

==================================================
PART 8 — REWORK GLASSMORPHISM
==================================================

Use glassmorphism strategically instead of generically.

Good places for glass treatment:
- floating overlays
- map controls
- premium cards
- hero overlays
- sticky action bars
- modal surfaces

Guidelines:
- keep readability high
- use soft white translucency in light mode
- use smoky charcoal translucency in dark mode
- use moderate blur, not excessive blur
- combine with subtle borders and soft shadows

Do not apply glass to every component.

==================================================
PART 9 — UPDATE ICONOGRAPHY
==================================================

Refine the icon style across the app.

Icons should feel:
- rounded
- friendly
- clean
- modern
- slightly playful

Update or align icon usage for:
- navigation
- route stops
- map markers
- premium features
- badges / save / favorites
- date / friends / solo vibes

Avoid icons that feel:
- too corporate
- too harsh
- too generic
- too childish

==================================================
PART 10 — REDESIGN THE PREMIUM PAGE
==================================================

The premium page must be updated to match the new brand identity.

Premium should feel:
- aspirational
- rewarding
- dreamy
- gamified-premium
- still clearly part of Rally

Use softer, warmer, more magical gradients and slightly more elevated/glassy presentation.

Also update premium tier naming if appropriate to match the new identity.
Suggested direction:
- Starter
- Golden Hour
- Afterglow

If the current premium structure already exists, re-skin and reframe it rather than rebuilding everything unnecessarily.

==================================================
PART 11 — REDESIGN THE HOME PAGE
==================================================

Completely refresh the homepage presentation in line with the new identity.

Goals:
- instantly communicate what Rally is
- feel cute, stylish, social, and modern
- feel premium but approachable
- make users want to try the app immediately

Update:
- hero section
- supporting copy sections
- vibe chips
- route example cards
- featured sections
- premium teaser section
- business/partner teaser section if present
- footer polish

Add tasteful ambient visual life such as:
- soft pastel background blobs
- gentle floating objects
- subtle parallax/drift if appropriate
- animated highlight cards
- charming motion in route examples

The homepage should feel memorable and post-2025 modern.

==================================================
PART 12 — DEFINE APP ICON DIRECTION
==================================================

Create or refine a clear app icon direction in the codebase/design system.

Best direction:
- a rounded location-pin / route-path hybrid with a small sparkle accent

Alternative acceptable directions:
- rounded “R” with path/dot motif
- path curve with subtle heart-like shape
- token/badge-like social icon

Requirements:
- must feel modern and friendly
- must work in light and dark contexts
- must match the pastel/cozy/social brand direction
- should not look like a generic map app or corporate navigation tool

If there is an existing logo/icon treatment, evolve it toward this direction.

==================================================
PART 13 — IMPLEMENT LIGHT AND DARK THEMES PROPERLY
==================================================

Refactor the app’s theme system so the light and dark modes feel like one coherent brand.

Light mode:
- main identity
- airy, warm-white, pastel, fresh

Dark mode:
- cozy café at night
- charcoal and graphite base
- muted pastels
- soft readable contrast

Requirements:
- both modes must feel premium and coherent
- dark mode should not just be inverted light mode
- dark mode should preserve the same rounded, soft, social identity
- all major components should be updated for both themes

==================================================
PART 14 — APPLY THE REBRAND ACROSS THE ACTUAL PRODUCT
==================================================

Apply the new identity across the core product surfaces, not just one page.

Audit and update at minimum:
- home page
- build page
- route page
- map page
- history page
- saved page
- profile page
- premium page
- business page
- authentication screens
- empty states
- loading states
- overlays
- bottom sheets / modals
- nav
- cards and list items

The whole app should feel like one coherent brand after this pass.

==================================================
PART 15 — PERFORMANCE + ACCESSIBILITY
==================================================

Keep the rebrand polished and responsible.

Requirements:
- maintain good contrast and readability
- avoid excessive motion or blur
- support reduced-motion preferences
- do not create layout instability
- keep interactions smooth on mobile
- avoid performance-heavy decorative effects on dense screens

==================================================
PART 16 — IMPLEMENTATION QUALITY
==================================================

Refactor cleanly and build reusable systems.

If helpful, add or improve:
- theme tokens file(s)
- motion config/constants
- shared card primitives
- shared button primitives
- shared gradient/background utilities
- glass surface component(s)
- icon wrappers / styling helpers
- brand-aware section shells

Keep the code maintainable and organized.

==================================================
PART 17 — FINAL DELIVERABLES
==================================================

After implementing, provide:
1. what was changed in the brand identity
2. the new color system
3. the new token/theme structure
4. the new gradient system
5. the new motion style
6. what changed in typography hierarchy
7. what changed in cards and buttons
8. how glassmorphism is now used
9. what changed on the home page
10. what changed on the premium page
11. what the new app icon direction is
12. how light and dark themes now work
13. what components/pages were changed most
14. what was done for accessibility and performance
15. how to test the rebrand locally

Important:
- Do not ask me questions
- Make strong design decisions
- Do not do a shallow recolor
- The final result should feel like a fully rebranded, polished, premium, playful social-planning app
```
