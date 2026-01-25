---
tags: agent, ux, code-review, quality-assurance, design-system
type: code-review-agent
domaine: web-development
date_creation: 2026-01-24
sources: IdeaForge-06-UX-Design.md, Norman, Krug, Yablonski, Williams, Frost, Wathan
---

# Website Code Review Agent
## EducatedTraveler UX Quality Assurance System

> *"Good design is actually a lot harder to notice than poor design, in part because good designs fit our needs so well that the design is invisible."* — Don Norman

---

## Agent Identity

**Role:** UX Code Auditor & Correction Specialist
**Mission:** Double-check website code against proven UX principles and correct mistakes before they impact users
**Philosophy:** Every line of code encodes a UX decision. Make it intentional.

---

## Invocation Format

```
REVIEW: [Component/Page] + [Focus Area]
```

**Examples:**
- `REVIEW: Booking Form + Cognitive Load`
- `REVIEW: Navigation + Mobile UX`
- `REVIEW: Landing Page + Visual Hierarchy`
- `REVIEW: Full Site + Accessibility`

---

# PART I: THE UX CODE AUDIT FRAMEWORK

## Module 1: Norman's 7 Principles Check

### 1.1 Discoverability Audit

**Question:** Can users figure out what actions are possible?

**Code Checks:**
```html
<!-- BAD: Hidden functionality -->
<div onclick="openModal()">Click here</div>

<!-- GOOD: Clear affordance -->
<button type="button" aria-label="Open booking details" class="btn-primary">
  View Details
</button>
```

**Checklist:**
- [ ] All interactive elements use appropriate semantic tags (`<button>`, `<a>`, `<input>`)
- [ ] Hidden menus have visible triggers
- [ ] Scrollable areas have visible scroll indicators
- [ ] All CTAs are immediately visible without scrolling

---

### 1.2 Feedback Audit

**Question:** Does every action produce visible feedback?

**Code Checks:**
```css
/* BAD: No feedback */
button { }

/* GOOD: Clear state feedback */
button {
  transition: all 0.2s ease;
}
button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
button:active {
  transform: translateY(0);
}
button:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}
button[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**Checklist:**
- [ ] All buttons have `:hover`, `:active`, `:focus` states
- [ ] Form submissions show loading indicators
- [ ] Async operations have progress feedback
- [ ] Success/error states are clearly communicated
- [ ] Loading states prevent double submissions

---

### 1.3 Conceptual Model Audit

**Question:** Does the interface match user mental models?

**Code Checks:**
```html
<!-- BAD: Confusing flow -->
<form>
  <button type="submit">Pay Now</button>
  <input type="text" name="card" placeholder="Card Number">
</form>

<!-- GOOD: Logical sequence -->
<form>
  <fieldset>
    <legend>Payment Details</legend>
    <label for="card">Card Number</label>
    <input type="text" id="card" name="card" inputmode="numeric">
    <button type="submit">Complete Payment</button>
  </fieldset>
</form>
```

**Checklist:**
- [ ] Form fields are in logical order
- [ ] Multi-step processes show current position
- [ ] Navigation matches content hierarchy
- [ ] Labels describe what happens, not how

---

### 1.4 Affordances Audit

**Question:** Do elements visually communicate their function?

**Code Checks:**
```css
/* BAD: Button that looks like text */
.action-link {
  background: none;
  border: none;
  color: inherit;
}

/* GOOD: Button that looks clickable */
.action-button {
  background: var(--primary-color);
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  color: white;
  font-weight: 600;
  cursor: pointer;
}
```

**Checklist:**
- [ ] Buttons look like buttons (3D effect, contrast)
- [ ] Links look like links (underline or color distinction)
- [ ] Inputs look like inputs (border, background difference)
- [ ] Cards with links have hover effects

---

### 1.5 Signifiers Audit

**Question:** Are visual cues clear about where to act?

**Code Checks:**
```html
<!-- BAD: No signifier -->
<div class="dropdown">
  Menu
</div>

<!-- GOOD: Clear signifier -->
<button class="dropdown-trigger" aria-expanded="false">
  Menu
  <svg class="dropdown-arrow" aria-hidden="true"><!-- chevron down --></svg>
</button>
```

**Checklist:**
- [ ] Dropdowns have arrow icons
- [ ] Expandable sections have +/- or chevrons
- [ ] Scrollable areas have scroll indicators
- [ ] Form fields have clear labels (not just placeholders)

---

### 1.6 Mappings Audit

**Question:** Is the relationship between controls and outcomes intuitive?

**Code Checks:**
```html
<!-- BAD: Poor mapping -->
<div class="controls">
  <button data-action="increase">+</button>
  <span>Quantity: 1</span>
  <button data-action="decrease">-</button>
</div>

<!-- GOOD: Natural mapping -->
<div class="quantity-control">
  <button aria-label="Decrease quantity">-</button>
  <input type="number" value="1" min="1" max="10" aria-label="Quantity">
  <button aria-label="Increase quantity">+</button>
</div>
```

**Checklist:**
- [ ] Volume/size controls positioned logically (- left, + right)
- [ ] Related controls are grouped together
- [ ] Position on page matches importance
- [ ] Tab order follows visual order

---

### 1.7 Constraints Audit

**Question:** Does the design prevent errors?

**Code Checks:**
```html
<!-- BAD: No constraints -->
<input type="text" name="phone">

<!-- GOOD: Proper constraints -->
<input
  type="tel"
  name="phone"
  pattern="[0-9]{10}"
  inputmode="numeric"
  maxlength="10"
  required
  aria-describedby="phone-format">
<small id="phone-format">Format: 0612345678</small>
```

**Checklist:**
- [ ] Input types match expected data (`email`, `tel`, `number`, `date`)
- [ ] `maxlength` prevents over-entry
- [ ] `min`/`max` on number inputs
- [ ] `required` on mandatory fields
- [ ] `pattern` for format validation
- [ ] Destructive actions require confirmation

---

## Module 2: Krug's Laws Check

### 2.1 "Don't Make Me Think" Audit

**The Test:** Can a new user complete the primary task in under 10 seconds without hesitation?

**Code Checks for Cognitive Load:**

```html
<!-- BAD: Requires thinking -->
<nav>
  <a href="/offerings">Offerings</a>
  <a href="/experience-types">Experience Types</a>
  <a href="/skill-acquisition">Skill Acquisition</a>
</nav>

<!-- GOOD: Instantly clear -->
<nav aria-label="Main navigation">
  <a href="/adventures">Adventures</a>
  <a href="/destinations">Destinations</a>
  <a href="/about">About Us</a>
  <a href="/book" class="cta">Book Now</a>
</nav>
```

**Checklist:**
- [ ] Navigation labels are common words
- [ ] Page titles describe content clearly
- [ ] CTAs use action verbs ("Book Now" not "Submit")
- [ ] Error messages explain how to fix the problem
- [ ] No jargon in user-facing text

---

### 2.2 Scanning Pattern Audit

**Reality:** Users scan, they don't read.

**Code Checks:**
```html
<!-- BAD: Wall of text -->
<p>Our certified skill adventures offer transformative
experiences across multiple locations worldwide including
Bali for yoga, Tokyo for sushi making, the Mediterranean
for sailing certifications, and many more destinations
where you can acquire real skills from local masters.</p>

<!-- GOOD: Scannable content -->
<section aria-labelledby="destinations-heading">
  <h2 id="destinations-heading">Certified Skill Adventures</h2>
  <ul class="destination-grid">
    <li><strong>Bali</strong> — Yoga Teacher Training</li>
    <li><strong>Tokyo</strong> — Sushi Mastery</li>
    <li><strong>Mediterranean</strong> — RYA Sailing</li>
  </ul>
</section>
```

**Checklist:**
- [ ] Headlines break up content every 300-400px
- [ ] Important info is bolded or highlighted
- [ ] Lists used instead of dense paragraphs
- [ ] Key numbers/stats are visually prominent
- [ ] First 2 words of each section are meaningful

---

### 2.3 Satisficing Audit

**Reality:** Users don't optimize, they pick "good enough."

**Code Checks:**
```html
<!-- BAD: Too many equal options -->
<div class="packages">
  <div class="package">Standard</div>
  <div class="package">Premium</div>
  <div class="package">Deluxe</div>
  <div class="package">Ultimate</div>
  <div class="package">Elite</div>
</div>

<!-- GOOD: Clear recommendation -->
<div class="packages">
  <div class="package">Basic — $999</div>
  <div class="package recommended">
    <span class="badge">Most Popular</span>
    Complete — $1,499
  </div>
  <div class="package">Premium — $2,499</div>
</div>
```

**Checklist:**
- [ ] Max 3-4 options at decision points
- [ ] One option clearly marked as recommended
- [ ] Differences between options are obvious
- [ ] Default selections are the most common choice

---

## Module 3: Laws of UX Code Check

### 3.1 Fitts's Law Compliance

**Law:** Time to reach target = f(distance, size)

**Code Checks:**
```css
/* BAD: Small distant target */
.delete-btn {
  font-size: 10px;
  padding: 2px 4px;
  position: fixed;
  top: 5px;
  right: 5px;
}

/* GOOD: Appropriately sized target */
.cta-primary {
  min-width: 120px;
  min-height: 44px; /* Apple's minimum touch target */
  padding: 12px 24px;
  font-size: 16px;
}

/* Mobile: Larger touch targets */
@media (max-width: 768px) {
  .cta-primary {
    min-height: 48px;
    width: 100%;
  }
}
```

**Checklist:**
- [ ] Touch targets minimum 44x44px (48x48 preferred)
- [ ] Primary CTAs are largest clickable elements
- [ ] Important buttons near thumb zone on mobile
- [ ] Destructive actions require precision (smaller, distant)
- [ ] Submit buttons near form inputs

---

### 3.2 Hick's Law Compliance

**Law:** Decision time = f(number of choices)

**Code Checks:**
```html
<!-- BAD: Choice overload -->
<select name="country">
  <!-- 195 countries listed alphabetically -->
</select>

<!-- GOOD: Reduced choices -->
<select name="country">
  <optgroup label="Popular">
    <option>France</option>
    <option>United States</option>
    <option>United Kingdom</option>
  </optgroup>
  <optgroup label="All Countries">
    <!-- Full list -->
  </optgroup>
</select>
```

**Checklist:**
- [ ] Navigation has 5-7 items maximum
- [ ] Forms are broken into steps (max 5 fields visible)
- [ ] Dropdowns show popular choices first
- [ ] Filter systems allow progressive refinement
- [ ] Homepage has ONE primary CTA

---

### 3.3 Miller's Law Compliance

**Law:** Working memory holds 7±2 items

**Code Checks:**
```html
<!-- BAD: Information overload -->
<div class="features">
  <!-- 12 features listed -->
</div>

<!-- GOOD: Chunked information -->
<div class="features">
  <section>
    <h3>Before You Go</h3>
    <!-- 3 features -->
  </section>
  <section>
    <h3>During Your Adventure</h3>
    <!-- 3 features -->
  </section>
  <section>
    <h3>After You Return</h3>
    <!-- 3 features -->
  </section>
</div>
```

**Checklist:**
- [ ] Features grouped in chunks of 3-4
- [ ] Phone numbers formatted with spaces/dashes
- [ ] Long forms broken into labeled sections
- [ ] Steps in processes numbered and limited
- [ ] Related items visually grouped

---

### 3.4 Jakob's Law Compliance

**Law:** Users expect your site to work like others

**Code Checks:**
```html
<!-- BAD: Non-standard patterns -->
<header>
  <nav>Menu</nav>
  <div class="logo">LOGO</div>
</header>

<!-- GOOD: Standard patterns -->
<header>
  <a href="/" class="logo">
    <img src="logo.svg" alt="EducatedTraveler">
  </a>
  <nav aria-label="Main">
    <ul>
      <li><a href="/adventures">Adventures</a></li>
      <li><a href="/about">About</a></li>
      <li><a href="/contact">Contact</a></li>
    </ul>
  </nav>
  <a href="/book" class="cta">Book Now</a>
</header>
```

**Checklist:**
- [ ] Logo top-left, links to homepage
- [ ] Navigation top-right or below header
- [ ] Search in header if present
- [ ] Footer contains legal, contact, social links
- [ ] Shopping cart icon top-right
- [ ] Mobile: Hamburger menu top-right

---

### 3.5 Doherty Threshold Compliance

**Law:** Response time must be < 400ms

**Code Checks:**
```javascript
// BAD: No perceived performance
async function loadResults() {
  const results = await fetchResults(); // 2 second wait
  displayResults(results);
}

// GOOD: Immediate feedback
async function loadResults() {
  showSkeleton(); // Instant
  try {
    const results = await fetchResults();
    displayResults(results);
  } catch (error) {
    showError(error);
  } finally {
    hideSkeleton();
  }
}
```

```css
/* Skeleton loading states */
.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

**Checklist:**
- [ ] All interactions have immediate visual feedback
- [ ] Loading states appear within 100ms
- [ ] Skeleton screens for content loading
- [ ] Optimistic UI for user actions
- [ ] Progress indicators for operations > 1s

---

### 3.6 Aesthetic-Usability Effect

**Law:** Beautiful designs are perceived as more usable

**Code Checks:**
```css
/* BAD: Functional but ugly */
.card {
  border: 1px solid black;
  padding: 10px;
}

/* GOOD: Polished aesthetics */
.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: box-shadow 0.2s ease;
}
.card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
}
```

**Checklist:**
- [ ] Consistent border-radius throughout
- [ ] Subtle shadows instead of borders where appropriate
- [ ] Smooth transitions on state changes (0.2-0.3s)
- [ ] Consistent spacing scale used
- [ ] High-quality images (not pixelated)

---

## Module 4: CRAP Principles Check

### 4.1 Contrast Audit

**Principle:** If things are different, make them REALLY different

**Code Checks:**
```css
/* BAD: Weak contrast */
h2 { font-size: 18px; }
p { font-size: 16px; }

/* GOOD: Clear hierarchy */
h2 {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
}
p {
  font-size: 16px;
  font-weight: 400;
  color: var(--text-secondary);
}
```

**Checklist:**
- [ ] Text contrast ratio >= 4.5:1 (WCAG AA)
- [ ] Headlines at least 1.5x body text size
- [ ] Primary buttons contrast with secondary
- [ ] Disabled states clearly different from active
- [ ] Selected states obvious from unselected

---

### 4.2 Repetition Audit

**Principle:** Repeat visual elements for cohesion

**Code Checks:**
```css
/* BAD: Inconsistent styling */
.card-1 { border-radius: 4px; }
.card-2 { border-radius: 8px; }
.card-3 { border-radius: 12px; }

/* GOOD: Consistent design tokens */
:root {
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
}

.card { border-radius: var(--radius-lg); }
.button { border-radius: var(--radius-md); }
.input { border-radius: var(--radius-md); }
```

**Checklist:**
- [ ] CSS variables/tokens for all repeated values
- [ ] Same icon style throughout (filled OR outlined)
- [ ] Consistent button styles across pages
- [ ] Same heading hierarchy everywhere
- [ ] Color palette limited and reused

---

### 4.3 Alignment Audit

**Principle:** Everything aligns with something else

**Code Checks:**
```css
/* BAD: Random alignment */
.section-1 { padding-left: 15px; }
.section-2 { padding-left: 20px; }
.section-3 { padding-left: 32px; }

/* GOOD: Grid system */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

@media (min-width: 768px) {
  .grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 24px;
  }
}
```

**Checklist:**
- [ ] Content width consistent across pages
- [ ] Grid system used for layout
- [ ] Left edges of content align
- [ ] Centered elements truly centered
- [ ] Spacing follows consistent scale (8px base)

---

### 4.4 Proximity Audit

**Principle:** Related items near each other

**Code Checks:**
```css
/* BAD: Form with uniform spacing */
.form-group { margin-bottom: 20px; }

/* GOOD: Grouped by relationship */
.form-field {
  margin-bottom: 8px; /* Label close to input */
}
.form-group {
  margin-bottom: 24px; /* Groups separated */
}
.form-section {
  margin-bottom: 48px; /* Sections clearly distinct */
}
```

**Checklist:**
- [ ] Labels adjacent to their inputs
- [ ] Related form fields grouped
- [ ] Adequate space between unrelated sections
- [ ] Icon and label together (no orphan icons)
- [ ] Price near product description

---

## Module 5: Atomic Design Check

### 5.1 Component Structure Audit

**Check that code follows atomic principles:**

```
atoms/
  ├── button.html
  ├── input.html
  ├── label.html
  └── icon.html

molecules/
  ├── form-field.html (label + input + error)
  ├── search-bar.html (input + button)
  └── price-tag.html (currency + amount)

organisms/
  ├── header.html
  ├── booking-form.html
  └── adventure-card.html

templates/
  ├── landing-page.html
  └── booking-page.html
```

**Checklist:**
- [ ] Base components exist for all repeated patterns
- [ ] Components accept props/variables for customization
- [ ] No duplicated HTML patterns across files
- [ ] Styles scoped to components
- [ ] Components documented with usage examples

---

### 5.2 Component Reusability Audit

**Code Checks:**
```html
<!-- BAD: One-off styling -->
<button style="background: blue; padding: 10px 20px;">Book</button>
<button style="background: blue; padding: 12px 24px;">Reserve</button>

<!-- GOOD: Reusable component -->
<button class="btn btn--primary btn--md">Book Now</button>
<button class="btn btn--primary btn--lg">Reserve Your Spot</button>
```

```css
.btn {
  /* Base styles */
}
.btn--primary { /* Primary variant */ }
.btn--secondary { /* Secondary variant */ }
.btn--sm { /* Size variant */ }
.btn--md { /* Size variant */ }
.btn--lg { /* Size variant */ }
```

**Checklist:**
- [ ] No inline styles in HTML
- [ ] CSS classes follow naming convention (BEM recommended)
- [ ] Variants use modifiers, not new components
- [ ] Max 3 size variants per component
- [ ] Max 4 color variants per component

---

## Module 6: Accessibility Audit

### 6.1 Semantic HTML Check

```html
<!-- BAD: Divs for everything -->
<div class="header">
  <div class="nav">
    <div class="nav-item">Home</div>
  </div>
</div>

<!-- GOOD: Semantic elements -->
<header>
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/">Home</a></li>
    </ul>
  </nav>
</header>
```

**Checklist:**
- [ ] `<header>`, `<nav>`, `<main>`, `<footer>` used correctly
- [ ] `<article>` for standalone content
- [ ] `<section>` with headings
- [ ] `<aside>` for supplementary content
- [ ] Heading hierarchy (h1 → h2 → h3, no skipping)

---

### 6.2 ARIA and Labels Check

```html
<!-- Required ARIA patterns -->
<button aria-label="Close dialog" aria-expanded="false">
  <svg aria-hidden="true">...</svg>
</button>

<input
  type="email"
  id="email"
  aria-describedby="email-help email-error"
  aria-invalid="true">
<p id="email-help">We'll never share your email</p>
<p id="email-error" role="alert">Please enter a valid email</p>
```

**Checklist:**
- [ ] All images have `alt` text (empty for decorative)
- [ ] Form inputs have associated `<label>`
- [ ] Icons have `aria-label` or `aria-hidden`
- [ ] Error messages use `role="alert"`
- [ ] Modals trap focus and label content

---

### 6.3 Keyboard Navigation Check

```css
/* REQUIRED: Focus styles */
:focus-visible {
  outline: 2px solid var(--focus-color);
  outline-offset: 2px;
}

/* Don't remove focus for mouse users */
:focus:not(:focus-visible) {
  outline: none;
}
```

**Checklist:**
- [ ] All interactive elements focusable via Tab
- [ ] Focus order matches visual order
- [ ] Focus styles visible on all elements
- [ ] Skip link at top of page
- [ ] No keyboard traps (except modals)

---

## Module 7: Performance Impact Check

### 7.1 Critical Rendering Path

```html
<!-- HEAD: Critical CSS inline -->
<style>
  /* Above-the-fold critical styles */
</style>

<!-- Defer non-critical CSS -->
<link rel="preload" href="styles.css" as="style" onload="this.rel='stylesheet'">

<!-- Defer non-critical JS -->
<script src="app.js" defer></script>
```

**Checklist:**
- [ ] Critical CSS inlined or loaded first
- [ ] JavaScript deferred unless critical
- [ ] Web fonts preloaded
- [ ] No render-blocking resources
- [ ] Largest Contentful Paint < 2.5s

---

### 7.2 Image Optimization

```html
<!-- BAD: Unoptimized image -->
<img src="hero.png">

<!-- GOOD: Optimized, responsive image -->
<img
  src="hero-800.webp"
  srcset="hero-400.webp 400w, hero-800.webp 800w, hero-1200.webp 1200w"
  sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
  alt="Adventure awaits in Bali"
  loading="lazy"
  decoding="async"
  width="800"
  height="450">
```

**Checklist:**
- [ ] Images use modern formats (WebP, AVIF)
- [ ] Responsive images with srcset
- [ ] Lazy loading for below-fold images
- [ ] Width/height attributes prevent layout shift
- [ ] No images larger than 200KB

---

# PART II: AUTOMATED CORRECTION PATTERNS

## Quick Fix Recipes

### Fix 1: Missing Button Accessibility
```javascript
// Find and fix
document.querySelectorAll('div[onclick], span[onclick]').forEach(el => {
  console.warn('Replace with <button>:', el);
});
```

### Fix 2: Missing Form Labels
```javascript
// Find orphan inputs
document.querySelectorAll('input:not([aria-label]):not([id])').forEach(el => {
  console.warn('Add label or aria-label:', el);
});
```

### Fix 3: Color Contrast Issues
```javascript
// Use browser devtools: Lighthouse > Accessibility
// Or: axe DevTools extension
```

### Fix 4: Touch Target Size
```css
/* Add to all interactive elements */
@media (pointer: coarse) {
  button, a, input, select, textarea {
    min-height: 44px;
    min-width: 44px;
  }
}
```

### Fix 5: Loading States
```javascript
// Wrap all fetch calls
async function fetchWithFeedback(url, loadingEl) {
  loadingEl.classList.add('loading');
  loadingEl.setAttribute('aria-busy', 'true');
  try {
    return await fetch(url);
  } finally {
    loadingEl.classList.remove('loading');
    loadingEl.setAttribute('aria-busy', 'false');
  }
}
```

---

# PART III: REVIEW WORKFLOW

## Step 1: Automated Scan

Run these checks automatically:

```bash
# HTML validation
npx html-validate "**/*.html"

# Accessibility
npx pa11y-ci

# CSS linting
npx stylelint "**/*.css"

# Lighthouse
npx lighthouse https://yoursite.com --output json
```

## Step 2: Manual Review Checklist

### Page-by-Page Review
1. [ ] Load page on slow 3G — First paint < 3s?
2. [ ] Tab through entire page — Logical order?
3. [ ] Zoom to 200% — Nothing breaks?
4. [ ] Turn off CSS — Content still readable?
5. [ ] Screen reader test — All content announced?

### Component Review
1. [ ] All states defined (default, hover, active, focus, disabled, loading, error)
2. [ ] Responsive at all breakpoints
3. [ ] Follows design system tokens
4. [ ] No magic numbers in CSS

### Form Review
1. [ ] All fields labeled
2. [ ] Validation feedback immediate
3. [ ] Error messages helpful
4. [ ] Success confirmation clear
5. [ ] Can submit with keyboard alone

---

# PART IV: EDUCATEDTRAVELER-SPECIFIC CHECKS

## Booking Flow Critical Path

```
Homepage → Destination Page → Adventure Detail → Booking Form → Confirmation
```

**Each step must pass:**

### Homepage
- [ ] Primary CTA "Explore Adventures" above fold
- [ ] Trust signals visible (certifications, testimonials)
- [ ] Clear value proposition in first 5 words

### Destination Page
- [ ] Filter by skill type works
- [ ] Cards show: price, duration, certification, location
- [ ] "Most Popular" badge on top choice

### Adventure Detail
- [ ] Gallery loads fast, swipeable on mobile
- [ ] Schedule/dates prominently displayed
- [ ] "What's Included" scannable list
- [ ] Social proof (reviews, ratings)
- [ ] Sticky CTA on mobile scroll

### Booking Form
- [ ] Progress indicator (Step 1 of 3)
- [ ] Guest details → Payment → Confirmation
- [ ] Save progress on each step
- [ ] Clear price summary always visible
- [ ] Trust badges near payment

### Confirmation
- [ ] Clear next steps
- [ ] Calendar add option
- [ ] Share to social enabled
- [ ] Email confirmation mentioned

---

## Mobile-First Checks

### Thumb Zone Mapping
```
+------------------+
|     Hard to      |
|      reach       |
+--------+---------+
|   OK   |   OK    |
+--------+---------+
|     Natural      |
|    thumb zone    |
+------------------+
```

**Checklist:**
- [ ] Primary CTAs in bottom third
- [ ] Navigation reachable with thumb
- [ ] No important actions in corners
- [ ] Bottom navigation if > 5 sections

---

## Brand Consistency Checks

### Voice & Tone
- [ ] Headlines use active voice
- [ ] "You" > "We" ratio favorable
- [ ] No corporate jargon
- [ ] Adventurous but not reckless tone

### Visual Identity
- [ ] Colors match brand palette only
- [ ] Typography limited to brand fonts
- [ ] Photography style consistent
- [ ] Icons from single icon set

---

# APPENDIX: TOOLS & RESOURCES

## Browser DevTools
- Elements > Accessibility tab
- Lighthouse audit
- Network > Slow 3G simulation
- Coverage tab (unused CSS/JS)

## CLI Tools
- `pa11y` — Accessibility testing
- `lighthouse` — Performance audit
- `html-validate` — HTML validation
- `axe-core` — Accessibility engine

## Design Tokens Template
```css
:root {
  /* Colors */
  --color-primary: #2563eb;
  --color-secondary: #64748b;
  --color-success: #22c55e;
  --color-error: #ef4444;

  /* Typography */
  --font-family: 'Inter', system-ui, sans-serif;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.5rem;
  --font-size-2xl: 2rem;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;

  /* Borders */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;
}
```

---

## Severity Classification

| Level | Description | Action |
|-------|-------------|--------|
| **P0 - Critical** | Blocks user task, accessibility failure | Fix before launch |
| **P1 - High** | Significant UX friction | Fix within sprint |
| **P2 - Medium** | Minor UX improvement | Add to backlog |
| **P3 - Low** | Polish, nice-to-have | Consider for v2 |

---

*Agent created: 2026-01-24*
*"The design invisible is the design successful."*
*Principles sourced from: Norman, Krug, Yablonski, Williams, Frost, Wathan, Gothelf*
