const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const mainPath = 'src/main.jsx';
let code = fs.readFileSync(mainPath, 'utf-8');

const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx']
});

const extractions = [
    {
        file: 'src/components/ui/LegacyUI.jsx',
        components: ['Brand', 'Button', 'GlassButton', 'Pill', 'ShinyButton', 'AnimatedLayerButton'],
        imports: "import React, { useRef } from 'react';\nimport { Eye } from 'lucide-react';\nimport { motion } from 'framer-motion';\n"
    },
    {
        file: 'src/components/ui/TextReveal.jsx',
        components: ['TextReveal'],
        imports: "import React, { useState, useMemo } from 'react';\n"
    },
    {
        file: 'src/components/ui/GradientBlobCard.jsx',
        components: ['GradientBlobCard'],
        imports: "import React from 'react';\n"
    },
    {
        file: 'src/components/ui/ReflectiveTiltFrame.jsx',
        components: ['ReflectiveTiltFrame'],
        imports: "import React, { useEffect, useRef } from 'react';\n"
    },
    {
        file: 'src/components/shared/ChapterImage.jsx',
        components: ['ChapterImage'],
        imports: "import React from 'react';\n"
    },
    {
        file: 'src/components/shared/ChapterCardStack.jsx',
        components: ['ChapterCardStack'],
        imports: "import React, { useState } from 'react';\nimport { ArrowLeft, ArrowRight, Lock } from 'lucide-react';\nimport { AnimatePresence, motion } from 'framer-motion';\nimport { GlassButton } from '../ui/LegacyUI';\n"
    },
    {
        file: 'src/components/ui/TesplePill.jsx',
        components: ['TesplePill'],
        imports: "import React, { useEffect, useRef } from 'react';\n"
    },
    {
        file: 'src/components/ui/RockerSwitch.jsx',
        components: ['RockerSwitch'],
        imports: "import React from 'react';\nimport { ShamayimToggleSwitch } from './switch';\n"
    },
    {
        file: 'src/components/ui/PortalBadge.jsx',
        components: ['PortalBadge'],
        imports: "import React, { useEffect, useRef } from 'react';\n"
    },
    {
        file: 'src/components/layout/ScaleRotateWrapper.jsx',
        components: ['ScaleRotateWrapper'],
        imports: "import React, { useState, useEffect } from 'react';\nconst isMobileOrTablet = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|Macintosh/i.test(navigator.userAgent) && (navigator.maxTouchPoints > 0 || (navigator.userAgent.includes('Macintosh') && 'ontouchend' in document));\n"
    },
    {
        file: 'src/components/common/WhyIbisView.jsx',
        components: ['WhyIbisView'],
        imports: "import React, { useRef } from 'react';\nimport { Menu } from 'lucide-react';\nimport { TimelineContent } from '../ui/timeline-animation';\nimport { AwardBadge } from '../ui/award-badge';\nimport { Brand, Button } from '../ui/LegacyUI';\nimport RockerSwitch from '../ui/RockerSwitch';\nimport TesplePill from '../ui/TesplePill';\n"
    },
    {
        file: 'src/components/common/LegalInfoPage.jsx',
        components: ['LegalInfoPage'],
        imports: "import React from 'react';\nimport { ArrowLeft } from 'lucide-react';\nimport { Brand, GlassButton } from '../ui/LegacyUI';\n"
    },
    {
        file: 'src/components/auth/Checkout.jsx',
        components: ['Checkout'],
        imports: "import React, { useState, useEffect, useRef } from 'react';\nimport { ArrowLeft, Check, Lock, ReceiptIndianRupee } from 'lucide-react';\nimport { Brand, Button, GlassButton, Pill } from '../ui/LegacyUI';\nimport ReflectiveTiltFrame from '../ui/ReflectiveTiltFrame';\nimport TesplePill from '../ui/TesplePill';\n"
    },
    {
        file: 'src/components/auth/Signup.jsx',
        components: ['Pupil', 'EyeBall', 'updateSignupPupils', 'SignupCharacters', 'Signup'],
        imports: "import React, { useRef, useState, useEffect } from 'react';\nimport { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';\nimport { Brand, Button, GlassButton, AnimatedLayerButton } from '../ui/LegacyUI';\nimport { useAuth } from '../../lib/auth';\nimport PortalBadge from '../ui/PortalBadge';\n"
    },
    {
        file: 'src/components/admin/BatchControl.jsx',
        components: ['StudentRow', 'BatchControl'],
        imports: "import React, { useState } from 'react';\nimport { ArrowLeft, CalendarDays, Download, LogOut, Mail, Upload, Users, Save, Check } from 'lucide-react';\nimport { Brand, Button, GlassButton, Pill } from '../ui/LegacyUI';\n"
    },
    {
        file: 'src/components/admin/AdminPanel.jsx',
        components: ['reorder', 'AdminColumn', 'AdminRow', 'AdminVideos', 'UploadIllustration', 'AdminNotes', 'AdminPanel'],
        imports: "import React, { useState, useEffect } from 'react';\nimport { ArrowDown, ArrowUp, CalendarDays, Clipboard, Edit3, Eye, EyeOff, FileText, Lock, LogOut, Play, Plus, Save, Trash2, Upload, Users, Video } from 'lucide-react';\nimport { Brand, Button, GlassButton, Pill, ShinyButton } from '../ui/LegacyUI';\nimport StudentManager from './StudentManager';\nimport AdminQuestionBank from '../test/AdminQuestionBank';\n"
    },
    {
        file: 'src/components/student/ChapterView.jsx',
        components: ['ContentTab', 'VideoCard', 'VideoModal', 'NotesTab', 'LatexFallback', 'TestTab', 'ChapterView'],
        imports: "import React, { useState, useEffect } from 'react';\nimport { ArrowLeft, BookOpen, FileText, Lock, Play, Video, WandSparkles, X, ZoomIn, ZoomOut } from 'lucide-react';\nimport { Button, GlassButton, Pill } from '../ui/LegacyUI';\nimport StudentTest from '../test/StudentTest';\nimport LatexDocument from '../LatexDocument';\n"
    },
    {
        file: 'src/components/student/StudentPortal.jsx',
        components: ['getCalendarDays', 'getStudyCalendar', 'CalendarCard', 'StatsModal', 'LeaderboardModal', 'ActivityRings', 'Paywall', 'BatchModal', 'StudentPortal'],
        imports: "import React, { useState, useEffect, useRef } from 'react';\nimport { Award, BookOpen, Check, Flame, Layers3, Lock, LogOut, ReceiptIndianRupee, Trophy, Users, X, Zap } from 'lucide-react';\nimport { Brand, Button, GlassButton, Pill, ShinyButton } from '../ui/LegacyUI';\nimport TextReveal from '../ui/TextReveal';\nimport GradientBlobCard from '../ui/GradientBlobCard';\nimport ChapterCardStack from '../shared/ChapterCardStack';\n"
    },
    {
        file: 'src/components/common/Landing.jsx',
        components: ['Proof', 'Feature', 'StudentChapterShowcase', 'Landing'],
        imports: "import React, { useState, useRef, useEffect } from 'react';\nimport { ArrowRight, BookOpen, Layers3, Play, Users, Zap } from 'lucide-react';\nimport { Brand, Button, GlassButton, Pill, AnimatedLayerButton } from '../ui/LegacyUI';\nimport TextReveal from '../ui/TextReveal';\nimport ChapterImage from '../shared/ChapterImage';\nimport ChapterCardStack from '../shared/ChapterCardStack';\n"
    }
];

let nodesToRemove = [];
let extractedCodeMap = {};

traverse(ast, {
    FunctionDeclaration(path) {
        let name = path.node.id.name;
        for (let ext of extractions) {
            if (ext.components.includes(name)) {
                nodesToRemove.push({ start: path.node.start, end: path.node.end, name });
                extractedCodeMap[name] = code.substring(path.node.start, path.node.end);
            }
        }
    },
    VariableDeclaration(path) {
        if (path.node.declarations && path.node.declarations.length === 1) {
            let name = path.node.declarations[0].id.name;
            for (let ext of extractions) {
                if (ext.components.includes(name)) {
                    nodesToRemove.push({ start: path.node.start, end: path.node.end, name });
                    extractedCodeMap[name] = code.substring(path.node.start, path.node.end);
                }
            }
        }
    }
});

nodesToRemove.sort((a, b) => b.start - a.start);

for (let ext of extractions) {
    let fileBody = ext.imports + '\n';
    for (let comp of ext.components) {
        if (extractedCodeMap[comp]) {
            if (comp === ext.components[ext.components.length - 1] && ext.components.length > 1) {
                if (comp === 'TextReveal' || comp === 'ScaleRotateWrapper' || ext.file.includes('LegacyUI')) {
                    fileBody += 'export default ' + extractedCodeMap[comp] + '\n\n';
                } else {
                    fileBody += 'export default ' + extractedCodeMap[comp] + '\n\n';
                }
            } else if (ext.components.length === 1 && comp !== 'TextReveal' && comp !== 'ScaleRotateWrapper') {
                fileBody += 'export default ' + extractedCodeMap[comp] + '\n\n';
            } else {
                if (comp === 'TextReveal' || comp === 'ScaleRotateWrapper') {
                     fileBody += 'export default ' + extractedCodeMap[comp] + '\n\n';
                } else {
                     fileBody += 'export ' + extractedCodeMap[comp] + '\n\n';
                }
            }
        }
    }
    fs.writeFileSync(ext.file, fileBody);
    console.log("Wrote", ext.file);
}

let newMainCode = code;
for (let node of nodesToRemove) {
    newMainCode = newMainCode.substring(0, node.start) + newMainCode.substring(node.end);
}

const newImports = extractions.map(ext => {
    let relPath = ext.file.replace('src/', './').replace('.jsx', '');
    if (ext.components.length === 1) {
        return `import ${ext.components[0]} from '${relPath}';`;
    } else {
        if (ext.components.includes('Brand')) {
            return `import { Brand, Button, GlassButton, Pill, ShinyButton, AnimatedLayerButton } from '${relPath}';`;
        } else {
            return `import ${ext.components[ext.components.length - 1]} from '${relPath}';`;
        }
    }
}).join('\n');

newMainCode = newMainCode.replace('import { ErrorBoundary } from "./components/common/ErrorBoundary.jsx";', 'import { ErrorBoundary } from "./components/common/ErrorBoundary.jsx";\n' + newImports);

fs.writeFileSync(mainPath, newMainCode);
console.log("Updated main.jsx");
