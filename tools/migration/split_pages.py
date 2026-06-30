import re
import os

with open('frontend/src/main.jsx', 'r') as f:
    code = f.read()

pages = [
    {
        'name': 'WhyIbisView',
        'funcs': ['WhyIbisView'],
        'path': 'frontend/src/components/common/WhyIbisView.jsx',
        'imports': "import React, { useRef } from 'react';\nimport { Menu } from 'lucide-react';\nimport { TimelineContent } from '../ui/timeline-animation';\nimport { AwardBadge } from '../ui/award-badge';\nimport { Brand, Button } from '../ui/LegacyUI';\nimport RockerSwitch from '../ui/RockerSwitch';\nimport TesplePill from '../ui/TesplePill';\n"
    },
    {
        'name': 'LegalInfoPage',
        'funcs': ['LegalInfoPage'],
        'path': 'frontend/src/components/common/LegalInfoPage.jsx',
        'imports': "import React from 'react';\nimport { ArrowLeft } from 'lucide-react';\nimport { Brand, GlassButton } from '../ui/LegacyUI';\n"
    },
    {
        'name': 'Checkout',
        'funcs': ['Checkout'],
        'path': 'frontend/src/components/auth/Checkout.jsx',
        'imports': "import React, { useState, useEffect, useRef } from 'react';\nimport { ArrowLeft, Check, Lock, ReceiptIndianRupee } from 'lucide-react';\nimport { Brand, Button, GlassButton, Pill } from '../ui/LegacyUI';\nimport ReflectiveTiltFrame from '../ui/ReflectiveTiltFrame';\nimport TesplePill from '../ui/TesplePill';\n"
    },
    {
        'name': 'Signup',
        'funcs': ['Pupil', 'EyeBall', 'updateSignupPupils', 'SignupCharacters', 'Signup'],
        'path': 'frontend/src/components/auth/Signup.jsx',
        'imports': "import React, { useRef, useState, useEffect } from 'react';\nimport { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';\nimport { Brand, Button, GlassButton, AnimatedLayerButton } from '../ui/LegacyUI';\nimport { useAuth } from '../../lib/auth';\nimport PortalBadge from '../ui/PortalBadge';\n"
    },
    {
        'name': 'BatchControl',
        'funcs': ['StudentRow', 'BatchControl'],
        'path': 'frontend/src/components/admin/BatchControl.jsx',
        'imports': "import React, { useState } from 'react';\nimport { ArrowLeft, CalendarDays, Download, LogOut, Mail, Upload, Users, Save, Check } from 'lucide-react';\nimport { Brand, Button, GlassButton, Pill } from '../ui/LegacyUI';\n"
    },
    {
        'name': 'AdminPanel',
        'funcs': ['reorder', 'AdminColumn', 'AdminRow', 'AdminVideos', 'UploadIllustration', 'AdminNotes', 'AdminPanel'],
        'path': 'frontend/src/components/admin/AdminPanel.jsx',
        'imports': "import React, { useState, useEffect } from 'react';\nimport { ArrowDown, ArrowUp, CalendarDays, Clipboard, Edit3, Eye, EyeOff, FileText, Lock, LogOut, Play, Plus, Save, Trash2, Upload, Users, Video } from 'lucide-react';\nimport { Brand, Button, GlassButton, Pill, ShinyButton } from '../ui/LegacyUI';\nimport StudentManager from './StudentManager';\nimport AdminQuestionBank from '../test/AdminQuestionBank';\n"
    },
    {
        'name': 'ChapterView',
        'funcs': ['ContentTab', 'VideoCard', 'VideoModal', 'NotesTab', 'LatexFallback', 'TestTab', 'ChapterView'],
        'path': 'frontend/src/components/student/ChapterView.jsx',
        'imports': "import React, { useState, useEffect } from 'react';\nimport { ArrowLeft, BookOpen, FileText, Lock, Play, Video, WandSparkles, X, ZoomIn, ZoomOut } from 'lucide-react';\nimport { Button, GlassButton, Pill } from '../ui/LegacyUI';\nimport StudentTest from '../test/StudentTest';\nimport LatexDocument from '../LatexDocument';\n"
    },
    {
        'name': 'StudentPortal',
        'funcs': ['getCalendarDays', 'getStudyCalendar', 'CalendarCard', 'StatsModal', 'LeaderboardModal', 'ActivityRings', 'Paywall', 'BatchModal', 'StudentPortal'],
        'path': 'frontend/src/components/student/StudentPortal.jsx',
        'imports': "import React, { useState, useEffect, useRef } from 'react';\nimport { Award, BookOpen, Check, Flame, Layers3, Lock, LogOut, ReceiptIndianRupee, Trophy, Users, X, Zap } from 'lucide-react';\nimport { Brand, Button, GlassButton, Pill, ShinyButton } from '../ui/LegacyUI';\nimport TextReveal from '../ui/TextReveal';\nimport GradientBlobCard from '../ui/GradientBlobCard';\nimport ChapterCardStack from '../shared/ChapterCardStack';\n"
    },
    {
        'name': 'Landing',
        'funcs': ['Proof', 'Feature', 'StudentChapterShowcase', 'Landing'],
        'path': 'frontend/src/components/common/Landing.jsx',
        'imports': "import React, { useState, useRef, useEffect } from 'react';\nimport { ArrowRight, BookOpen, Layers3, Play, Users, Zap } from 'lucide-react';\nimport { Brand, Button, GlassButton, Pill, AnimatedLayerButton } from '../ui/LegacyUI';\nimport TextReveal from '../ui/TextReveal';\nimport ChapterImage from '../shared/ChapterImage';\nimport ChapterCardStack from '../shared/ChapterCardStack';\n"
    }
]

def extract_comp(c_code, func_name):
    # Try function func_name(
    idx = c_code.find(f"function {func_name}(")
    if idx == -1:
        idx = c_code.find(f"const {func_name} = ")
    
    if idx == -1:
        return None, c_code
        
    brace_count = 0
    found = False
    end_idx = -1
    for i in range(idx, len(c_code)):
        if c_code[i] == '{':
            found = True
            brace_count += 1
        elif c_code[i] == '}':
            brace_count -= 1
            if found and brace_count == 0:
                end_idx = i + 1
                break
                
    if end_idx != -1:
        content = c_code[idx:end_idx]
        new_code = c_code[:idx] + c_code[end_idx:]
        return content, new_code
    return None, c_code

main_imports = []
for p in pages:
    page_content = ""
    for func in p['funcs']:
        content, code = extract_comp(code, func)
        if content:
            page_content += content + "\n\n"
        else:
            print(f"Could not find {func}")
            
    if page_content:
        file_content = p['imports'] + "\n" + page_content + f"export default {p['name']};\n"
        with open(p['path'], 'w') as f:
            f.write(file_content)
        print(f"Extracted {p['name']}")
        
        rel_path = p['path'].replace('frontend/src/', './').replace('.jsx', '')
        main_imports.append(f"import {p['name']} from '{rel_path}';")

imp_str = "\n".join(main_imports)
code = code.replace('import { ErrorBoundary } from "./components/common/ErrorBoundary.jsx";', f'import {{ ErrorBoundary }} from "./components/common/ErrorBoundary.jsx";\n{imp_str}')

with open('frontend/src/main.jsx', 'w') as f:
    f.write(code)
print("Updated main.jsx")
