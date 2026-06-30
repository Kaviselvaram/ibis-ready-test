import re

def update_file(filepath, replacements):
    with open(filepath, "r") as f:
        code = f.read()
    for old, new in replacements:
        code = code.replace(old, new)
    with open(filepath, "w") as f:
        f.write(code)

# 1. Landing.jsx
update_file("frontend/src/components/common/Landing.jsx", [
    ('import { useNavigate } from "react-router-dom";', 'import { useNavigationController } from "../../hooks/useNavigationController";'),
    ('const navigate = useNavigate();', 'const { goToAdmin, goToWhyIbis } = useNavigationController();'),
    ('const onAdmin = () => navigate("/admin");', 'const onAdmin = goToAdmin;'),
    ('const onWhyIbis = () => navigate("/why-ibis");', 'const onWhyIbis = goToWhyIbis;')
])

# 2. AdminPanel.jsx
update_file("frontend/src/components/admin/AdminPanel.jsx", [
    ('import { useNavigate } from "react-router-dom";', 'import { useNavigationController } from "../../hooks/useNavigationController";'),
    ('const navigate = useNavigate();', 'const { goToBatches, goToHome } = useNavigationController();'),
    ('const onBatch = () => navigate("/admin/batches");', 'const onBatch = goToBatches;'),
    ('const onLogout = () => navigate("/");', 'const onLogout = goToHome;')
])

# 3. ChapterView.jsx
update_file("frontend/src/components/student/ChapterView.jsx", [
    ('import { useNavigate } from "react-router-dom";', 'import { useNavigationController } from "../../hooks/useNavigationController";'),
    ('const navigate = useNavigate();', 'const { goToStudentPortal } = useNavigationController();'),
    ('const onBack = () => navigate("/student");', 'const onBack = goToStudentPortal;')
])

# 4. Checkout.jsx
update_file("frontend/src/components/auth/Checkout.jsx", [
    ('import { useNavigate } from "react-router-dom";', 'import { useNavigationController } from "../../hooks/useNavigationController";'),
    ('const navigate = useNavigate();', 'const { goBackFromCheckout } = useNavigationController();'),
    ('const onBack = () => navigate(pricingSource === "landing" ? "/" : "/signup");', 'const onBack = goBackFromCheckout;')
])

# 5. Signup.jsx
update_file("frontend/src/components/auth/Signup.jsx", [
    ('import { useNavigate } from "react-router-dom";', 'import { useNavigationController } from "../../hooks/useNavigationController";'),
    ('const navigate = useNavigate();', 'const { goToHome, goToLegal } = useNavigationController();'),
    ('const onBack = () => navigate("/");', 'const onBack = goToHome;'),
    ('const onLegal = (page) => navigate(`/legal/${page}`);', 'const onLegal = goToLegal;')
])

# 6. BatchControl.jsx (remove onBack prop, use useNavigationController)
filepath = "frontend/src/components/admin/BatchControl.jsx"
with open(filepath, "r") as f:
    code = f.read()
if "import { useNavigationController }" not in code:
    code = 'import { useNavigationController } from "../../hooks/useNavigationController";\n' + code
code = code.replace('export default function BatchControl({ onBack }) {', 'export default function BatchControl() {')
code = code.replace('  const [batches, setBatches] = useState(initialBatches);', '  const { goToAdmin } = useNavigationController();\n  const [batches, setBatches] = useState(initialBatches);')
code = code.replace('onClick={onBack}', 'onClick={goToAdmin}')
with open(filepath, "w") as f:
    f.write(code)

# 7. WhyIbisView.jsx (remove onBack prop, use useNavigationController)
filepath = "frontend/src/components/common/WhyIbisView.jsx"
with open(filepath, "r") as f:
    code = f.read()
if "import { useNavigationController }" not in code:
    code = 'import { useNavigationController } from "../../hooks/useNavigationController";\n' + code
code = code.replace('export default function WhyIbisView({ onBack }) {', 'export default function WhyIbisView() {')
code = code.replace('  const [activeSection, setActiveSection] = useState(0);', '  const { goToHome } = useNavigationController();\n  const [activeSection, setActiveSection] = useState(0);')
code = code.replace('onClick={onBack}', 'onClick={goToHome}')
with open(filepath, "w") as f:
    f.write(code)

# 8. LegalInfoPage.jsx (remove onBack prop, get page from useParams, use useNavigationController)
filepath = "frontend/src/components/common/LegalInfoPage.jsx"
with open(filepath, "r") as f:
    code = f.read()
if "import { useNavigationController }" not in code:
    code = 'import { useNavigationController } from "../../hooks/useNavigationController";\n' + code
if "import { useParams } from" not in code:
    code = 'import { useParams } from "react-router-dom";\n' + code
code = code.replace('export default function LegalInfoPage({ page = "privacy", onBack }) {', 'export default function LegalInfoPage() {')
code = code.replace('  const getTitle = () => {', '  const { page = "privacy" } = useParams();\n  const { goBackFromLegal } = useNavigationController();\n  const getTitle = () => {')
code = code.replace('onClick={onBack}', 'onClick={goBackFromLegal}')
with open(filepath, "w") as f:
    f.write(code)

# 9. main.jsx (remove onBack props, replace LegalRouteWrapper with LegalInfoPage)
filepath = "frontend/src/main.jsx"
with open(filepath, "r") as f:
    code = f.read()

code = code.replace('import { Routes, Route, useNavigate, useParams, BrowserRouter } from "react-router-dom";', 'import { Routes, Route, BrowserRouter } from "react-router-dom";')
# Remove LegalRouteWrapper entirely
code = re.sub(r'const LegalRouteWrapper =.*?};\n?', '', code, flags=re.DOTALL)
# Remove navigate and useUI from App
code = re.sub(r'  const navigate = useNavigate\(\);\n', '', code)
# Fix Routes
code = code.replace('<WhyIbisView onBack={() => navigate("/")} />', '<WhyIbisView />')
code = code.replace('<BatchControl onBack={() => navigate("/admin")} />', '<BatchControl />')
code = code.replace('<LegalRouteWrapper onBack={() => navigate("/signup")} />', '<LegalInfoPage />')
with open(filepath, "w") as f:
    f.write(code)

