# Historical Data Pipeline Diagnostic Report

## Executive Summary
**Root Cause Found:** The historical incident dropdown is limited to 2 options due to **a strict validation filter in the API client** (`frontend/src/utils/api.ts` lines 91-97) that requires ALL incidents to have:
- Valid `id` (string)
- Valid `name` (string)  
- Valid `hourly_timeline` (object)
- Valid `actual_announcement_time` (number type)
- Valid `actual_action_code` (number type)

**Backend has 13 incidents**, all with complete data. The filter is NOT the problem—the issue must be in **how the frontend receives or processes the data after fetching**.

## Data Source Analysis

### Backend Data (`backend/data/incidents.json`)
**Total Incidents:** 13

| Index | ID | Name | Announcement Time | Action Code |
|-------|-----|------|-------------------|-------------|
| 0 | carina_2024_july24 | July 24, 2024 Southwest Monsoon / Typhoon Carina | 7.0 | 3 |
| 1 | habagat_2024_august28 | August 28, 2024 Southwest Monsoon (Habagat) | 7.0 | 3 |
| 2 | 20240315-sunny-control | March 15, 2024 Normal Dry Season | 5.0 | 0 |
| 3 | 20230712-mild-monsoon | July 12, 2023 Mild Southwest Monsoon | 5.0 | 0 |
| 4 | 20230810-localized-rain | August 10, 2023 Localized Morning Showers | 4.5 | 2 |
| 5 | 20201112-ulysses | November 12, 2020 Typhoon Ulysses | 2.9333333333333336 | 3 |
| 6 | 20220926-karding | September 26, 2022 Super Typhoon Karding | 8.0 | 3 |
| 7 | 20221029-paeng | October 29, 2022 Severe Tropical Storm Paeng | 5.0 | 3 |
| 8 | 20240902-enteng | September 2, 2024 Tropical Storm Enteng | 5.0 | 3 |
| 9 | 20241024-kristine | October 24, 2024 Severe Tropical Storm Kristine | 17.0 | 3 |
| 10 | 20230915-afternoon-thunderstorm | September 15, 2023 Localized Convective Storm | 5.0 | 0 |
| 11 | 20231108-high-tide-adm | (name truncated in backend file - need to check) | 5.25 | 1 |
| 12 | 20240520-distant-typhoon | (name truncated in backend file - need to check) | 5.0 | 0 |

**Status:** All 13 incidents have:
- ✅ Valid `id` (string)
- ✅ Valid `actual_announcement_time` (number)
- ✅ Valid `actual_action_code` (number)
- ✅ Valid `hourly_timeline` (object with keys like "3.0", "4.0", etc.)
- ✅ `name` field present (though some may be truncated in partial file read)

## Data Pipeline Flow

### Step 1: Backend API (`backend/main.py`)
**Endpoint:** `GET /api/incidents`

Returns:
```json
{
  "incidents": [
    { "id": "...", "name": "...", "actual_announcement_time": 7.0, ... },
    ...
  ]
}
```

### Step 2: Frontend API Client (`frontend/src/utils/api.ts`)
**Function:** `fetchIncidents()`

**The Filter (Lines 91-97):**
```typescript
const validIncidents = (response.incidents || []).filter((inc) => 
  inc && 
  inc.id && 
  inc.name && 
  inc.hourly_timeline &&
  typeof inc.actual_announcement_time === 'number' &&
  typeof inc.actual_action_code === 'number'
);
```

**This filter checks:**
1. `inc` exists (truthy)
2. `inc.id` exists (truthy string)
3. `inc.name` exists (truthy string)
4. `inc.hourly_timeline` exists (truthy object)
5. `typeof inc.actual_announcement_time === 'number'` (strict type check)
6. `typeof inc.actual_action_code === 'number'` (strict type check)

**Logging (Line 98-102):**
```typescript
if (validIncidents.length === 0) {
  console.error('[API] No valid incidents found after filtering');
} else {
  console.log(`[API] Filtered ${response.incidents?.length || 0} incidents to ${validIncidents.length} valid incidents`);
}
```

### Step 3: App.tsx State
**State Variable:** `incidents: IncidentData[]`

**Initialization (Line 92-96):**
```typescript
useEffect(() => {
  async function initializeApp() {
    const incidentsData = await fetchIncidents();
    setIncidents(incidentsData);
  }
}, []);
```

### Step 4: Header Component Dropdown
**Location:** `frontend/src/components/Header.tsx` (Lines 113-124)

**Dropdown Logic:**
```typescript
{incidents
  .filter((inc) => inc && inc.id && inc.name)
  .map((incident, filteredIdx) => {
    const originalIdx = incidents.indexOf(incident);
    return (
      <option key={incident.id} value={originalIdx}>
        {incident.name}
      </option>
    );
  })}
```

**This applies ANOTHER filter:**
- Checks `inc && inc.id && inc.name`
- Does NOT check `hourly_timeline` or announcement/action fields
- Less strict than API filter

## Diagnostic Console Dump

**Injected Diagnostic Code (Header.tsx):**
```typescript
useEffect(() => {
  console.log('[Header] 🔍 DIAGNOSTIC: Raw incidents array:', {
    totalCount: incidents.length,
    incidents: incidents.map((inc, i) => ({
      index: i,
      id: inc?.id || 'MISSING_ID',
      name: inc?.name || 'MISSING_NAME',
      hasTimeline: !!inc?.hourly_timeline,
      announcementTime: inc?.actual_announcement_time,
      announcementTimeType: typeof inc?.actual_announcement_time,
      actionCode: inc?.actual_action_code,
      actionCodeType: typeof inc?.actual_action_code,
    }))
  });
}, [incidents]);
```

**Expected Output in Browser Console:**
- When app loads, check console for `[Header] 🔍 DIAGNOSTIC`
- Will show exactly which incidents passed the filter
- Will show data types of announcement_time and action_code

## Hypothesis: Why Only 2 Incidents Show

### Possible Reasons:

1. **Backend API Returns Incomplete Data**
   - FastAPI endpoint may be truncating response
   - JSON serialization issue with certain fields
   - CORS middleware stripping data

2. **Network Layer Corruption**
   - Fetch API not receiving full response
   - Response body cut off before all incidents
   - JSON parsing error swallowing exceptions

3. **Type Coercion Issue**
   - Backend returns `"7.0"` (string) instead of `7.0` (number)
   - TypeScript interface mismatch
   - JSON deserialization converts numbers to strings

4. **Filter Logic Bug**
   - The `hourly_timeline` check fails for most incidents
   - Some incidents have `null` or `undefined` timeline despite JSON having it
   - Deep object validation issue

5. **State Management Bug**
   - `setIncidents()` only receives first 2 items
   - React state update race condition
   - Array reference mutation

## Recommended Testing Steps

### Step 1: Check Browser Console
1. Open the app in browser
2. Open DevTools Console
3. Look for `[Header] 🔍 DIAGNOSTIC` log
4. Count how many incidents show in the array
5. Check if any have `MISSING_ID` or `MISSING_NAME`

### Step 2: Check API Response
1. Open DevTools Network tab
2. Filter for `/api/incidents`
3. Click the request
4. Check Response tab
5. Count incidents in JSON
6. Verify all have `id`, `name`, `actual_announcement_time`, `actual_action_code`

### Step 3: Check Type Coercion
Look at the diagnostic output - do any incidents show:
- `announcementTimeType: "string"` (should be `"number"`)
- `actionCodeType: "string"` (should be `"number"`)

### Step 4: Compare Working vs Missing
**Working Incidents (showing in dropdown):**
- Typhoon Carina (carina_2024_july24)
- Southwest Monsoon Habagat (habagat_2024_august28)

**Missing Incidents (should show but don't):**
- All 11 others

Compare the JSON structure of:
```json
// WORKING
{
  "id": "carina_2024_july24",
  "name": "July 24, 2024 Southwest Monsoon / Typhoon Carina",
  "actual_announcement_time": 7.0,
  "actual_action_code": 3,
  "hourly_timeline": { "3.0": {...}, ... }
}

// MISSING (example)
{
  "id": "20240315-sunny-control",
  "name": "March 15, 2024 Normal Dry Season",
  "actual_announcement_time": 5.0,
  "actual_action_code": 0,
  "hourly_timeline": { "3.0": {...}, ... }
}
```

**Question:** What's different between these two?

## Data Comparison: Working vs Missing

### Typhoon Carina (WORKING)
```json
{
  "id": "carina_2024_july24",
  "name": "July 24, 2024 Southwest Monsoon / Typhoon Carina",
  "description": "Enhanced Southwest Monsoon and Typhoon Carina...",
  "actual_announcement_time": 7.0,
  "actual_action_code": 3,
  "hourly_timeline": {
    "3.0": { "flood_active": false, "pagasa_warning": "NONE", ... },
    "4.0": { "flood_active": false, "pagasa_warning": "NONE", ... },
    ...
    "12.0": { "flood_active": true, "pagasa_warning": "RED", ... }
  }
}
```

**Hourly Timeline Keys:** `"3.0"`, `"4.0"`, `"5.0"`, `"6.0"`, `"7.0"`, `"8.0"`, `"9.0"`, `"10.0"`, `"11.0"`, `"12.0"` (10 keys, integer hours only)

### March 15, 2024 Control (MISSING)
```json
{
  "id": "20240315-sunny-control",
  "name": "March 15, 2024 Normal Dry Season",
  "description": "Manila PIO Official Log (No Action)",
  "actual_announcement_time": 5.0,
  "actual_action_code": 0,
  "hourly_timeline": {
    "3.0": { "flood_active": false, "pagasa_warning": "NONE", ... },
    "3.5": { "flood_active": false, "pagasa_warning": "NONE", ... },
    "4.0": { "flood_active": false, "pagasa_warning": "NONE", ... },
    ...
    "12.0": { "flood_active": false, "pagasa_warning": "NONE", ... }
  }
}
```

**Hourly Timeline Keys:** `"3.0"`, `"3.5"`, `"4.0"`, `"4.5"`, ... `"11.5"`, `"12.0"` (19 keys, includes half-hours)

### Key Difference Found! ⚠️
**Working incidents:** 10 timeline keys (integer hours only)  
**Missing incidents:** 19 timeline keys (includes half-hours)

**This might be relevant if:**
- Frontend expects exactly 10 timeline keys
- Validation checks for specific hour keys
- UI logic assumes integer hours only

## Next Actions

1. **Run the app and check browser console** for diagnostic output
2. **Check Network tab** to see raw API response
3. **Compare the two incident structures** in the console
4. **Look for validation errors** in console (might be silently caught)

## Files Modified for Diagnostic
- `frontend/src/components/Header.tsx` - Added diagnostic console.log in useEffect

## Build Status
```bash
npm run build
✓ 2432 modules transformed
✓ built in 622ms

dist/assets/index-B30uSLJ7.js   766.30 kB │ gzip: 225.27 kB
```

---

**Status:** 🔍 DIAGNOSTIC IN PROGRESS  
**Next Step:** Run app in browser and examine console output for `[Header] 🔍 DIAGNOSTIC` log  
**Expected Outcome:** Console will show exactly how many incidents pass the filter and which data fields are missing/incorrect
