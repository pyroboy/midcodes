# Instructions for Budget Planner PAGE

This document provides a distilled overview of the Budget Planner component, outlining its functionality, layout organization, input types, data management with modal-based forms, and the associated database schema. Use this as a reference to understand and implement the core features in your Rental management system

---

## 1. Overview

- **Purpose:**  
  The component serves as the central hub for managing property renovation and maintenance projects. It enables users to create, update, and delete projects and their associated budget items while dynamically calculating and displaying budget statistics.

- **Key Functions:**
  - Manage projects and their details (name, budget, category, status).
  - Manage budget items within each project (item name, type, cost, quantity).
  - Dynamically calculate totals, allocated budgets, and differences (over/under budget).
  - Display aggregated statistics for all projects.

---

## 2. Database Schema

The component uses the following PostgreSQL database schema to store budget-related data:

```sql
CREATE TABLE public.budgets (
    id bigint primary key generated always as identity,
    project_name text NOT NULL,
    project_description text,
    project_category text,
    planned_amount numeric(10,2) NOT NULL,
    pending_amount numeric(10,2) DEFAULT 0,
    actual_amount numeric(10,2) DEFAULT 0,
    budget_items jsonb DEFAULT '[]'::jsonb,
    status text DEFAULT 'planned',
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    property_id integer NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
) WITH (OIDS=FALSE);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Create a foreign key constraint for property_id referencing properties(id)
ALTER TABLE public.budgets ADD CONSTRAINT fk_property FOREIGN KEY (property_id) REFERENCES public.properties(id);
CREATE INDEX idx_property_id ON public.budgets(property_id);


## 2. Component Functionality

### Project Management
- **Creation:**
  Users can add new projects using a modal form that opens with default values.
- **Editing:**
  Each project can have its details updated via modal dialogs, including the project name, planned budget, category, and status.
- **Deletion:**
  Projects can be removed from the list.

### Budget Items Management
- **Adding Items:**
  Within an expanded project view, users can launch a modal to add new budget items.
- **Editing Items:**
  Budget items include fields for name, type, cost, and quantity, all of which are editable via modal forms.
- **Removing Items:**
  Budget items can be deleted as needed.

### Dynamic Calculations & Statistics
- **Item Total:**
  For each project, the allocated budget is calculated by summing (cost × quantity) for each budget item.
- **Budget Difference:**
  The component computes the difference between the planned budget and the allocated amount, indicating whether a project is under or over budget.
- **Global Stats:**
  Aggregated statistics include:
  - Total planned budget
  - Total allocated budget
  - Remaining budget (difference)
  - Count of completed and ongoing projects

---

## 3. Layout & UI Organization

### Main Container
- A centered container with a maximum width and padding ensures a clean and organized layout.

### Top Summary Section (Grid Layout)
- **Total Budget Card:**
  Displays the sum of all planned project budgets.
- **Allocated / Remaining Card:**
  Shows the total allocated amount alongside the remaining budget.
- **Project Status Card:**
  Provides counts for projects that are completed and ongoing.

### Projects List Section
- **Project Cards:**
  Each project is rendered in a card that includes:
  - **Expand/Collapse Control:**
    A toggle button to show or hide detailed project information.
  - **Editable Fields (via Modal Forms):**
    - **Project Name:** Displayed as text; when editing is required, a modal form is launched to update the name.
    - **Project Budget:** Displayed as a numeric value; a modal form can be used to edit the planned budget.
  - **Dynamic Display:**
    - Displays the allocated budget for the project.
    - Indicates if the project is under or over budget.
  - **Dropdowns:**
    - **Project Category:** Options include Renovation, Repairs, Maintenance, etc.
    - **Project Status:** Options include Planned, Ongoing, and Completed.

### Budget Items Section (within Expanded Project)
- **Item Details:**
  Each budget item includes:
  - Text input for the item name.
  - Dropdown for the item type (e.g., Materials, Labor, Equipment Rental, etc.).
  - Numeric inputs for item cost and quantity.
- **Item Controls:**
  Buttons launch modal forms to add or edit budget items, as well as options to remove them.

---

## 4. Input Types and Interaction

- **Text Inputs:**
  For entering project names and item names.
- **Numeric Inputs:**
  For specifying planned budgets, item costs, and quantities.
- **Select/Dropdown Components:**
  - **Project Category:** Options include Renovation, Repairs, Maintenance, Furniture, etc.
  - **Project Status:** Options include Planned, Ongoing, and Completed.
  - **Item Type:** Options include Materials, Labor, Equipment Rental, Permits, etc.
- **Action Buttons:**
  - Buttons to add new projects and budget items.
  - Icons for editing, deleting, and toggling expansion for both projects and items.

All user inputs are handled through modal forms. When a user needs to enter or modify data, a modal dialog is presented, ensuring a focused and uncluttered main page.

---

## 5. Data Management

### Data Structure
- **Projects List:**
  An array of project objects, each containing:
  - `id`, `name`, `budget`, `category`, `status`
  - `items`: an array of budget item objects
  - `isExpanded`: boolean flag to control detailed view
  - `isEditingBudget`: boolean flag for toggling budget editing mode
- **Statistics Object:**
  Maintains aggregated data such as:
  - `totalBudget`
  - `allocatedBudget`
  - `remainingBudget`
  - `completedProjects`
  - `ongoingProjects`


  ## 6. Integration with SvelteKit and Svelte 5

### Implementation as a Main Page/Route
- This component serves as the primary interface for property project budgeting within your application.

### Adapting the Logic
- **Modal-Based Form Handling:**
  Implement modal dialogs to capture user input for creating and editing projects and budget items.
- **UI Components:**
  Use shadcn UI components (such as cards, buttons, inputs, and selects) that mirror the described layout and behavior.
- **Event Handling:**
  Use functions triggered by modal form submissions to manage updates to the projects and budget items, ensuring that changes are automatically reflected in the view.

### Overall Role in the Application
- Acts as the primary interface for managing property projects and budgets.
- Integrates detailed project management with real-time budget tracking and statistics display.
- Provides a user-friendly, organized experience through modal-based form interactions.

```
