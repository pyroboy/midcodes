# HMR Troubleshooting Guide

## Quick Fixes for Common HMR Issues

### 🚨 **Emergency Fix (Use This First)**
```bash
npm run dev:fix-hmr
```

### 🔧 **Manual Fix Steps**

1. **Kill all Node processes**:
   ```powershell
   taskkill /f /im node.exe
   ```

2. **Clean cache directories**:
   ```powershell
   Remove-Item -Recurse -Force .svelte-kit -ErrorAction SilentlyContinue
   Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
   Remove-Item -Recurse -Force build -ErrorAction SilentlyContinue
   ```

3. **Sync SvelteKit**:
   ```bash
   npx svelte-kit sync
   ```

4. **Restart dev server**:
   ```bash
   npm run dev
   ```

## Common Error Patterns

### ❌ WebSocket Connection Failed
**Error**: `WebSocket connection to 'ws://localhost:undefined' failed`

**Solution**: Fixed in `vite.config.ts` with explicit host configuration:
```typescript
server: {
  host: '127.0.0.1',
  port: 5173,
  hmr: {
    port: 5173,
    host: '127.0.0.1'
  }
}
```

### ❌ Missing Dependency Chunks
**Error**: `chunk-XXXXX.js?v=xxxxxx 404 (Not Found)`

**Solution**: 
1. Use `npm run dev:fix-hmr` 
2. Updated `optimizeDeps.exclude` in Vite config
3. Removed complex chunk splitting

### ❌ Svelte Reactivity Issues
**Error**: `Cannot read properties of undefined (reading 'call')`

**Solution**: Fixed infinite loops in `$effect()` by adding state guards:
```typescript
let propertiesInitialized = $state(false);

$effect(() => {
  if (data.properties && !propertiesInitialized) {
    // Handle promise and set flag to prevent re-runs
    propertiesInitialized = true;
  }
});
```

## Available Commands

- `npm run dev` - Normal development
- `npm run dev:clean` - Quick restart with cleanup  
- `npm run dev:fix-hmr` - Complete HMR fix (recommended)

## Key Configuration Files

### `vite.config.ts`
- Fixed WebSocket URL construction
- Simplified dependency optimization
- Removed complex chunk splitting

### `src/routes/+layout.svelte`
- Fixed Svelte 5 reactivity patterns
- Added proper state guards for effects

## Prevention Tips

1. **Use the fix script regularly** when experiencing HMR issues
2. **Avoid complex effects** that handle promises without guards
3. **Keep Vite dependencies excluded** from optimization if they cause issues
4. **Use explicit host/port configuration** to prevent WebSocket issues

## Browser Developer Tools

If you still see errors:
1. Open DevTools (F12)
2. Clear cache: Settings → Storage → Clear site data
3. Hard refresh: Ctrl+Shift+R
4. Check Network tab for failed requests

## Last Resort

If all else fails:
```bash
# Nuclear option - reinstall everything
rm -rf node_modules package-lock.json
npm install
npm run dev:fix-hmr
```

---

**Note**: These fixes address the specific issues found in this Svelte 5 + SvelteKit + Vite setup. The configuration has been optimized for this particular tech stack.
