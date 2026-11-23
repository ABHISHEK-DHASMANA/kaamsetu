# KAAMSETU (कामसेतु)
### India's Hyperlocal Employment & Verified Skill Network
> **"Kaam Paas Mein. Mauke Sabke Liye."** (काम पास में • मौके सबके लिए)

KAAMSETU is an intelligent hyperlocal employment and verified skill ecosystem built for India's 400M+ informal and semi-skilled workforce (electricians, plumbers, carpenters, painters, masons, mechanics, cleaners, delivery runners) and the contractors and local enterprises that hire them.

---

## 🌟 Key Features & Innovations

1. **Voice-to-Work (Dual-Language AI Discovery)**
   - Speak naturally in **Hindi** or **English** (e.g., *"Mujhe kal electrician ka kaam chahiye, Sector 62 mein, 800 rupaye daily"*).
   - Voice transcript is parsed via Gemini AI (or built-in hybrid local NLP engine) into structured job criteria: trade, area, wage, radius, availability.
   - Allows workers to preview and adjust extracted preferences before querying the matching engine.

2. **Intelligent 4-Factor Matching Engine**
   - Strictly computed using the mathematical formula:
     $$\text{Match Score} = (0.40 \times \text{Skill}) + (0.25 \times \text{Location}) + (0.20 \times \text{Wage}) + (0.15 \times \text{Availability})$$
   - Real Haversine geo-distance calculation using GPS coordinates.
   - Transparent explanations: *"Why this job matches you: 1.7 km away, offered wage ₹900 exceeds your expected ₹800/day"*.

3. **Digital Skill Passport**
   - Portable, verified digital identity replacing paper CVs.
   - Distinguishable 3-tier credentials:
     - `Self-declared`
     - `Evidence Submitted` (licenses, trade certificates)
     - `Employer Confirmed` (audited work completion ratings)
   - Real-time QR code generation, shareable public URL (`/passport/:passportId`), and printable card format.

4. **Fair Wage Transparency Charter**
   - Every job discloses offered wages, disbursement schedule (e.g. *Daily at shift end via direct UPI*), overtime terms, and zero deductions.
   - Automated compliance scanner displays amber warnings on listings with vague payment terms or sub-minimum wages.

5. **Trust & Safety Ecosystem**
   - 3-tier account verification: `Registered` ➔ `Contact Verified` ➔ `Identity Verified`.
   - Contact details of workers and employers are securely protected until an application is mutually accepted.
   - Grievance reporting and admin moderation panel for dispute resolution.

6. **Interactive Hyperlocal Map**
   - OpenStreetMap & Leaflet integration displaying nearby jobs and worker home bases with custom markers and distance indicators.

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- **Node.js** (v18+ or v24+ installed)
- **NPM** (v10+ or v11+ installed)
- MongoDB is **optional** — KAAMSETU features an automated persistent local JSON demo store fallback (`demo_db.json`) so it runs 100% out-of-the-box with zero database setup required!

### Option A: One-Click Launch (Windows)
Double-click `start-all.bat` in the project root:
```bat
start-all.bat
```
This automatically initializes the backend on `http://localhost:5000` and launches the frontend on `http://localhost:5173`.

### Option B: Manual Command Line

#### 1. Start Backend Server
```bash
cd server
npm install
npm run seed     # Seeds 21 users, 15 workers, 5 employers, 20 jobs
npm start        # Runs on http://localhost:5000
```

#### 2. Start Frontend Client
```bash
cd client
npm install
npm run dev      # Runs on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## 🎭 One-Click Demonstration Accounts

The login page includes **1-Click Hackathon Evaluation Buttons** for instant evaluation without typing:

| Role | Name & Trade | Phone | Password | Key Flow |
|---|---|---|---|---|
| **Worker** | **Ramesh Kumar** (Electrician) | `9811002233` | `kaamsetu123` | Voice search, view 92% match, apply, view Skill Passport |
| **Employer** | **Sunil Sharma** (Sharma Electrical Services) | `9811445566` | `kaamsetu123` | Post job with wage check, review candidates, **Accept Ramesh** |
| **Admin** | **KAAMSETU Admin** (Vigilance & Ops) | `9876543210` | `kaamsetu123` | Audit live analytics, elevate ID tiers, resolve reports |

---

## 🔄 End-to-End Demonstration Journey Walkthrough

1. **Ramesh Logs In**:
   - Click *Demo Switcher* ➔ *Ramesh Kumar (Worker)*.
   - View recommended jobs matching his trade (Electrician) and location (Noida Sector 62).
2. **Uses Voice Search**:
   - Click the **Voice-to-Work Mic**.
   - Speak or select sample Hindi prompt: *"Mujhe kal electrician ka kaam chahiye, Sector 62 mein, 800 rupaye daily"*.
   - View structured AI preference extraction.
3. **Applies for Job**:
   - Finds Sharma Electrical Services job in Sector 63 (1.7 km away, ₹900/day).
   - Clicks *"Why 92% Match?"* to inspect the 4-factor formula breakdown.
   - Submits application.
4. **Employer Reviews & Hires**:
   - Click *Demo Switcher* ➔ *Sharma Electrical Services (Employer)*.
   - Go to **Review Candidates** (`/employer/candidates`).
   - Inspect Ramesh Kumar's Digital Skill Passport (94% Trust Score, ID: KS-W-6201).
   - Click **Accept & Hire**.
5. **Ramesh Receives Confirmation**:
   - Switch back to Ramesh.
   - Real-time notification: *"Congratulations! Application Accepted 🎉"*.
   - Direct phone contact of Sunil Sharma (`9811445566`) is unlocked!

---

## 🛠️ Architecture & Tech Stack

```
kaamsetu/
├── client/                      # React 18 + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/          # Navbar, Footer, DashboardLayout
│   │   │   ├── voice/           # Voice-to-Work Speech & NLP Modal
│   │   │   ├── map/             # Leaflet OpenStreetMap Visualizer
│   │   │   ├── passport/        # Digital Skill Passport Card & QR Modal
│   │   │   └── matching/        # 4-Factor Match Score Badge & Explanations
│   │   ├── pages/               # Landing, Login, Register, About, Jobs, Dashboards
│   │   ├── services/            # Centralized API service
│   │   └── context/             # AuthContext, NotificationContext
├── server/                      # Node.js + Express REST API
│   ├── src/
│   │   ├── config/              # MongoDB + persistent JSON fallback
│   │   ├── controllers/         # Auth, Job, Worker, Employer, Voice, Admin
│   │   ├── models/              # User, WorkerProfile, Job, Application, etc.
│   │   ├── services/
│   │   │   ├── matchingEngine.js# Weighted 4-Factor Compatibility Formula
│   │   │   ├── aiExtractor.js   # Gemini API + Local Hybrid NLP Parser
│   │   │   └── storage.js       # Persistent Zero-Setup Demo Storage
│   │   └── seeds/seedData.js    # Seed 21 NCR users, 20 jobs, 10 applications
└── README.md
```

---

## 🇮🇳 Social Impact

- **Empowering Semi-Skilled Artisans**: Eliminates exploitation by middlemen, ensuring zero commission deduction.
- **Overcoming Literacy Barriers**: Voice-first Hindi & English natural language search makes digital job discovery accessible to everyone.
- **Portability of Reputation**: Blue-collar workers own their verified Digital Skill Passport across jobs, building long-term creditworthiness and upward mobility.


---

## Account verification and privacy configuration

### Firebase phone OTP
- In Firebase Console, select the `kaamsetu-83aef` project.
- Enable **Authentication → Sign-in method → Phone**.
- Add every production and preview hostname used for testing under **Authentication → Settings → Authorized domains**.
- Keep the existing `VITE_FIREBASE_*` values configured in the Vercel project.
- Keep `FIREBASE_PROJECT_ID` and `FIREBASE_SERVICE_ACCOUNT_JSON` configured only on the Render backend. Never put the service-account JSON in Vite/client variables.
- Firebase may require billing/SMS quota configuration and may limit SMS delivery by country, IP, or volume. Real SMS delivery must be tested on a real, authorized mobile number; a local success state is not proof of delivery.

### Email verification
The backend sends single-use, 24-hour verification links through Resend. Configure these variables in Render (not in frontend code):
- `RESEND_API_KEY`: private Resend API key.
- `RESEND_FROM_EMAIL`: sender address on a domain verified in Resend, for example `KaamSetu <verify@your-domain.example>`.
- `FRONTEND_URL`: public frontend origin, without a trailing slash. The verification link is built from this origin.

Email registration is unavailable until all three values are configured and Resend accepts the sender domain. Email tokens are stored as SHA-256 hashes and are cleared after successful verification. Email/password login is blocked until verification is complete.

### Account deletion and retained records
Workers and employers can request deletion from their profile page after confirming their current password and typing `DELETE`. The backend removes profile and private conversation data, closes active employer jobs, and anonymizes the account record. Application, job, review, and payment records remain for audit, reconciliation, and dispute handling. Firebase identity deletion is attempted when the linked UID is available.

### UPI and bank details
KaamSetu currently collects a worker UPI ID only. It checks the input format but does **not** verify that the UPI ID exists or belongs to the worker. No bank account number or IFSC details are currently collected, so bank-account/penny-drop verification is not applicable to the present UI. Do not describe either contact details or payment IDs as externally verified unless a provider-backed verification integration is added and configured.
