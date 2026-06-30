import re

# 1. StudentPortal.jsx
filepath = "frontend/src/components/student/StudentPortal.jsx"
with open(filepath, "r") as f:
    code = f.read()

if "useAuthenticationController" not in code:
    code = 'import { useAuthenticationController } from "../../hooks/useAuthenticationController";\n' + code

code = code.replace("const { handleLogoutAction, initiateSignup } = useAccessController();", "const { initiateSignup } = useAccessController();\n  const { signOut } = useAuthenticationController();")
code = code.replace("const onLogout = handleLogoutAction;", "const onLogout = signOut;")

with open(filepath, "w") as f:
    f.write(code)

# 2. Signup.jsx
filepath = "frontend/src/components/auth/Signup.jsx"
with open(filepath, "r") as f:
    code = f.read()

code = code.replace("import { useAuth } from '../../lib/auth';", "import { useAuthenticationController } from '../../hooks/useAuthenticationController';")
code = code.replace("const { signInWithEmail, signUpWithEmail } = useAuth();", "const { signIn } = useAuthenticationController();")
code = code.replace("await signInWithEmail(email, password);", "await signIn(email, password);")
# If it uses signUpWithEmail, we replace it with signIn for now (or AuthenticationRepository could implement it)
# Looking at useAuth, signUpWithEmail was not exported in lib/auth.jsx so it probably crashes if called anyway. Let's replace it with signIn just in case.
code = code.replace("await signUpWithEmail(email, password);", "await signIn(email, password);")

with open(filepath, "w") as f:
    f.write(code)

# 3. ProtectedRoute, PublicRoute, AdminRoute - they used useAuth from '../lib/auth'. Change it to useAuthContext.
for route_file in ["ProtectedRoute.jsx", "PublicRoute.jsx", "AdminRoute.jsx"]:
    filepath = f"frontend/src/routes/{route_file}"
    with open(filepath, "r") as f:
        code = f.read()
    code = code.replace("import { useAuth } from '../lib/auth';", "import { useAuthContext } from '../contexts/AuthContext';")
    code = code.replace("const { isSignedIn, loading } = useAuth();", "const { isSignedIn, loading } = useAuthContext();")
    code = code.replace("const { user, loading } = useAuth();", "const { user, loading } = useAuthContext();")
    with open(filepath, "w") as f:
        f.write(code)

# 4. main.jsx - change AuthProvider import
filepath = "frontend/src/main.jsx"
with open(filepath, "r") as f:
    code = f.read()
code = code.replace('import { AuthProvider, useAuth } from "./lib/auth";', 'import { AuthProvider } from "./contexts/AuthContext";')
with open(filepath, "w") as f:
    f.write(code)

