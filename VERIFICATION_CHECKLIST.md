# Yormetrics Bug Fix Verification Checklist

## 🚀 Quick Start
The development server is running at: **http://localhost:8443/**

Perform a **hard refresh** in your browser:
- Windows: `Ctrl + Shift + R` or `Ctrl + F5`
- Or: Open DevTools (F12) → Right-click refresh → "Empty Cache and Hard Reload"

---

## ✅ Verification Steps

### 1. Header & Layout
- [ ] Header is positioned at the **top of the page** (not floating in middle)
- [ ] Header has proper glassmorphic blur effect
- [ ] "Yormetrics" title is in **Playfair Display serif** font
- [ ] Subtitle "Predictive Early Suspension Advisor — City of Manila LGU" is in **Inter sans** font
- [ ] Content flows naturally below header without overlap

### 2. Live Watch Mode
- [ ] Click "Live Watch" button in header
- [ ] **Red pulsing dot** appears next to "Live Watch" text when active
- [ ] "Live Meteorological Radar" card title shows **red pulsing dot**
- [ ] Timeline scrubber disappears in Live Watch mode
- [ ] Clock shows live Manila time with "(Live)" suffix
- [ ] Click "Historical Replay" to switch back

### 3. Typography Readability
- [ ] Main logo "Yormetrics" in serif ✓
- [ ] Large action titles ("Suspend All Levels") in serif ✓
- [ ] All subheadings in **sans-serif** (Inter) ✓
- [ ] All labels and descriptions in **sans-serif** ✓
- [ ] PAGASA badges in **sans-serif** ✓
- [ ] Dropdown menus in **sans-serif** ✓
- [ ] Timestamps in **monospace** (JetBrains Mono) ✓
- [ ] Text is clearly readable across all components

### 4. Timeline Scrubber (Historical Mode)
- [ ] "Step 18/19" counter is **removed** ✅
- [ ] Only time display shows (e.g., "11:30 AM (Sim)")
- [ ] Slider is full-width without counter text
- [ ] Dragging slider updates time smoothly
- [ ] Bottom visual timeline scrubber still shows all 19 steps

### 5. Radar Grid Scaling
- [ ] RadarGrid canvas is **significantly larger** (not tiny)
- [ ] Canvas is centered within its container
- [ ] Visual size matches the Windy map next to it
- [ ] Coordinates (14.5995°N 120.9842°E) visible in top-left
- [ ] Timestamp visible in top-right
- [ ] PAGASA warning badge visible in bottom-right
- [ ] Color scale bar below canvas is clear
- [ ] 32×32 pixelated heatmap pattern visible

### 6. AI Prediction Error Handling

#### Test 1: Normal Operation (Backend Online)
- [ ] AI Policy Recommendation card loads successfully
- [ ] Shows action code (A0-A4)
- [ ] Shows confidence percentage
- [ ] Shows model weights path
- [ ] Displays simulated stranded count
- [ ] Shows "Protected" safety badge

#### Test 2: Backend Offline (Simulated)
If your backend is offline, you should see:
- [ ] **Error icon** (yellow warning triangle) displayed
- [ ] Clear message: "Backend Offline or Waking Up"
- [ ] Error details displayed
- [ ] Note about cold start (up to 50 seconds)
- [ ] **"Retry Connection" button** appears
- [ ] Clicking retry button triggers new API call

### 7. Hero Cards Layout
- [ ] Two cards displayed side-by-side (desktop)
- [ ] Left card has **Terra brown** top border accent
- [ ] Right card has **Sage green** top border accent
- [ ] Both cards have two inner stat sub-cards
- [ ] Terra card shows "Estimated Stranded" in terra background
- [ ] Sage card shows "Simulated Stranded" in sage background
- [ ] Safety badges displayed correctly

### 8. Live Map
- [ ] Windy.com iframe loads successfully
- [ ] **Red pulsing dot** next to title
- [ ] Map centered on Manila (14.5995°N, 120.9842°E)
- [ ] Interactive map controls working
- [ ] Data source attribution visible below map

### 9. Bottom Timeline (Historical Mode)
- [ ] 19 step indicators displayed (03:00 AM to 12:00 PM)
- [ ] Active step highlighted
- [ ] Announcement markers visible
- [ ] Clicking steps updates the dashboard
- [ ] Legend shows Manila PIO note

### 10. Technical Appendix Drawer
- [ ] FAB (Floating Action Button) visible bottom-right
- [ ] Click FAB to open drawer
- [ ] Drawer slides up from bottom
- [ ] Warm off-white background (#FBF9F6)
- [ ] Three columns displayed:
  - Policy bias selector
  - PPO probability bar chart
  - Tensor inspector + reward matrix
- [ ] Close button works

---

## 🐛 Common Issues & Solutions

### Issue: Still seeing "YORME-TRICS"
**Solution**: Hard refresh browser (Ctrl + Shift + R) or clear cache

### Issue: Header still in middle of page
**Solution**: 
1. Check browser zoom level (should be 100%)
2. Hard refresh
3. Check browser console for errors (F12)

### Issue: AI card still stuck loading
**Solution**: 
1. Check if backend is running and accessible
2. Look for error message with retry button
3. Check browser console for API errors
4. Verify VITE_API_URL in .env file

### Issue: Canvas too small
**Solution**: 
1. Hard refresh browser
2. Check browser zoom level
3. Resize window to trigger responsive layout

### Issue: Fonts not rendering correctly
**Solution**:
1. Ensure Google Fonts are loading (check Network tab in DevTools)
2. Hard refresh browser
3. Check for font-blocking browser extensions

---

## 📊 Expected Visual State

### Header Row 1
```
[Yormetrics]                    [Historical Replay] [Live Watch 🔴] [Dropdown]
Predictive Early Suspension...
```

### Header Row 2
```
[PAGASA: No Warning] [06:30 AM (Sim)] [═══●═══════════]
```

### Hero Cards
```
┌─ Terra Border ─────────────┐  ┌─ Sage Border ──────────────┐
│ Official LGU Decision  [A3]│  │ AI Policy Rec...    [A3]  │
│ Suspend All Levels         │  │ Suspend All Levels        │
│ ┌─────────┐ ┌─────────┐   │  │ ┌─────────┐ ┌─────────┐  │
│ │Estimated│ │Commuter │   │  │ │Simulated│ │Commuter │  │
│ │5,200    │ │Critical │   │  │ │120      │ │Protected│  │
│ └─────────┘ └─────────┘   │  │ └─────────┘ └─────────┘  │
└─────────────────────────────┘  └─────────────────────────┘
```

### Radar Grid + Live Map
```
┌─────────────────────┐  ┌─────────────────────┐
│ PAGASA Radar Grid   │  │ Live Radar 🔴       │
│ ┌─────────────────┐ │  │ [Windy.com iframe]  │
│ │ 32×32 Heatmap   │ │  │                     │
│ │ [████████████]  │ │  │                     │
│ └─────────────────┘ │  │                     │
│ [Color Scale Bar]   │  │                     │
└─────────────────────┘  └─────────────────────┘
```

---

## 🎯 Success Criteria

All fixes are working if:
- ✅ Header is at top with proper z-index
- ✅ Live Watch shows red pulsing indicators
- ✅ Typography uses correct font families
- ✅ "Step X/19" counter removed from header
- ✅ Radar grid scaled up to match live map
- ✅ AI card shows error state with retry when backend fails
- ✅ All text is readable with proper font hierarchy

---

## 📝 Testing Notes

### Manual API Error Testing
To test error handling, you can:
1. Stop the backend server temporarily
2. Reload the frontend
3. Verify error message appears with retry button
4. Restart backend
5. Click "Retry Connection"
6. Verify prediction loads successfully

### Responsive Testing
Test on different screen sizes:
- Desktop (1920x1080): Cards side-by-side ✓
- Tablet (768px): Cards may stack vertically ✓
- Mobile (375px): All cards stack vertically ✓

### Browser Compatibility
Tested on:
- Chrome/Edge (Chromium)
- Firefox
- Safari (check glassmorphic effects)

---

## 🔧 Dev Server Info

**URL**: http://localhost:8443/  
**Status**: ✅ Running  
**Last Reload**: Automatic (Vite HMR)

Changes are applied. Access the dashboard and verify all fixes using the checklist above!
