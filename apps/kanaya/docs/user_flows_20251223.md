# User Flows and Permissions

This document outlines the user flows for different roles and the permissions structure within the application.

## App Introduction: Kanaya

Kanaya is a digital-first ID generation platform designed to streamline the creation, management, and distribution of professional identification cards. It eliminates the need for complex software installations, allowing schools, companies, and organizations to design, print, and issue IDs directly from any device.

With features like AI-powered background removal ("decompose"), cloud-based asset management, and dynamic QR implementation, Kanaya modernizes the traditional ID workflow. It supports bulk printing and provides a digital companion for every physical card, enabling verification and contact sharing through simple QR scans.

---

## User Roles

The application supports a granular role-based access control (RBAC) system.

### Primary Roles

- **Public User**: An unauthenticated user who interacts with public-facing elements like digital cards (via QR scan).
- **User (Standard)**: A basic authenticated user with a profile.
- **Org Admin**: Administrator for a specific organization. Manages organization settings and members.
- **Super Admin**: System-wide administrator with full access and the ability to emulate other roles.

---

## User Personas & Use Case Analysis

This section analyzes key user personas, their specific needs ("dying needs"), and how Kanaya fulfills them.

### 1. The Business-Savvy Technophile

_A professional who wants a "smart business card" to signal technological forwardness._

- **Dying Needs**:
  - **Differentiation**: Needs to stand out from the sea of paper business cards.
  - **Efficiency**: Wants contacts to save their details immediately without typing.
  - **Updates**: Needs to update contact info (phone, position) without re-printing cards.
- **App Fulfillment**:
  - **Digital Twin**: The physical card is just a gateway to a dynamic digital profile.
  - **Live Updates**: Changing data on the app updates the QR scan result instantly.
  - **NFC/QR Hybrid**: Supports modern interactions that impress clients.

### 2. The Foodie Influencer

_A social media personality who needs a physical token to share their brand._

- **Dying Needs**:
  - **Visual Appeal**: The card must be "Instagrammable" and match their aesthetic.
  - **Traffic Driver**: Needs to drive offline interactions to online operational channels (Instagram, TikTok, Blog).
  - **Legitimacy**: Wants to look professional to brands and restaurants, not just like a "hobbyist."
- **App Fulfillment**:
  - **Custom Branding**: High-fidelity templates allow for rich visuals and branding.
  - **Smart Links**: The digital profile aggregates all social links in one place (Linktree-style).
  - **Verification**: A professional ID card signals "media/press" status more effectively than a phone screen.

### 3. The Printer (Tool Savior)

_A print shop owner struggling with high design costs and slow approvals._

- **Dying Needs**:
  - **Operational Efficiency**: "I spend more time fixing client designs than printing."
  - **Batch Processing**: collecting explicit data (names, photos) via email is a nightmare.
  - **Upsell**: Wants to offer "Digital IDs" but doesn't have the tech stack.
- **App Fulfillment**:
  - **Client Self-Service**: Clients design and input data themselves; the printer just hits "Download Print Sheet."
  - **Print-Ready Output**: Generates CMYK/High-DPI PDFs automatically, saving hours of prep.
  - **New Revenue Stream**: Can resell the "Digital ID" hosting as a value-added service.

### 4. The Events Manager

_An organizer who needs to handle staff and attendee accreditation quickly._

- **Dying Needs**:
  - **Security**: "I need to know who is actual staff vs. a random guest."
  - **Speed**: Printing badges on-site is slow; pre-printing is rigid.
  - **Updates**: Last-minute staff changes happen constantly.
- **App Fulfillment**:
  - **Instant Issuance**: Can generate a digital pass immediately for a new staff member.
  - **Scan Verification**: Security can scan the QR to see "Active/Authorized" status in real-time.
  - **Revocation**: Can instantly separate/suspend a pass if a staff member is dismissed.

### 5. The Franchise Owner

_A business owner with 20+ branches and high employee turnover._

- **Dying Needs**:
  - **Standardization**: "Every branch prints their own ugly IDs. It hurts the brand."
  - **Central Control**: Needs to manage access and branding from HQ.
  - **Onboarding Speed**: New employees need uniforms and IDs immediately.
- **App Fulfillment**:
  - **Org-Level Templates**: HQ sets the design; Branch Managers only input data.
  - **Role-Based Access**: Branch managers are `Org Admins` for their specific unit.
  - **Billing**: Centralized billing for all ID generations across the franchise.

---

## User Flows

### 1. Template Creation (Super Admin / Designer)

**Actor**: Super Admin/Designer

1.  **Manage Assets**: Upload raw assets (A4 sheets, backgrounds) to `/admin/template-assets`.
2.  **Decompose**: Use AI tools (Crop, Upscale, Remove) to create standard graphics.
3.  **Edit**: Assemble graphics into a template, adding dynamic fields and QR placeholders.
4.  **Save**: Publish template for organization use.

### 2. Create IDs / Registration (Principal / Marketing)

**Actor**: School Principal (Org Admin)

1.  **Pitch**: Principal sees value in "Instant Digital IDs".
2.  **Registration**: Signs up and creates Organization.
3.  **Issuance**:
    - Selects Template.
    - Inputs Student Data (Photo + Text).
    - **Generate**: System creates Printable ID + Digital Profile.

### 3. Public Profile Scan

**Trigger**: Scan QR Code `https://app.kanaya.app/id/[slug]`.

- **Active**: Shows Profile + Card Images.
- **Unclaimed**: Shows "Claim This Profile" CTA.
- **Expired**: Shows "Expired" message.

---

## Proposed Feature: Secure Claiming via OTP/Token

To address the race condition risk in card claiming and enhance security, we propose the following flow using a secure token or OTP.

**Flow**:

1.  **Generation**: When an ID is created, the system generates a unique, high-entropy **Claim Token**.
    - _Option A (Physical)_: Token is printed on the card hidden under a scratch-off or simply printed as a "Pin Code."
    - _Option B (Digital)_: Token is emailed/SMS'd to the user if contact info is known.
2.  **Scan**: User scans the QR code.
3.  **Prompt**: User clicks "Claim Profile."
4.  **Verification**:
    - System prompts: "Enter the 6-digit PIN printed on your card" or "Enter the OTP sent to your email."
    - User inputs code.
5.  **Validation**:
    - System verifies code matches the `claim_token` hash in the database.
    - **Rate Limiting**: Prevents brute-force guessing.
    - **Atomic Claim**: Validation and Ownership Transfer happen in a single transaction.
6.  **Success**: Profile is linked to the user account.

---

## Technical Edge Cases & Race Conditions

### 1. Concurrent Card Claiming

- **Risk**: Double claiming.
- **Resolution**: Database unique constraint on `owner_id`. **Secure Claiming Flow** (above) further mitigates this by requiring a secret token, making "accidental" or "race-condition" claims by random scanners impossible.

### 2. Credit Usage vs. Balance

- **Risk**: Overdrawing credits via parallel requests.
- **Resolution**: Atomic database transactions for balance deductions.

### 3. Template Asset Deletion

- **Risk**: Breaking templates by deleting used assets.
- **Resolution**: Soft deletes and usage checks.
