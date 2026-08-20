# React Runtime Crash Fix

## Problem

Selecting certain historical incidents caused a full React white screen crash with:
```
Uncaught TypeError: Cannot read properties of undefined (reading 'toFixed')
```

Root causes:
1. Missing or malformed timeline data in `incidents.json`
2. Unsafe `.toFixed()` calls on undefined/null values
3. Direct property access without optional chaining (`incident.property` instead of `incident?.property`)
4. No error boundary to catch runtime errors gracefully

## Fixes Applied

### 1. Fixed `.toFixed()` Calls with Safe Fallbacks

**HeroCards.tsx:**
```typescript
// Before (UNSAFE)
Announced at {currentIncident.actual_announcement_time.toFixed(1)}:00

// After (SAFE)
Announced at {typeof currentIncident.actual_announcement_time === 'number' 
  ? currentIncident.actual_announcement_time.toFixed(1) 
  : (Number(currentIncident.actual_announcement_time) || 0).toFixed(1)}:00
```

**LiveSystemTelemetry.tsx:**
```typescript
// Before (UNSAFE)
{commuteDensity.toFixed(2)}

// After (SAFE)
{typeof commuteDensity === 'number' 
  ? commuteDensity.toFixed(2) 
  : (Number(commuteDensity) || 0).toFixed(2)}
```

### 2. Added Optional Chaining Throughout App.tsx

**Timeline Access:**
```typescript
// Before (UNSAFE)
const timeline = currentIncident.hourly_timeline[timelineKey];
console.error('[App] Available keys:', Object.keys(currentIncident.hourly_timeline));

// After (SAFE)
const timeline = currentIncident?.hourly_timeline?.[timelineKey];
console.error('[App] Available keys:', currentIncident?.hourly_timeline ? Object.keys(currentIncident.hourly_timeline) : 'No timeline data');
```

**Timeline Key Generation:**
```typescript
// Before (UNSAFE)
const timelineKey = Math.floor(currentHour).toFixed(1);

// After (SAFE)
const timelineKey = Number.isFinite(currentHour) ? Math.floor(currentHour).toFixed(1) : "3.0";
```

**Prediction Request:**
```typescript
// Before (UNSAFE)
const request = {
  current_hour: currentHour,
  flood_active: timeline.flood_active,
  pagasa_warning_red: timeline.pagasa_warning === "RED",
};

// After (SAFE)
const request = {
  current_hour: Number.isFinite(currentHour) ? currentHour : 3.0,
  flood_active: timeline?.flood_active ?? false,
  pagasa_warning_red: timeline?.pagasa_warning === "RED",
};
```

**Component State Variables:**
```typescript
// Before (UNSAFE)
const currentTimeline = currentIncident?.hourly_timeline[timelineKey];
const simulatedStranded = currentTimeline?.simulated_stranded_projection || 0;
const pagasaWarning: PagasaLevel = currentTimeline?.pagasa_warning || "NONE";

// After (SAFE)
const currentTimeline = currentIncident?.hourly_timeline?.[timelineKey];
const simulatedStranded = currentTimeline?.simulated_stranded_projection ?? 0;
const pagasaWarning: PagasaLevel = currentTimeline?.pagasa_warning ?? "NONE";
```

**Announcement Time:**
```typescript
// Before (UNSAFE)
const announcementStep = currentIncident 
  ? HOUR_STEPS.findIndex(h => (h.hour + h.minute / 60) === currentIncident.actual_announcement_time)
  : -1;

// After (SAFE)
const announcementStep = currentIncident 
  ? HOUR_STEPS.findIndex(h => (h.hour + h.minute / 60) === (currentIncident.actual_announcement_time ?? -1))
  : -1;
```

### 3. Added React Error Boundary

**Created:** `frontend/src/components/ErrorBoundary.tsx`

A class component that catches unhandled React errors and displays a user-friendly error screen instead of a white screen.

**Features:**
- Catches all React component errors
- Displays error message and component stack trace
- Provides "Reload Application" and "Try Again" buttons
- Shows common causes and troubleshooting hints
- Logs detailed error info to console for debugging

**Integrated in main.tsx:**
```typescript
import ErrorBoundary from './components/ErrorBoundary'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
```

## Pattern Reference

### Safe Numeric Formatting

**Always use this pattern:**
```typescript
typeof value === 'number' 
  ? value.toFixed(n) 
  : (Number(value) || 0).toFixed(n)
```

### Safe Property Access

**Always use this pattern:**
```typescript
// Object property access
const value = obj?.property ?? defaultValue

// Nested access
const value = obj?.nested?.property ?? defaultValue

// Array/object with computed keys
const value = obj?.array?.[key] ?? defaultValue

// Method calls
const result = obj?.method?.() ?? defaultValue
```

### Safe Numeric Operations

**Always validate before math operations:**
```typescript
// Before arithmetic
const result = Number.isFinite(value) ? value * 2 : 0

// Before Math.floor/ceil/round
const key = Number.isFinite(hour) ? Math.floor(hour).toFixed(1) : "0.0"

// Before comparisons
const isValid = typeof value === 'number' && value > threshold
```

## Nullish Coalescing vs Logical OR

**Use `??` (nullish coalescing) instead of `||` when `0` or `false` are valid values:**

```typescript
// WRONG - treats 0 as falsy
const stranded = timeline?.projection || 1000  // Returns 1000 if projection is 0

// RIGHT - only checks null/undefined
const stranded = timeline?.projection ?? 1000  // Returns 0 if projection is 0
```

## Error Boundary Behavior

**What it catches:**
- Render errors
- Lifecycle method errors
- Constructor errors in child components

**What it DOESN'T catch:**
- Event handler errors (use try-catch)
- Async code errors (use try-catch)
- Server-side rendering errors
- Errors in the Error Boundary itself

## Testing the Fixes

### 1. Test with Malformed Incident Data

Create an incident in `incidents.json` with missing properties:
```json
{
  "id": "test-broken",
  "name": "Broken Test Case",
  "hourly_timeline": {
    "6.0": {
      "pagasa_warning": "RED"
      // Missing: flood_active, simulated_stranded_projection
    }
  }
  // Missing: actual_announcement_time, actual_action_code
}
```

Expected behavior:
- No crash
- Fallback values used (0 for stranded, false for flood_active)
- App remains functional

### 2. Test Error Boundary

Force an error in a component:
```typescript
// Temporarily add to any component
throw new Error("Test error boundary");
```

Expected behavior:
- Error boundary catches it
- User sees friendly error screen (not white screen)
- Can reload or retry
- Console shows detailed error

### 3. Test Timeline Edge Cases

Test incidents with:
- Missing timeline keys
- Invalid hour values (NaN, Infinity)
- Null/undefined properties
- Empty hourly_timeline object

## Files Modified

1. `frontend/src/components/HeroCards.tsx` - Safe `.toFixed()` calls, optional chaining
2. `frontend/src/components/LiveSystemTelemetry.tsx` - Safe `.toFixed()` call
3. `frontend/src/App.tsx` - Comprehensive optional chaining and fallbacks
4. `frontend/src/components/ErrorBoundary.tsx` - NEW: Error boundary component
5. `frontend/src/main.tsx` - Wrap App in ErrorBoundary

## Prevention Guidelines

**When writing new code:**

1. Always use optional chaining for object property access
2. Always validate numbers before `.toFixed()`, `Math.*`, or arithmetic
3. Use nullish coalescing (`??`) for default values
4. Add type guards for runtime validation
5. Test with missing/malformed data
6. Check console for TypeScript warnings

**Code review checklist:**
- [ ] No direct property access on potentially undefined objects
- [ ] All `.toFixed()` calls have type checks
- [ ] All array/object bracket access uses optional chaining
- [ ] All Math operations validate input
- [ ] Default values provided for all optional data
- [ ] Error boundary wraps risky components

## Future Improvements

Consider adding:

1. **Runtime schema validation** with Zod or Yup:
   ```typescript
   const IncidentSchema = z.object({
     id: z.string(),
     name: z.string(),
     actual_announcement_time: z.number(),
     hourly_timeline: z.record(z.object({
       pagasa_warning: z.enum(["NONE", "YELLOW", "ORANGE", "RED"]),
       flood_active: z.boolean(),
       simulated_stranded_projection: z.number(),
     }))
   });
   ```

2. **Per-component error boundaries** for isolated failures:
   ```typescript
   <ErrorBoundary fallback={<CardErrorState />}>
     <HeroCards {...props} />
   </ErrorBoundary>
   ```

3. **Sentry or error tracking** for production monitoring

4. **Backend data validation** to ensure incidents.json is always well-formed

## Deployment

No special deployment steps required. Changes are client-side only.

```bash
# Test locally
cd frontend
npm run dev

# Build for production
npm run build

# Deploy to Vercel
git add .
git commit -m "Fix: Add optional chaining and Error Boundary to prevent crashes"
git push origin main
```

Vercel will auto-deploy the updated frontend.
