# Project Structure Documentation

## Frontend Architecture

### Routes Structure
```
/src/routes/
├── (auth)/
│   └── login/
│       └── +page.svelte
├── (protected)/
│   │
│   └── reports/
│       ├── +page.svelte               # Monthly reports page
│       ├── +page.server.ts            # Report generation logic
│       ├── MonthPicker.svelte         # Month navigation component
│       ├── FloorSummary.svelte        # Floor-wise summary component
│       └── types.ts                   # Type definitions
```

### Key Components

#### UtilityReadingTable.svelte
```typescript
interface ReadingRow {
  roomNumber: string;
  previousReading: number;
  currentReading: number;
  consumption: number | null;
  isFlagged: boolean;
}

// Real-time consumption calculation
const calculateConsumption = (prev: number, curr: number) => curr - prev;
```

#### MonthPicker.svelte
```typescript
interface MonthSelection {
  year: number;
  month: number;
}

// Month navigation controls
const navigateMonth = (direction: 'prev' | 'next') => {
  // Update selected month
};
```

## State Management

### Utility Readings Store
```typescript
// stores/utilityReadings.ts
interface ReadingsStore {
  readings: ReadingRow[];
  selectedUtilityType: 'electricity' | 'water';
  currentRate: number;
}

export const utilityReadingsStore = writable<ReadingsStore>({
  readings: [],
  selectedUtilityType: 'electricity',
  currentRate: 0
});
```

### Reports Store
```typescript
// stores/reports.ts
interface ReportsStore {
  selectedMonth: MonthSelection;
  floorSummaries: FloorSummary[];
}

export const reportsStore = writable<ReportsStore>({
  selectedMonth: getCurrentMonth(),
  floorSummaries: []
});
```

## UI Components Layout

### Utility Readings Page
```svelte
<script lang="ts">
  import { utilityReadingsStore } from '../stores/utilityReadings';
  import UtilityReadingTable from './UtilityReadingTable.svelte';
</script>

<div class="container mx-auto p-4">
  <!-- Utility Type Selection -->
  <div class="mb-4">
    <select bind:value={$utilityReadingsStore.selectedUtilityType}>
      <option value="electricity">Electricity</option>
      <option value="water">Water</option>
    </select>
  </div>

  <!-- Batch Reading Entry Table -->
  <UtilityReadingTable />

  <!-- Preview & Submit -->
  <div class="mt-4 flex justify-end gap-4">
    <button class="btn btn-secondary">Preview Calculations</button>
    <button class="btn btn-primary">Save Readings</button>
  </div>
</div>
```

### Monthly Reports Page
```svelte
<script lang="ts">
  import { reportsStore } from '../stores/reports';
  import MonthPicker from './MonthPicker.svelte';
  import FloorSummary from './FloorSummary.svelte';
</script>

<div class="container mx-auto p-4">
  <!-- Month Navigation -->
  <MonthPicker />

  <!-- Floor-wise Summaries -->
  <div class="grid gap-4 mt-4">
    {#each $reportsStore.floorSummaries as summary}
      <FloorSummary {summary} />
    {/each}
  </div>

  <!-- Overall Summary -->
  <div class="mt-8 p-4 bg-gray-50 rounded-lg">
    <h3>Monthly Overview</h3>
    <!-- Overall statistics -->
  </div>
</div>
```