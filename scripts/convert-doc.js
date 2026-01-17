const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');

const markdown = fs.readFileSync('doc.md', 'utf-8');
const lines = markdown.split('\n');

const children = [];

let inCodeBlock = false;

for (let line of lines) {
    // Code Blocks
    if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
    }

    if (inCodeBlock) {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: line,
                        font: "Courier New",
                        size: 20, // 10pt
                    }),
                ],
                spacing: { after: 0, before: 0 },
                indent: { left: 720 }, // 0.5 inch
            })
        );
        continue;
    }

    const cleanLine = line.trim();

    // Empty lines
    if (!cleanLine) {
        children.push(new Paragraph({ text: "" }));
        continue;
    }

    // Headers
    if (line.startsWith('# ')) {
        children.push(
            new Paragraph({
                text: line.replace('# ', ''),
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
            })
        );
    } else if (line.startsWith('## ')) {
        children.push(
            new Paragraph({
                text: line.replace('## ', ''),
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
                border: {
                    bottom: {
                        color: "auto",
                        space: 1,
                        value: "single",
                        size: 6,
                    },
                },
            })
        );
    } else if (line.startsWith('### ')) {
        children.push(
            new Paragraph({
                text: line.replace('### ', ''),
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 100 },
            })
        );
    } else if (line.startsWith('- ')) {
        // List Items
        // Handle bold inside list
        const content = line.replace('- ', '');
        children.push(
            new Paragraph({
                children: parseText(content),
                bullet: {
                    level: 0,
                },
            })
        );
    } else {
        // Normal Text
        children.push(
            new Paragraph({
                children: parseText(line),
                spacing: { after: 200 },
            })
        );
    }
}

// Helper to parse bold/italic
function parseText(text) {
    const parts = [];
    // Regex to split by bold (**text**) or italic (_text_ or *text*)
    // Simplified: just handling **bold** and *italic* for now

    let currentText = text;

    // This is a very basic parser, good enough for specific doc
    // We'll split by **
    const boldParts = currentText.split(/(\*\*[^*]+\*\*)/g);

    boldParts.forEach(part => {
        if (part.startsWith('**') && part.endsWith('**')) {
            parts.push(new TextRun({
                text: part.replace(/\*\*/g, ''),
                bold: true,
            }));
        } else {
            // Checking for italics inside non-bold parts
            const italicParts = part.split(/(\*[^*]+\*)/g);
            italicParts.forEach(iPart => {
                if (iPart.startsWith('*') && iPart.endsWith('*') && iPart.length > 2) {
                    parts.push(new TextRun({
                        text: iPart.replace(/\*/g, ''),
                        italics: true,
                    }));
                } else {
                    parts.push(new TextRun({ text: iPart }));
                }
            });
        }
    });

    return parts;
}

const doc = new Document({
    sections: [
        {
            properties: {},
            children: children,
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync('Dokumentasi_Rumus.docx', buffer);
    console.log('Document created: Dokumentasi_Rumus.docx');
});
