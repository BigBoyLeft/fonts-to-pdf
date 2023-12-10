const path = require('path');
const fs = require('fs');
const fontManager = require('node-system-fonts');
const { PDFDocument } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');

const DISABLED_FONTS = [''];
const FONTS_PATH = 'C:\\WINDOWS\\FONTS';

async function getSystemAvailableFonts() {
    try {
        const fonts = fontManager.getAvailableFontsSync();
        return fonts.filter(
            (font) =>
                font.path.includes(FONTS_PATH) &&
                font.path.endsWith('.TTF') &&
                !DISABLED_FONTS.includes(font.family.toLowerCase()),
        );
    } catch (error) {
        console.error(error);
        throw new Error('Failed to get system available fonts');
    }
}

async function main() {
    const fonts = await getSystemAvailableFonts();
    console.log(`Found ${fonts.length} fonts`);
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    let page = pdfDoc.addPage();
    const fontSize = 12;
    const lineHeight = 14;
    let leftYPos = page.getHeight() - lineHeight - 25;
    let rightYPos = page.getHeight() - lineHeight - 25;

    for (let i = 0; i < fonts.length; i += 2) {
        try {
            const fontName1 = fonts[i].family;
            const fontPath1 = fonts[i].path;
            const fontBytes1 = await fs.promises.readFile(fontPath1);
            const pdfFont1 = await pdfDoc.embedFont(fontBytes1);
            console.log(`Added font: ${fontName1}`);

            const fontName2 = fonts[i + 1]?.family;
            const fontPath2 = fonts[i + 1]?.path;
            const fontBytes2 = await fs.promises.readFile(fontPath2);
            const pdfFont2 = await pdfDoc.embedFont(fontBytes2);
            console.log(`Added font: ${fontName2}`);

            // Calculate the width of the text
            const textWidth2 = pdfFont2?.widthOfTextAtSize(fontName2, fontSize);

            // If the left y position - line height exceeds the right y position, start a new line
            if (leftYPos - lineHeight < 0) {
                page = pdfDoc.addPage();
                leftYPos = page.getHeight() - lineHeight;
                rightYPos = page.getHeight() - lineHeight;
            }

            // Add the font name to the PDF using the font
            page.drawText(fontName1, {
                x: 50,
                y: leftYPos,
                size: fontSize,
                font: pdfFont1,
            });

            // Move the y position up for the next font
            leftYPos -= lineHeight;

            // If there is a second font, add it to the right list
            if (fontName2) {
                page.drawText(fontName2, {
                    x: page.getWidth() - textWidth2 - 50, // adjust this value as needed
                    y: rightYPos,
                    size: fontSize,
                    font: pdfFont2,
                });

                // Move the y position up for the next font
                rightYPos -= lineHeight;
            }
        } catch (error) {
            console.error(`Failed to add font: ${fonts[i].family}`);
        }
    }

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(path.join(process.cwd(), 'fonts.pdf'), pdfBytes);
}

main();
