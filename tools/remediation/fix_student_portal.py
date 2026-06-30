import re

# 1. Update CourseContext
filepath = "frontend/src/contexts/CourseContext.jsx"
with open(filepath, "r") as f:
    code = f.read()

if "studyData" not in code:
    code = code.replace("const [chapters, setChapters] = useState([]);", "const [chapters, setChapters] = useState([]);\n  const [studyData, setStudyData] = useState({});")
    code = code.replace("        setChapters,", "        setChapters,\n        studyData,\n        setStudyData,")
    code = code.replace("[chapters, chapterIndex, topicIndex, tab, activeChapter]", "[chapters, chapterIndex, topicIndex, tab, activeChapter, studyData]")

with open(filepath, "w") as f:
    f.write(code)

# 2. Update useCourseController
filepath = "frontend/src/hooks/useCourseController.js"
with open(filepath, "r") as f:
    code = f.read()

code = code.replace("const { chapters, setChapters", "const { chapters, setChapters, studyData, setStudyData")

if "CourseRepository.getStudyData" not in code:
    code = code.replace("""const data = await CourseRepository.getChapters();
        setChapters(data);""", """const [chaps, study] = await Promise.all([
          CourseRepository.getChapters(),
          CourseRepository.getStudyData()
        ]);
        setChapters(chaps);
        setStudyData(study);""")

with open(filepath, "w") as f:
    f.write(code)

# 3. Update StudentPortal
filepath = "frontend/src/components/student/StudentPortal.jsx"
with open(filepath, "r") as f:
    code = f.read()

code = code.replace('import { studyDataByDay } from "../../data/mockData";\n', '')
code = code.replace("""export function getStudyCalendar(baseDate = new Date()) {""", """export function getStudyCalendar(studyDataByDay, baseDate = new Date()) {""")
code = code.replace("""export function CalendarCard({ onClick, isNested = false }) {
  const { year, today, monthName, days, activeDays } = getStudyCalendar();""", """export function CalendarCard({ onClick, isNested = false }) {
  const { studyData } = useCourseContext();
  const { year, today, monthName, days, activeDays } = getStudyCalendar(studyData || {});""")

# Update other calls to getStudyCalendar
code = code.replace("""const { year, month, today, monthName, days } = getStudyCalendar();""", """const { studyData } = useCourseContext();\n  const { year, month, today, monthName, days } = getStudyCalendar(studyData || {});""")
# Check if there is another call in StudentPortal
code = code.replace("const selectedData = studyDataByDay[selectedDay];", "const selectedData = (studyData || {})[selectedDay];")
code = code.replace("Object.keys(studyDataByDay)", "Object.keys(studyData || {})")

with open(filepath, "w") as f:
    f.write(code)

