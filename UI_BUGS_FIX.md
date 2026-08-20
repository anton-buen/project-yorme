# UI Bugs Fix - Blank Screen and Dropdown

## Problems

### 1. Blank Screen Below Header
Child components unmounted when encountering undefined or missing timeline properties, causing the entire main content area to disappear (white space below header).

### 2. Blank Dropdown Option
An empty option appeared in the incident dropdown between valid entries, likely due to filtering issues or index mismatches after filtering.

## Fixes Applied

### 1. Fixed Component Unmounting (Blank Screen)

**App.tsx - Added Incident Validation:**
```typescript
const currentIncident = incidents[incidentIdx];

// Early return if incident is invalid
if (!currentIncident) {
  return <LoadingScreen stage="complete" error="Invalid incident selection. Please select a valid incident." />;
}
```

**App.tsx - Safe Timeline Fallback:**
```typescript
// Before (UNSAFE - could be undefined)
const currentTimeline = currentIncident?.hourly_timeline?.[timelineKey];

// After (SAFE - always has a valid object)
const currentTimeline = currentIncident?.hourly_timeline?.[timelineKey] ?? {
  pagasa_warning: "NONE" as PagasaLevel,
  flood_active: false,
  simulated_stranded_projection: 0
};
```

**App.tsx - Safe Numeric Access:**
```typescript
// Before (UNSAFE)
const simulatedStranded = currentTimeline?.simulated_stranded_projection ?? 0;

// After (SAFE with type check)
const simulatedStranded = typeof currentTimeline?.simulated_stranded_projection === 'number' 
  ? currentTimeline.simulated_stranded_projection 
  : 0;
```

**Result:** Components now always receive valid data structures, preventing unmount due to undefined access.

### 2. Fixed Blank Dropdown Option

**api.ts - Filter at API Layer:**
```typescript
export async function fetchIncidents(): Promise<IncidentData[]> {
  const response = await fetchApi<{ incidents: IncidentData[] }>('/api/incidents');
  
  // Filter out invalid incidents at the API layer
  const validIncidents = (response.incidents || []).filter((inc) => 
    inc && 
    inc.id && 
    inc.name && 
    inc.hourly_timeline &&
    typeof inc.actual_announcement_time === 'number' &&
    typeof inc.actual_action_code === 'number'
  );
  
  if (validIncidents.length === 0) {
    console.error('[API] No valid incidents found after filtering');
  } else {
    console.log(`[API] Filtered ${response.incidents?.length || 0} incidents to ${validIncidents.length} valid incidents`);
  }
  
  return validIncidents;
}
```

**Header.tsx - Safe Dropdown Rendering with Index Mapping:**
```typescript
{incidents
  .filter((inc) => inc && inc.id && inc.name)
  .map((incident, filteredIdx) => {
    // Use original index to prevent mismatch
    const originalIdx = incidents.indexOf(incident);
    return (
      <option key={incident.id} value={originalIdx}>
        {incident.name}
      </option>
    );
  })}
```

**Why Index Mapping:**
- When filtering an array, the filtered indices don't match original indices
- Example: If incident at index 5 is invalid, filtered array shifts all subsequent indices down by 1
- Using `incidents.indexOf(incident)` preserves the original index so `incidentIdx` state matches correctly

**Result:** No blank dropdown options, all options render correctly with proper index mapping.

## Additional Safety Measures

### Data Validation Rules

All incidents must have:
1. `id` (string, non-empty)
2. `name` (string, non-empty)
3. `hourly_timeline` (object with timeline keys)
4. `actual_announcement_time` (number)
5. `actual_action_code` (number, 0-4)

### Timeline Default Object

When timeline key is missing, fallback to:
```typescript
{
  pagasa_warning: "NONE",
  flood_active: false,
  simulated_stranded_projection: 0
}
```

This ensures components always receive valid data structures.

### Component Guard Pattern

**Always validate critical data before rendering:**
```typescript
// Early return pattern
if (!criticalData) {
  return <ErrorFallback />;
}

// Continue with render...
```

## Testing the Fixes

### Test 1: Missing Timeline Key

1. Open App in Historical mode
2. Scrub to a time not in `hourly_timeline`
3. Expected: Fallback values used, no crash, no blank screen

### Test 2: Invalid Incident Selection

1. Manually set `incidentIdx` to out-of-range value
2. Expected: Error screen shows, no blank screen

### Test 3: Dropdown Rendering

1. Check dropdown in Header
2. Expected: 13 valid options, no blank entries
3. All indices should map correctly when selected

### Test 4: Backend Returns Partial Data

Mock API to return:
```json
{
  "incidents": [
    { "id": "1", "name": "Valid" },
    null,
    { "id": "2" }, // Missing name
    { "id": "3", "name": "Also Valid" }
  ]
}
```

Expected:
- API filters to 2 valid incidents
- Dropdown shows only 2 options
- No blank entries
- No crashes

## Files Modified

1. `frontend/src/App.tsx`
   - Added incident validation guard
   - Safe timeline fallback with default object
   - Type-safe numeric access

2. `frontend/src/components/Header.tsx`
   - Filter + original index mapping for dropdown
   - Prevents blank options from index mismatches

3. `frontend/src/utils/api.ts`
   - API-layer validation and filtering
   - Logs validation results for debugging
   - Returns only valid, complete incidents

## Root Cause Analysis

### Blank Screen Issue

**Cause:** React components attempt to render with `undefined` data, leading to:
1. `.toFixed()` called on undefined → TypeError
2. Component throws error
3. Without Error Boundary in specific subtree → React unmounts component
4. Parent grid tries to render → finds child unmounted → shows blank space

**Fix:** Ensure all data has valid fallbacks so components never receive undefined values.

### Blank Dropdown Issue

**Cause:** Two possible scenarios:
1. Backend returned null/malformed entry in incidents array
2. Filtering in render created index mismatch between filtered array and state

**Example of index mismatch:**
```typescript
// Original array indices: [0, 1, 2, 3, 4]
// After filtering: [0, 1, 3, 4] (index 2 removed)
// Using filtered index: maps to wrong incident
// Selected index 2 → points to original index 3
```

**Fix:** 
- Filter at API layer (prevents null entries)
- Use `incidents.indexOf(incident)` to preserve original indices
- Double-filter in Header as defensive programming

## Prevention Guidelines

### When Adding New Components

1. **Always provide fallbacks:**
   ```typescript
   const value = data?.property ?? defaultValue
   ```

2. **Validate before numeric operations:**
   ```typescript
   typeof value === 'number' ? value.toFixed(2) : '0.00'
   ```

3. **Use default objects for complex data:**
   ```typescript
   const timeline = data?.timeline ?? { default: 'structure' }
   ```

4. **Add guards for critical paths:**
   ```typescript
   if (!requiredData) return <Fallback />;
   ```

### When Adding New API Endpoints

1. **Validate response structure:**
   ```typescript
   if (!response.data || !Array.isArray(response.data)) {
     throw new ApiError('Invalid response format');
   }
   ```

2. **Filter invalid entries:**
   ```typescript
   return response.data.filter(isValid);
   ```

3. **Log validation results:**
   ```typescript
   console.log(`Filtered ${raw} to ${valid} valid items`);
   ```

## Deployment

No special deployment steps required. Changes are client-side only.

```bash
# Test locally
cd frontend
npm run dev

# Verify fixes
# - Check dropdown has no blank options
# - Scrub timeline to all hours
# - Switch between all incidents
# - No blank screens should appear

# Build and deploy
npm run build
git add .
git commit -m "Fix: Prevent blank screen and clean dropdown with validation"
git push origin main
```

## Related Issues

These fixes complement the earlier React crash fixes (REACT_CRASH_FIX.md):
- Error Boundary catches unhandled errors
- Optional chaining prevents undefined access
- These fixes add fallback objects and validation layers
- Together, they create defense-in-depth for data integrity
