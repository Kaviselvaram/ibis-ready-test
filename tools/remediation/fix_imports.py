import os
import re

# 1. Update StudentPortal.jsx
filepath = "frontend/src/components/student/StudentPortal.jsx"
with open(filepath, "r") as f:
    code = f.read()

# It uses studyDataByDay, which needs to be imported
if "studyDataByDay" in code and "import { studyDataByDay }" not in code:
    code = 'import { studyDataByDay } from "../../data/mockData";\n' + code
    with open(filepath, "w") as f:
        f.write(code)

# 2. Update BatchControl.jsx
filepath = "frontend/src/components/admin/BatchControl.jsx"
with open(filepath, "r") as f:
    code = f.read()

if "initialBatches" in code and "import { initialBatches }" not in code:
    code = 'import { initialBatches } from "../../data/mockData";\n' + code
    with open(filepath, "w") as f:
        f.write(code)

# 3. Update ChapterView.jsx (getYouTubeThumbnail, getYouTubeEmbed)
filepath = "frontend/src/components/student/ChapterView.jsx"
with open(filepath, "r") as f:
    code = f.read()

if "getYouTubeThumbnail" in code and "import { getYouTubeThumbnail" not in code:
    code = 'import { getYouTubeThumbnail, getYouTubeEmbed } from "../../utils/youtube";\n' + code
    with open(filepath, "w") as f:
        f.write(code)

# 4. Update AdminPanel.jsx (getYouTubeThumbnail)
filepath = "frontend/src/components/admin/AdminPanel.jsx"
with open(filepath, "r") as f:
    code = f.read()

if "getYouTubeThumbnail" in code and "import { getYouTubeThumbnail" not in code:
    code = 'import { getYouTubeThumbnail } from "../../utils/youtube";\n' + code
    with open(filepath, "w") as f:
        f.write(code)

