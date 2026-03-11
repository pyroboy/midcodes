# POS Order Flows

This document provides explicit, step-by-step instructions for placing different types of orders in WTFPOS. When testing the POS, **follow these exact paths** to avoid getting stuck or creating invalid database states.

---

## 1. Opening a Table

Before you can add items for dine-in, you must open a table.

1. **Tap an available table** on the `/pos` floor plan (e.g., `text="T4"`).
2. The **Pax Modal** appears.
3. Enter the number of adults in the input field.
4. (Optional) Enter the number of children (agres 6-9) or free pax (under 5).
5. Tap **"Next"**.
6. The **Package Selection Modal** appears.
7. Tap a package (e.g., `text="Pork Unlimited"`).
8. Tap **"Confirm"**.
9. The table is now open, and the **Order Sidebar** appears on the right.

> **Note:** If you are testing a generated mock order (T1, T2, T3 from seed data), the table is *already open*. Just tap the table to view its Order Sidebar.

---

---

## 2. Adding Ala Carte Dishes & Drinks

Dishes and drinks are paid add-ons and are sent directly to the stove/bar (not the grill).

1. With a table's Order Sidebar open, tap **"Add Item"**.
2. Tap the **"Dishes"** or **"Drinks"** tab.
3. Tap the `+` button next to the desired item (e.g., Ramyun or San Miguel Beer).
4. Tap **"Add to Order"**.
5. Notice the bill subtotal immediately increases in the Order Sidebar.

---

## 3. Creating a Takeout Order

Takeout orders bypass the floor plan entirely.

1. On the `/pos` page, tap the **"Takeout"** tab at the top (next to "Dine-in").
2. Tap **"New Takeout Order"**.
3. A prompt appears asking for the Customer Name. Enter it and submit.
4. The Takeout Order Sidebar opens.
5. Tap **"Add Item"**.
6. Note: Takeout orders do NOT have access to unlimited packages. You must order specific dishes, drinks, or retail items.
7. Select items, adjust quantities, and tap **"Add to Order"**.
8. Takeout orders move through statuses: `New` → `Preparing` → `Ready` → `Picked Up`.

---

## 4. Logging Out & Switching Users

When auditing multi-role scenarios (e.g., Staff placing an order, then Manager approving a void), you must switch users.

1. Ensure the current action is complete (e.g. order placed).
2. Look for the **Location Banner** at the top of the app (it usually says the branch name like "WTF! Tagaytay" and the user name like "Ate Rose").
3. Click on the user's name/icon in the top right.
4. A dropdown menu appears.
5. Click **"Log Out"**.
6. You will be returned to the `/` root login page.
7. Click the role card of the next user (e.g. "Manager") to log back in.

> **🚀 FAST BYPASS FOR AGENTS:** You can completely bypass the UI clicks above and instantly switch users by injecting a new token via CLI and navigating to the target page (see `playwright-cli sessionstorage-set` in SKILL.md under PC-2).

---

## 5. Summary of Order Rules

- **Modifiers do not exist.** Everything is an individual item (e.g., "Iced Tea Pitcher" vs "Iced Tea Glass").
- **Kitchen Dispatch:** Dishes/Drinks go to the Stove (`/kitchen/stove`), Meats go to the Weigh Station / Grill (`/kitchen/dispatch`). 
- **Grace Period:** Items can be removed from the sidebar without a manager PIN within 30 seconds of being added. After that, they require a manager PIN to void.
