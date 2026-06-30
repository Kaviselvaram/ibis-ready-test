const fs = require('fs');
const path = require('path');

const file = fs.readFileSync('frontend/src/main.jsx', 'utf-8');
const lines = file.split('\n');

function extractLines(startStr, endStr) {
    let startIdx = lines.findIndex(l => l.startsWith(startStr));
    let endIdx = -1;
    let braceCount = 0;
    let foundStart = false;
    
    for (let i = startIdx; i < lines.length; i++) {
        if (!foundStart && lines[i].includes('{')) {
            foundStart = true;
        }
        braceCount += (lines[i].match(/\{/g) || []).length;
        braceCount -= (lines[i].match(/\}/g) || []).length;
        if (foundStart && braceCount === 0) {
            endIdx = i;
            break;
        }
    }
    
    // Also include preceding comments or consts if we want to be exact, but we'll do it manually.
    if (startIdx !== -1 && endIdx !== -1) {
        return { startIdx, endIdx, code: lines.slice(startIdx, endIdx + 1).join('\n') };
    }
    return null;
}
