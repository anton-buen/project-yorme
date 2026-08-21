# Cache Busting Fix for Incidents API

## Problem

Backend successfully serves 13 incidents, but frontend consistently receives stale/cached response with old data. This is caused by aggressive caching at multiple levels:

1. Browser fetch cache
2. Service worker cache (if present)
3. Vercel edge cache
4. CDN intermediate cache

## Root Cause

**Fetch API Default Behavior:**
- By default, `fetch()` uses `cache: 'default'` which respects HTTP cache headers
- Browsers aggressively cache GET requests
- Vercel's edge network caches API responses

**HTTP Caching Cascade:**
```
Browser Cache → Service Worker → Vercel Edge → Origin Server
     ↓              ↓                ↓              ↓
  Serves old   Serves old      Serves old     Serves fresh
```

Without explicit cache-busting, requests never reach the origin server.

## Fixes Applied

### 1. Added Cache-Busting Headers to All Fetch Calls

**File:** `frontend/src/utils/api.ts`

**Before:**
```typescript
const response = await fetch(url, {
  headers: {
    'Content-Type': 'application/json',
    ...options?.headers,
  },
  ...options,
  signal: controller.signal,
});
```

**After:**
```typescript
const response = await fetch(url, {
  cache: 'no-store',  // ← Disables fetch cache
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',  // ← HTTP cache control
    'Pragma': 'no-cache',  // ← HTTP/1.0 compatibility
    'Expires': '0',  // ← Explicit expiry
    ...options?.headers,
  },
  ...options,
  signal: controller.signal,
});
```

**What Each Header Does:**

- **`cache: 'no-store'`**: Fetch API-specific, bypasses browser fetch cache
- **`Cache-Control: no-cache`**: Forces revalidation with server
- **`Cache-Control: no-store`**: Prevents storing response in any cache
- **`Cache-Control: must-revalidate`**: Requires fresh data after expiry
- **`Pragma: no-cache`**: HTTP/1.0 backward compatibility
- **`Expires: 0`**: Mark as already expired

### 2. Added Timestamp Query Parameter

**File:** `frontend/src/utils/api.ts` → `fetchIncidents()`

**Before:**
```typescript
const response = await fetchApi<{ incidents: IncidentData[] }>('/api/incidents');
```

**After:**
```typescript
const timestamp = new Date().getTime();
const response = await fetchApi<{ incidents: IncidentData[] }>(`/api/incidents?t=${timestamp}`);
```

**Why This Works:**
- Each request has a unique URL due to timestamp
- Caches are URL-keyed, so each request bypasses cache
- Works even if headers are stripped by proxies
- Simple and reliable fallback strategy

### 3. Added Diagnostic Logging

**File:** `frontend/src/App.tsx`

```typescript
console.log('[App] Fetching incidents from API...');
const incidentsData = await fetchIncidents();
console.log('[App] Received incidents from API:', incidentsData.length, 'items');
console.log('[App] Incident IDs:', incidentsData.map(inc => inc.id));
setIncidents(incidentsData);
console.log('[App] State updated with', incidentsData.length, 'incidents');
```

**Purpose:**
- Verify API returns fresh data
- Track incident count through the pipeline
- Debug any filtering or state update issues

## How to Verify the Fix

### 1. Clear All Caches

**Browser (Chrome/Edge):**
```
1. Open DevTools (F12)
2. Right-click refresh button → "Empty Cache and Hard Reload"
3. Or: Settings → Clear browsing data → Cached images and files
```

**Vercel Edge Cache:**
```
1. Vercel Dashboard → Deployments
2. Click on latest deployment
3. Click "..." → "Redeploy"
4. Or wait 60 seconds (default edge cache TTL)
```

### 2. Check Network Tab

**Expected behavior:**
1. Open DevTools → Network tab
2. Reload page
3. Find `/api/incidents?t=...` request
4. Check:
   - Status: `200 OK` (not `304 Not Modified`)
   - Size: Should show actual bytes (not "disk cache" or "memory cache")
   - Query param: `t=` should have current timestamp
   - Response: Should contain 13 incidents

### 3. Check Console Logs

**Expected output:**
```
[API] ⚡ Fetching: /api/incidents?t=1234567890
[API] ✅ Response status: 200 OK
[API] Filtered 13 incidents to 13 valid incidents
[App] Fetching incidents from API...
[App] Received incidents from API: 13 items
[App] Incident IDs: ["carina_2024_july24", "monsoon_2024_aug28", ...]
[App] State updated with 13 incidents
```

**Bad signs:**
```
[App] Received incidents from API: 2 items  ← Old cached data
```

### 4. Force Refresh Test

```bash
# In browser console:
localStorage.clear();
sessionStorage.clear();
location.reload(true);
```

## Additional Diagnostic Commands

### Check if Backend Returns 13 Incidents

```bash
curl -H "Cache-Control: no-cache" https://walang-pasok-api.onrender.com/api/incidents | jq '.incidents | length'
```

Expected output: `13`

### Check Response Headers

```bash
curl -I https://walang-pasok-api.onrender.com/api/incidents
```

Look for:
```
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0
```

If not present, backend needs to add these headers.

## Backend Cache Headers (Optional Enhancement)

If caching persists, add cache headers to backend response:

**File:** `backend/main.py`

```python
@app.get("/api/incidents")
def get_incidents():
    response = JSONResponse(content=json_data)
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response
```

## Common Caching Issues and Solutions

### Issue 1: Vercel Edge Cache Not Clearing

**Symptom:** Even with headers, still getting cached data

**Solution:**
1. Add `x-vercel-cache: BYPASS` check in Network tab
2. If seeing `x-vercel-cache: HIT`, edge cache is serving stale data
3. Redeploy or wait for cache TTL (usually 60s)

### Issue 2: Service Worker Intercepting Requests

**Symptom:** Requests never reach network

**Check:**
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs);
  regs.forEach(reg => reg.unregister());
});
```

### Issue 3: React StrictMode Double-Fetching

**Symptom:** Seeing duplicate API calls in dev mode

**Not an issue:** React StrictMode intentionally double-calls effects in development. This doesn't happen in production.

### Issue 4: Browser Ignoring Cache Headers

**Symptom:** Headers present but cache still hits

**Solution:** Use timestamp query param (already implemented)

## Testing Matrix

| Scenario | Expected Behavior |
|----------|------------------|
| Fresh page load | Fetch 13 incidents, no cache |
| Hard refresh (Ctrl+F5) | Fetch 13 incidents, bypass cache |
| Normal refresh (F5) | Fetch 13 incidents (due to cache: 'no-store') |
| Back button | Fetch 13 incidents (no bfcache) |
| After deployment | Fetch 13 incidents immediately |

## Rollback Plan

If cache-busting causes issues:

```typescript
// Revert to simple fetch (not recommended)
const response = await fetchApi('/api/incidents');
```

But investigate why cache-busting is problematic - usually indicates a different issue.

## Performance Considerations

**Impact:** Minimal
- Cache-busting adds ~10-15 bytes per request (timestamp)
- Headers add ~100 bytes
- Incidents endpoint called once per app load
- Backend response time: ~100-200ms
- Total impact: Negligible for this use case

**When NOT to cache-bust:**
- Static assets (images, CSS, JS bundles)
- Rarely-changing reference data
- High-traffic endpoints needing CDN caching

**When TO cache-bust:**
- Frequently updated data (incidents updated daily/weekly)
- User-specific data
- Real-time dashboards
- Admin panels

## Files Modified

1. `frontend/src/utils/api.ts`
   - Added cache: 'no-store' to fetch
   - Added comprehensive cache headers
   - Added timestamp query parameter to fetchIncidents

2. `frontend/src/App.tsx`
   - Added diagnostic logging for incident fetching
   - Track incident count and IDs

3. `CACHE_BUSTING_FIX.md` (this file)
   - Comprehensive documentation

## Deployment

```bash
# Frontend changes only
cd frontend
npm run build

# Verify build output
ls dist/

# Deploy
git add .
git commit -m "Fix: Add cache-busting for incidents API"
git push origin main
```

Vercel will auto-deploy. Changes take effect immediately.

## Monitoring

After deployment, check:

1. Vercel deployment logs for successful build
2. Browser DevTools Network tab for `?t=` parameter
3. Console logs for incident count
4. Application behavior with fresh data

## Related Documentation

- [MDN: Fetch API Cache](https://developer.mozilla.org/en-US/docs/Web/API/Request/cache)
- [MDN: Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
- [Vercel Edge Caching](https://vercel.com/docs/edge-network/caching)
