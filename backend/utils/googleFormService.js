const { google } = require('googleapis');
const { OAuth2 } = google.auth;

const oauth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const forms = google.forms({ version: 'v1', auth: oauth2Client });
const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

/**
 * Generates a Google Form link with pre-filled Name, Email, Semester and Roll No.
 * @param {Object} data - Data to pre-fill
 * @returns {string} The Google Form URL with pre-filled data
 */
const generateFormLink = (data = {}) => {
    const formId = process.env.GOOGLE_FORM_ID;
    
    // Get Field IDs from .env
    const nameField = process.env.GOOGLE_FORM_NAME_FIELD_ID;
    const emailField = process.env.GOOGLE_FORM_EMAIL_FIELD_ID;
    const rollNoField = process.env.GOOGLE_FORM_ROLLNO_FIELD_ID;
    // const cgpaField = process.env.GOOGLE_FORM_CGPA_FIELD_ID; // Usually hidden or blank
    const semesterField = process.env.GOOGLE_FORM_Semester_FIELD_ID;

    const baseUrl = `https://docs.google.com/forms/d/e/${formId}/viewform`;
    
    const params = new URLSearchParams();
    if (data.name) params.append(nameField, data.name);
    if (data.email) params.append(emailField, data.email);
    if (data.rollNo) params.append(rollNoField, data.rollNo || "");
    if (data.semester) params.append(semesterField, data.semester);

    return `${baseUrl}?${params.toString()}`;
};


/**
 * Fetches form responses from Google Sheets (linked to the form)
 * Expected columns: Timestamp | Name | Email | Roll No | CGPA | DocID
 * @returns {Promise<Array>}
 */
const fetchFormResponses = async () => {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    const range = "'Form Responses 1'!A2:G"; // Quoted name for spaces

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
    });

    return response.data.values || [];
};

module.exports = {
    generateFormLink,
    fetchFormResponses
};
