import re

# 1. Update CourseContext
filepath = "frontend/src/contexts/CourseContext.jsx"
with open(filepath, "r") as f:
    code = f.read()

code = code.replace('import { initialChapters } from "../data/chapters";', '')
code = code.replace('const [chapters, setChapters] = useState(initialChapters);', 'const [chapters, setChapters] = useState([]);')
code = code.replace('const activeChapter = chapters[chapterIndex] || chapters[0];', 'const activeChapter = chapters[chapterIndex] || (chapters.length > 0 ? chapters[0] : null);')

with open(filepath, "w") as f:
    f.write(code)

# 2. Update AdminContext
filepath = "frontend/src/contexts/AdminContext.jsx"
with open(filepath, "r") as f:
    code = f.read()

# Add students and batches state to AdminContext
if "students" not in code:
    code = code.replace('const [questionBank, setQuestionBank] = useState(null);', """const [questionBank, setQuestionBank] = useState(null);
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);""")
    code = code.replace('questionBank,', 'questionBank,\n        students,\n        setStudents,\n        batches,\n        setBatches,')

with open(filepath, "w") as f:
    f.write(code)

# 3. Update useCourseController
filepath = "frontend/src/hooks/useCourseController.js"
with open(filepath, "r") as f:
    code = f.read()

if "CourseRepository" not in code:
    code = 'import { CourseRepository } from "../repositories/CourseRepository";\nimport { useEffect } from "react";\n' + code

code = code.replace('const { chapters, setChapters', 'const { chapters, setChapters')
# We need to initialize chapters on mount
if "useEffect" in code and "initCourse" not in code:
    code = code.replace("const { goToChapter } = useNavigationController();", """const { goToChapter } = useNavigationController();
  
  useEffect(() => {
    const initCourse = async () => {
      if (chapters.length === 0) {
        const data = await CourseRepository.getChapters();
        setChapters(data);
      }
    };
    initCourse();
  }, [chapters.length, setChapters]);""")

with open(filepath, "w") as f:
    f.write(code)

# 4. Update useAdminController
filepath = "frontend/src/hooks/useAdminController.js"
with open(filepath, "r") as f:
    code = f.read()

code = code.replace('import { loadBank, saveBank } from "../repositories/QuestionBankRepository";', 
'import { loadBank, saveBank } from "../repositories/QuestionBankRepository";\nimport { StudentRepository } from "../repositories/StudentRepository";\nimport { BatchRepository } from "../repositories/BatchRepository";')

code = code.replace('const { questionBank, setQuestionBank } = useAdminContext();', 
'const { questionBank, setQuestionBank, students, setStudents, batches, setBatches } = useAdminContext();')

if "StudentRepository.getStudents()" not in code:
    code = code.replace('setQuestionBank(loadBank());', 'setQuestionBank(loadBank());\n      StudentRepository.getStudents().then(setStudents);\n      BatchRepository.getBatches().then(setBatches);')
    
    code = code.replace('return { questionBank, updateQuestionBank };', 
    """const updateStudents = async (newStudents) => {
    await StudentRepository.saveStudents(newStudents);
    setStudents(newStudents);
  };
  const updateBatches = async (newBatches) => {
    await BatchRepository.saveBatches(newBatches);
    setBatches(newBatches);
  };

  return { questionBank, updateQuestionBank, students, updateStudents, batches, updateBatches };""")

with open(filepath, "w") as f:
    f.write(code)

# 5. Update StudentManager.jsx
filepath = "frontend/src/components/admin/StudentManager.jsx"
with open(filepath, "r") as f:
    code = f.read()

code = code.replace('import { loadStudents, saveStudents, blankStudent, ACCESS_LEVELS, PAYMENT_STATES } from "../../lib/students";', 
'import { blankStudent, ACCESS_LEVELS, PAYMENT_STATES } from "../../lib/students";\nimport { useAdminController } from "../../hooks/useAdminController";')

code = code.replace('export function StudentManager({ batches, batchFilter }) {', 'export function StudentManager({ batches, batchFilter }) {')
code = code.replace('const [students, setStudents] = useState(() => loadStudents());', 
'const { students, updateStudents } = useAdminController();\n  const setStudents = updateStudents;')
code = code.replace('useEffect(() => { saveStudents(students); }, [students]);', '')

with open(filepath, "w") as f:
    f.write(code)

# 6. Update BatchControl.jsx
filepath = "frontend/src/components/admin/BatchControl.jsx"
with open(filepath, "r") as f:
    code = f.read()

code = code.replace('import { initialBatches } from "../../data/mockData";', 'import { useAdminController } from "../../hooks/useAdminController";')
code = code.replace('const [batches, setBatches] = useState(initialBatches);', 'const { batches, updateBatches } = useAdminController();\n  const setBatches = updateBatches;')

with open(filepath, "w") as f:
    f.write(code)


