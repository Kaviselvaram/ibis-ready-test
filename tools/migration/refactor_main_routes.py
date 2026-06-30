import re

filepath = "frontend/src/main.jsx"
with open(filepath, "r") as f:
    code = f.read()

# 1. Import Route Guards
imports_to_add = """
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { PublicRoute } from "./routes/PublicRoute";
import { AdminRoute } from "./routes/AdminRoute";
import { RouteFallback } from "./routes/RouteFallback";
"""

if "ProtectedRoute" not in code:
    code = imports_to_add + code

# 2. Replace Routes content
routes_start = code.find("<Routes>")
routes_end = code.find("</Routes>") + len("</Routes>")

if routes_start != -1 and routes_end != -1:
    new_routes = """<Routes>
        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<Landing />} />
          <Route path="/why-ibis" element={<WhyIbisView />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/checkout" element={<Checkout />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/student" element={<StudentPortal />} />
          <Route path="/chapter" element={<ChapterView />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/batches" element={<BatchControl />} />
        </Route>

        {/* Unprotected Static Routes */}
        <Route path="/legal/:page" element={<LegalInfoPage />} />
        <Route path="/legal" element={<LegalInfoPage />} />

        {/* Fallback */}
        <Route path="*" element={<RouteFallback />} />
      </Routes>"""
    code = code[:routes_start] + new_routes + code[routes_end:]

with open(filepath, "w") as f:
    f.write(code)

