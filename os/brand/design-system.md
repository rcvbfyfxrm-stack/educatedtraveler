# Design System

The visual language of EducatedTraveler. Apple glass meets Netflix minimal.

> For brand rules and ethics that all design and copy must follow, see `os/brand/brand-guardrails.md`.

---

## Philosophy

- **Substance over sizzle**: Let the adventures speak
- **Darkness as canvas**: Black backgrounds, content glows
- **Motion with purpose**: Subtle animations, never distracting
- **Premium restraint**: Less is more, always

---

## Color Palette

### Backgrounds
```
Primary:      #000000 (pure black)
Surface:      rgba(255,255,255,0.03) (glass)
Surface-alt:  rgba(255,255,255,0.06) (glass-strong)
```

### Text
```
Primary:      #FFFFFF (headings)
Secondary:    rgba(255,255,255,0.60) (body)
Tertiary:     rgba(255,255,255,0.40) (captions)
Muted:        rgba(255,255,255,0.20) (subtle)
```

### Accent Colors
```
Cyan:         #06B6D4 (primary action, sailing)
Amber:        #F59E0B (culinary, warmth)
Orange:       #F97316 (wellness, India)
Purple:       #A855F7 (creative, time)
Pink:         #EC4899 (wellness category)
```

### Gradients
```
Text gradient:    linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)
Image overlay:    linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.2) 100%)
Icon bg amber:    linear-gradient(to bottom-right, rgba(245,158,11,0.2), rgba(249,115,22,0.2))
Icon bg cyan:     linear-gradient(to bottom-right, rgba(6,182,212,0.2), rgba(59,130,246,0.2))
Icon bg purple:   linear-gradient(to bottom-right, rgba(168,85,247,0.2), rgba(236,72,153,0.2))
```

---

## Typography

### Font
```
Family:    Inter
Weights:   300 (light), 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
Fallback:  system-ui, sans-serif
```

### Scale
```
Hero:      text-5xl md:text-7xl lg:text-8xl (tracking-tight)
H1:        text-4xl md:text-6xl (tracking-tight)
H2:        text-3xl md:text-4xl (tracking-tight)
H3:        text-xl md:text-2xl
Body:      text-base (font-light, leading-relaxed)
Caption:   text-sm
Overline:  text-xs (uppercase, tracking-widest)
```

### Text Rendering
```css
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

---

## Components

### Glass Cards
```css
.glass {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 1.5rem; /* rounded-3xl */
}

.glass-strong {
    background: rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(40px);
    border: 1px solid rgba(255, 255, 255, 0.08);
}
```

### Buttons
```html
<!-- Primary (white on black) -->
<a class="inline-flex items-center gap-3 px-8 py-4 bg-white text-black font-medium rounded-full hover:bg-white/90 transition-all duration-300 hover:scale-105">
    Join the Waitlist →
</a>

<!-- Secondary (glass) -->
<a class="inline-flex items-center gap-3 px-6 py-3 glass text-white/80 font-medium rounded-full hover:bg-white/10 transition-all">
    Learn More
</a>
```

### Adventure Cards (Netflix Style)
```html
<div class="group relative rounded-3xl overflow-hidden aspect-[3/4] cursor-pointer">
    <img class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
    <div class="absolute inset-0 image-overlay"></div>
    <div class="absolute inset-0 p-8 flex flex-col justify-end">
        <p class="text-amber-400 text-sm font-medium tracking-wide mb-2">Location</p>
        <h3 class="text-2xl font-semibold mb-3">Adventure Name</h3>
        <p class="text-white/60 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
            Description reveals on hover
        </p>
        <div class="flex items-center gap-4 text-sm">
            <span class="text-white/80">30 days</span>
            <span class="text-white/40">•</span>
            <span class="text-white/60">$12,000</span>
        </div>
    </div>
</div>
```

### Feature Pills
```html
<span class="px-3 py-1.5 rounded-full bg-white/5 text-white/60 text-xs">Category</span>
```

### Checkmark Lists
```html
<div class="flex gap-4">
    <div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
        <svg class="w-4 h-4 text-cyan-400"><!-- checkmark --></svg>
    </div>
    <p class="text-white/70 font-light">Benefit statement</p>
</div>
```

---

## Animation

### Fade Up (on load)
```css
@keyframes fadeUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
}
.fade-up { animation: fadeUp 0.8s ease-out forwards; }
.fade-up-delay-1 { animation-delay: 0.1s; opacity: 0; }
.fade-up-delay-2 { animation-delay: 0.2s; opacity: 0; }
.fade-up-delay-3 { animation-delay: 0.3s; opacity: 0; }
```

### Card Hover
```css
.card-hover {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.card-hover:hover {
    transform: scale(1.02);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}
```

### Scroll Indicator
```css
@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(8px); }
}
.scroll-indicator { animation: bounce 2s infinite; }
```

---

## Layout Patterns

### Hero (Full Screen)
```
- Full viewport height
- Background image at 50% opacity
- Gradient overlay (top: 60% black, middle: 40%, bottom: 100% black)
- Centered content with max-width
- Scroll indicator at bottom
```

### Section Spacing
```
py-20 to py-32 (80-128px vertical padding)
px-6 (24px horizontal)
max-w-6xl or max-w-7xl container
```

### Grid Patterns
```
3-column: grid md:grid-cols-3 gap-6
2-column: grid md:grid-cols-2 gap-4
Cards: aspect-[3/4] for portrait, aspect-video for landscape
```

---

## Image Guidelines

### Sources
- Unsplash for hero/ambient shots
- Professional photography for specific programs

### Treatment
```
opacity-30 to opacity-50 for backgrounds
object-cover for all images
Gradient overlay required for text readability
```

### Recommended Shots
| Context | Style |
|---------|-------|
| Sailing | Golden hour, crew at work, open ocean |
| Sushi | Hands working, fish detail, market atmosphere |
| Yoga | Ganges at dawn, outdoor practice, temple silhouettes |
| General | Action over posed, authentic over staged |

---

## Icons

### Style
- Outline only (stroke-width: 1.5 or 2)
- 24x24 base size (w-6 h-6)
- Accent color matching context

### Common Icons
```html
Arrow right:  <path d="M17 8l4 4m0 0l-4 4m4-4H3"/>
Checkmark:    <path d="M5 13l4 4L19 7"/>
Globe:        <path d="M3.055 11H5a2 2 0 012 2v1..."/>
Clock:        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0..."/>
Lightbulb:    <path d="M9.663 17h4.673M12 3v1..."/>
```

---

## Forms

### Inputs
```css
input, select, textarea {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: white;
    border-radius: 0.75rem; /* rounded-xl */
    padding: 0.75rem 1rem;
}

input:focus {
    border-color: rgba(6, 182, 212, 0.4);
    box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.1);
}

input::placeholder {
    color: rgba(255, 255, 255, 0.3);
}
```

### Form Sections
```html
<h3 class="text-xs font-medium text-cyan-400/80 uppercase tracking-widest mb-5">
    Section Title
</h3>
```

---

## Responsive Breakpoints

```
sm:   640px
md:   768px
lg:   1024px
xl:   1280px
2xl:  1536px
```

Mobile-first. Most adjustments at `md:` breakpoint.

---

## Do / Don't

### Do
- Use glass effects for cards
- Reveal content on hover
- Keep animations subtle
- Use accent colors sparingly
- Let darkness breathe

### Don't
- Use pure white backgrounds
- Add unnecessary motion
- Crowd the layout
- Use more than 2 accent colors per section
- Sacrifice readability for aesthetics

---

**Version**: 1.0
**Last Updated**: January 2026
