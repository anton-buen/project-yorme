# 🚀 Quick Start Testing Guide

**Current Status:** ✅ Dev server running, all components built successfully

---

## Browser Testing (5 Minutes)

### Step 1: Open Browser & Dev Tools
```
1. Open Chrome/Edge/Firefox
2. Press F12 to open DevTools
3. Go to Console tab
4. Navigate to: http://localhost:5173 (or your Vite port)
5. Press Ctrl + Shift + R for hard refresh
```

### Step 2: Test Historical Mode (2 min)
```
✓ Verify amber SystemContextBanner appears below header
✓ Verify Timeline Scrubber at TOP (not bottom)
✓ Verify TWO hero cards show (LGU + AI)
✓ Verify Historical Radar Grid (32×32 pixelated)
✓ Verify Live Map is HIDDEN
✓ Drag timeline slider - watch console for [API] logs
✓ Check AI card updates with timeline changes
```

### Step 3: Test Live Watch Mode (2 min)
```
✓ Click "🔴 Live Watch" in iOS segmented control
✓ Verify pulsing red dot appears on button
✓ Verify LGU card is HIDDEN (only AI card shows)
✓ Verify Timeline Scrubber is HIDDEN
✓ Verify Historical Radar Grid is HIDDEN
✓ Verify Live Map appears (Windy iframe)
✓ Verify pulsing red dot on "Live Meteorological Radar" title
✓ Verify live clock shows current Manila time
```

### Step 4: Test API Error Handling (1 min)
```
1. Stop backend server (if running)
2. Switch modes or move timeline
3. Verify error message appears in AI card:
   "Backend Offline or Waking Up"
4. Verify "Retry Connection" button shows
5. Check console for [API] error logs with CORS detection
6. Click "Retry Connection"
7. Check console for: [App] Retry button clicked
```

---

## Console Log Examples

### Successful API Call:
```
[API] Fetching: /api/predict {url: "https://...", method: "POST"}
[API] Response status: 200 OK
[API] Response headers: {content-type: "application/json", ...}
[API] Success response: {ai_action_code: 3, action_probabilities: [...]}
```

### CORS Error:
```
[API] Fetching: /api/predict
[API] Fetch error: TypeError: Failed to fetch
[API] Possible CORS error or network failure
```

### Retry Action:
```
[App] Retry button clicked - resetting prediction state
[API] Fetching: /api/predict
```

---

## Visual Checklist

### Header (All Modes):
- [ ] "Yormetrics" wordmark in Playfair Display
- [ ] iOS segmented control centered between wordmark and dropdown
- [ ] Active mode button: white bg with shadow
- [ ] Inactive button: gray text
- [ ] PAGASA badge shows correct color
- [ ] Clock shows correct time/format

### SystemContextBanner (All Modes):
- [ ] Amber gradient background
- [ ] Info icon in circular background
- [ ] Clear RL explanation text
- [ ] White/60 transparency box for data disclaimer
- [ ] "Simulated Stranded" in monospace badge

### Historical Mode Layout:
```
┌──────────────────────────────────┐
│ Header (sticky)                  │
├──────────────────────────────────┤
│ SystemContextBanner (amber)      │
├──────────────────────────────────┤
│ TimelineScrubber (TOP) ← CHECK   │
├──────────────────────────────────┤
│ ┌──────────┐  ┌──────────┐      │
│ │ LGU Card │  │ AI Card  │      │
│ └──────────┘  └──────────┘      │
├──────────────────────────────────┤
│ ┌───────────────────────────┐   │
│ │ Historical Radar (32×32)  │   │
│ └───────────────────────────┘   │
└──────────────────────────────────┘
```

### Live Watch Mode Layout:
```
┌──────────────────────────────────┐
│ Header (simplified, no dropdown) │
├──────────────────────────────────┤
│ SystemContextBanner (amber)      │
├──────────────────────────────────┤
│ ┌───────────────────────────┐   │
│ │ AI Card Only 🔴           │   │
│ └───────────────────────────┘   │
├──────────────────────────────────┤
│ ┌───────────────────────────┐   │
│ │ Live Map (Windy) 🔴       │   │
│ └───────────────────────────┘   │
└──────────────────────────────────┘
```

---

## Common Issues & Solutions

### Issue: Changes not showing
**Solution:** Hard refresh with `Ctrl + Shift + R`

### Issue: Console empty after API call
**Solution:** Check browser console is open, try reloading page

### Issue: Live Map not loading
**Solution:** Check internet connection (Windy requires external connection)

### Issue: Timeline not at top
**Solution:** Hard refresh, verify you're in Historical mode

### Issue: Both cards showing in Live mode
**Solution:** Click Live Watch button, check red dot appears

### Issue: API errors on every request
**Solution:** Check backend is running at correct URL in `.env`

---

## Backend Quick Start

### If Backend Not Running:
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### Expected Output:
```
[STARTUP] Successfully loaded PPO model from models/ppo_yorme_agent.zip
INFO:     Uvicorn running on http://0.0.0.0:8000
[BACKGROUND CACHE] Updated PAGASA Doppler radar tensor.
```

### Test Backend:
```bash
curl http://localhost:8000/api/health
# Expected: {"status":"online","model_loaded":true}
```

---

## Environment Variables

### Frontend `.env`:
```
VITE_API_URL=https://walang-pasok-api.onrender.com
# Or for local testing:
# VITE_API_URL=http://localhost:8000
```

### To Switch to Local Backend:
1. Edit `frontend/.env`
2. Change to: `VITE_API_URL=http://localhost:8000`
3. Hard refresh browser
4. Check console logs show localhost URL

---

## Mobile Testing

### Chrome DevTools Device Emulation:
```
1. Open DevTools (F12)
2. Click device toolbar icon (Ctrl + Shift + M)
3. Select "iPhone 12 Pro" or "Pixel 5"
4. Verify responsive layout:
   - Hero cards stack vertically
   - iOS segmented control remains usable
   - Banner text readable
   - Drawer doesn't overflow
```

---

## Success Indicators

### ✅ Everything Working:
- SystemContextBanner visible with amber gradient
- Timeline at top in Historical mode
- Mode switching smooth with visual feedback
- Red pulsing dots appear in Live mode
- Console logs show [API] messages
- No TypeScript errors in console
- Predictions update when timeline moves
- Retry button appears and works on errors

### ❌ Something Wrong:
- Timeline still at bottom → Hard refresh
- Both cards in Live mode → Click Live Watch button
- No console logs → DevTools closed or filtered
- White screen → Check console for errors
- API always fails → Check backend URL in .env

---

## Performance Benchmarks

### Expected Metrics:
- **Build time:** ~550ms
- **Bundle size:** ~580 KB (gzipped: 172 KB)
- **CSS size:** ~32 KB (gzipped: 6.6 KB)
- **First load:** < 2 seconds
- **HMR update:** < 100ms
- **API response:** < 500ms (local), < 3s (Render cold start)

---

## One-Line Test Commands

```bash
# Build frontend
cd frontend && npm run build

# Run dev server
cd frontend && npm run dev

# Check backend health
curl http://localhost:8000/api/health

# Check incidents data
curl http://localhost:8000/api/incidents

# Test prediction endpoint
curl -X POST http://localhost:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"current_hour":6.0,"flood_active":true,"pagasa_warning_red":true}'
```

---

## Acceptance Criteria

Task 8 is complete when:

1. ✅ SystemContextBanner visible below header
2. ✅ Timeline Scrubber at top in Historical mode
3. ✅ Historical mode shows both cards + Historical Radar only
4. ✅ Live mode shows AI card + Live Map only
5. ✅ iOS segmented control centered with smooth transitions
6. ✅ Pulsing red dots appear in Live mode
7. ✅ Console shows [API] logs for all requests
8. ✅ Error state displays with retry button
9. ✅ Retry button clears cache and re-fetches
10. ✅ All TypeScript diagnostics clean
11. ✅ Build succeeds without errors
12. ✅ Dev server runs with HMR

---

## Contact & Support

- **Build Issues:** Check `frontend/package.json` dependencies
- **TypeScript Errors:** Run `npm run build` to see full output
- **API Issues:** Check console logs with `[API]` prefix
- **Layout Issues:** Hard refresh (Ctrl + Shift + R)
- **Backend Issues:** Check `backend/main.py` logs

---

**Ready to test! Open your browser and follow Step 1 above.**

🚀 Good luck testing!
