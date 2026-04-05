const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const crypto = require('crypto');

/**
 * Adds a professional "Verified" seal, QR code, and academic metadata to a document.
 * This turns a plain upload into a self-verifying academic credential.
 */
const stampDocument = async (filePath, qrCodeBase64, metadata) => {
    try {
        const isPDF = filePath.toLowerCase().endsWith('.pdf');
        let pdfDoc;
        let firstPage;
        
        if (isPDF) {
            const existingPdfBytes = fs.readFileSync(filePath);
            pdfDoc = await PDFDocument.load(existingPdfBytes);
            const pages = pdfDoc.getPages();
            if (pages.length === 0) throw new Error("PDF has no pages");
            firstPage = pages[0];
        } else {
            // Convert Image (Marksheet JPG/PNG) to a formal PDF
            pdfDoc = await PDFDocument.create();
            const imageBuffer = fs.readFileSync(filePath);
            const pngBuffer = await sharp(imageBuffer)
                .flatten({ background: { r: 255, g: 255, b: 255 } })
                .png()
                .toBuffer();
                
            const embeddedImage = await pdfDoc.embedPng(pngBuffer);
            const { width: imgW, height: imgH } = embeddedImage.scale(0.8); // Scale down slightly to fit margins
            
            // Standard A4-ish size or sized to image
            const page = pdfDoc.addPage([imgW + 100, imgH + 220]);
            page.drawImage(embeddedImage, {
                x: 50,
                y: 120, // Room for the footer
                width: imgW,
                height: imgH,
            });
            firstPage = page;
        }

        const { width, height } = firstPage.getSize();
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // --- 1. Top Header Seal (Professional Academic Security) ---
        firstPage.drawRectangle({
            x: 0,
            y: height - 55,
            width: width,
            height: 55,
            color: rgb(0.06, 0.16, 0.38), // Official Navy
        });

        firstPage.drawText("EDUVERIFY ACADEMIC NETWORK - OFFICIALLY CERTIFIED RECORD", {
            x: 40,
            y: height - 34,
            size: 13,
            font: font,
            color: rgb(1, 1, 1),
        });

        // --- 2. Security Footer & QR Integration ---
        const qrImageBytes = Buffer.from(qrCodeBase64.split(',')[1], 'base64');
        const qrImage = await pdfDoc.embedPng(qrImageBytes);

        // Footer Background
        firstPage.drawRectangle({
            x: 0,
            y: 0,
            width: width,
            height: 110,
            color: rgb(0.98, 0.98, 1), // Pure Light Blue
        });

        // Embed Verification ID & Data QR
        firstPage.drawImage(qrImage, {
            x: width - 100,
            y: 15,
            width: 85,
            height: 85,
        });

        // Textual Identity Verification
        firstPage.drawText(`VERIFICATION ID: ${String(metadata.docId).toUpperCase()}`, {
            x: 40,
            y: 75,
            size: 11,
            font: font,
            color: rgb(0, 0, 0),
        });

        firstPage.drawText(`CERTIFICATION FOR: ${String(metadata.studentName).toUpperCase()}`, {
            x: 40,
            y: 58,
            size: 10,
            font: regularFont,
            color: rgb(0.1, 0.1, 0.1),
        });

        firstPage.drawText(`DATE OF VALIDATION: ${new Date().toLocaleDateString()}`, {
            x: 40,
            y: 45,
            size: 10,
            font: regularFont,
            color: rgb(0.1, 0.1, 0.1),
        });

        firstPage.drawText(`SCAN RIGHT QR CODE TO CONFIRM LIVE STATUS & INTEGRITY`, {
            x: 40,
            y: 25,
            size: 9,
            font: font,
            color: rgb(0.06, 0.16, 0.38),
        });

        // Side Security Strip (Signature Look)
        firstPage.drawRectangle({
            x: 0,
            y: 0,
            width: 12,
            height: height,
            color: rgb(0.06, 0.16, 0.38),
        });

        const modifiedPdfBytes = await pdfDoc.save();
        const baseName = path.basename(filePath).split('.')[0];
        const finalFileName = `CERTIFIED_RECORD_${Date.now()}.pdf`;
        const finalPath = path.join(path.dirname(filePath), finalFileName);
        
        fs.writeFileSync(finalPath, modifiedPdfBytes);
        
        // Return details for DB update
        return {
            fileName: finalFileName,
            hash: crypto.createHash('sha256').update(modifiedPdfBytes).digest('hex')
        };

    } catch (error) {
        console.error("Vault Stamping Failed:", error);
        throw error;
    }
};

module.exports = { stampDocument };
