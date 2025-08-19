# 🔧 Template Image Upload Diagnostic Guide

Based on my analysis of your codebase, here are the most likely issues and solutions for your template image upload not working:

## 🎯 **Most Likely Issues**

### 1. **Image Cropping Function Errors**
**Location**: `src/lib/utils/imageCropper.ts`

**Potential Issues**:
- Canvas context creation failing
- Invalid crop area calculations
- File conversion to blob failing

**Debug Steps**:
```javascript
// Run in browser console on template page
console.log('Testing image cropping...');

// Check if functions are available
if (typeof cropBackgroundImage === 'undefined') {
    console.error('❌ cropBackgroundImage not loaded');
} else {
    console.log('✅ cropBackgroundImage available');
}

// Test with a simple image
async function testCropping() {
    try {
        // Create test file
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 400, 300);
        
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const testFile = new File([blob], 'test.png', { type: 'image/png' });
        
        console.log('📷 Created test file:', testFile.size, 'bytes');
        
        const result = await cropBackgroundImage(
            testFile,
            { width: 200, height: 150 },
            { x: 0, y: 0, scale: 1 }
        );
        
        console.log('✅ Cropping success:', result);
        return result;
        
    } catch (error) {
        console.error('❌ Cropping failed:', error);
        return null;
    }
}

testCropping();
```

### 2. **Supabase Storage Upload Issues**
**Location**: `src/lib/database.ts` and `src/lib/utils/supabase.ts`

**Check Supabase Storage**:
```javascript
// Test Supabase upload
async function testSupabaseUpload() {
    try {
        // Create a small test file
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'blue';
        ctx.fillRect(0, 0, 100, 100);
        
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const testFile = new File([blob], 'upload-test.png', { type: 'image/png' });
        
        // Test upload using your uploadImage function
        if (typeof uploadImage !== 'undefined') {
            const url = await uploadImage(testFile, 'test', 'user123');
            console.log('✅ Upload successful:', url);
        } else {
            console.error('❌ uploadImage function not available');
        }
        
    } catch (error) {
        console.error('❌ Upload failed:', error.message);
        console.error('Full error:', error);
    }
}

testSupabaseUpload();
```

### 3. **Template Save Process Issues**
**Location**: `src/routes/templates/+page.svelte` lines 133-405

**Common Problems**:
- `uploadImage()` function throwing errors
- File processing taking too long
- Network issues during upload
- Invalid image URLs being generated

**Debug the Save Process**:
```javascript
// Monitor the save process
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = function(...args) {
    if (args[0]?.includes('🖼️') || args[0]?.includes('✅') || args[0]?.includes('❌')) {
        originalConsoleLog.apply(console, ['[TEMPLATE SAVE]', ...args]);
    } else {
        originalConsoleLog.apply(console, args);
    }
};

console.error = function(...args) {
    originalConsoleError.apply(console, ['[TEMPLATE ERROR]', ...args]);
};

// Now try saving a template and watch the logs
```

## 🔧 **Quick Fixes to Try**

### Fix 1: Add Error Boundaries to Image Processing
```typescript
// In imageCropper.ts, wrap the canvas operations
export async function cropBackgroundImage(...) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
            try {
                console.log('🖼️ Image loaded:', img.width, 'x', img.height);
                
                // Validate image dimensions
                if (img.width <= 0 || img.height <= 0) {
                    throw new Error('Invalid image dimensions');
                }
                
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d', { alpha: false });
                
                if (!ctx) {
                    throw new Error('Failed to get 2D context');
                }
                
                console.log('✅ Canvas context created');
                // ... rest of the cropping logic
                
            } catch (error) {
                console.error('❌ Cropping error:', error);
                reject(error);
            }
        };
        
        img.onerror = (error) => {
            console.error('❌ Image load error:', error);
            reject(new Error('Failed to load image'));
        };
        
        img.src = URL.createObjectURL(imageFile);
    });
}
```

### Fix 2: Add Retry Logic to Uploads
```typescript
// In database.ts
export async function uploadImageWithRetry(file: File, path: string, userId?: string, retries = 3): Promise<string> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`🔄 Upload attempt ${attempt}/${retries}:`, file.name);
            return await uploadImage(file, path, userId);
        } catch (error) {
            console.error(`❌ Upload attempt ${attempt} failed:`, error);
            if (attempt === retries) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        }
    }
}
```

### Fix 3: Validate File Before Processing
```typescript
// Add validation before cropping
function validateImageFile(file: File): boolean {
    // Check file type
    if (!file.type.startsWith('image/')) {
        console.error('❌ Invalid file type:', file.type);
        return false;
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        console.error('❌ File too large:', file.size, 'bytes');
        return false;
    }
    
    console.log('✅ File validation passed:', file.name, file.size, 'bytes');
    return true;
}
```

## 🕵️ **Debugging Steps**

### Step 1: Check Browser Console
1. Open template creation page
2. Open browser DevTools (F12)
3. Go to Console tab
4. Try creating a template with images
5. Look for error messages

### Step 2: Check Network Tab
1. In DevTools, go to Network tab
2. Try saving template
3. Look for failed uploads (red entries)
4. Check response codes and error messages

### Step 3: Check Supabase Dashboard
1. Go to your Supabase dashboard
2. Check Storage → `templates` bucket
3. See if images are being uploaded
4. Check Database → `templates` table for saved records

## 🚨 **Common Error Patterns**

### Error: "Failed to get canvas context"
**Cause**: Browser canvas limitations or memory issues
**Fix**: Add context creation validation and fallbacks

### Error: "Upload failed" or network errors
**Cause**: Supabase connection issues or bucket permissions
**Fix**: Check Supabase storage policies and network connectivity

### Error: "Invalid crop area calculated"
**Cause**: Mathematical errors in coordinate calculations
**Fix**: Add bounds checking and validation

### Error: Template saves without images
**Cause**: Upload promises not being awaited properly
**Fix**: Ensure all async operations complete before saving

## 🎯 **Most Likely Solution**

Based on common patterns, the issue is probably:

1. **Canvas context creation failing** - Add error handling in `cropBackgroundImage()`
2. **Async/await timing issues** - Make sure uploads complete before saving template
3. **File validation issues** - Add proper file type and size validation
4. **Supabase storage permissions** - Check bucket policies allow uploads

Try the debugging steps above and let me know what errors you see!
