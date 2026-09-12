# Vignan Student Grievance Redressal Agent (Agent 46)

Autonomous, policy-driven Student Grievance Redressal and Institutional Governance System designed for **Vignan's Foundation for Science, Technology & Research (VFSTR)**. Built for the Integrated AI Hackathon 2026.

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

## License
MIT License. Developed for Vignan University's Integrated AI Hackathon 2026.
