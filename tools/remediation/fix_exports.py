import re

# Fix ChapterView
filepath = "frontend/src/components/student/ChapterView.jsx"
with open(filepath, "r") as f:
    code = f.read()
code = code.replace('import StudentTest from "../test/StudentTest";', 'import { StudentTest } from "../test/StudentTest";')
with open(filepath, "w") as f:
    f.write(code)

# Fix AdminPanel
filepath = "frontend/src/components/admin/AdminPanel.jsx"
with open(filepath, "r") as f:
    code = f.read()
code = code.replace('import StudentManager from "./StudentManager";', 'import { StudentManager } from "./StudentManager";')
code = code.replace('import AdminQuestionBank from "../test/AdminQuestionBank";', 'import { AdminQuestionBank } from "../test/AdminQuestionBank";')
with open(filepath, "w") as f:
    f.write(code)

# Fix AnimatedLayerButton import
for fp in ["frontend/src/components/common/Landing.jsx", "frontend/src/components/auth/Signup.jsx"]:
    with open(fp, "r") as f:
        code = f.read()
    code = code.replace(', AnimatedLayerButton ', ' ')
    code = code.replace('AnimatedLayerButton', '') # in case it's the last one
    # Replace `<AnimatedLayerButton` with `<Button` if it was used in code
    code = code.replace('<AnimatedLayerButton', '<Button')
    code = code.replace('</AnimatedLayerButton>', '</Button>')
    with open(fp, "w") as f:
        f.write(code)

