import re

filepath = "frontend/src/main.jsx"
with open(filepath, "r") as f:
    code = f.read()

# Remove initialStudents array
code = re.sub(r'const initialStudents = \[[^\]]*\];\n?', '', code, flags=re.DOTALL)

# Remove initialBatches array
code = re.sub(r'const initialBatches = \[[^\]]*\];\n?', '', code, flags=re.DOTALL)

# Remove studyDataByDay
code = re.sub(r'const studyDataByDay = \{[^}]*\};\n?', '', code, flags=re.DOTALL)

# Remove youtube helpers
code = re.sub(r'function getYouTubeId[^}]+}\n?', '', code, flags=re.DOTALL)
code = re.sub(r'function getYouTubeThumbnail[^}]+}\n?', '', code, flags=re.DOTALL)
code = re.sub(r'function getYouTubeEmbed[^}]+}\n?', '', code, flags=re.DOTALL)

# Remove isMobileOrTablet if not used. It is NOT used in main.jsx, it's inside useViewport!
code = re.sub(r'const isMobileOrTablet = [^;]+;\n?', '', code, flags=re.DOTALL)

# Remove any consecutive blank lines down to max 2
code = re.sub(r'\n{3,}', '\n\n', code)

with open(filepath, "w") as f:
    f.write(code)

