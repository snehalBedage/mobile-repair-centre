# Mobile Repair Centre Web Application

A full-stack web application developed using React.js, Python, Django REST Framework, and MySQL to manage mobile repair centre operations efficiently.

## Project Overview

The **Mobile Repair Centre Web Application** is designed to simplify the daily activities of a mobile repair centre. It provides a centralized platform for managing customers, mobile devices, technicians, repair job cards, estimates, spare parts, payments, and warranties.

The application supports three user roles: Admin, Staff, and Customer. Each role has access to the functionalities required for its responsibilities. Customers can track repair progress, review estimates, access payment records, and view warranty information.

## Objectives

- To maintain customer and mobile device records.
- To create and manage repair job cards.
- To monitor repair progress and status history.
- To prepare repair estimates and record customer approval.
- To manage spare parts inventory and job-part assignments.
- To maintain payment records and generate PDF receipts for eligible paid transactions.
- To maintain warranty records for completed repairs.
- To provide QR code-based repair tracking and shareable tracking links.
- To generate reports and export available data in CSV format.
- To manage user roles and record selected system activities through audit logs.

## Technologies Used

### Frontend
- React.js
- Vite
- JavaScript
- HTML5
- CSS3
- Tailwind CSS
- React Router
- Axios

### Backend
- Python
- Django
- Django REST Framework
- Django REST Framework SimpleJWT

### Database
- MySQL

### Libraries and Tools
- Git
- GitHub
- Visual Studio Code
- ReportLab for PDF receipt generation
- QR code library for repair tracking
- `python-dotenv` for environment configuration
- `django-cors-headers` for cross-origin request handling

## User Roles

### 1. Admin

The Admin role provides access to administrative and operational functions.

- Manage customers, devices, and technicians.
- Create and manage repair job cards.
- Update repair statuses and review status history.
- Manage estimates and customer approval status.
- Manage spare parts, stock, and job-part assignments.
- Manage payments, receipts, and warranties.
- View reports and export available CSV data.
- Manage users and roles.
- Review audit logs.

### 2. Staff

The Staff role supports day-to-day repair centre operations.

- Register and search customers.
- Register and manage mobile devices.
- Maintain technician information.
- Create job cards and update repair progress.
- Prepare estimates and review their approval status.
- Manage spare parts and job-part assignments.
- Record payments and access eligible receipts.
- Maintain warranty records.
- Share repair tracking links with customers.

### 3. Customer

The Customer role allows registered customers to access their own repair information.

- Register and log in to an account.
- View registered devices.
- Track repair progress.
- Review estimates and approve or reject them.
- View payment records.
- Access eligible PDF payment receipts.
- View warranty information.

## Key Features

### Authentication and Authorization
- User login and customer registration.
- JWT-based authentication.
- Role-based access for Admin, Staff, and Customer.

### Customer and Device Management
- Customer registration and record management.
- Mobile device registration and search.
- Device information associated with customer records.

### Repair Job Management
- Repair job card creation and management.
- Repair status updates.
- Repair status history.
- Technician assignment according to the implemented workflow.

### Estimate Management
- Repair cost estimate creation.
- Customer estimate approval or rejection.
- Estimate status tracking.

### Inventory Management
- Spare parts management.
- Stock quantity updates.
- Assignment of spare parts to repair jobs.
- Stock adjustments through supported job-part operations.

### Payments and Receipts
- Payment record management.
- Payment status tracking.
- PDF receipt generation for eligible payments marked as paid.

### Warranty Management
- Warranty records associated with eligible completed repairs.
- Warranty information and status viewing.

### QR Code and Repair Tracking
- QR code-based repair tracking.
- Shareable repair tracking links.
- Public tracking page for permitted repair information.
- WhatsApp sharing through a prepared message that the user sends manually.

### Reports and Audit Logs
- Repair status distribution.
- Revenue and payment summaries.
- Repair performance information.
- Inventory summaries.
- CSV export where supported.
- Audit logs for selected system activities.

## Application Workflow

1. The user opens the application and logs in with the appropriate account.
2. Admin or Staff registers a customer and the customer's mobile device.
3. A job card is created to record the reported repair problem.
4. The repair status is updated as the job progresses.
5. An estimate is created and made available to the customer.
6. The customer reviews the estimate and approves or rejects it.
7. Required spare parts are assigned to the repair job.
8. The repair proceeds through the applicable repair and quality-check stages.
9. Once the job is completed, payment and warranty operations can be performed according to the application's rules.
10. A PDF receipt can be accessed for an eligible payment marked as paid.
11. Customers can track their repairs through the customer dashboard or a public tracking link.
12. Admin can review reports, manage user roles, and inspect audit logs.

## Project Structure

The following is a simplified overview of the project directories.

```text
mobile-repair-centre/
├── backend/
│   ├── apps/
│   │   ├── accounts/
│   │   ├── billing/
│   │   ├── customers/
│   │   ├── inventory/
│   │   ├── repairs/
│   │   └── reports/
│   ├── config/
│   ├── manage.py
│   ├── requirements.txt
│   └── ...
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   └── ...
│   ├── package.json
│   ├── package-lock.json
│   └── ...
├── documentation/
│   └── ...
├── .gitignore
└── README.md
```

*Note: This is a simplified directory overview. Refer to the repository for the complete structure.*

## Prerequisites

Install the following software before setting up the project:

- Python
- Node.js and npm
- MySQL Server
- Git

## Installation and Setup

### Step 1: Clone the Repository

Open a terminal and execute:

```bash
git clone https://github.com/snehalBedage/mobile-repair-centre.git
cd mobile-repair-centre
```

### Step 2: Set Up the MySQL Database

1. Start MySQL Server.
2. Create the database configured for the application. The local project uses the database name `mobile_repair_db`.
3. Note the database username and password.
4. Configure the backend environment variables using the names expected by the project settings.

Example SQL command:

```sql
CREATE DATABASE mobile_repair_db;
```

If the database already exists, do not create it again.

### Step 3: Set Up the Backend

Navigate to the backend directory:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv venv
```

Activate the environment on Windows:

```bash
venv\Scripts\activate
```

Install the required Python packages:

```bash
pip install -r requirements.txt
```

Configure the required environment variables, including the Django secret key, database credentials, and other settings used by the application.

Run database migrations:

```bash
python manage.py migrate
```

Start the Django development server:

```bash
python manage.py runserver
```

The backend development server is commonly available at:

`http://127.0.0.1:8000/`

### Step 4: Set Up the Frontend

Open a separate terminal and navigate to the frontend directory from the project root:

```bash
cd frontend
```

Install the frontend dependencies:

```bash
npm install
```

Configure the frontend API base URL according to the project's existing API service and environment settings.

Start the Vite development server:

```bash
npm run dev
```

Open the local URL displayed in the terminal. Vite commonly uses:

`http://localhost:5173/`

### Step 5: Access the Application

1. Ensure that the backend server is running.
2. Ensure that the frontend development server is running.
3. Open the frontend URL in a web browser.
4. Use the Login page to access the application.
5. New customers can register through the customer registration option.

Use valid credentials configured for the application. Create an administrator or staff account using the project's supported account-management process.

## Environment Configuration

The application may require environment variables for the following settings:

- Django secret key and debug configuration.
- Allowed hosts.
- MySQL database name, username, password, host, and port.
- CORS configuration.
- Email settings, where email functionality is enabled.
- Frontend API base URL.

Use the exact variable names expected by the existing source code. Keep actual credentials and secret keys out of the repository.

Do not upload `.env` files containing passwords, API keys, email app passwords, or other private credentials.

## Database Overview

The application uses MySQL with Django models and migrations to manage its database schema.

The main database entities include:

- Users
- Customers
- Devices
- Technicians
- Job Cards
- Estimates
- Spare Parts
- Job Parts
- Payments
- Warranties
- Status History
- Audit Logs

These entities support authentication, customer and device records, repair operations, inventory, billing, warranty management, and activity tracking.

## Security

- JWT-based authentication is used for authenticated API access.
- Role-based permissions restrict access to protected functionality.
- Customer information is associated with the appropriate customer account.
- Sensitive configuration should be stored in environment variables.
- Public repair tracking should expose only the information permitted by the application.
- Credentials and private configuration files should not be committed to GitHub.

## Testing

The application should be verified using the following functional and access-control tests:

- Login and customer registration.
- Access restrictions for Admin, Staff, and Customer roles.
- Customer and device record management.
- Technician management and assignment rules.
- Job card creation and status updates.
- Status history recording.
- Estimate creation and customer approval or rejection.
- Spare-part stock updates and job-part assignments.
- Payment creation and PDF receipt access.
- Warranty creation and viewing.
- QR code and public tracking access.
- Report generation and CSV export.
- Audit log access restrictions.

## Future Enhancements

Potential future enhancements may include:

- Production deployment and configuration improvements.
- Additional report filters and analytics.
- Further improvements to customer notifications.
- Enhancements to the repair tracking interface.

## Project Repository

GitHub Repository:

https://github.com/snehalBedage/mobile-repair-centre

## Project Information

**Project Title:** Mobile Repair Centre Web Application

**Domain:** Python Full Stack Development

**Internship Organization:** ZOYASOFTS TECHNOLOGIES

**Developer:** Snehal Shivaji Bedage

**Course:** Bachelor of Computer Application (BCA)

