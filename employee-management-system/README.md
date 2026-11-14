# WorkPulse — Enterprise Employee Management System (EMS)

A complete, production-ready, full-stack **Employee Management System** built with **React, Vite, Tailwind CSS, Node.js, Express, PostgreSQL, and Prisma ORM**.

---

## 1. Project Overview & Objectives

WorkPulse is designed to streamline corporate HR operations, workforce tracking, department management, and employee appraisal reviews. The system implements secure role-based access control (RBAC) separating administrative oversight from employee self-service capabilities.

### Objectives
- **Centralized Workforce Directory**: Maintain employee profiles, compensations, designations, and contact channels.
- **Department Oversight**: Manage organizational units and maintain employee headcount integrity.
- **Performance Appraisals**: Conduct periodic evaluations, track rating metrics, and record goal progress.
- **Reporting & Analytics**: Real-time workforce metrics, Recharts visual analytics, and CSV report exports.
- **Role-Based Security**: Strict isolation between Admin management and Employee personal workspaces.

---

## 2. Technology Stack

### Frontend
- **React.js 18** with **Vite** for rapid bundling and hot module replacement.
- **Tailwind CSS** for modern, responsive, mobile-first design.
- **React Router v6** for client-side routing, protected routes, and role-based redirects.
- **Axios** with global request/response interceptors for automatic Bearer JWT handling.
- **Recharts** for real-time analytics charts (Bar charts and Pie charts).
- **Lucide React** for icons.

### Backend
- **Node.js** & **Express.js** adhering to strict **MVC architecture** (Routes, Controllers, Services, Middleware).
- **Prisma ORM** for type-safe database queries, schema migrations, and relational integrity.
- **PostgreSQL** relational database.
- **JWT (JSON Web Tokens)** for stateless authentication with access & refresh token support.
- **bcryptjs** (10 salt rounds) for password hashing.
- **express-validator** for request payload validation.
- **express-rate-limit** & **Helmet** for API rate limiting and security headers.
- **json2csv** for generating formatted CSV exports.

### Testing
- **Jest** test runner with 36 unit tests across auth, employees, departments, and evaluations.
- Isolated mocking of database operations for fast CI/CD execution.

---

## 3. System Architecture

```
employee-management-system/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # PostgreSQL models & relationships
│   │   └── seed.js                # Database seeder with sample depts & employees
│   ├── src/
│   │   ├── config/                # Database & constant configurations
│   │   ├── controllers/           # HTTP handlers (Auth, Employee, Dept, Dashboard, Reports)
│   │   ├── middleware/            # Auth, Role, Error & Validation middleware
│   │   ├── routes/                # Express API route declarations
│   │   ├── services/              # Business logic & database transactions
│   │   ├── utils/                 # Standardized response format, JWT & pagination helpers
│   │   ├── validators/            # express-validator schemas
│   │   ├── tests/                 # Comprehensive Jest test suite
│   │   ├── app.js                 # Express application assembly
│   │   └── server.js              # Server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/            # Reusable UI (Cards, Tables, Modals, Badges, Pagination)
│   │   ├── context/               # AuthContext & ToastContext providers
│   │   ├── layouts/               # MainLayout (Sidebar + Navbar)
│   │   ├── pages/                 # Admin & Employee portal pages
│   │   ├── services/              # Axios API client
│   │   ├── App.jsx                # Route declarations & role gates
│   │   ├── main.jsx               # Entry point
│   │   └── index.css              # Tailwind directives
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── docker-compose.yml             # Single-command PostgreSQL container setup
├── .env.example                   # Master environment variables template
└── README.md                      # Comprehensive documentation
```

---

## 4. Database Schema (Prisma & PostgreSQL)

The database models are defined in `backend/prisma/schema.prisma`:

### Tables & Relationships
1. **`users`**:
   - `id` (PK, cuid)
   - `email` (Unique, Indexed)
   - `password` (Hashed with bcrypt)
   - `role` (`ADMIN` | `EMPLOYEE`)
   - `isActive` (Boolean)
   - *1-to-1 relationship with `Employee`*

2. **`departments`**:
   - `id` (PK, cuid)
   - `name` (Unique, Indexed)
   - `description` (Text)
   - *1-to-many relationship with `Employee`*

3. **`employees`**:
   - `id` (PK, cuid)
   - `employeeId` (Unique formatted string, e.g. `EMP0001`, Indexed)
   - `firstName`, `lastName`, `email` (Unique), `phone`
   - `designation`, `salary` (Decimal), `status` (`ACTIVE` | `INACTIVE` | `ON_LEAVE` | `TERMINATED`)
   - `joiningDate` (DateTime), `address` (Text)
   - `userId` (FK to `users.id`, Cascade delete)
   - `departmentId` (FK to `departments.id`)
   - *1-to-many relationship with `PerformanceEvaluation`*

4. **`performance_evaluations`**:
   - `id` (PK, cuid)
   - `employeeId` (FK to `employees.id`, Cascade delete)
   - `evaluationDate` (DateTime, Indexed)
   - `rating` (`EXCELLENT` | `GOOD` | `AVERAGE` | `BELOW_AVERAGE` | `POOR`)
   - `score` (Integer, 0-100)
   - `comments`, `goals`, `achievements` (Text)
   - `evaluatorName` (String)

---

## 5. REST API Documentation

All API responses follow a standardized JSON envelope:
```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... },
  "pagination": { "total": 25, "page": 1, "limit": 10, "totalPages": 3 }
}
```

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user account |
| `POST` | `/api/auth/login` | Public | Sign in and retrieve Bearer JWT & refresh token |
| `POST` | `/api/auth/refresh` | Public | Refresh expired access token |
| `POST` | `/api/auth/logout` | Authenticated | Terminate session |
| `GET` | `/api/auth/me` | Authenticated | Get current authenticated user profile |

### Employees (`/api/employees`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/employees` | Admin | List employees (supports `?page=1&limit=10&search=&departmentId=&status=`) |
| `POST` | `/api/employees` | Admin | Create employee (creates both User and Employee profile via transaction) |
| `GET` | `/api/employees/:id` | Admin | Retrieve single employee with evaluations & department |
| `PUT` | `/api/employees/:id` | Admin | Update employee fields (designation, salary, department, etc.) |
| `DELETE`| `/api/employees/:id` | Admin | Delete employee (cascades user and appraisal records) |
| `GET` | `/api/employees/me` | Authenticated | Retrieve logged-in employee's own profile |
| `PATCH`| `/api/employees/me` | Authenticated | Employee self-update (permitted: `phone`, `address`) |

### Departments (`/api/departments`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/departments` | Authenticated | List all departments with employee counts |
| `GET` | `/api/departments/:id`| Authenticated | Get department details and member list |
| `POST` | `/api/departments` | Admin | Create a new department |
| `PUT` | `/api/departments/:id`| Admin | Update department name and description |
| `DELETE`| `/api/departments/:id`| Admin | Delete department (prevents deletion if employees are assigned) |

### Performance Reviews (`/api/evaluations`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/evaluations` | Admin | List evaluations with pagination & employee filter |
| `POST` | `/api/evaluations` | Admin | Create an appraisal record |
| `GET` | `/api/evaluations/:id`| Authenticated | Get evaluation details |
| `GET` | `/api/evaluations/employee/:id` | Authenticated | Get all evaluations for specific employee |
| `GET` | `/api/evaluations/employee/:id/stats` | Authenticated | Compute average score & rating counts |
| `DELETE`| `/api/evaluations/:id`| Admin | Delete evaluation |

### Analytics & Reports (`/api/dashboard`, `/api/reports`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/stats` | Admin | Summary counts, department stats, status distribution, monthly hires |
| `GET` | `/api/reports/employees` | Admin | Filtered employee report dataset |
| `GET` | `/api/reports/employees/export` | Admin | Export workforce report as downloadable CSV |

---

## 6. Installation & Setup Guide

### Prerequisites
- **Node.js** v18+ or v20+
- **npm** v9+
- **PostgreSQL** v14+ (or Docker)

### Step 1: Database Setup
You can run PostgreSQL locally or launch it via Docker Compose:
```bash
cd employee-management-system
docker compose up -d
```
*This launches a PostgreSQL 16 container at `localhost:5432` with database `employee_management_db`.*

### Step 2: Backend Setup
```bash
cd employee-management-system/backend

# Create .env from template
cp ../.env.example .env

# Generate Prisma Client
npx prisma generate

# Apply database schema
npx prisma db push

# Seed sample data (Admin + 5 Employees + Departments + Evaluations)
npm run prisma:seed
```

### Step 3: Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run at: **http://localhost:5173**  
The backend will run at: **http://localhost:5000**

---

## 7. Default Credentials

The database seed provides two ready-to-use accounts:

| Role | Email | Password |
|---|---|---|
| **System Admin** | `admin@company.com` | `Admin@123` |
| **Employee** | `john.doe@company.com` | `Employee@123` |

*(The login screen also includes convenient 1-click demo credential fill buttons!)*

---

## 8. Running Automated Tests

To run the complete test suite:
```bash
cd employee-management-system/backend
npm test
```

All 36 unit tests cover:
- Authentication, token generation, password verification, duplicate check
- Employee creation transactions, unique ID generation, pagination, self-updates
- Department CRUD, duplicate prevention, relational delete blocking
- Performance evaluation recording and statistical averages computation

---

## 9. Security Implementations

1. **Password Hashing**: Salts and hashes passwords with `bcryptjs` (10 rounds). Plaintext passwords are never stored or returned in responses.
2. **Stateless JWT**: Bearer tokens with expiration and signature verification.
3. **Role-Based Access Control (RBAC)**: Route middleware validates user privileges before accessing administrative controllers.
4. **Input Sanitization & Validation**: `express-validator` validates emails, string lengths, and data types on all incoming payloads.
5. **Rate Limiting**: `express-rate-limit` prevents brute-force login attempts (100 requests per 15 minutes).
6. **HTTP Security Headers**: `helmet` guards against clickjacking, cross-site scripting (XSS), and MIME-sniffing.
7. **CORS Isolation**: Restricts API calls strictly to the frontend origin.

---

## 10. Troubleshooting

- **Database connection error**: Verify that PostgreSQL is running on port 5432 and the `DATABASE_URL` credentials in `backend/.env` match your PostgreSQL password.
- **Port 5000 in use**: You can customize `PORT=5001` in `backend/.env` and update the proxy in `frontend/vite.config.js`.
- **CORS Error**: Ensure `FRONTEND_URL="http://localhost:5173"` in `backend/.env`.
