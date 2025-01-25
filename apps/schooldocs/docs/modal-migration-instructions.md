# Modal Migration Instructions

## Component Structure Changes

### 1. Flag Component Enhancements
- Add hover state information display
- Implement transition effects
- Add disabled states
- Include icon support (AlertTriangle for blocking flags)
- Enhance styling with proper color gradients

```svelte
<!-- Flag Component Example -->
<div
  class="p-3 rounded-lg border relative overflow-hidden"
  class:cursor-pointer={!disabled}
  class:bg-red-100={isSelected && type === 'blocking'}
  class:bg-red-50={!isSelected && type === 'blocking'}
  class:bg-yellow-100={isSelected && type === 'nonBlocking'}
  class:bg-yellow-50={!isSelected && type === 'nonBlocking'}
  on:mouseenter={() => (showInfo = true)}
  on:mouseleave={() => (showInfo = false)}
>
  <!-- Content structure -->
</div>
```

### 2. Layout Structure
The new layout consists of three main sections in a single column:
1. Top Section
   - Active flags display with status indicators
   - Progress tracking
   - Notes display

2. Middle Section ( 60 /40 split)
   - Main request information
     - Reference number and document type
     - Payment status and amount
     - Student details in a 2-column grid
   - Processing steps with interactive buttons
     - Step completion tracking
     - Visual indicators for current and completed steps
3. Bottom Section
   - Flag management interface
     - Flag selector with blocking/non-blocking options
     - Flag notes with character limit
     - Active flags display with remove functionality

### 3. New Features to Implement

#### Progress Tracking
- Add step completion tracking
- Implement step toggle logic
- Add visual indicators for current step
- Prevent skipping steps

#### Flag Management
- Limit to 1 blocking and 1 non-blocking flag
- Add flag notes with character limit
- Implement flag selection modal
- Add back button functionality

#### Visual Enhancements
- Add loading spinner animation
- Implement conditional border styling
- Add hover and focus states
- Include transition effects

## Styling Updates

### 1. Color Scheme
```css
/* Blocking Flags */
.blocking {
  --selected-bg: bg-red-100;
  --normal-bg: bg-red-50;
  --text: text-red-700;
  --icon: text-red-600;
  --border: border-red-300;
}

/* Non-blocking Flags */
.non-blocking {
  --selected-bg: bg-yellow-100;
  --normal-bg: bg-yellow-50;
  --text: text-yellow-700;
  --icon: text-yellow-600;
  --border: border-yellow-300;
}
```

### 2. Layout Classes
```css
/* Main Container */
.container {
  @apply min-h-screen w-full bg-gray-100 p-8 flex items-center justify-center;
}

/* Content Grid */
.content-grid {
  @apply h-full grid grid-rows-[auto_1fr_auto] gap-4;
}

/* Information Cards */
.info-card {
  @apply border rounded-lg bg-white p-4;
}
```

## Component Migration Steps

1. **Flag Component**
   - Implement hover state information display
   - Add transition effects
   - Include icon support
   - Add disabled states

2. **Header Section**
   - Add progress tracking
   - Implement flag display
   - Add payment information

3. **Steps Section**
   - Create step toggle functionality
   - Add step completion tracking
   - Implement step restrictions

4. **Flag Management**
   - Add flag selector modal
   - Implement flag notes
   - Add character limit counter
   - Create flag removal functionality

## Interaction Changes

### 1. Step Toggle Logic
```typescript
function toggleStep(index: number) {
  // Only allow completing next undone step
  const nextUndoneIndex = steps.findIndex(step => !step.done);
  if (index === nextUndoneIndex) {
    // Toggle step
  }
  // Allow unchecking last completed step
  if (index === nextUndoneIndex - 1 && steps[index].done) {
    // Uncheck step
  }
}
```

### 2. Flag Management
```typescript
function addFlag(type: 'blocking' | 'nonBlocking', flagId: string) {
  if (!flags[type].includes(flagId)) {
    setFlags(prev => ({
      ...prev,
      [type]: [...prev[type], flagId]
    }));
    setShowFlagSelector(false);
  }
}
```

## Accessibility Considerations

1. Add proper ARIA labels
2. Implement keyboard navigation
3. Include focus management
4. Add screen reader descriptions

## Animation Guidelines

1. Use transition-all for smooth state changes
2. Implement hover state transitions
3. Add loading spinner animation
4. Include modal transitions

## Testing Checklist

- [ ] Flag selection and removal
- [ ] Step progression logic
- [ ] Character limit enforcement
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Responsive layout
- [ ] Animation performance
