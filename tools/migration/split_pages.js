const fs = require('fs');

let fileStr = fs.readFileSync('frontend/src/main.jsx', 'utf-8');

const pagesToExtract = [
    {
        name: 'WhyIbisView',
        funcs: ['WhyIbisView'],
        path: 'frontend/src/components/common/WhyIbisView.jsx',
        imports: `import React, { useRef } from 'react';\nimport { Menu } from 'lucide-react';\nimport { TimelineContent } from '../ui/timeline-animation';\nimport { AwardBadge } from '../ui/award-badge';\nimport { Brand, Button } from '../ui/LegacyUI';\nimport RockerSwitch from '../ui/RockerSwitch';\nimport TesplePill from '../ui/TesplePill';\n`
    },
    {
        name: 'LegalInfoPage',
        funcs: ['LegalInfoPage'],
        path: 'frontend/src/components/common/LegalInfoPage.jsx',
        imports: `import React from 'react';\nimport { ArrowLeft } from 'lucide-react';\nimport { Brand, GlassButton } from '../ui/LegacyUI';\n`
    },
    {
        name: 'Checkout',
        funcs: ['Checkout'],
        path: 'frontend/src/components/auth/Checkout.jsx',
        imports: `import React, { useState, useEffect } from 'react';\nimport { ArrowLeft, Check, Lock, ReceiptIndianRupee } from 'lucide-react';\nimport { Brand, Button, GlassButton, Pill } from '../ui/LegacyUI';\nimport ReflectiveTiltFrame from '../ui/ReflectiveTiltFrame';\nimport TesplePill from '../ui/TesplePill';\n`
    },
    {
        name: 'Signup',
        funcs: ['Pupil', 'EyeBall', 'updateSignupPupils', 'SignupCharacters', 'Signup'],
        path: 'frontend/src/components/auth/Signup.jsx',
        imports: `import React, { useRef, useState, useEffect } from 'react';\nimport { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';\nimport { Brand, Button, GlassButton, AnimatedLayerButton } from '../ui/LegacyUI';\nimport { useAuth } from '../../lib/auth';\nimport PortalBadge from '../ui/PortalBadge';\n`
    },
    {
        name: 'BatchControl',
        funcs: ['StudentRow', 'BatchControl'],
        path: 'frontend/src/components/admin/BatchControl.jsx',
        imports: `import React, { useState } from 'react';\nimport { ArrowLeft, CalendarDays, Download, LogOut, Mail, Upload, Users, Save, Check } from 'lucide-react';\nimport { Brand, Button, GlassButton, Pill } from '../ui/LegacyUI';\n`
    },
    {
        name: 'AdminPanel',
        funcs: ['reorder', 'AdminColumn', 'AdminRow', 'AdminVideos', 'UploadIllustration', 'AdminNotes', 'AdminPanel'],
        path: 'frontend/src/components/admin/AdminPanel.jsx',
        imports: `import React, { useState, useEffect } from 'react';\nimport { ArrowDown, ArrowUp, CalendarDays, Clipboard, Edit3, Eye, EyeOff, FileText, Lock, LogOut, Play, Plus, Save, Trash2, Upload, Users, Video } from 'lucide-react';\nimport { Brand, Button, GlassButton, Pill, ShinyButton } from '../ui/LegacyUI';\nimport StudentManager from './StudentManager';\nimport AdminQuestionBank from '../test/AdminQuestionBank';\n`
    },
    {
        name: 'ChapterView',
        funcs: ['ContentTab', 'VideoCard', 'VideoModal', 'NotesTab', 'LatexFallback', 'TestTab', 'ChapterView'],
        path: 'frontend/src/components/student/ChapterView.jsx',
        imports: `import React, { useState, useEffect } from 'react';\nimport { ArrowLeft, BookOpen, FileText, Lock, Play, Video, WandSparkles, X, ZoomIn, ZoomOut } from 'lucide-react';\nimport { Button, GlassButton, Pill } from '../ui/LegacyUI';\nimport StudentTest from '../test/StudentTest';\nimport LatexDocument from '../LatexDocument';\n`
    },
    {
        name: 'StudentPortal',
        funcs: ['getCalendarDays', 'getStudyCalendar', 'CalendarCard', 'StatsModal', 'LeaderboardModal', 'ActivityRings', 'Paywall', 'BatchModal', 'StudentPortal'],
        path: 'frontend/src/components/student/StudentPortal.jsx',
        imports: `import React, { useState, useEffect, useRef } from 'react';\nimport { Award, BookOpen, Check, Flame, Layers3, Lock, LogOut, ReceiptIndianRupee, Trophy, Users, X, Zap } from 'lucide-react';\nimport { Brand, Button, GlassButton, Pill, ShinyButton } from '../ui/LegacyUI';\nimport TextReveal from '../ui/TextReveal';\nimport GradientBlobCard from '../ui/GradientBlobCard';\nimport ChapterCardStack from '../shared/ChapterCardStack';\n`
    },
    {
        name: 'Landing',
        funcs: ['Proof', 'Feature', 'StudentChapterShowcase', 'Landing'],
        path: 'frontend/src/components/common/Landing.jsx',
        imports: `import React, { useState, useRef, useEffect } from 'react';\nimport { ArrowRight, BookOpen, Layers3, Play, Users, Zap } from 'lucide-react';\nimport { Brand, Button, GlassButton, Pill, AnimatedLayerButton } from '../ui/LegacyUI';\nimport TextReveal from '../ui/TextReveal';\nimport ChapterImage from '../shared/ChapterImage';\nimport ChapterCardStack from '../shared/ChapterCardStack';\n`
    }
];

function extractComponent(code, compName) {
    let searchStr = \`function \${compName}(\`;
    let startIdx = code.indexOf(searchStr);
    
    // Check if it's an arrow function or similar if standard search fails
    if (startIdx === -1) {
        // Simple fallback check
        startIdx = code.indexOf(\`const \${compName} = \`);
    }

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
                endIdx = i + 1;
                break;
            }
        }
    }
    
    if (endIdx !== -1) {
        return { startIdx, endIdx, content: code.substring(startIdx, endIdx) };
    }
    return null;
}

pagesToExtract.forEach(page => {
    let pageContent = '';
    
    page.funcs.forEach(func => {
        let result = extractComponent(fileStr, func);
        if (result) {
            pageContent += result.content + '\n\n';
            fileStr = fileStr.substring(0, result.startIdx) + fileStr.substring(result.endIdx);
        } else {
            console.warn(\`Could not find function \${func}\`);
        }
    });
    
    if (pageContent) {
        let fileContent = page.imports + '\n' + pageContent + \`export default \${page.name};\n\`;
        fs.writeFileSync(page.path, fileContent);
        console.log(\`Extracted page \${page.name}\`);
    }
});

// Add imports to top of main.jsx
const mainImports = pagesToExtract.map(page => {
    let relativePath = page.path.replace('frontend/src/', './');
    return \`import \${page.name} from '\${relativePath.replace('.jsx', '')}';\`;
}).join('\n');

fileStr = fileStr.replace('import { ErrorBoundary } from "./components/common/ErrorBoundary.jsx";', 
    \`import { ErrorBoundary } from "./components/common/ErrorBoundary.jsx";\\n\${mainImports}\`);

fs.writeFileSync('frontend/src/main.jsx', fileStr);
console.log('Updated main.jsx');
