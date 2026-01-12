# How to Run Unit Tests

## Option 1: Quick Browser Test (No Setup Required)

1. **Open the HTML test file directly in your browser:**
   ```
   Open: src/components/CountrySelect.test.html
   ```
   - Double-click the file, or
   - Right-click → Open with → Your browser
   - The tests will run automatically and show results

2. **What it tests:**
   - API response format
   - Country display logic
   - Multiple selection functionality
   - Search/filter functionality

## Option 2: Vitest Unit Tests (Recommended for Development)

### Step 1: Install Dependencies

```bash
npm install
```

This will install:
- `vitest` - Test runner
- `@testing-library/react` - React testing utilities
- `@testing-library/jest-dom` - DOM matchers
- `jsdom` - DOM environment for tests
- `@vitest/ui` - Visual test UI

### Step 2: Run Tests

**Watch mode (runs tests on file changes):**
```bash
npm test
```

**Run once:**
```bash
npm run test:run
```

**Visual UI (interactive test runner):**
```bash
npm run test:ui
```

### Step 3: Run Specific Test File

```bash
npm test CountrySelect
```

### Step 4: Run Tests with Coverage

```bash
npm test -- --coverage
```

## Test Files Location

- **React Component Tests:** `src/components/__tests__/CountrySelect.test.jsx`
- **Browser Test:** `src/components/CountrySelect.test.html`

## What the Tests Cover

### CountrySelect.test.jsx
- ✅ Renders with label
- ✅ Loads and displays countries
- ✅ Filters countries by search query
- ✅ Handles single selection
- ✅ Handles multiple selection
- ✅ Displays selected countries correctly
- ✅ Handles API errors gracefully
- ✅ Handles different country object formats

## Troubleshooting

### If tests fail to run:

1. **Make sure dependencies are installed:**
   ```bash
   npm install
   ```

2. **Check Node.js version:**
   ```bash
   node --version
   ```
   Should be Node.js 18+ for Vitest

3. **Clear cache and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **For Windows PowerShell:**
   ```powershell
   Remove-Item -Recurse -Force node_modules
   Remove-Item package-lock.json
   npm install
   ```

## Running Tests in CI/CD

Add to your CI pipeline:
```bash
npm run test:run
```

## Next Steps

After running tests, you can:
1. Add more test cases in `CountrySelect.test.jsx`
2. Create tests for `AirportAutocomplete` component
3. Add integration tests for `TravelPulse` component

