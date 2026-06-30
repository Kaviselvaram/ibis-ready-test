import re

filepath = "frontend/src/components/admin/StudentManager.jsx"
with open(filepath, "r") as f:
    code = f.read()

code = code.replace('import {\n  loadStudents, saveStudents, blankStudent, ACCESS_LEVELS, PAYMENT_STATES,\n} from "../../lib/students";', 'import { blankStudent, ACCESS_LEVELS, PAYMENT_STATES } from "../../repositories/StudentRepository";')
code = code.replace('import { loadStudents, saveStudents, blankStudent, ACCESS_LEVELS, PAYMENT_STATES } from "../../lib/students";', 'import { blankStudent, ACCESS_LEVELS, PAYMENT_STATES } from "../../repositories/StudentRepository";')

with open(filepath, "w") as f:
    f.write(code)

