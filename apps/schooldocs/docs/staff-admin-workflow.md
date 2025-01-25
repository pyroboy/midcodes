# Staff Admin Page Workflow Documentation

This document outlines the user flow and functionality of the staff admin page in the SchoolDocs application.

## Overview

The staff admin page provides an interface for managing document print requests. It allows staff members to view, track, and manage the status of student document requests through a comprehensive dashboard.

## Components

### Main Components
- Staff Admin Page (`/admin/staff/+page.svelte`)
- Request Modal (`/components/modals/admin/RequestModal.svelte`)
- Enhanced Request Store (`/stores/enhanced-request-store.ts`)

## User Flow

### 1. Initial Page Load
When the page loads:
- Mock print requests are automatically loaded into the `enhancedRequestStore`
- A table displays all print requests with their details
- Each request is tracked through the enhanced request store system

### 2. Request List View
The main table displays:
- Document details
- Student information
- Payment status
- Request status and progress
- Interactive rows for selection

### 3. Request Selection
When selecting a request:
- User clicks on a table row
- Selected request data is stored
- Request Modal opens automatically

### 4. Request Modal Features

#### Detailed Information Display
- Reference number
- Document type
- Student details
- Payment information
- Status flags
- Processing steps

#### Flag Management
Staff can manage two types of flags:

**Blocking Flags:**
- Incomplete Requirements
- Invalid Information
- Payment Issue
- Verification Required

**Non-blocking Flags:**
- Needs Review
- Follow-up Required
- Special Handling
- Has Notes

#### Step Progress Tracking
- Toggle completion status of processing steps
- Visual progress indicators
- Real-time progress calculation

### 5. State Management
The system tracks:
- Presence of blocking flags
- Number of completed steps
- Overall progress percentage
- Notes and additional metadata

## Technical Implementation

### State Management
- Uses Svelte stores for centralized state
- Reactive updates for real-time UI changes
- TypeScript integration for type safety

### Event Handling
Key functions:
- `handleRowClick`: Manages request selection
- `handleFlagToggle`: Controls flag addition
- `handleFlagRemove`: Manages flag removal
- `handleStepToggle`: Updates step completion
- `handleModalClose`: Controls modal visibility

### Store Subscriptions
- Components subscribe to store changes
- Automatic UI updates on data changes
- Cleanup on component destruction

## Best Practices
1. Always check for blocking flags before proceeding
2. Update step status in sequential order
3. Add detailed notes for any flag modifications
4. Verify student information before processing
5. Keep track of payment status updates

## Related Components
- Enhanced Request Store
- Print Request Service
- Request Types Definitions
