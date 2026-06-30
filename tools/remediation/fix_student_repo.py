import re

filepath = "frontend/src/repositories/StudentRepository.js"
with open(filepath, "w") as f:
    f.write("export { MockStudentRepository as StudentRepository, blankStudent, ACCESS_LEVELS, PAYMENT_STATES } from './mock/MockStudentRepository';\n")

