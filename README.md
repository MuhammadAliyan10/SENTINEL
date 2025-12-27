<div align="center">

# SENTINEL

### University Access Control & Event Management System

**A comprehensive, enterprise-grade solution for managing university event access through secure digital passes and real-time QR code verification.**

---

[Overview](#overview) • [Architecture](#architecture) • [Features](#features) • [Technology Stack](#technology-stack) • [Getting Started](#getting-started) • [Documentation](#documentation)

</div>

---

## Overview

SENTINEL is a purpose-built access control platform designed to streamline the management of university events, specifically annual dinners and similar gatherings. The system replaces traditional paper-based ticketing with a modern, secure digital pass infrastructure that enables seamless entry verification while maintaining complete audit trails.

The platform addresses critical challenges faced by university event organizers:

- **Fraud Prevention**: Cryptographically signed QR codes prevent pass duplication and unauthorized sharing
- **Real-Time Monitoring**: Administrators can observe attendee flow as it happens
- **Financial Accountability**: Complete tracking of which staff member registered each student
- **Passback Prevention**: Intelligent detection of re-entry attempts when a student is already inside the venue

SENTINEL consists of two interconnected applications: a web portal for administration, registration, and student access, and a dedicated mobile application for security personnel to verify entry credentials.

---

## Architecture

The SENTINEL ecosystem is composed of two primary applications that work in concert:

### Web Application (sentinel-web)

The web application serves as the central nervous system of the platform. Built on Next.js 16, it provides distinct interfaces for multiple user roles:

| Role                          | Responsibilities                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Super Administrator**       | Complete system oversight, user management, real-time monitoring, audit log access, and system configuration |
| **Class Representative (CR)** | Male student registration, payment collection tracking, and roster management                                |
| **Girls Representative (GR)** | Female student registration, payment collection tracking, and roster management                              |
| **Student**                   | Digital pass access, profile completion, and QR code display for venue entry                                 |

### Mobile Application (sentinel-guard)

A purpose-built React Native application deployed on security personnel devices. Guards authenticate with administrative credentials and utilize the device camera to scan and validate student QR codes in real-time.

### Data Flow

```
Student Registration → CR/GR Web Portal → Database Record Created
                                              ↓
Student Login → Web Portal → Profile Completion → Digital Pass Generated
                                                        ↓
                            Security Guard Scan → Mobile App Validation → Access Granted/Denied
                                                        ↓
                                            Real-Time Dashboard Update → Audit Log Entry
```

---

## Features

### Administrative Command Center

The Super Administrator dashboard provides comprehensive event oversight capabilities:

- **Live Attendance Tracking**: Real-time visualization of entry and exit activity
- **Student Management**: Search, filter, and manage the complete student roster
- **Manager Oversight**: Create, modify, and deactivate CR/GR accounts with assigned sections
- **Guard Management**: Provision and manage security personnel accounts
- **Bulk Operations**: Import student data via CSV for rapid initial population
- **Audit Trail**: Immutable log of all administrative actions with performer identification
- **Export Functionality**: Generate attendance reports for currently present attendees

### Staff Registration Portal

Class Representatives and Girls Representatives access a streamlined interface designed for efficient student onboarding:

- **Issue New Pass**: Register students by entering SAP ID, name, and payment confirmation
- **Ledger View**: Complete list of students registered by the current manager
- **Financial Accountability**: Clear tracking of which manager collected payment from each student
- **Profile Management**: Update personal credentials and account settings

### Student Digital Pass

Students receive a premium digital experience through their personalized portal:

- **Animated Pass Display**: Interactive, physics-based card with realistic lanyard simulation
- **Time-Based QR Codes**: Cryptographically signed codes that refresh periodically to prevent screenshots
- **Flip Card Design**: Front displays QR code; reverse shows student identity and entry timestamp
- **Offline Support**: Progressive Web App technology ensures pass accessibility without network connectivity
- **Real-Time Status**: Automatic updates when entry or exit is recorded by security

### Security Guard Scanner

The mobile application provides guards with essential verification tools:

- **Dual Mode Operation**: Toggle between Entry and Exit modes for accurate logging
- **Instant Validation**: Immediate visual and haptic feedback upon scan
- **Detailed Results**: Display of student name, photo, and relevant details upon successful verification
- **Rejection Handling**: Clear indication of denial reason (unpaid, duplicate entry, invalid signature)
- **Scan History**: Log of all verifications performed during the current session
- **Rate Limiting**: Protection against brute-force login attempts

---

## Technology Stack

### Web Application

| Category       | Technology                            |
| -------------- | ------------------------------------- |
| Framework      | Next.js 16 (App Router)               |
| Language       | TypeScript                            |
| Database       | PostgreSQL via Supabase               |
| ORM            | Prisma                                |
| Authentication | Supabase Auth with Row Level Security |
| Styling        | Tailwind CSS 4                        |
| Components     | Radix UI with shadcn/ui               |
| Animations     | Framer Motion                         |
| QR Generation  | qrcode.react                          |
| Data Tables    | TanStack Table                        |
| Forms          | React Hook Form with Zod validation   |
| Charts         | Recharts                              |
| PWA            | next-pwa                              |

### Mobile Application

| Category       | Technology                             |
| -------------- | -------------------------------------- |
| Framework      | React Native with Expo SDK 54          |
| Navigation     | Expo Router                            |
| Language       | TypeScript                             |
| Styling        | NativeWind (Tailwind for React Native) |
| Camera         | Expo Camera                            |
| Haptics        | Expo Haptics                           |
| Secure Storage | Expo Secure Store                      |
| Backend        | Supabase client                        |

### Security Features

| Feature            | Implementation                                                   |
| ------------------ | ---------------------------------------------------------------- |
| QR Signature       | HMAC-based cryptographic signing using student activation tokens |
| Session Management | HTTP-only cookies with automatic token rotation                  |
| Rate Limiting      | Failed login tracking with progressive lockout                   |
| CSRF Protection    | Origin and referer validation on API routes                      |
| Audit Logging      | Immutable records with IP address and user agent capture         |
| Input Validation   | Zod schemas on all form submissions                              |

---

## Database Schema

SENTINEL utilizes a carefully designed PostgreSQL schema optimized for security and query performance:

### Core Entities

| Table             | Purpose                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `users`           | Unified storage for all user types with role-based field utilization |
| `access_logs`     | Immutable record of every scan attempt with status and type          |
| `audit_logs`      | Administrative action history for compliance and investigation       |
| `events`          | Event configuration including capacity, pricing, and branding        |
| `system_settings` | Dynamic configuration without deployment requirements                |

### User Roles

| Role        | Authentication Method     | Primary Function            |
| ----------- | ------------------------- | --------------------------- |
| SUPER_ADMIN | Email + Password          | Full system administration  |
| CR          | Email + Password          | Male student registration   |
| GR          | Email + Password          | Female student registration |
| GUARD       | Email + Password          | QR code verification        |
| STUDENT     | SAP ID + Activation Token | Digital pass access         |

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- PostgreSQL database (Supabase recommended)
- Expo CLI for mobile development

### Web Application Setup

```bash
# Navigate to web application directory
cd sentinel-web

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Push database schema
npm run db:push

# Start development server
npm run dev
```

### Mobile Application Setup

```bash
# Navigate to mobile application directory
cd sentinel-guard

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start Expo development server
npm start
```

### Initial Configuration

1. Create a Super Administrator account directly in Supabase Auth
2. Add corresponding user record in the `users` table with role `SUPER_ADMIN`
3. Login to the web application to access the administrative dashboard
4. Create CR/GR accounts for section managers
5. Create Guard accounts for security personnel
6. Import or manually add student records

---

## Documentation

Comprehensive documentation is available in the `docs` directory:

| Document              | Description                                 |
| --------------------- | ------------------------------------------- |
| [Web.md](docs/Web.md) | Complete web application flow documentation |
| [App.md](docs/App.md) | Mobile application flow documentation       |

---

## Security Considerations

SENTINEL implements multiple layers of security to protect event integrity:

1. **Authentication Isolation**: Different login portals for administrators, managers, and students prevent credential confusion
2. **Role Verification**: Every protected action validates the performer's role at execution time
3. **Cryptographic QR Codes**: Student passes cannot be forged without access to the secret activation token
4. **Passback Detection**: The system maintains state awareness to prevent a single pass from admitting multiple individuals
5. **Audit Immutability**: All security-relevant actions are logged to a tamper-evident audit trail
6. **Session Security**: HTTP-only cookies with automatic rotation minimize exposure window

---

## Project Structure

```
SENTINEL/
├── README.md                 # This document
├── docs/
│   ├── Web.md               # Web application documentation
│   └── App.md               # Mobile application documentation
├── sentinel-web/            # Next.js web application
│   ├── src/
│   │   ├── app/            # Next.js App Router pages
│   │   ├── components/     # React components
│   │   ├── actions/        # Server actions
│   │   ├── lib/            # Utility functions
│   │   └── middleware.ts   # Route protection
│   └── prisma/
│       └── schema.prisma   # Database schema
└── sentinel-guard/          # React Native mobile application
    ├── app/                 # Expo Router screens
    ├── components/          # React Native components
    └── src/                 # Utility functions
```

---

## License

This project is proprietary software developed for university event management. All rights reserved.

---

<div align="center">

**SENTINEL** — Securing University Events with Precision

</div>
