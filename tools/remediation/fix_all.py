import re

# Fix ChapterView
filepath = "frontend/src/components/student/ChapterView.jsx"
with open(filepath, "r") as f:
    code = f.read()
code = code.replace("import StudentTest from '../test/StudentTest';", 'import { StudentTest } from "../test/StudentTest";')
with open(filepath, "w") as f:
    f.write(code)

# Fix AdminPanel
filepath = "frontend/src/components/admin/AdminPanel.jsx"
with open(filepath, "r") as f:
    code = f.read()
code = code.replace("import StudentManager from './StudentManager';", 'import { StudentManager } from "./StudentManager";')
code = code.replace("import AdminQuestionBank from '../test/AdminQuestionBank';", 'import { AdminQuestionBank } from "../test/AdminQuestionBank";')
with open(filepath, "w") as f:
    f.write(code)

