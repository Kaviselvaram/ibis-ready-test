import re

# Fix useAccessController
filepath = "frontend/src/hooks/useAccessController.js"
with open(filepath, "r") as f:
    code = f.read()

code = code.replace('import { useNavigate } from "react-router-dom";', 'import { useNavigationController } from "./useNavigationController";\nimport { useAuthenticationController } from "./useAuthenticationController";')
code = code.replace('import { useAuth } from "../lib/auth";', '')
code = code.replace('const navigate = useNavigate();', 'const { goToStudentPortal, goToCheckout, goToSignup } = useNavigationController();\n  const { signOut } = useAuthenticationController();')
# We need to add goToCheckout and goToSignup to useNavigationController! Let's just fix it.
# Wait, I didn't add goToCheckout and goToSignup to useNavigationController previously. I'll add them now.
code = code.replace('navigate("/student");', 'goToStudentPortal();')
code = code.replace('navigate("/checkout");', 'goToCheckout();')
code = code.replace('navigate("/signup");', 'goToSignup();')
code = code.replace('navigate("/");', '') # signOut in useAuthenticationController handles goToHome()

with open(filepath, "w") as f:
    f.write(code)

# Fix useCourseController
filepath = "frontend/src/hooks/useCourseController.js"
with open(filepath, "r") as f:
    code = f.read()
code = code.replace('import { useNavigate } from "react-router-dom";', 'import { useNavigationController } from "./useNavigationController";')
code = code.replace('const navigate = useNavigate();', 'const { goToChapter } = useNavigationController();')
code = code.replace('navigate("/chapter");', 'goToChapter();')

with open(filepath, "w") as f:
    f.write(code)

