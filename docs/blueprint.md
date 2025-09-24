# Iroha Product Blueprint

## 1. Product Snapshot
- **Name:** iroha (いろは)
- **Mission:** Deliver seasonal Japanese distance-learning courses that blend live instruction, recorded content, and structured assessments.
- **Platforms:** Web (Next.js 14) and Mobile (Flutter or React Native).
- **Primary Roles:** Student, Instructor, Admin, Registrar/Support.

## 2. Feature Roadmap
### MVP Scope
1. **Accounts & Profiles**
   - Email and OTP login, JWT auth, RBAC.
   - Profile management, locale/timezone preferences.
2. **Seasonal Catalog**
   - Seasons (Spring/Summer/Fall/Winter) with levels (A0–B2).
   - Course capacity, enrollment windows, published status.
3. **Enrollment & Payments**
   - Waitlist logic, HyperPay/Tap/PayTabs integrations (Mada, Apple Pay).
   - Webhook-confirmed payment activation.
4. **Live & Recorded Learning**
   - Sections with schedules, meeting links, attendance tracking.
   - Lessons with video, slides, PDFs, vocabulary JSON.
5. **Assessments**
   - MCQ auto-grading and manual rubric scoring.
   - Quiz attempts, scoring, instructor review.
6. **Progress & Certification**
   - Student dashboard, progress metrics, certificate issuance (PDF).
7. **Notifications**
   - Email + push for enrollment, reminders, grading updates.
8. **Localization**
   - Arabic/English/日本語 UI, RTL support.

### V2 Enhancements
- Placement tests with automated track suggestions.
- Spaced-repetition vocabulary trainer (SRS).
- Lesson discussions & private Q&A.
- Instructor analytics dashboards, rubric grading.
- Lightweight proctoring for final exams.
- Coupons, corporate cohorts, instructor marketplace.

## 3. System Architecture Overview
```
[Web (Next.js 14) + React Query + next-intl]
                     |
[Mobile (Flutter or React Native)]
                     |
         [REST/GraphQL API - Node.js (NestJS)]
                     |
    -------------------------------------------
    |                  |                     |
 [MySQL]            [Redis]             [S3/VOD]
    |                  |                     |
[Payments (Tap/HyperPay/PayTabs)]    [Email/Push Queue]
```
- **Backend:** NestJS (or Express + Zod), REST endpoints, Socket.io for live presence.
- **Infra:** Docker for local, deploy via Vercel (web) + Fly.io/Render/EC2 (API), managed MySQL (PlanetScale/Aurora).
- **Observability:** pino logs, OpenTelemetry tracing, Sentry error tracking.

## 4. Database Schema (MySQL)
```sql
-- Users & Roles
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(30),
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  locale VARCHAR(10) DEFAULT 'ar',
  timezone VARCHAR(50) DEFAULT 'Asia/Riyadh',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
  id TINYINT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE user_roles (
  user_id BIGINT NOT NULL,
  role_id TINYINT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Seasons & Courses
CREATE TABLE seasons (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) UNIQUE NOT NULL,
  title VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  enrollment_open DATETIME NOT NULL,
  enrollment_close DATETIME NOT NULL,
  status ENUM('scheduled','enrolling','running','complete','archived') NOT NULL
);

CREATE TABLE courses (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  season_id BIGINT NOT NULL,
  code VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  level ENUM('A0','A1','A2','B1','B2') NOT NULL,
  description TEXT,
  modality ENUM('live','recorded','hybrid') DEFAULT 'hybrid',
  language VARCHAR(10) DEFAULT 'ja',
  capacity INT DEFAULT 25,
  price_cents INT NOT NULL,
  currency CHAR(3) DEFAULT 'SAR',
  published BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (season_id) REFERENCES seasons(id)
);

-- Sections & Lessons
CREATE TABLE sections (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  course_id BIGINT NOT NULL,
  instructor_id BIGINT NOT NULL,
  title VARCHAR(100),
  meeting_link VARCHAR(500),
  weekday TINYINT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (instructor_id) REFERENCES users(id)
);

CREATE TABLE lessons (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  course_id BIGINT NOT NULL,
  section_id BIGINT,
  week_no INT,
  title VARCHAR(200) NOT NULL,
  video_url VARCHAR(500),
  materials_json JSON,
  release_at DATETIME,
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (section_id) REFERENCES sections(id)
);

-- Enrollments & Payments
CREATE TABLE enrollments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  course_id BIGINT NOT NULL,
  section_id BIGINT,
  status ENUM('pending','active','waitlisted','cancelled','completed') NOT NULL,
  enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, course_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (section_id) REFERENCES sections(id)
);

CREATE TABLE payments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  enrollment_id BIGINT NOT NULL,
  provider VARCHAR(50) NOT NULL,
  provider_ref VARCHAR(100) NOT NULL,
  amount_cents INT NOT NULL,
  currency CHAR(3) DEFAULT 'SAR',
  status ENUM('initiated','paid','failed','refunded') NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(id)
);

-- Assessments
CREATE TABLE quizzes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  course_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  total_points INT NOT NULL,
  config_json JSON,
  available_from DATETIME,
  due_at DATETIME,
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE TABLE quiz_attempts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  quiz_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  score INT,
  submitted_at DATETIME,
  answers_json JSON,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Attendance & Certificates
CREATE TABLE attendance (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  section_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  meeting_date DATE NOT NULL,
  present BOOLEAN NOT NULL,
  note VARCHAR(255),
  UNIQUE(section_id, user_id, meeting_date),
  FOREIGN KEY (section_id) REFERENCES sections(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE certificates (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  enrollment_id BIGINT UNIQUE NOT NULL,
  issued_at DATETIME,
  pdf_url VARCHAR(500),
  grade VARCHAR(10),
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(id)
);
```

## 5. REST API Surface (NestJS/Express)
### Auth
- `POST /auth/register` `{email, phone?, password?}`
- `POST /auth/login` `{email, password}` → `{accessToken, refreshToken}`
- `POST /auth/otp/request`, `POST /auth/otp/verify`
- `POST /auth/refresh`, `POST /auth/logout`

### Catalog & Enrollment
- `GET /seasons?status=enrolling|running`
- `GET /courses?season=2025-SUM&level=A1&published=true`
- `GET /courses/:id`
- `GET /sections?courseId=:id`
- `POST /enrollments` `{courseId, sectionId?}` → `status=pending`
- `POST /payments/:enrollmentId/intent`
- `POST /webhooks/payments`

### Learning & Teaching
- `GET /lessons?courseId=:id`
- `GET /quizzes?courseId=:id`
- `POST /quizzes/:id/attempt`
- `POST /attendance/checkin`
- Instructor/Admin CRUD: seasons, courses, sections, lessons, reports.

## 6. Seasonal Logic (Asia/Riyadh)
- Enrollment windows set per season; cron transitions:
  - `scheduled → enrolling` at `enrollment_open`.
  - `enrolling → running` at `start_date`.
  - `running → complete` when `now > end_date`.
- Seat calculation: `seats_left = capacity - active_enrollments`; waitlist when zero.

## 7. Tech Setup
- **Local:** `docker-compose` with MySQL 8.0 (credentials in `.env`).
- **Backend env:** `DATABASE_URL`, `JWT_SECRET`, `APP_TIMEZONE`, `PAY_PROVIDER`, `PAY_CALLBACK_URL`.
- **Deploy:** Web to Vercel; API to Fly.io/Render/EC2; managed MySQL; S3-compatible storage.

## 8. Frontend Surface
- `/` landing with CTA "Browse Seasons".
- `/seasons/[code]` catalog view.
- `/courses/[id]` detail with seat counts and syllabus.
- `/dashboard` student hub (next lessons, tasks, certificates).
- `/teach` instructor portal (roster, attendance, grading).
- `/admin` season & course management.
- **UI Considerations:** language switcher (AR/EN/JA), RTL styling, furigana support, brand palette (indigo 600, sakura pink, slate neutrals).

## 9. Payments Flow
1. Student initiates enrollment → creates pending enrollment.
2. Backend calls payment provider intent API; returns redirect/SDK token.
3. On provider webhook, verify signature, mark payment `paid`, activate enrollment.
4. Ensure idempotent webhook handling.

## 10. Security & Compliance
- Argon2id password hashes, JWT rotation, short-lived access tokens (15m) with refresh tokens (7–30d).
- RBAC enforcement, row-level access checks.
- Signed URLs for media; bandwidth throttling.
- Audit logging for admin actions; daily MySQL backups.

## 11. Analytics & Reporting
- Track enrollments per day, revenue by season, quiz item stats, attendance rates.
- Instructor dashboards with CSV/PDF exports.
- KPIs: lesson completion %, quiz pass rate, retention by season.

## 12. Branding
- **Colors:** Indigo-600 (#4F46E5), Sakura Pink (#F472B6), Slate neutrals.
- **Logo:** Minimalist 「いろは」 with sakura petal accent.
- **Tone:** Warm, encouraging, study-friendly.

## 13. Core User Journeys
### Student
1. Sign up → browse Summer 2025 A1.
2. Pay via Mada → enrollment active → dashboard shows Week-1 lesson & live link.
3. Instructor marks attendance; quizzes unlock; certificate issued at ≥75% attendance & ≥60% final.

### Instructor
1. Create lessons with video + vocab JSON; schedule releases.
2. Mark attendance post-class; message absentees.
3. Review quiz attempts, post grades, trigger certificates.

## 14. Implementation Roadmap (8 Weeks)
- **W1–2:** Auth, seasons/courses CRUD, payment sandbox, catalog pages.
- **W3:** Enrollment pipeline, transactional emails, lesson delivery basics.
- **W4:** Quizzes, grading tools, attendance workflows.
- **W5:** Certificate generation, instructor portal polish.
- **W6:** Mobile app MVP (read-only views, push notifications).
- **W7:** SRS vocab trainer, placement testing.
- **W8:** Hardening, localization polish, SEO, launch readiness.
