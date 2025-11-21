# AI Agent Scheduling & Monitoring UI/UX Specification

## 1. Overview
This document outlines the user interface and user experience design for the **AI Agent Scheduling and Monitoring System** within the Naly platform. The system simplifies automation by allowing administrators to set the execution frequency for the built-in AI Reporter and Marketer agents, and monitor their performance and automated reviews.

## 2. User Personas & Stories

### Primary User: System Administrator / Content Manager
- **Goal**: Configure how often AI agents run and monitor their output.
- **Needs**:
  - Secure access to the admin panel.
  - Simple controls to set the frequency (period) for Reporter and Marketer.
  - Visibility into the latest runs and their status.
  - Automated quality assurance via AI Editor.

### User Stories
1.  **Secure Login**: As an admin, I want to log in with a username and password so that unauthorized users cannot change agent settings.
2.  **Set Schedule**: As an admin, I want to set the "Reporter" agent to run every 6 hours so I have fresh news 4 times a day.
3.  **Monitor Runs**: As an admin, I want to see a timeline of recent agent executions to verify they are running on schedule.
4.  **Automated Review**: As an admin, I want the **AI Editor** to automatically review every generated report and marketing strategy.
5.  **Review Feedback**: As an admin, I want to see the Editor's quality score for each run to quickly gauge content quality.
6.  **Manual Trigger**: As an admin, I want to manually trigger the Reporter or Marketer to run immediately for testing or urgent needs.

## 3. Information Architecture

### Sitemap
- **Login** (`/admin/login`)
- **Dashboard** (`/admin/dashboard`)
  - Agent Status Cards (Reporter, Marketer)
  - Recent Activity Feed
- **Agent Settings** (`/admin/agents`)
  - Configuration for Reporter (Period, Topics)
  - Configuration for Marketer (Period, Audience)
- **Monitoring**
  - Run History (`/admin/history`)
  - Run Details (`/admin/history/[runId]`)

### Data Models (Conceptual)

#### User (Admin)
- `id`: UUID
- `username`: String
- `passwordHash`: String

#### AgentConfig
- `id`: UUID
- `type`: Enum (REPORTER, MARKETER) (Unique Constraint)
- `schedule`: String (Cron expression or simple interval enum)
- `status`: Enum (ACTIVE, PAUSED)
- `params`: JSON (e.g., `{ "topic": "AI", "region": "US" }`)
- `updatedAt`: DateTime

#### AgentRun
- `id`: UUID
- `agentType`: Enum (REPORTER, MARKETER)
- `status`: Enum (QUEUED, RUNNING, COMPLETED, FAILED)
- `startTime`: DateTime
- `endTime`: DateTime
- `output`: JSON (The agent's generated content)
- `logs`: Array<LogEntry>
- `editorReview`: JSON (The AI Editor's output)
  - `score`: Number (0-100)
  - `status`: Enum (APPROVED, REJECTED, NEEDS_REVISION)
  - `feedback`: String

## 4. UI Specifications

### 4.0. Login Page (`/admin/login`)
**Purpose**: Secure entry point for administrators.

**Key Elements**:
- **Form**:
  - Username / Email field
  - Password field
  - "Sign In" button
- **Behavior**:
  - On success: Redirect to Dashboard.
  - On failure: Show error message.

### 4.1. Dashboard (`/admin/dashboard`)
**Purpose**: Overview of agent health and recent output quality.

**Key Elements**:
- **Agent Status Cards** (One for Reporter, One for Marketer):
  - **Header**: Agent Name & Icon
  - **Status**: Active/Paused Toggle
  - **Schedule**: "Runs every 6 hours"
  - **Next Run**: "in 2 hours"
  - **Last Run**: "Success (Score: 92)"
  - **Action**: "Run Now" button.
- **Recent Activity**:
  - List of the last 10 runs across all agents with Status, Editor Score, and Link to details.

### 4.2. Agent Settings (`/admin/agents`)
**Purpose**: Configure the behavior and frequency of the agents.

**Layout**:
- **Tabs/Sections**: Reporter Settings, Marketer Settings.

**Configuration Form (Per Agent)**:
1.  **Frequency**:
    - Dropdown: "Every Hour", "Every 6 Hours", "Daily", "Weekly", "Custom (Cron)".
2.  **Input Parameters**:
    - **Reporter**: Topic (e.g., "Crypto"), Region.
    - **Marketer**: Target Audience, Tone.
3.  **Review Thresholds**:
    - Minimum Score to Auto-Publish (e.g., 85).
4.  **Save Button**: Updates the `AgentConfig`.

### 4.3. Run History (`/admin/history`)
**Purpose**: Audit log of all automation.

**Key Elements**:
- **Table**:
  - Agent (Icon/Name)
  - Date/Time
  - Status (Success/Fail)
  - **Quality Score** (Color-coded gauge)
  - Actions: View Details.

### 4.4. Run Details (`/admin/history/[runId]`)
**Purpose**: Inspect content and review feedback.

**Layout**:
- **Header**: Reporter Run #402 | 10:00 AM | Score: 92/100
- **Content View**:
  - The generated article or marketing copy.
- **Editor Feedback Sidebar**:
  - "Strengths": ...
  - "Weaknesses": ...
  - "Suggestions": ...
- **Logs Tab**: Technical execution logs.

## 5. Technical Implementation Strategy

### Authentication
- **Library**: **NextAuth.js (v5)**.
- **Provider**: Credentials Provider (ID/Password).
- **Protection**:
  - Middleware to protect all `/admin/*` routes.
  - API route protection for `/api/admin/*` endpoints.

### Backend
- **Database**: `AgentConfig` table (2 rows: REPORTER, MARKETER) and `AgentRun` table.
- **Scheduler**:
  - Single Cron Job (e.g., every 10 mins) checks `AgentConfig`.
  - If `(LastRunTime + ScheduleInterval) <= Now`, trigger a new run.
- **Execution Flow**:
  1.  Scheduler triggers `runReporter()` or `runMarketer()`.
  2.  On completion, trigger `runEditor(output)`.
  3.  Store results in `AgentRun`.

### Frontend
- **Next.js App Router**:
  - `/admin/dashboard`: Server Component fetching config and recent runs.
  - `/admin/agents`: Client Component for form handling.

