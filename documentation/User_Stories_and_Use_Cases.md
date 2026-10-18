# MOBILE REPAIR CENTRE MANAGEMENT SYSTEM
## User Stories and Use Cases

**Project Type:** Python Full Stack Internship Project  
**Frontend:** React, Vite, Tailwind CSS  
**Backend:** Django REST Framework  
**Database:** MySQL  
**Authentication:** JWT (JSON Web Token)  
**Document Version:** 1.0  

---

## 1. Introduction

The Mobile Repair Centre Management System is a web-based application developed to manage the daily operations of a mobile repair centre. It provides a structured way to maintain customer records, mobile device information, repair job cards, estimates, technicians, spare parts, payments, warranties, repair history, and reports.

The system aims to reduce manual record keeping, improve repair-status visibility, maintain accurate transaction records, and provide role-based access to system functionality.

This document defines the system's user stories, use cases, acceptance criteria, and business rules. It serves as a reference for implementation, testing, and project evaluation.

## 2. Objectives

- Maintain organized customer and mobile-device records.
- Track repair requests through job cards and status updates.
- Prepare estimates and record approval decisions.
- Manage technician assignments and spare-part usage.
- Record payments and generate eligible receipts.
- Maintain warranty information and repair history.
- Provide reports and audit information to authorized users.
- Allow customers to view permitted repair progress through an available tracking link.
- Support manual sharing of tracking links through WhatsApp where implemented.

## 3. User Roles

### 3.1 Admin

The Admin has access to authorized management functions, reports, and audit information. Access to individual operations depends on the permissions configured in the system.

### 3.2 Staff

Staff members manage day-to-day repair operations, including customer and device registration, job-card creation, estimate processing, repair-status updates, inventory operations, and payment recording where permitted.

### 3.3 Customer

Customers can access the customer-facing features permitted by the system. Where public repair tracking is enabled, a customer can use the tracking link to view limited repair-progress information.

---

## 4. User Stories and Acceptance Criteria

### US-01: User Login

**User Story:** As a registered user, I want to log in securely so that I can access the features permitted for my role.

**Acceptance Criteria**
- The system accepts valid credentials.
- Invalid credentials produce an appropriate error.
- Successful authentication returns the information required by the frontend.
- Protected pages and APIs reject unauthorized access.

### US-02: User Registration and Password Recovery

**User Story:** As a user, I want to register or recover my password so that I can access my account when required.

**Acceptance Criteria**
- Required registration fields are validated.
- Invalid or duplicate information is rejected where applicable.
- Password recovery follows the configured reset process.
- Invalid or expired reset information cannot be used to change a password.

### US-03: Customer Management

**User Story:** As an authorized Admin or Staff member, I want to create, view, update, and search customer records so that customer information remains organized.

**Acceptance Criteria**
- Required customer details are validated.
- Authorized users can retrieve and update permitted records.
- Search returns matching records where supported.
- Unauthorized operations are rejected.

### US-04: Device Management

**User Story:** As Staff, I want to register and maintain mobile-device details so that each repair request is associated with the correct device.

**Acceptance Criteria**
- Each device is associated with the appropriate customer.
- Required device information is validated.
- Unique identifiers, such as IMEI where applicable, follow the configured uniqueness rules.
- Invalid device information is rejected.

### US-05: Technician Management

**User Story:** As an authorized user, I want to manage technician records so that repair jobs can be assigned to eligible technicians.

**Acceptance Criteria**
- Technician information is validated.
- Technician status can be maintained by authorized users.
- Inactive technicians cannot be assigned to new repair jobs.
- Invalid assignment requests are rejected.

### US-06: Job-Card Management

**User Story:** As Staff, I want to create and maintain job cards so that repair requests can be tracked from intake to completion.

**Acceptance Criteria**
- A job card references the correct customer and device.
- The system generates a unique job-card number.
- Required intake details and reported problems are recorded.
- The job card follows the configured repair-status workflow.

### US-07: Estimate Management

**User Story:** As Staff, I want to prepare an estimate for a job card so that the expected repair cost can be recorded and reviewed.

**Acceptance Criteria**
- The estimate is linked to the correct job card.
- Estimate amounts and required fields are validated.
- The approval status is stored accurately.
- Operations that require an approved estimate must check its approval status.

### US-08: Estimate Approval or Rejection

**User Story:** As an authorized actor, I want to approve or reject an estimate so that repair work follows the recorded decision.

**Acceptance Criteria**
- The estimate must exist and belong to the relevant job card.
- Only an authorized actor can perform the decision.
- The decision is stored and returned correctly.
- Invalid approval or rejection attempts are rejected.

### US-09: Spare-Part and Stock Management

**User Story:** As an authorized user, I want to maintain spare-part records and stock quantities so that parts used for repairs can be tracked.

**Acceptance Criteria**
- Part details and quantities are validated.
- Stock additions update the available quantity.
- Part usage follows stock-availability rules.
- Part returns and stock adjustments follow the configured business rules.

### US-10: Repair Status and History

**User Story:** As Staff, I want to update repair status so that the progress of a job can be tracked.

**Acceptance Criteria**
- Only permitted status changes are accepted.
- The system records status history for supported status changes.
- The latest status is visible to authorized users.
- Invalid or unauthorized updates are rejected.

### US-11: Payment and Receipt

**User Story:** As authorized Staff, I want to record payments and provide eligible receipts so that financial transactions are traceable.

**Acceptance Criteria**
- The payment references the correct job card.
- Payment details and amounts are validated.
- Required billing and estimate conditions are checked.
- A receipt is available only when the configured payment conditions are satisfied.

### US-12: Warranty Management

**User Story:** As an authorized user, I want to maintain warranty records for eligible repairs so that warranty information can be checked later.

**Acceptance Criteria**
- The warranty is linked to the correct job card.
- Warranty creation follows the configured eligibility rules.
- Required dates and details are validated.
- Invalid warranty operations are rejected.

### US-13: Reports and Audit Logs

**User Story:** As Admin, I want to view reports and audit information so that I can review repair-centre activity and important system changes.

**Acceptance Criteria**
- Reports use stored system data.
- Supported filters are applied correctly.
- Restricted reports and audit records are not exposed to unauthorized roles.
- Important supported operations can be traced through audit records.

### US-14: Public Repair Tracking

**User Story:** As a customer, I want to use a tracking link to check repair progress so that I can understand the current status of my device.

**Acceptance Criteria**
- The tracking token identifies the correct job card.
- Only permitted repair-progress information is displayed.
- Payment-sensitive, audit, and unrelated private information is not exposed.
- Invalid tracking tokens do not reveal job-card details.

### US-15: Manual WhatsApp Sharing

**User Story:** As Staff, I want to prepare a WhatsApp message containing the repair-tracking link so that I can share it with the customer manually.

**Acceptance Criteria**
- The prepared message contains the correct tracking link.
- Staff can review the message before sending.
- The message is sent manually through WhatsApp.
- Opening WhatsApp is not treated as proof that the message was delivered.

---

## 5. Use Cases

### UC-01: Authenticate User

**Primary Actor:** Admin, Staff, Customer

**Preconditions**
- The user has an account.
- The authentication service is available.

**Main Flow**
1. The user opens the login page.
2. The user enters their credentials.
3. The frontend sends the login request.
4. The backend validates the credentials.
5. The backend returns the authentication response.
6. The user accesses the permitted dashboard.

**Alternative Flow**
- Invalid credentials produce an error.
- Unauthorized requests to protected resources are rejected.

**Expected Result:** The user is authenticated and can access permitted functionality.

### UC-02: Register Customer and Device

**Primary Actor:** Admin or Staff

**Preconditions**
- The actor has permission to manage the records.

**Main Flow**
1. The actor opens customer management.
2. The actor enters customer details.
3. The system validates and saves the customer record.
4. The actor opens device management.
5. The actor selects the customer and enters device details.
6. The system validates and saves the device record.

**Alternative Flow**
- Missing required fields, invalid references, or duplicate unique identifiers are rejected.

**Expected Result:** Valid customer and device records are saved and linked correctly.

### UC-03: Create Job Card and Update Repair Status

**Primary Actor:** Staff

**Preconditions**
- The customer and device exist.
- Staff has permission to create and update job cards.

**Main Flow**
1. Staff opens job-card management.
2. Staff selects the customer and device.
3. Staff enters the reported problem and required intake details.
4. The system validates the request and creates the job card.
5. The system generates a unique job-card number.
6. Staff updates the repair status as work progresses.
7. The system records supported status-history entries.

**Alternative Flow**
- Invalid customer/device references are rejected.
- Invalid status changes are rejected.

**Expected Result:** The job card is available with its current repair status and supported history.

### UC-04: Prepare and Process Estimate

**Primary Actor:** Staff and the authorized approval actor

**Preconditions**
- A valid job card exists.

**Main Flow**
1. Staff opens the job card.
2. Staff prepares an estimate.
3. The system validates and saves the estimate.
4. The authorized actor approves or rejects it.
5. The system stores the decision.
6. The repair workflow follows the recorded decision and business rules.

**Alternative Flow**
- Invalid estimate information is rejected.
- Unauthorized approval attempts are rejected.

**Expected Result:** The estimate and its approval decision are recorded.

### UC-05: Manage Spare Parts

**Primary Actor:** Authorized Staff

**Preconditions**
- The relevant job card and spare-part records exist.

**Main Flow**
1. Staff opens the relevant job card or parts section.
2. Staff selects a spare part and enters the quantity.
3. The backend validates stock availability.
4. The system records part usage.
5. The available stock is updated according to the configured rules.

**Alternative Flow**
- Insufficient stock or invalid quantities are rejected.
- Part returns follow the configured return rules.

**Expected Result:** Part usage and stock changes are traceable.

### UC-06: Record Payment and Generate Receipt

**Primary Actor:** Authorized Staff

**Preconditions**
- A valid job card exists.
- Required billing conditions are satisfied.

**Main Flow**
1. Staff opens the relevant job card.
2. Staff enters the payment details.
3. The backend validates the request.
4. The system saves the valid payment.
5. If the payment meets the configured conditions, the receipt can be generated or downloaded.

**Alternative Flow**
- Invalid payment details are rejected.
- If an approved estimate is required but unavailable, the operation is rejected with an appropriate error.

**Expected Result:** The payment is recorded and an eligible receipt is available.

### UC-07: Check Repair Tracking and Share Link

**Primary Actors:** Customer and Staff

**Preconditions**
- A valid tracking link is available.
- Public tracking is enabled.

**Main Flow**
1. Staff opens the relevant job card.
2. Staff prepares the tracking message for WhatsApp.
3. WhatsApp opens with the prepared message, where supported.
4. Staff checks the recipient and sends the message manually.
5. The customer opens the tracking link.
6. The system validates the token and displays permitted repair-progress information.

**Alternative Flow**
- If WhatsApp does not open, Staff can copy and share the link manually.
- An invalid tracking token returns an appropriate error.
- Sensitive information is not displayed publicly.

**Expected Result:** The customer can access the permitted tracking information through the shared link.

### UC-08: View Reports and Audit Records

**Primary Actor:** Admin

**Preconditions**
- Admin is authenticated and authorized.

**Main Flow**
1. Admin opens the reports or audit section.
2. Admin selects available filters.
3. The backend retrieves the relevant records.
4. The system displays the permitted information.

**Alternative Flow**
- Invalid filters produce appropriate errors.
- Unauthorized users are denied access.

**Expected Result:** Admin can review the available reports and audit records.

---

## 6. Business Rules

1. Required fields must be validated by the backend.
2. Unique identifiers must follow the configured uniqueness rules.
3. Only authorized roles can perform restricted operations.
4. Inactive technicians cannot be assigned to new repair jobs.
5. Estimate approval must be recorded wherever the workflow requires it.
6. Spare-part usage must respect stock availability.
7. Payment and receipt operations must follow billing rules.
8. Warranty creation must follow the configured eligibility rules.
9. Supported job-status changes should be recorded in status history.
10. Important supported actions should be traceable through audit logs.
11. Public tracking must expose only necessary repair-progress information.
12. Manual WhatsApp sharing must not be represented as automatic message delivery.


