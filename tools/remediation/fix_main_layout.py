import re

filepath = "frontend/src/main.jsx"
with open(filepath, "r") as f:
    code = f.read()

# Remove useViewport import
code = re.sub(r'import\s+{\s*useViewport\s*}\s*from\s*["\']\./hooks/useViewport["\'];\n?', '', code)

# Remove lucide-react 'Check' import if it was only used by ScaleRotateWrapper
# Looking at the lucide-react imports:
code = re.sub(r'\s*Check,?\s*', '\n  ', code) # simple regex since it's just a named import

# Add AppLayout import before existing imports if not present
if "import { AppLayout }" not in code:
    code = 'import { AppLayout } from "./components/layout/AppLayout";\n' + code

# Remove AnimatedMeshBackground
code = re.sub(r'const AnimatedMeshBackground.*?</div>\n\);\n?', '', code, flags=re.DOTALL)

# Remove AppLayout inline
code = re.sub(r'const AppLayout =.*?};\n?', '', code, flags=re.DOTALL)

# Remove ScaleRotateWrapper
code = re.sub(r'const ScaleRotateWrapper =.*?};\n?', '', code, flags=re.DOTALL)

# Remove extra newlines
code = re.sub(r'\n{3,}', '\n\n', code)

with open(filepath, "w") as f:
    f.write(code)

