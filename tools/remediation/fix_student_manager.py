import re

# 1. Update StudentRepository
filepath = "frontend/src/repositories/StudentRepository.js"
with open(filepath, "w") as f:
    f.write("export * from './mock/MockStudentRepository';\n")

# 2. Update StudentManager.jsx
filepath = "frontend/src/components/admin/StudentManager.jsx"
with open(filepath, "r") as f:
    code = f.read()

code = code.replace('import { blankStudent, ACCESS_LEVELS, PAYMENT_STATES } from "../../lib/students";', 'import { blankStudent, ACCESS_LEVELS, PAYMENT_STATES } from "../../repositories/StudentRepository";')

with open(filepath, "w") as f:
    f.write(code)

