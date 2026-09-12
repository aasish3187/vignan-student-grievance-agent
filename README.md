# Vignan Student Grievance Redressal Agent (Agent 46)

Autonomous, policy-driven Student Grievance Redressal and Institutional Governance System designed for **Vignan's Foundation for Science, Technology & Research (VFSTR)**. Built for the Integrated AI Hackathon 2026.

[![Live Deployment](https://img.shields.io/badge/Live_Deployment-Active-success?style=for-the-badge&logo=render)](https://vignan-student-grievance-agent.onrender.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Live Production URL:** [https://vignan-student-grievance-agent.onrender.com/](https://vignan-student-grievance-agent.onrender.com/)

---

## System Architecture & Workflow Diagram

For the detailed multi-stage technical specification, see [WORKFLOW.md](./WORKFLOW.md).

![Agent 46: System Architecture & Workflow](public/assets/images/workflow-diagram.png)

```mermaid
flowchart TD
    %% Styling
    classDef intake fill:#e8f0fe,stroke:#1a3c7d,stroke-width:2px;
    classDef aiCore fill:#fef3e0,stroke:#d97706,stroke-width:2px;
    classDef auth fill:#e6f4ea,stroke:#137333,stroke-width:2px;
    classDef sla fill:#fce8e6,stroke:#c5221f,stroke-width:2px;
    classDef resolution fill:#f3e8fd,stroke:#7c3aed,stroke-width:2px;
    classDef mesh fill:#e0f2fe,stroke:#0284c7,stroke-width:2px;

    %% 1. INTAKE LAYER
    subgraph Intake["1. DUAL-TRACK INTAKE LAYER"]
        Student["Student / Complainant"] --> Choice{"Select Intake Mode"}
        Choice -->|Verified Mode| VerTrack["Verified Student Track\n• Full Name & Regd No\n• Contact & Department"]:::intake
        Choice -->|Anonymous Mode| AnonTrack["Whistleblower Track\n• Full Identity Redaction\n• Cryptographic 6-Digit PIN"]:::intake
        Robot["Robot AI Assistant\n(Interactive Guide)"] -.->|Answers Policy & SLA FAQs| Student
    end

    %% 2. AI CLASSIFICATION & ROUTING
    subgraph AICore["2. INTELLIGENT ROUTING & POLICY ENGINE"]
        VerTrack --> Guardrail["Guardrails & PII Sanitization"]:::aiCore
        AnonTrack --> Guardrail
        Guardrail --> Classifier["AI Classifier & Priority Scorer"]:::aiCore
        Classifier --> Tagging{"Determine Case Severity & Category"}
        Tagging -->|Academic / Departmental| R_HOD["Route: Department HoD\n(e.g., HoD CSE, ECE)"]:::auth
        Tagging -->|Campus-Wide / General| R_Dean["Route: Dean of Student Affairs\n(General Grievance Cell)"]:::auth
        Tagging -->|Ragging / Bullying / Harassment| R_Statutory["Route: Statutory Committees\n• Anti-Ragging Committee\n• Internal Complaints (ICC)"]:::auth
    end

    %% 3. DATABASE & SLA MONITORING
    subgraph StorageSLA["3. DATABASE & SLA MONITORING"]
        R_HOD --> DB[("SQLite Database\n(grievance.db)")]
        R_Dean --> DB
        R_Statutory --> DB
        
        CronEngine["Background Cron Engine\n(Active SLA Monitoring)"]:::sla -->|Monitors Deadlines| DB
        CronEngine --> BreachCheck{"Breach Detected?"}
        BreachCheck -->|Yes| Escalate["Auto-Escalate Severity\nNotify Higher Authority"]:::sla
        BreachCheck -->|No| Wait["Maintain Current Status"]
    end

    %% 4. AUTHORITY CASE DOSSIER & RESOLUTION
    subgraph AuthorityConsole["4. AUTHORITY CASE DOSSIER & RESOLUTION"]
        DB --> AuthLogin["Authority Authentication\n(HoDs, Deans, Chairs)"]:::auth
        AuthLogin --> Dossier["Interactive Case Dossier"]:::auth
        
        Precedents["AI Precedents Engine\n(Historical Rulings Retrieval)"]:::aiCore -->|Suggests Benchmarks| Dossier
        Dossier --> Action["Authority Action & Resolution Notes"]:::auth
        Action --> GenLetter["Generate Official University Order\n• Dispatch Ref: VFSTR/GRC/...\n• Statutory Seals & Findings\n• 15-Day Appellate Protocol"]:::resolution
    end

    %% 5. STUDENT NOTIFICATION & MANDATORY FEEDBACK
    subgraph StudentResolution["5. MANDATORY STUDENT FEEDBACK & CLOSURE"]
        GenLetter --> Notify["Student Case Tracking Portal\n(Status: RESOLVED)"]:::resolution
        Notify --> ViewLetter["Review Official University Order"]:::resolution
        ViewLetter --> Feedback["Mandatory Complainant Feedback\n• 1–5 Star Rating (Required)\n• Redressal Remarks"]:::resolution
        Feedback --> Closure["Official Case Closure\n(Status: CLOSED)"]:::resolution
        Closure --> DB
    end

    %% 6. MULTI-AGENT MESH INTEGRATION
    subgraph AgentMesh["6. UNIVERSITY MULTI-AGENT MESH INTEGRATION"]
        DB <-->|Grievance History| A44["Agent 44: Student 360 & Counseling"]:::mesh
        DB <-->|Hearing Agendas| A56["Agent 56: Statutory Committees"]:::mesh
        DB <-->|Defect Trends| A57["Agent 57: IQAC Quality Audits"]:::mesh
        A64["Agent 64: Physical Intake OCR"]:::mesh -->|Ingests Dropbox Scans| DB
        DB <-->|Academic Trends| A70["Agent 70: Academic Decision Support"]:::mesh
    end
```

---

## Key Features

### 1. Dual-Track Intake & Privacy Architecture
- **Verified Student Track**: Full tracking, department auto-mapping, and personalized SMS/Email alerts.
- **Whistleblower / Anonymous Mode**: Cryptographic 6-digit PIN verification allowing students to file sensitive complaints (e.g., Ragging, Harassment) with complete identity privacy.

### 2. Autonomous Governance & Routing Engine
- **Multi-Jurisdiction Routing**: Dynamic dispatch to Department Heads (HoD CSE, ECE, Mech, etc.), Dean of Student Affairs, Internal Complaints Committee (ICC), and Anti-Ragging Committees.
- **SLA Policy Enforcement**: UGC-mandated resolution deadlines with automated escalation rules upon SLA breach.

### 3. Institutional Decision Support & Precedent Engine
- **Precedent Retrieval**: Automated similarity analysis against historical rulings to assist committees with past decisions and disciplinary benchmarks.
- **Official Statutory Resolution Orders**: Automatic generation of official University Resolution Letters with dispatch numbers, legal framework citations, and 15-day appellate protocol.

### 4. Interactive Robot AI Assistant
- Floating 3D-styled interactive guide answering student queries regarding grievance policies, SLAs, anonymous tracking, and escalation hierarchies.

### 5. Inter-Agent Integration Suite
Built-in REST interfaces for university multi-agent mesh:
- **Agent 44**: Student 360 & Counseling Profile
- **Agent 56**: Statutory Hearing Agenda Feeds
- **Agent 57**: IQAC Quality Audits & NAAC Criteria 6.2 Compliance
- **Agent 64**: Physical Drop-box Intake OCR Ingestion
- **Agent 70**: Academic Decision Support

---

## Tech Stack
- **Backend**: Node.js, Express.js
- **Database**: SQLite (via `sql.js`) with persistent disk flushing
- **Frontend**: Vanilla JavaScript, Responsive CSS3, SVG vector geometry (Zero emojis)
- **Scheduling**: Node-Cron for continuous background SLA monitoring

---

## Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
```bash
# Clone the repository
git clone https://github.com/aasish3187/vignan-student-grievance-agent.git

# Navigate to project directory
cd vignan-student-grievance-agent

# Install dependencies
npm install

# Start the application
npm start
```
The server will start on `http://localhost:3000`.

---

## Default Authority Demo Credentials

| Role | Username | Jurisdiction | Password |
| :--- | :--- | :--- | :--- |
| **HoD (Computer Science)** | `hod.cse` | CSE Department Complaints | `vignan@2026` |
| **Dean of Student Affairs** | `dean.studentaffairs` | Campus-Wide Complaints | `vignan@2026` |
| **Anti-Ragging Committee Chair** | `chair.antiragging` | Anti-Ragging & Safety Cases | `vignan@2026` |
| **Women Protection Cell / ICC Chair** | `chair.icc` | Harassment & Gender Inequity | `vignan@2026` |

---

## Enterprise Campus Database Setup (Supabase / PostgreSQL)

For scaling to **25,000+ university campus students**, Agent 46 includes a production **Supabase (Managed PostgreSQL)** integration with zero-downtime dual-engine fallback.

### 1. Create a Free Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and create a free project.
2. In the Supabase dashboard, open the **SQL Editor**.
3. Open [`supabase/schema.sql`](./supabase/schema.sql), copy its contents, paste into the SQL Editor, and click **Run**.

### 2. Connect to Agent 46
Copy your PostgreSQL connection URI from **Project Settings → Database → Connection string (URI)** and set it on your server (or in Render environment variables):
```env
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

### 3. Sync Existing Campus Records (Optional)
To migrate all existing grievances, departments, and audit logs into your new Supabase cloud database, run:
```bash
npm run db:sync-supabase
```

*(Note: When `DATABASE_URL` is omitted, Agent 46 automatically defaults to the fast local SQLite engine for development and offline testing.)*

---

## License
MIT License. Developed for Vignan University's Integrated AI Hackathon 2026.

