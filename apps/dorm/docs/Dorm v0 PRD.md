# Product Requirements Document (PRD)

**Product Name:** Dorm Management App

---

## 1. Overview

### 1.1 Product Name

**Dorm Management App**

### 1.2 Description

A comprehensive property management system designed to handle lease management, utility tracking, and monthly reporting for residential properties. The system focuses on efficient utility management and financial reporting while maintaining organized tenant and room information.

### 1.3 Core Value Proposition

The app streamlines property management operations by providing:

- Efficient utility reading and billing management
- Clear monthly financial reporting
- Organized tenant and lease tracking
- Floor-wise property management

---

## 2. Target Users

### 2.1 User Roles

#### Super Admin

- Full system access across multiple properties
- Oversee and configure all system settings and reports

#### Property Admin

- Manage individual property operations
- Oversee utility readings, billing, and lease management
- Access detailed monthly reports

#### Property Input Operator

- Limited access for data entry and review of rent payables
- Responsible for entering utility readings and basic property data

#### Property Tenant

- View personal invoices, payment history, and utility consumption
- Access payment schedules and notifications

---

## 3. Key Features

### 3.1 Priority 1 (MVP)

#### Utility Management

- **Batch Entry:** Allow batch entry for utility readings (electricity and water)
- **Automatic Calculations:** Compute consumption automatically and apply standard rates
- **Anomaly Detection:** Flag unusual consumption patterns for review

#### Monthly Reporting

- **Floor-wise Summary:** Generate summary reports for each floor
- **Occupancy & Consumption:** Track total occupancy and provide an overview of utility consumption
- **Navigation:** Enable month-to-month navigation in reports
- **Financial Calculations:** Compute overall balance including incomes and expenses

#### Lease Management

- **Tenant Registration:** Register new tenants and maintain tenant records
- **Room Assignment:** Manage room assignments and track occupancy
- **Payment Tracking:** Monitor rent and utility payment statuses
- **Term Management:** Handle lease term details and renewals

### 3.2 Priority 2 (Future Releases)

#### Advanced Reporting

- **PDF Export:** Ability to export reports as PDF documents
- **Custom Reports:** Allow users to generate custom reports tailored to their needs
- **Analytics:** Provide advanced analytics, trends, and forecasting

#### Additional Utilities

- **Extended Utility Types:** Integrate support for utilities beyond electricity and water
- **Custom Rate Structures:** Enable custom utility rate configurations
- **Automated Meter Reading:** Explore integration with automated meter reading systems

---

## 4. Technical Requirements

### 4.1 Frontend

- **Framework:** Built using Svelte 5 with TailwindCSS for responsive design
- **Mobile Optimization:** Ensure design is responsive and mobile-friendly
- **Real-Time Previews:** Provide real-time calculation previews during data entry
- **Navigation:** Easy-to-use month navigation interface for reports

### 4.2 Backend

- **Database & Auth:** Use Supabase for database management and authentication
- **Role-Based Access Control (RBAC):** Enforce user permissions based on roles
- **API Endpoints:** Develop robust endpoints for batch operations and data retrieval
- **Security:** Ensure secure data handling and encryption in transit and at rest

---

## 5. Success Metrics

### 5.1 Performance Metrics

- **Utility Entry Time:** < 2 minutes per floor for utility reading entry
- **Report Generation:** < 5 seconds for report generation
- **System Response:** < 1 second response time for standard operations

### 5.2 Business Metrics

- **Error Reduction:** Achieve a 90% reduction in billing errors
- **Collection Efficiency:** Improve rent and utility collection rates
- **Operational Efficiency:** Enhance overall property management operational efficiency

---

## 6. Assumptions & Constraints

### 6.1 Assumptions

- Standard utility rates will apply across rooms initially
- The system will follow a monthly billing cycle
- Users will have basic technical proficiency
- Reliable internet connectivity is available for system access

### 6.2 Constraints

- Utility readings must be input manually (initially)
- The system supports only standard rate structures at launch
- Focus on electricity and water utilities for the initial release
- PDF export functionality is deferred to future releases

---

## 7. Security Requirements

### 7.1 Authentication

- Secure login system integrated via Supabase
- Strict role-based access control to limit functionalities by user role
- Robust session management and multi-factor authentication (if needed)

### 7.2 Data Protection

- **Encryption:** Encrypted data transmission (HTTPS) and secure storage
- **Backup:** Regular backup procedures for critical data
- **Access Logs:** Maintain detailed logs for auditing purposes

---

## 8. Future Considerations

### 8.1 Scalability

- **Multiple Properties:** Expand support for managing multiple properties concurrently
- **Utility Expansion:** Integration of additional utility types and custom rate structures
- **Advanced Features:** Incrementally introduce advanced reporting and analytics features

### 8.2 Integration Possibilities

- **Automated Meter Reading:** Integration with IoT devices for automated meter readings
- **Payment Gateways:** Connect with external payment systems for seamless transactions
- **Mobile App:** Potential development of a dedicated mobile application
- **Accounting Software:** Integration with external accounting platforms for comprehensive financial management

---

## 9. Appendices

### 9.1 User Flow Diagrams

_Include flow diagrams to illustrate typical user interactions (e.g., utility entry, lease management, report generation)._

### 9.2 Data Flow Diagrams

_Outline how data moves between modules such as tenant management, utility tracking, and billing systems._

### 9.3 Error Handling & Exception Scenarios

- **Network Failures:** Define steps for retry mechanisms and error notifications during batch entry.
- **Data Inconsistencies:** Outline procedures for resolving discrepancies in utility readings or payment records.
- **User Errors:** Incorporate validation and user feedback loops to minimize incorrect data entry.

### 9.4 Feedback Mechanism

- **User Feedback:** Implement channels for receiving tenant and admin feedback.
- **Iterative Updates:** Regularly review and update the system based on collected feedback and usage metrics.
