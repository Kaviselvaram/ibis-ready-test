const fs = require('fs');

let fileStr = fs.readFileSync('frontend/src/main.jsx', 'utf-8');

const componentsToExtract = [
    { name: 'ScaleRotateWrapper', path: 'frontend/src/components/layout/ScaleRotateWrapper.jsx' },
    { name: 'TextReveal', path: 'frontend/src/components/ui/TextReveal.jsx', isMemo: true },
    { name: 'GradientBlobCard', path: 'frontend/src/components/ui/GradientBlobCard.jsx' },
    { name: 'ReflectiveTiltFrame', path: 'frontend/src/components/ui/ReflectiveTiltFrame.jsx' },
    { name: 'ChapterImage', path: 'frontend/src/components/shared/ChapterImage.jsx' },
    { name: 'ChapterCardStack', path: 'frontend/src/components/shared/ChapterCardStack.jsx' },
    { name: 'TesplePill', path: 'frontend/src/components/ui/TesplePill.jsx' },
    { name: 'RockerSwitch', path: 'frontend/src/components/ui/RockerSwitch.jsx' },
    { name: 'PortalBadge', path: 'frontend/src/components/ui/PortalBadge.jsx' }
];

function extractComponent(code, compName, isMemo) {
    let searchStr = isMemo ? `const ${compName} = React.memo(function ${compName}(` : `function ${compName}(`;
    let startIdx = code.indexOf(searchStr);
    if (startIdx === -1) return null;

    let braceCount = 0;
    let foundStart = false;
    let endIdx = -1;

    for (let i = startIdx; i < code.length; i++) {
        if (code[i] === '{') {
            foundStart = true;
            braceCount++;
        } else if (code[i] === '}') {
            braceCount--;
            if (foundStart && braceCount === 0) {
                if (isMemo) {
                    endIdx = code.indexOf('});', i) + 3;
                } else {
                    endIdx = i + 1;
                }
                break;
            }
        }
    }
    
    if (endIdx !== -1) {
        return { startIdx, endIdx, content: code.substring(startIdx, endIdx) };
    }
    return null;
}

const extracted = {};

componentsToExtract.forEach(comp => {
    let result = extractComponent(fileStr, comp.name, comp.isMemo);
    if (result) {
        extracted[comp.name] = result.content;
        
        let imports = `import React, { useState, useEffect, useRef, useMemo } from 'react';\n`;
        
        // Add specific imports based on component usage
        if (comp.name === 'ChapterCardStack') {
            imports += `import { ArrowLeft, ArrowRight, Lock } from 'lucide-react';\nimport { AnimatePresence, motion } from 'framer-motion';\nimport { GlassButton } from '../ui/LegacyUI';\n`;
        }
        if (comp.name === 'RockerSwitch') {
            imports += `import { ShamayimToggleSwitch } from './switch';\n`;
        }
        
        // Check for isMobileOrTablet needed by ScaleRotateWrapper
        if (comp.name === 'ScaleRotateWrapper') {
            let isMobile = `const isMobileOrTablet = typeof navigator !== "undefined" && /Mobi|Android|iPhone|iPad|Macintosh/i.test(navigator.userAgent) && (navigator.maxTouchPoints > 0 || (navigator.userAgent.includes("Macintosh") && "ontouchend" in document));\n`;
            imports += isMobile;
        }

        let fileContent = imports + `\nexport default ${extracted[comp.name]}\n`;
        if (!comp.isMemo) {
            fileContent = imports + `\nexport default ` + extracted[comp.name].replace(`function ${comp.name}`, `function ${comp.name}`) + `\n`;
        }
        
        fs.writeFileSync(comp.path, fileContent);
        console.log(`Extracted ${comp.name}`);
        
        // Replace in main.jsx
        fileStr = fileStr.substring(0, result.startIdx) + fileStr.substring(result.endIdx);
    }
});

// Add imports to top of main.jsx
const mainImports = componentsToExtract.map(comp => {
    let relativePath = comp.path.replace('frontend/src/', './');
    return `import ${comp.name} from '${relativePath.replace('.jsx', '')}';`;
}).join('\n');

fileStr = fileStr.replace('import { ErrorBoundary } from "./components/common/ErrorBoundary.jsx";', 
    `import { ErrorBoundary } from "./components/common/ErrorBoundary.jsx";\n${mainImports}`);

fs.writeFileSync('frontend/src/main.jsx', fileStr);
console.log('Updated main.jsx');
