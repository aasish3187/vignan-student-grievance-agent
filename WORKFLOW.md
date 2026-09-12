# Agent 46: System Architecture & Workflow

Comprehensive architectural specification and process flow for **Agent 46 (Student Grievance Redressal Agent)** designed for **Vignan's Foundation for Science, Technology & Research (VFSTR)**.

---

## 1. End-to-End Workflow Diagram

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

    %% 5. STUDENT NOTIFICATION & FEEDBACK
    subgraph StudentResolution["5. CLOSURE & FEEDBACK"]
        GenLetter --> Notify["Student Case Tracking Portal"]:::resolution
        Notify --> ViewLetter["Download / Print Official Resolution"]:::resolution
        ViewLetter --> Feedback["Student Submits 1–5 Star Rating\n& Redressal Satisfaction"]:::resolution
        Feedback --> DB
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

## 2. Detailed Process Breakdown

### Step 1: Dual-Track Grievance Submission
1. **Verified Student Track**:
   - The student supplies Name, Registration Number, Phone, and Academic Department.
   - Ideal for standard academic, examination, evaluation, and campus infrastructure concerns.
   - Provides live SMS and email status notifications.
2. **Whistleblower / Anonymous Mode**:
   - For sensitive complaints (Ragging, Bullying, Gender Inequity, Retaliation Fears).
   - All PII fields are removed and masked before database insertion.
   - The system generates a cryptographic **6-digit secret PIN** displayed only once to the student.
   - The student uses their Case ID + 6-digit PIN to check status, review resolution letters, and submit feedback without ever revealing their identity.

### Step 2: AI Classification & Statutory Dispatch
- Text passes through the sanitization and keyword affinity engine.
- Assigns severity level:
  - `CRITICAL` (Ragging, Safety Hazards, Harassment) — 24 to 48 hour SLA.
  - `HIGH` (Evaluation disputes, Hostel, Lab access) — 72 hour SLA.
  - `MEDIUM` (Canteen, Transport, Facilities) — 5 to 7 day SLA.
  - `LOW` (General inquiries, Library requests) — 7 to 10 day SLA.
- Routes ticket directly to the appropriate official:
  - **Academic Grievance** -> Respective Department HoD (`hod.cse`, etc.).
  - **General Grievance** -> Dean of Student Affairs (`dean.studentaffairs`).
  - **Statutory Anti-Ragging** -> Anti-Ragging Committee Chair (`chair.antiragging`).
  - **Gender / Sexual Harassment** -> Internal Complaints Committee / Women Protection Cell (`chair.icc`).

### Step 3: Continuous SLA Enforcement
- Embedded background worker runs every minute via `node-cron`.
- Scans `grievances` for upcoming or expired SLA timestamps.
- If SLA is breached:
  - Updates case status to `ESCALATED`.
  - Logs an audit trail event in `grievance_events`.
  - Re-assigns the ticket to the next higher institutional tier (e.g., Department HoD -> Dean -> Vice-Chancellor).

### Step 4: Authority Case Dossier & Precedent Engine
- Authorities access their scoped console (`/login.html` -> `/admin.html`).
- The **AI Precedents Engine** (`/api/grievances/:id/precedents`) searches resolved historical archives in SQLite using term frequency and category matching.
- Displays past rulings, precedent relevance percentage, and historical penalties to ensure fair and consistent institutional action.

### Step 5: Statutory Resolution Order Generation
- When an authority resolves a case, an official **University Resolution Order** is generated (`/api/grievances/:id/resolution-letter`):
  - Official VFSTR institutional header and dispatch code (`VFSTR/GRC/2026/ORD-...`).
  - Regulatory reference (UGC Redressal of Grievances Regulations).
  - Committee findings and mandatory remedial actions.
  - Official 15-day appellate window allowing students to escalate to the Ombudsperson.

### Step 6: Multi-Agent Mesh Integrations
Agent 46 communicates with upstream and downstream institutional agents:
- `GET /api/integrations/agent44/student/:regdNo`: Feeds student grievance history to **Agent 44 (Student 360)**.
- `POST /api/integrations/agent64/digitize`: Ingests OCR drop-box complaints from **Agent 64 (Physical Intake OCR)**.
- `GET /api/integrations/agent56/committee-agenda`: Generates live hearing agendas for **Agent 56 (Statutory Committees)**.
- `GET /api/integrations/agent57/iqac-defects`: Feeds quality defect metrics to **Agent 57 (IQAC Quality Audits)** for NAAC Criteria 6.2 compliance.
- `GET /api/integrations/agent70/academic-decision-support`: Supplies grading dispute trends to **Agent 70 (Academic Decision Support)**.
