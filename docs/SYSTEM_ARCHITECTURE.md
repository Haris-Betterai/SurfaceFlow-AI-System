# SurfaceFlow AI System – System Architecture Documentation

**Version:** 1.0  
**Date:** December 9, 2025  
**Status:** Draft

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Goals](#2-system-goals)
3. [Tech Stack](#3-tech-stack)
4. [High-Level Architecture](#4-high-level-architecture)
5. [Component Breakdown](#5-component-breakdown)
6. [Database Design](#6-database-design)
7. [API Design](#7-api-design)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Automation Orchestration](#9-automation-orchestration)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Security Considerations](#11-security-considerations)
12. [Monitoring & Logging](#12-monitoring--logging)

---

## 1. Overview

The **SurfaceFlow AI System** is a modular automation platform designed to streamline business workflows by connecting browser-based triggers (Chrome Extension) with backend automation modules. The system enables users to trigger complex automations directly from web applications (starting with Buildertrend) with a single click.

### Key Characteristics

- **Modular Architecture**: Each automation is an independent, pluggable module
- **Browser-Initiated**: Chrome Extension triggers automations from web pages
- **Centralized Portal**: Single backend for all automation management, monitoring, and audit
- **Extensible**: Designed to support 2 to 200+ automation modules over time

---

## 2. System Goals

| Goal | Description |
|------|-------------|
| **One-Click Automation** | Users trigger complex workflows from web apps without manual data entry |
| **Audit Trail** | Every automation action is logged with full traceability |
| **Writeback Capability** | Results are written back to source systems (e.g., Buildertrend) |
| **Modular Growth** | New automations can be added without re-architecting the core |
| **Real-Time Feedback** | Users see progress and results in the extension UI |

---

## 3. Tech Stack

### Backend

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Web Framework** | Django 5.x | Admin portal, user management, internal views |
| **API Framework** | FastAPI | High-performance async APIs for extension |
| **ORM** | SQLAlchemy 2.x | Database models and queries |
| **Migrations** | Alembic | Schema versioning and migrations |
| **Database** | MySQL 8.x | Primary data store |
| **Cache** | Redis | Session cache, task queues, rate limiting |
| **Task Queue** | Celery | Background job processing |
| **Auth** | JWT (python-jose) | Stateless authentication tokens |

### Chrome Extension

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Manifest** | V3 | Chrome Extension standard |
| **UI** | HTML/CSS/JavaScript | Popup and injected UI components |
| **Communication** | Fetch API | REST calls to FastAPI backend |
| **Storage** | chrome.storage | Local token and preference storage |

### Infrastructure

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Containerization** | Docker + Docker Compose | Local dev and deployment |
| **Web Server** | Nginx | Reverse proxy, SSL termination |
| **Process Manager** | Gunicorn + Uvicorn | Django + FastAPI workers |

---

## 4. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SURFACEFLOW AI SYSTEM                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────────┐                                                      │
│   │  Chrome Extension│                                                      │
│   │  (Trigger Layer) │                                                      │
│   └────────┬─────────┘                                                      │
│            │ HTTPS (JWT Auth)                                               │
│            ▼                                                                │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         BACKEND SERVICES                            │   │
│   │  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │   │
│   │  │   Django    │    │   FastAPI   │    │   Celery Workers        │  │   │
│   │  │   (Admin)   │    │   (APIs)    │    │   (Background Tasks)    │  │   │
│   │  └──────┬──────┘    └──────┬──────┘    └───────────┬─────────────┘  │   │
│   │         │                  │                       │                │   │
│   │         └──────────────────┼───────────────────────┘                │   │
│   │                            │                                        │   │
│   │                    ┌───────▼───────┐                                │   │
│   │                    │  SQLAlchemy   │                                │   │
│   │                    │    (ORM)      │                                │   │
│   │                    └───────┬───────┘                                │   │
│   │                            │                                        │   │
│   └────────────────────────────┼────────────────────────────────────────┘   │
│                                │                                            │
│                        ┌───────▼───────┐                                    │
│                        │    MySQL      │                                    │
│                        │   Database    │                                    │
│                        └───────────────┘                                    │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     AUTOMATION MODULES                              │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │   │
│   │  │  AM-002      │  │  AM-003      │  │  AM-XXX      │               │   │
│   │  │  Hotel       │  │  Permits     │  │  Future      │               │   │
│   │  │  Booking     │  │  (Future)    │  │  Modules     │               │   │
│   │  └──────────────┘  └──────────────┘  └──────────────┘               │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     EXTERNAL INTEGRATIONS                           │   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐             │   │
│   │  │Buildertrend│ │  OTAs   │  │  Twilio  │  │ Accounting│            │   │
│   │  │   API    │  │ (Hotels) │  │  (SMS)   │  │  System   │            │   │
│   │  └──────────┘  └──────────┘  └──────────┘  └──────────┘             │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Component Breakdown

### 5.1 Chrome Extension (Trigger Layer)

**Purpose**: Detect context from web applications and trigger automations

| Responsibility | Description |
|----------------|-------------|
| Context Detection | Identify current page type (Job Detail, To-Do, etc.) |
| Data Capture | Extract job ID, address, crew info, dates from page |
| UI Injection | Add "Automations" button/panel on supported pages |
| API Communication | Send automation requests to FastAPI backend |
| User Feedback | Show progress, success, and error notifications |

### 5.2 Django Portal (Admin Layer)

**Purpose**: Internal administration and management

| Responsibility | Description |
|----------------|-------------|
| Admin Dashboard | View all automations, jobs, users, audit logs |
| User Management | Create/edit users, assign roles and permissions |
| Module Registry | Enable/disable automation modules, configure settings |
| Audit Viewer | Search and view automation history |

### 5.3 FastAPI (API Layer)

**Purpose**: High-performance async API for extension and integrations

| Responsibility | Description |
|----------------|-------------|
| Authentication | JWT token issuance and validation |
| Automation Triggers | Receive and validate automation requests |
| Module Routing | Route requests to appropriate automation modules |
| Webhook Handlers | Receive callbacks from external services |
| Real-time Updates | WebSocket support for live progress updates |

### 5.4 Celery Workers (Task Layer)

**Purpose**: Execute long-running automation workflows

| Responsibility | Description |
|----------------|-------------|
| Workflow Execution | Run multi-step automation workflows |
| External API Calls | Query OTAs, send SMS, call Buildertrend API |
| Retry Logic | Handle failures with exponential backoff |
| Result Storage | Store automation results and artifacts |

### 5.5 Automation Modules

**Purpose**: Self-contained automation logic packages

Each module contains:
- **Input Schema**: Required data from trigger source
- **Workflow Steps**: Ordered list of operations
- **Output Schema**: Result structure
- **Writeback Config**: How to update source system
- **Error Handlers**: Module-specific error handling

---

## 6. Database Design

### 6.1 Core Tables

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATABASE SCHEMA                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐       ┌─────────────────┐                          │
│  │     users       │       │     roles       │                          │
│  ├─────────────────┤       ├─────────────────┤                          │
│  │ id (PK)         │       │ id (PK)         │                          │
│  │ email           │◄──────│ name            │                          │
│  │ hashed_password │       │ permissions     │                          │
│  │ role_id (FK)    │       │ created_at      │                          │
│  │ is_active       │       └─────────────────┘                          │
│  │ created_at      │                                                    │
│  └─────────────────┘                                                    │
│           │                                                             │
│           │ 1:N                                                         │
│           ▼                                                             │
│  ┌─────────────────┐       ┌─────────────────┐                          │
│  │ automation_jobs │       │ module_registry │                          │
│  ├─────────────────┤       ├─────────────────┤                          │
│  │ id (PK)         │       │ id (PK)         │                          │
│  │ job_id (UUID)   │       │ module_id       │                          │
│  │ module_id (FK)  │◄──────│ name            │                          │
│  │ user_id (FK)    │       │ description     │                          │
│  │ status          │       │ version         │                          │
│  │ input_data      │       │ is_enabled      │                          │
│  │ output_data     │       │ config          │                          │
│  │ error_message   │       │ created_at      │                          │
│  │ started_at      │       └─────────────────┘                          │
│  │ completed_at    │                                                    │
│  │ created_at      │                                                    │
│  └─────────────────┘                                                    │
│           │                                                             │
│           │ 1:N                                                         │
│           ▼                                                             │
│  ┌─────────────────┐       ┌─────────────────┐                          │
│  │   audit_logs    │       │  job_artifacts  │                          │
│  ├─────────────────┤       ├─────────────────┤                          │
│  │ id (PK)         │       │ id (PK)         │                          │
│  │ job_id (FK)     │       │ job_id (FK)     │                          │
│  │ action          │       │ file_type       │                          │
│  │ actor_id        │       │ file_path       │                          │
│  │ details         │       │ metadata        │                          │
│  │ timestamp       │       │ created_at      │                          │
│  └─────────────────┘       └─────────────────┘                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Key Tables Description

| Table | Purpose |
|-------|---------|
| `users` | System users (extension users, admins) |
| `roles` | Role definitions with permission sets |
| `module_registry` | Registered automation modules and their config |
| `automation_jobs` | Individual automation execution records |
| `audit_logs` | Detailed action logs for compliance |
| `job_artifacts` | Files/documents generated by automations |

---

## 7. API Design

### 7.1 API Structure

```
/api/v1/
├── /auth/
│   ├── POST   /login          # Get JWT token
│   ├── POST   /refresh         # Refresh token
│   └── POST   /logout          # Invalidate token
│
├── /users/
│   ├── GET    /me              # Current user profile
│   └── PUT    /me              # Update profile
│
├── /modules/
│   ├── GET    /                # List enabled modules
│   └── GET    /{module_id}     # Module details & config
│
├── /automations/
│   ├── POST   /trigger         # Trigger an automation
│   ├── GET    /{job_id}        # Get job status
│   ├── GET    /{job_id}/logs   # Get job audit logs
│   └── POST   /{job_id}/cancel # Cancel running job
│
├── /buildertrend/              # Buildertrend-specific endpoints
│   ├── POST   /hotel-booking/run
│   ├── POST   /hotel-booking/approve
│   └── GET    /hotel-booking/{job_id}/status
│
└── /webhooks/
    ├── POST   /twilio/sms      # SMS callback
    └── POST   /ota/booking     # OTA confirmation callback
```

### 7.2 Standard Response Format

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "request_id": "uuid",
    "timestamp": "ISO8601"
  }
}
```

---

## 8. Authentication & Authorization

### 8.1 Authentication Flow

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Extension  │         │   FastAPI    │         │   Database   │
└──────┬───────┘         └──────┬───────┘         └──────┬───────┘
       │                        │                        │
       │  POST /auth/login      │                        │
       │  {email, password}     │                        │
       │───────────────────────▶│                        │
       │                        │  Verify credentials    │
       │                        │───────────────────────▶│
       │                        │◀───────────────────────│
       │                        │                        │
       │  {access_token, ...}   │                        │
       │◀───────────────────────│                        │
       │                        │                        │
       │  API Request           │                        │
       │  Authorization: Bearer │                        │
       │───────────────────────▶│                        │
       │                        │  Validate JWT          │
       │                        │  Check permissions     │
       │  Response              │                        │
       │◀───────────────────────│                        │
```

### 8.2 Permission Model

| Role | Permissions |
|------|-------------|
| `admin` | Full access to all modules and settings |
| `manager` | Run automations, view all jobs, approve requests |
| `user` | Run assigned automations, view own jobs |
| `viewer` | Read-only access to dashboard |

---

## 9. Automation Orchestration

### 9.1 Job Lifecycle

```
┌─────────┐    ┌──────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐
│ PENDING │───▶│ RUNNING  │───▶│ APPROVAL  │───▶│ EXECUTING │───▶│ COMPLETED │
└─────────┘    └──────────┘    │ _REQUIRED │    └───────────┘    └───────────┘
                               └───────────┘           │
                                    │                  │
                                    ▼                  ▼
                               ┌───────────┐    ┌───────────┐
                               │ REJECTED  │    │  FAILED   │
                               └───────────┘    └───────────┘
```

### 9.2 Job States

| State | Description |
|-------|-------------|
| `pending` | Job created, waiting to start |
| `running` | Workflow is executing |
| `approval_required` | Waiting for human approval (e.g., SMS) |
| `executing` | Post-approval execution (e.g., booking) |
| `completed` | Successfully finished |
| `failed` | Error occurred, see error_message |
| `rejected` | Approval was denied |
| `cancelled` | User cancelled the job |

---

## 10. Deployment Architecture

### 10.1 Container Structure

```yaml
services:
  nginx:          # Reverse proxy, SSL
  django:         # Admin portal (Gunicorn)
  fastapi:        # API service (Uvicorn)
  celery-worker:  # Background tasks
  celery-beat:    # Scheduled tasks
  redis:          # Cache & message broker
  mysql:          # Primary database
```

### 10.2 Environment Tiers

| Environment | Purpose | Database |
|-------------|---------|----------|
| `development` | Local development | Local MySQL/Docker |
| `staging` | Pre-production testing | Staging MySQL |
| `production` | Live system | Production MySQL (RDS) |

---

## 11. Security Considerations

### 11.1 Data Protection

- All traffic over HTTPS (TLS 1.2+)
- Passwords hashed with bcrypt
- Sensitive data encrypted at rest (AES-256)
- No PCI data stored directly (tokenized via provider)

### 11.2 API Security

- JWT tokens with short expiry (15 min access, 7 day refresh)
- Rate limiting per user/IP
- Input validation on all endpoints
- CORS restricted to extension origin

### 11.3 Extension Security

- Manifest V3 with minimal permissions
- Content Security Policy enforced
- No inline script execution
- Secure token storage via chrome.storage

---

## 12. Monitoring & Logging

### 12.1 Metrics

| Metric | Description |
|--------|-------------|
| `automation_jobs_total` | Count of jobs by module and status |
| `automation_duration_seconds` | Job execution time histogram |
| `api_request_duration` | API latency by endpoint |
| `error_rate` | Errors per minute by service |

### 12.2 Alerting

| Alert | Condition | Severity |
|-------|-----------|----------|
| High failure rate | >10% failures in 5 min | Critical |
| API latency spike | p95 > 5s for 5 min | Warning |
| Database connection errors | Any connection failure | Critical |
| Celery queue backup | >100 pending tasks | Warning |

### 12.3 Log Structure

```json
{
  "timestamp": "2025-12-09T10:30:00Z",
  "level": "INFO",
  "service": "fastapi",
  "request_id": "uuid",
  "user_id": "uuid",
  "message": "Automation triggered",
  "extra": {
    "module_id": "AM-002",
    "job_id": "uuid"
  }
}
```

---

## Appendix A: Folder Structure

```
surfaceflow-ai/
├── docs/                      # Documentation
├── portal/                    # Backend monorepo
│   ├── alembic/               # Database migrations
│   ├── app/
│   │   ├── api/               # FastAPI routes
│   │   │   └── v1/
│   │   │       └── endpoints/
│   │   ├── core/              # Config, security, deps
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Business logic
│   │   ├── automations/       # Automation modules
│   │   │   ├── base.py        # Base module class
│   │   │   └── buildertrend/
│   │   │       └── hotel_booking/
│   │   └── tasks/             # Celery tasks
│   ├── django_admin/          # Django admin app
│   ├── tests/
│   ├── requirements.txt
│   ├── docker-compose.yml
│   └── .env.example
└── extension/                 # Chrome Extension
    ├── manifest.json
    ├── background/
    ├── content/
    ├── popup/
    └── assets/
```

---

**End of System Architecture Documentation**
