# EduVerify

EduVerify is an automated student document verification system designed to streamline the process of reviewing and authenticating student marksheets and credentials. It leverages AI-powered OCR, Google Forms integration, and automated email notifications to reduce manual verification efforts and ensure data accuracy.

## 🚀 Features

- **Automated Document Extraction**: Uses the Gemini API for advanced OCR to extract student details (Name, Roll No, CGPA, Semester) directly from uploaded marksheets.
- **Google Workspace Integration**: Seamlessly syncs student submissions via Google Forms and Google Sheets.
- **Cross-Check Verification**: Automatically compares the student's self-reported data (from Google Forms) against the AI-extracted data from their uploaded document.
- **Smart Admin Dashboard**: Provides administrators with a clear interface to view pending documents, manually approve/reject, and trigger syncs.
- **Automated Email Notifications**: Uses the Gmail REST API (via OAuth2) to instantly notify students whether their document was verified successfully or if a data mismatch was found.
- **QR Code Issuance**: Generates a secure, verifiable QR code and public verification link for successfully authenticated documents.

## 🛠️ Tech Stack

### Frontend
- **React.js**: For building the interactive user interface.
- **React Router**: For seamless navigation between the public verification page and the Admin dashboard.
- **Vanilla CSS**: For styling the application.

### Backend
- **Node.js & Express.js**: For handling API requests, file uploads, and business logic.
- **MongoDB & Mongoose**: For storing document metadata, extracted data, and user accounts.
- **Google APIs**:
  - `googleapis` (Forms & Sheets) for syncing student responses.
  - `googleapis` (Gmail) for sending automated emails natively without SMTP blocks.
- **Google Generative AI (Gemini)**: For high-accuracy Optical Character Recognition (OCR).
- **PDF-lib / Tesseract.js / Sharp**: For processing and handling incoming PDF/image documents.
- **Nodemailer**: Used internally as a MIME builder for the Gmail API.

## ⚙️ Environment Variables

To run this project locally, you need to create a `.env` file in the `backend` directory with the following variables:

```env
# Database & Authentication
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
REFRESH_SECRET=your_refresh_secret

# Email Delivery (Gmail API)
EMAIL_USER=your_organization_email
GOOGLE_CLIENT_ID=your_oauth2_client_id
GOOGLE_CLIENT_SECRET=your_oauth2_client_secret
GOOGLE_REFRESH_TOKEN=your_oauth2_refresh_token
GOOGLE_REDIRECT_URI=https://developers.google.com/oauthplayground

# Google Forms & Sheets Integration
GOOGLE_FORM_ID=your_form_id
GOOGLE_SHEETS_ID=your_sheets_id
GOOGLE_FORM_NAME_FIELD_ID=entry.123456
GOOGLE_FORM_EMAIL_FIELD_ID=entry.123456
GOOGLE_FORM_ROLLNO_FIELD_ID=entry.123456
GOOGLE_FORM_CGPA_FIELD_ID=entry.123456
GOOGLE_FORM_Semester_FIELD_ID=entry.123456

# AI Data Extraction
GEMINI_API_KEY=your_gemini_api_key

# Frontend Configuration (for CORS)
FRONTEND_URL=your_frontend_url (e.g., http://localhost:3001)
```

> **Note**: Your `GOOGLE_REFRESH_TOKEN` must have scopes authorized for both `https://www.googleapis.com/auth/gmail.send` and `https://www.googleapis.com/auth/spreadsheets.readonly`.

## 🏃‍♂️ Running Locally

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd eduverify2
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 4. Start the Application
Open two terminals.

**Terminal 1 (Backend):**
```bash
cd backend
npm start
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm start
```

## 📦 Deployment (Render)

This project is configured right now to be deployed on Render as a Web Service.
1. The Node.js backend serves the API on `/api`.
2. The React frontend is built and served statically by Express (`/frontend/build`).

Ensure your Render Environment Variables match your local `.env` and that `NODE_ENV` is set to `production`.

---
*Built for Educational Verification Automation.*
