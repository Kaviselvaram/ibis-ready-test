import re

# 1. MockQuestionBankRepository.js
filepath = "frontend/src/repositories/mock/MockQuestionBankRepository.js"
with open(filepath, "r") as f:
    code = f.read()

code = code.replace("export function loadBank() {", "export async function loadBank() {")
code = code.replace("export function saveBank(bank) {", "export async function saveBank(bank) {")

with open(filepath, "w") as f:
    f.write(code)

# 2. useAdminController.js
filepath = "frontend/src/hooks/useAdminController.js"
with open(filepath, "r") as f:
    code = f.read()

code = code.replace("""  useEffect(() => {
    if (!questionBank) {
      setQuestionBank(loadBank());
      StudentRepository.getStudents().then(setStudents);
      BatchRepository.getBatches().then(setBatches);
    }
  }, [questionBank, setQuestionBank]);""", """  useEffect(() => {
    let active = true;
    if (!questionBank) {
      loadBank().then(bank => {
        if (active) setQuestionBank(bank);
      });
      StudentRepository.getStudents().then(data => {
        if (active) setStudents(data);
      });
      BatchRepository.getBatches().then(data => {
        if (active) setBatches(data);
      });
    }
    return () => { active = false; };
  }, [questionBank, setQuestionBank, setStudents, setBatches]);""")

with open(filepath, "w") as f:
    f.write(code)

