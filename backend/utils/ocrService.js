const fs = require('fs');
const path = require('path');

const extractionPrompt = `
You are a highly accurate document data extraction assistant.
Look at the provided document (which may be a student marksheet, degree certificate, or transcript).
Extract the following information:
1. The full name of the student.
2. The overall final Cumulative Grade Point Average (CGPA) or SGPA.
3. The specific semester this document belongs to (e.g., "Semester 3", "7th Semester").
4. A list of SGPA/CGPA for each individual semester mentioned on the document.

Return ONLY a valid JSON object matching this exact structure:
{
  "name": "Extracted Full Name Here",
  "cgpa": 9.85,
  "semester": "Semester 3",
  "semesterWiseDetails": [
    { "semester": "Semester 1", "gpa": 8.5 },
    { "semester": "Semester 2", "gpa": 8.7 }
  ]
}
If a value is not found, return null for that field. Empty array for semesterWiseDetails if not available.
Do not include any markdown formatting like \`\`\`json, just the pure JSON.
`;

const cgpaOnlyPrompt = `
You are a document extraction assistant. 
Look at the provided document and extract ONLY the overall final Cumulative Grade Point Average (CGPA) or SGPA.
Do NOT attempt to extract the student's name.

Return ONLY a valid JSON object matching this structure:
{
  "name": null,
  "cgpa": 9.85
}
If CGPA is not found, return null. Do not include markdown formatting.
`;


/**
 * Common Gemini extraction logic using standard REST fetch to bypass SDK networking issues
 */
const extractWithGemini = async (filePath, mimeType, prompt = extractionPrompt) => {

    try {
        if (!fs.existsSync(filePath)) return { name: null, cgpa: null };

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("[OCR] GEMINI_API_KEY is missing from .env file!");
            return { name: null, cgpa: null };
        }

        console.log(`[OCR] Extracting from ${path.basename(filePath)} using Gemini REST API...`);
        
        const base64Data = Buffer.from(fs.readFileSync(filePath)).toString("base64");

        const payload = {
            contents: [{
                parts: [
                    { text: prompt },

                    {
                        inline_data: {
                            mime_type: mimeType,
                            data: base64Data
                        }
                    }
                ]
            }]
        };

        let response;
        // Use Gemini 2.5/3.0 models (as of March 2026)
        // 'gemini-2.5-flash-lite' has highest free RPM (15), so we try it first.
        const models = [
            'gemini-2.5-flash-lite', 
            'gemini-2.5-flash', 
            'gemini-3-flash-preview', 
            'gemini-1.5-flash-8b'
        ];
        let success = false;

        for (const model of models) {
            if (success) break;
            
            // Try v1beta first for latest models, then v1 as fallback
            const apiVersions = ['v1beta', 'v1'];
            
            for (const version of apiVersions) {
                if (success) break;
                
                console.log(`[OCR] Trying model: ${model} (${version})...`);
                const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;

                for (let attempt = 1; attempt <= 3; attempt++) {
                    try {
                        response = await fetch(url, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });

                        if (response.ok) {
                            success = true;
                            break;
                            
                        } 
                        
                        const status = response.status;
                        
                        // 404/400 logic: Model not found or unsupported for this version
                        if (status === 404 || status === 400) {
                            console.warn(`[OCR] ${model} unavailable in ${version}. Trying next...`);
                            break; 
                        }

                        // 429/503/500 logic: Rate limit or server error
                        if ((status === 503 || status === 429 || status === 500) && attempt < 3) {
                            // Jittered Exponential Backoff: (2^attempt * 2s) + random(0-1s)
                            const delay = (Math.pow(2, attempt) * 2000) + Math.floor(Math.random() * 1000);
                            console.warn(`[OCR] Gemini ${status} on ${model} (attempt ${attempt}/3). Retrying in ${delay/1000}s...`);
                            await new Promise(res => setTimeout(res, delay));
                        } else {
                            console.error(`[OCR] Error on ${model} (${version}): ${status}`);
                            // If it's a 429, we wait a bit before moving to the NEXT model/version
                            if (status === 429) {
                                await new Promise(res => setTimeout(res, 3000));
                            }
                            break; // Try next version/model
                        }
                    } catch (fetchErr) {
                        console.error(`[OCR] Fetch failed for ${model}:`, fetchErr.message);
                        break;
                    }
                }
            }
        }

        if (!success || !response) {
            console.error("[OCR] All models and retries exhausted. Check your API key and quotas at https://aistudio.google.com/");
            return { name: null, cgpa: null };
        }

        const data = await response.json();
        
        let responseText = "";
        try {
            responseText = data.candidates[0].content.parts[0].text;
        } catch (e) {
            console.error("[OCR] Unexpected Gemini JSON Structure:", JSON.stringify(data));
            return { name: null, cgpa: null };
        }

        console.log("[OCR] Raw Gemini Response:", responseText);

        try {
            // Clean up backticks if Gemini accidentally adds them despite instructions
            let cleanJsonStr = responseText.replace(/```json/i, '').replace(/```/i, '').trim();
            const jsonParams = JSON.parse(cleanJsonStr);
            console.log("[OCR] Successfully parsed Gemini JSON:", jsonParams);
            return jsonParams;
        } catch (parseError) {
             console.error("[OCR] Failed to parse Gemini response as JSON:", responseText, parseError);
             return { name: null, cgpa: null };
        }

    } catch (error) {
        console.error("[OCR] Gemini Extraction Error:", error.message);
        return { name: null, cgpa: null };
    }
};

/**
 * Extracts data from an image file
 */
const extractTextFromImage = async (filePath, prompt = extractionPrompt) => {
    const ext = path.extname(filePath).toLowerCase();
    let mimeType = "image/jpeg";
    if (ext === ".png") mimeType = "image/png";
    if (ext === ".webp") mimeType = "image/webp";
    if (ext === ".heic") mimeType = "image/heic";
    if (ext === ".heif") mimeType = "image/heif";
    
    return await extractWithGemini(filePath, mimeType, prompt);
};

/**
 * Wrapper for PDF files
 */
const extractTextFromPDF = async (filePath, prompt = extractionPrompt) => {
    // Gemini Flash 1.5 natively supports PDF buffers!
    return await extractWithGemini(filePath, "application/pdf", prompt);
};

/**
 * Since Gemini handles the parsing internally and returns JSON,
 * we keep this function signature for backwards compatibility with existing routes
 * but it just passes the object through.
 */
const parseExtractedText = (geminiExtractedData) => {
    // If we receive a string (legacy behavior), we fail gracefully.
    if (typeof geminiExtractedData === 'string') {
        console.warn("[OCR] parseExtractedText received a string. This shouldn't happen with Gemini.");
        return { name: null, cgpa: null };
    }
    
    // It's already the JSON object from Gemini
    return geminiExtractedData || { name: null, cgpa: null };
};

module.exports = {
    extractTextFromImage,
    extractTextFromPDF,
    parseExtractedText,
    extractionPrompt,
    cgpaOnlyPrompt
};


