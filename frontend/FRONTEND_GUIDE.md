# ATLAS Frontend Guide

This directory contains the React frontend for the ATLAS application, built with Vite.

## Directory Structure

- **src/components/**: Reusable UI components (Button, Card, Navbar, etc.).
- **src/pages/**: Main application pages (Login, Dashboard, Attendance views).
- **src/services/**: API service modules for backend communication.
- **src/context/**: React Context providers (AuthContext).
- **src/styles/**: CSS files for styling.

## Styling System

The project uses a custom CSS variable-based design system.

- **Global Styles**: `src/index.css` (Variables, Reset, Typography, Utilities).
- **Employee Pages**: `src/styles/EmployeeStyles.css` (Mark Attendance, My Attendance).
- **Manager Pages**: `src/styles/ManagerStyles.css` (Dashboard, Approvals).

### Key CSS Variables
- Colors: `--primary`, `--secondary`, `--accent`, `--bg-primary`, `--text-primary`.
- Spacing: `--spacing-xs` to `--spacing-xl`.
- Glassmorphism: `--glass-bg`, `--glass-border`.

## Components

### Core Components
- **Button**: Standardized button with variants (primary, outline, danger, success).
- **Card**: Glassmorphism container for content.
- **StatusBadge**: Visual indicator for attendance/leave status.
- **LoadingSpinner**: Loading state indicator.
- **ProtectedRoute**: Route wrapper for authentication checks.

## Services

API calls are centralized in `src/services/attendanceService.js`.
- Uses `axios` for HTTP requests.
- Automatically attaches Firebase Auth token to requests.

## Deployment (Firebase Hosting)

The frontend is configured for Firebase Hosting.
1. Build the project: `npm run build`
2. Deploy: `firebase deploy --only hosting`
