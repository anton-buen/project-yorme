# Architectural Overhaul - Browser Testing Guide

**Quick Start:** Hard refresh browser (Ctrl + Shift + R) to see all changes

---

## Visual Checklist (5 Minutes)

### 1. Main Background
- [ ] Background is warm, subtle off-white (not stark white or gray)
- [ ] Feels premium and editorial

### 2. System Context Banner (Below Header)
- [ ] Two-column layout visible
- [ ] Left: "The Transparent Room" heading with vertical accent bar
- [ ] Right: Monospace data ledger showing PPO configuration
- [ ] NO yellow/amber warning background
- [ ] White/transparent background

### 3. Segmented Control (Header Center)
- [ ] Gray pill container with two buttons
- [ ] Active button has white background (sliding pill effect)
- [ ] Smooth transition when switching modes
- [ ] NO emojis visible (no 📊 or 🔴)
- [ ] Small red dot appears next to "Live Watch" when active

### 4. Timeline Scrubber
- [ ] NO white card wrapper around it
- [ ] Sits seamlessly on background
- [ ] Thin line (not thick bar)
- [ ] Small circular nodes (not large circles)
- [ ] Title: "Simulation Timeline" in serif
- [ ] Subtitle: Monospace "03:00 — 12:00 • 19 INTERVALS"

### 5. Hero Cards
- [ ] Thin accent strip at top (1px, not thick)
- [ ] Muted colors (no bright reds or greens)
- [ ] LGU card: Subtle rose/burgundy tones
- [ ] AI card: Subtle emerald/forest tones
- [ ] Status badges use muted colors (not bright)
- [ ] Hover shows subtle shadow (no scale effect on cards)

### 6. FAB Button (Bottom Center)
- [ ] Centered at bottom of screen
- [ ] White button with clean border
- [ ] Hovers to reveal "View Metrics" text
- [ ] Smooth expansion animation

### 7. Typography Check
- [ ] "Yormetrics" logo: Serif font (Playfair)
- [ ] Card titles: Serif font
- [ ] Action names ("Suspend All Levels"): Serif font
- [ ] All descriptions and labels: Sans-serif (Inter)
- [ ] All numbers and data: Monospace (JetBrains Mono)
- [ ] NO emojis anywhere in UI

---

## Interaction Testing (3 Minutes)

### Hover Effects:
1. Hover over hero cards → Subtle shadow appears
2. Hover over timeline nodes → Smooth scale up
3. Hover over FAB button → Expands to show text
4. Hover over segmented control buttons → Text darkens

### Mode Switching:
1. Click "Historical Replay" → Both cards + timeline visible
2. Click "Live Watch" → Only AI card visible, timeline hidden
3. Red dot appears next to "Live Watch" when active
4. Transitions are smooth (300ms)

### Timeline Interaction:
1. Drag timeline scrubber
2. Nodes smoothly change colors
3. Active node is larger
4. Announcement marker visible on specific node

### Drawer (RL Metrics):
1. Click FAB button at bottom center
2. Drawer slides up from bottom
3. Strong backdrop blur behind it
4. Background darkens
5. Click outside or X button to close

---

## Color Verification

### Should NOT See:
- ❌ Bright yellow (#FBBF24 or similar)
- ❌ Bright red (#EF4444 or similar)
- ❌ Bright green (#10B981 or similar)
- ❌ Stark white background
- ❌ Heavy gray shadows

### Should See:
- ✅ Warm off-white background (#F9F8F6)
- ✅ Muted rose/burgundy (#881337, #fef2f2)
- ✅ Muted emerald/forest (#065f46, #f0fdf4)
- ✅ Deep slate text (#1e293b)
- ✅ Subtle borders (stone-200/80)

---

## Mode-Specific Checks

### Historical Mode:
- [ ] Both hero cards visible (LGU + AI)
- [ ] Timeline scrubber visible below banner
- [ ] Incident dropdown visible in header
- [ ] Segmented control shows "Historical Replay" active

### Live Watch Mode:
- [ ] Only AI card visible (LGU card hidden)
- [ ] Timeline scrubber HIDDEN
- [ ] Incident dropdown HIDDEN
- [ ] Red pulsing dot next to "Live Watch"
- [ ] Live meteorological radar shows (if implemented)

---

## Responsive Testing

### Desktop (>1024px):
- [ ] Two-column banner layout
- [ ] Two hero cards side-by-side
- [ ] Timeline spans full width
- [ ] All elements aligned

### Tablet (768px - 1024px):
- [ ] Banner may stack or adjust
- [ ] Hero cards stack vertically
- [ ] Timeline still functional

### Mobile (<768px):
- [ ] All cards stack vertically
- [ ] Timeline nodes may be smaller
- [ ] FAB button still centered
- [ ] Segmented control still usable

---

## Console Check

### Open DevTools (F12) → Console:
- [ ] NO emojis in console logs
- [ ] Logs show "[App]" and "[API]" prefixes
- [ ] No TypeScript errors
- [ ] No React warnings

---

## Typography Audit

Open DevTools → Elements → Computed:

### Check "Yormetrics" Logo:
- Font Family: Should include "Playfair Display"

### Check Card Titles:
- Font Family: Should include "Playfair Display"

### Check Labels/Descriptions:
- Font Family: Should include "Inter"

### Check Data Values:
- Font Family: Should include "JetBrains Mono"

---

## Performance Check

### DevTools → Network:
1. Hard refresh page
2. Check load time
3. Should be fast (<2 seconds on good connection)
4. No failed requests
5. Favicon loads correctly

### DevTools → Performance:
1. Record interaction
2. Timeline scrubber should be smooth (60fps)
3. Mode switching should be smooth
4. No janky animations

---

## Accessibility Check

### Keyboard Navigation:
- [ ] Tab through elements
- [ ] Segmented control focusable
- [ ] Timeline nodes focusable
- [ ] FAB button focusable
- [ ] Focus indicators visible

### Screen Reader (Optional):
- [ ] ARIA labels present
- [ ] Button purposes clear
- [ ] Card structure semantic

---

## Common Issues & Fixes

### Issue: Still seeing old yellow banner
**Fix:** Hard refresh (Ctrl + Shift + R), clear cache

### Issue: Emojis still visible
**Fix:** Check if HMR updated, restart dev server if needed

### Issue: Timeline still in white card
**Fix:** Verify HMR update, check TimelineScrubber.tsx

### Issue: Colors still bright
**Fix:** Check HeroCards.tsx loaded correctly, restart dev server

### Issue: Typography wrong
**Fix:** Ensure fonts loaded, check DevTools → Network for font files

---

## Expected Experience

### Overall Feel:
- Premium and editorial
- Calm and sophisticated
- Clear information hierarchy
- Seamless component flow
- Professional without emojis

### User Understanding:
- Banner explains RL concept clearly
- Data ledger shows system configuration
- Timeline provides temporal control
- Cards compare LGU vs AI decisions
- All data labeled and transparent

---

## Sign-Off Checklist

Before marking complete, verify:

- [ ] Background is warm off-white (#F9F8F6)
- [ ] Banner has two-column editorial layout
- [ ] Timeline has NO card wrapper
- [ ] Segmented control works smoothly
- [ ] Hero cards use muted colors
- [ ] NO emojis visible in UI
- [ ] Typography hierarchy correct (serif/sans/mono)
- [ ] FAB button centered at bottom
- [ ] Drawer has strong backdrop blur
- [ ] All interactions smooth (300ms)
- [ ] Both Historical and Live modes work
- [ ] Build successful (602ms)
- [ ] No TypeScript errors

---

**If all checks pass:** Architectural overhaul is successfully implemented!

**Next steps:** Update remaining components (RadarGrid, LiveMap, LoadingScreen) to complete the cohesive design system.

---

*Testing guide for Yormetrics v2.1 architectural overhaul*  
*August 20, 2026*
