# MOBILE REPAIR CENTRE MANAGEMENT SYSTEM
# API DOCUMENTATION

## 1. Authentication APIs

**Base Path:** `/api/auth/`

| Sr. No. | API Name | HTTP Method | Endpoint |
|---:|---|---|---|
| 1 | User Login | POST | `/api/auth/login/` |
| 2 | Refresh Token | POST | `/api/auth/refresh/` |
| 3 | Customer Registration | POST | `/api/auth/register/` |
| 4 | Admin Test | GET | `/api/auth/admin-test/` |
| 5 | Forgot Password | POST | `/api/auth/forgot-password/` |
| 6 | Reset Password | POST | `/api/auth/reset-password/` |
| 7 | Current User | GET | `/api/auth/me/` |
| 8 | User Management | GET, POST | `/api/auth/users/` |
| 9 | Update User Status | PATCH | `/api/auth/users/<int:pk>/status/` |
| 10 | Delete User | DELETE | `/api/auth/users/<int:pk>/` |

## 2. Customer APIs

**Base Path:** `/api/customers/`

| Sr. No. | API Name | HTTP Method | Endpoint |
|---:|---|---|---|
| 1 | Customer List and Create | GET, POST | `/api/customers/` |
| 2 | Customer Detail | GET, PUT, PATCH | `/api/customers/<int:pk>/` |
| 3 | Customer Profile | GET, PUT, PATCH | `/api/customers/my-profile/` |

## 3. Device APIs

**Base Path:** `/api/customers/`

| Sr. No. | API Name | HTTP Method | Endpoint |
|---:|---|---|---|
| 1 | Device List and Create | GET, POST | `/api/customers/devices/` |
| 2 | Device Detail | GET, PUT, PATCH | `/api/customers/devices/<int:pk>/` |

## 4. Technician APIs

**Base Path:** `/api/`

| Sr. No. | API Name | HTTP Method | Endpoint |
|---:|---|---|---|
| 1 | Technician List and Create | GET, POST | `/api/technicians/` |
| 2 | Technician Detail | GET, PUT, PATCH | `/api/technicians/<int:pk>/` |
| 3 | Technician Status Update | PUT, PATCH | `/api/technicians/<int:pk>/status/` |

## 5. Job Card APIs

**Base Path:** `/api/`

| Sr. No. | API Name | HTTP Method | Endpoint |
|---:|---|---|---|
| 1 | Job Card List and Create | GET, POST | `/api/job-cards/` |
| 2 | Job Card Detail | GET, PUT, PATCH | `/api/job-cards/<int:pk>/` |
| 3 | Job Card Status Update | PUT, PATCH | `/api/job-cards/<int:pk>/status/` |
| 4 | Job Card Status History | GET | `/api/job-cards/<int:pk>/status-history/` |
| 5 | Public Repair Tracking | GET | `/api/track/<str:tracking_token>/` |

## 6. Estimate APIs

**Base Path:** `/api/`

| Sr. No. | API Name | HTTP Method | Endpoint |
|---:|---|---|---|
| 1 | Estimate List and Create | GET, POST | `/api/estimates/` |
| 2 | Estimate Detail | GET | `/api/estimates/<int:pk>/` |
| 3 | Estimate Approval | PUT, PATCH | `/api/estimates/<int:pk>/approval/` |

## 7. Spare Part APIs

**Base Path:** `/api/`

| Sr. No. | API Name | HTTP Method | Endpoint |
|---:|---|---|---|
| 1 | Spare Part List and Create | GET, POST | `/api/spare-parts/` |
| 2 | Spare Part Detail | GET, PUT, PATCH | `/api/spare-parts/<int:pk>/` |
| 3 | Add Stock | POST | `/api/spare-parts/<int:pk>/add-stock/` |

## 8. Job Part APIs

**Base Path:** `/api/`

| Sr. No. | API Name | HTTP Method | Endpoint |
|---:|---|---|---|
| 1 | Job Part List and Create | GET, POST | `/api/job-parts/` |
| 2 | Job Part Detail | GET, PUT, PATCH | `/api/job-parts/<int:pk>/` |

## 9. Billing and Payment APIs

**Base Path:** `/api/billing/`

| Sr. No. | API Name | HTTP Method | Endpoint |
|---:|---|---|---|
| 1 | Billing Summary | GET | `/api/billing/job-cards/<int:job_card_id>/` |
| 2 | Payment List and Create | GET, POST | `/api/billing/payments/` |
| 3 | Payment Detail | GET, PATCH | `/api/billing/payments/<int:pk>/` |
| 4 | Payment Receipt | GET | `/api/billing/payments/<int:pk>/receipt/` |

## 10. Warranty APIs

**Base Path:** `/api/`

| Sr. No. | API Name | HTTP Method | Endpoint |
|---:|---|---|---|
| 1 | Warranty List | GET | `/api/warranties/` |
| 2 | Create Warranty | POST | `/api/warranties/` |
| 3 | Warranty Detail | GET | `/api/warranties/<int:pk>/` |
| 4 | Warranty Status Update | PATCH | `/api/warranties/<int:pk>/status/` |

## 11. Reports APIs

**Base Path:** `/api/`

| Sr. No. | API Name | HTTP Method | Endpoint |
|---:|---|---|---|
| 1 | Dashboard Summary | GET | `/api/reports/dashboard-summary/` |
| 2 | Job Card Status Report | GET | `/api/reports/job-card-status/` |
| 3 | Revenue and Payment Report | GET | `/api/reports/revenue/` |
| 4 | Inventory Report | GET | `/api/reports/inventory/` |
| 5 | Repair Performance Report | GET | `/api/reports/repair-performance/` |

## 12. Audit Log API

**Base Path:** `/api/`

| Sr. No. | API Name | HTTP Method | Endpoint |
|---:|---|---|---|
| 1 | Audit Log List | GET | `/api/audit-logs/` |

---



**Document:** API Documentation  
**Project:** Mobile Repair Centre Management System