# Spec-30-Aug20-PROFILE-ICON-CIRCULAR-DISPLAY-FIX

## Step 1 – Requirement Extraction

**Primary Requirements:**

- Profile icon in header must display as a perfect circle
- Add placeholder profile picture when no user image is available
- Ensure consistent circular display across all screen sizes
- Maintain current functionality while improving visual presentation

## Step 2 – Context Awareness

**Technology Stack:**

- Svelte 5 + SvelteKit framework
- TailwindCSS 4.x for styling
- shadcn-svelte UI component library with existing Avatar components
- Current implementation uses text initials on colored background

**Current Implementation Analysis:**

- Located in `src/lib/components/MobileHeader.svelte:121-125`
- Uses simple div with `bg-primary rounded-full` classes
- Displays user initials as fallback (lines 16-19, 124)
- No actual image handling or avatar component usage

## Step 3 – Spec Expansion

### **Data Flow:**

1. **Input**: User object with potential `avatar_url` or `profile_picture` field
2. **Processing**: Check for existing profile image, fallback to placeholder, then initials
3. **Output**: Circular avatar display with proper aspect ratio

### **State Handling:**

- No new Svelte stores required
- Props remain unchanged (`user` object)
- Image loading states handled by shadcn-svelte Avatar component

### **Function-level Behavior:**

- **Image Loading**: Handle failed image loads gracefully
- **Fallback Chain**: Profile image → Placeholder → User initials
- **Error Handling**: Network failures, missing images, invalid URLs
- **Edge Cases**: Empty user object, missing email for initials

### **UI Implications:**

- Replace current div-based avatar with proper Avatar component
- Ensure 32px (w-8 h-8) size consistency
- Maintain white text on primary background for initials
- Add default placeholder image (generic user silhouette)

### **UX Implications:**

- Smoother visual experience with proper image loading
- Professional appearance with placeholder instead of just initials
- Consistent circular shape regardless of source image aspect ratio

### **Database & API Integration:**

- **Potential Supabase Schema Addition**: `profiles.avatar_url` field
- **Storage Integration**: Supabase Storage for profile image uploads
- **Query Updates**: Include avatar_url in user data fetching
- **Migration**: Add avatar_url column to profiles table

### **Dependencies:**

- Existing shadcn-svelte Avatar components (`src/lib/components/ui/avatar/`)
- Placeholder image asset (SVG or small PNG)
- Potential Supabase Storage integration for future uploads

## Step 4 – Implementation Guidance

### **High-level Code Strategy:**

1. **Replace Current Implementation**:
   - Import shadcn-svelte Avatar components in MobileHeader.svelte
   - Replace lines 121-125 with proper Avatar structure
   - Maintain same size (32px) and styling approach

2. **Component Structure**:

   ```svelte
   <Avatar class="h-8 w-8">
   	<AvatarImage src={user?.avatar_url} alt={user?.email} />
   	<AvatarFallback>
   		<!-- Placeholder image or initials -->
   	</AvatarFallback>
   </Avatar>
   ```

3. **Fallback Strategy**:
   - Primary: `user.avatar_url` if available
   - Secondary: Default placeholder image (user silhouette)
   - Tertiary: Current initials system

4. **Files Affected**:
   - `src/lib/components/MobileHeader.svelte` (primary changes)
   - `static/` folder for placeholder image asset
   - Potential database migration for avatar_url field

### **Best Practices**:

- **Performance**: Use optimized placeholder image (SVG preferred)
- **Accessibility**: Proper alt text for screen readers
- **Error Handling**: Graceful degradation if images fail to load
- **Maintainability**: Reusable avatar logic for other components

### **Assumptions**:

- User profile pictures will be stored in Supabase Storage
- Avatar uploads are future enhancement (not immediate requirement)
- Current user object structure remains unchanged for now
- 32px size requirement matches current design

## Step 5 – Output Checklist

✅ **Checklist:**

1. **UI Changes (Complexity: 3/10)** – Replace div-based avatar with shadcn Avatar component, add placeholder image
2. **UX Changes (Complexity: 2/10)** – Minor improvement to visual consistency and professional appearance
3. **Data Handling (Complexity: 5/10)** – Potential database schema addition for avatar_url field, Supabase Storage integration
4. **Function Logic (Complexity: 2/10)** – Simple fallback chain logic, minimal business logic changes
5. **ID/Key Consistency (Complexity: 1/10)** – No ID/key changes required, maintains existing user identification

### **Implementation Priority:**

1. **Immediate (Low Complexity)**: Replace with Avatar component + placeholder
2. **Future Enhancement**: Database integration for actual profile picture uploads

### **Breaking Changes**: None - maintains full backward compatibility
