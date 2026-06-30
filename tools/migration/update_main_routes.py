with open("frontend/src/main.jsx", "r") as f:
    code = f.read()

# I will replace the large block of `<Routes> ... </Routes>` with the simplified version.
new_routes = """        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/why-ibis" element={<WhyIbisView onBack={() => navigate("/")} />} />
          <Route path="/student" element={<StudentPortal />} />
          <Route path="/chapter" element={<ChapterView />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/batches" element={<BatchControl onBack={() => navigate("/admin")} />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/legal/:page" element={<LegalRouteWrapper onBack={() => navigate("/signup")} />} />
          <Route path="/legal" element={<LegalRouteWrapper onBack={() => navigate("/signup")} />} />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>"""

start_idx = code.find("<Routes>")
end_idx = code.find("</Routes>") + len("</Routes>")
if start_idx != -1 and end_idx != -1:
    code = code[:start_idx] + new_routes + code[end_idx:]

# Also remove all the unused destructuring from App()
app_start = code.find("function App() {")
return_start = code.find("return (", app_start)

simplified_app_body = """  const navigate = useNavigate();
  const { batchOpen, setBatchOpen } = useUI();
  
"""
code = code[:app_start + len("function App() {\n")] + simplified_app_body + code[return_start:]

# Also remove imports from main.jsx that were removed
imports_to_remove = [
    'import { AdminProvider, useAdmin } from "./contexts/AdminContext";',
    'import { StudentProvider, useStudent } from "./contexts/StudentContext";'
]
# Wait, main.jsx still needs to mount the Providers!
# Let's fix RootApp imports in main.jsx
imports = """import { UIProvider, useUI } from "./contexts/UIContext";
import { AdminProvider } from "./contexts/AdminContext";
import { CourseProvider } from "./contexts/CourseContext";
import { AccessProvider } from "./contexts/AccessContext";
"""
# Replace the old context imports block
old_imports = """import { UIProvider, useUI } from "./contexts/UIContext";
import { AdminProvider, useAdmin } from "./contexts/AdminContext";
import { StudentProvider, useStudent } from "./contexts/StudentContext";"""
code = code.replace(old_imports, imports)

# Update RootApp
old_root = """        <AdminProvider>
          <StudentProvider>
            <App />
          </StudentProvider>
        </AdminProvider>"""
new_root = """        <AdminProvider>
          <AccessProvider>
            <CourseProvider>
              <App />
            </CourseProvider>
          </AccessProvider>
        </AdminProvider>"""
code = code.replace(old_root, new_root)

# We also extracted AppLayout logic into useViewport
# Let's replace AppLayout in main.jsx to use useViewport
new_app_layout = """import { useViewport } from "./hooks/useViewport";

const AppLayout = ({ children }) => {
  const { isPortrait, needsScale, isEmbedded } = useViewport();
  const showBackground = isEmbedded || !needsScale;

  return (
    <main>
      {showBackground && <AnimatedMeshBackground />}
      <ScaleRotateWrapper
        needsScale={needsScale}
        isPortrait={isPortrait}
        isEmbedded={isEmbedded}
      >
        {children}
      </ScaleRotateWrapper>
    </main>
  );
};"""

al_start = code.find("const AppLayout = ({ children }) => {")
al_end = code.find("};", al_start) + 2
code = code[:al_start] + new_app_layout.replace('import { useViewport } from "./hooks/useViewport";\n\n', '') + code[al_end:]
# inject import for useViewport
code = 'import { useViewport } from "./hooks/useViewport";\n' + code

with open("frontend/src/main.jsx", "w") as f:
    f.write(code)

