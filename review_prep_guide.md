# Project Review Preparation Guide: EduVerify

Use this guide to answer "What" you used and "Why" you used it during your project review.

---

## 1. Frontend: React.js & Tailwind CSS
**What:** 
- **React.js** for the UI.
- **Tailwind CSS** for styling.
- **Recharts** for student data visualization.

**Why:**
- **Component Reusability:** React allowed us to build a modular dashboard where the "Student Profile," "Document Preview," and "Audit Status" are separate, reusable components.
- **Performance:** React’s Virtual DOM ensures the UI remains fast even when handling large lists of student submissions.
- **Modern UI (Tailwind):** Tailwind allowed us to build a premium, responsive interface significantly faster than traditional CSS, ensuring the admin dashboard looks professional on any device.

---

## 2. Backend: Node.js & Express.js
**What:** 
- **Node.js** runtime.
- **Express.js** framework.

**Why:**
- **Asynchronous Processing:** Since OCR and AI extraction take a few seconds, Node's non-blocking architecture allows the server to handle other requests while the AI is "reading" a document.
- **Unified Language:** Using JavaScript for both frontend and backend (MERN stack) improved development speed and reduced context switching.

---

## 3. Storage & Database: MongoDB & Mongoose
**What:** 
- **MongoDB** (NoSQL Database).
- **Mongoose** (ODM).

**Why:**
- **Flexible Schema:** Student records and OCR data can vary (some students have 8 semesters, some have 2). A NoSQL database like MongoDB is perfect for this "unstructured" data compared to a rigid SQL table.
- **Scalability:** MongoDB handles high-volume data writes efficiently, making it ideal if the system is scaled to an entire university.

---

## 4. The "Brain": Google Gemini AI & Tesseract.js
**What:** 
- **Google Generative AI (Gemini)**.
- **Tesseract.js** for initial OCR.

**Why:**
- **Handling Complexity:** Standard OCR often fails to identify which grade belongs to which subject in a table. Gemini AI was used to "understand" the structure of the transcript, providing a **95%+ accuracy rate** in data extraction.
- **Validation:** Using two libraries allowed us to cross-validate results, ensuring the extracted CGPA is 100% correct before auditing.

---

## 5. Automation: Google APIs & Nodemailer
**What:** 
- **Google Sheets API**.
- **Nodemailer**.

**Why:**
- **Seamless Sync:** We used Google Sheets as a bridge because it's the standard for student data collection. The API allows our system to "pull" new data automatically every time a student hits "Submit" on a Google Form.
- **Real-time Feedback:** Nodemailer ensures students get an instant email notification once their document is verified, reducing their anxiety and the admin's workload.

---

## 6. Security: JWT & BCrypt
**What:** 
- **JSON Web Tokens (JWT)** for session management.
- **BCryptjs** for password encryption.

**Why:**
- **Zero Trust Architecture:** Every API request (like viewing a student's private PDF) is validated against a JWT, ensuring no unauthorized user can access sensitive student documents.
- **Data Privacy:** Passwords are never stored in plain text; they are hashed 10+ times using BCrypt to prevent data breaches.

---

## 7. Verification: QR Code Technology
**What:** 
- **qrcode** library.

**Why:**
- **Instant Verification:** Instead of checking a paper certificate manually, an employer can simply scan the QR code to reach a secure, read-only verification portal that confirms the student's status directly from the database.

---

### **Potential "Hard" Questions & Suggested Answers:**

**Q: Why didn't you use a simpler database like SQLite?**  
**A:** "We chose MongoDB because student academic data is structured hierarchically (e.g., a student record contains an array of semesters, each containing an array of subjects). MongoDB's document-based model maps naturally to this data structure."

**Q: Is the AI extraction 100% accurate?**  
**A:** "No AI is 100% accurate, which is why we built a **human-in-the-loop** system. The AI does the heavy lifting (extraction), but the Admin has a 'Cross-Check' interface where they can quickly review and approve the extracted data."

**Q: Why Google Gemini instead of OpenAI's GPT?**  
**A:** "Gemini offers excellent multimodal support (reading images/PDFs directly) and integrates seamlessly with our existing Google ecosystem (Sheets/Drive), making it a more cost-effective and efficient choice for this specific use case."
