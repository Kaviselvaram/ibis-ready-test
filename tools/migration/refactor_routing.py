import re

with open('frontend/src/main.jsx', 'r') as f:
    code = f.read()

# Add imports
code = code.replace(
    'import { ErrorBoundary } from "./components/common/ErrorBoundary.jsx";',
    'import { BrowserRouter, Routes, Route, useNavigate, useParams, Navigate, useLocation } from "react-router-dom";\nimport { ErrorBoundary } from "./components/common/ErrorBoundary.jsx";'
)

# Add LegalRouteWrapper
wrapper_code = """
const LegalRouteWrapper = ({ onBack }) => {
  const { page } = useParams();
  return <LegalInfoPage page={page || "privacy"} onBack={onBack} />;
};

function App() {"""
code = code.replace('function App() {', wrapper_code)

# Remove screen state and add navigate/location
state_replacement = """  const navigate = useNavigate();
  const location = useLocation();
  const [pricingSource, setPricingSource] = useState("signup");"""
code = code.replace('  const [screen, setScreen] = useState("landing");\n  const [pricingSource, setPricingSource] = useState("signup");', state_replacement)

# Remove legalPage state
code = code.replace('  const [legalPage, setLegalPage] = useState("privacy");\n', '')

# Replace setScreen("landing")
code = code.replace('setScreen("landing")', 'navigate("/")')
# Replace setScreen("student")
code = code.replace('setScreen("student")', 'navigate("/student")')
# Replace setScreen("chapter")
code = code.replace('setScreen("chapter")', 'navigate("/chapter")')
# Replace setScreen("why-ibis")
code = code.replace('setScreen("why-ibis")', 'navigate("/why-ibis")')
# Replace setScreen("signup")
code = code.replace('setScreen("signup")', 'navigate("/signup")')
# Replace setScreen("checkout")
code = code.replace('setScreen("checkout")', 'navigate("/checkout")')
# Replace setScreen("admin")
code = code.replace('setScreen("admin")', 'navigate("/admin")')
# Replace setScreen("batches")
code = code.replace('setScreen("batches")', 'navigate("/admin/batches")')
# Replace setScreen("legal")
code = code.replace('setScreen("legal")', 'navigate("/legal")')
# Replace screen !== "landing"
code = code.replace('screen !== "landing"', 'location.pathname !== "/"')
# Replace the pricing source toggle in checkout
code = code.replace('setScreen(pricingSource === "landing" ? "landing" : "signup")', 'navigate(pricingSource === "landing" ? "/" : "/signup")')
# Update the legal page navigation logic
code = code.replace('setLegalPage(page);\n              setScreen("legal");', 'navigate(`/legal/${page}`);')
code = code.replace('setLegalPage(page);\n                navigate("/legal");', 'navigate(`/legal/${page}`);')


# Replace the old jsx routing with Routes
old_jsx = """        {screen === "landing" && (
          <Landing
            chapters={chapters}
            chapterIndex={chapterIndex}
            setChapterIndex={setChapterIndex}
            onTrial={() => enterPortal("trial")}
            onStart={() => { setPricingSource("signup"); navigate("/signup"); }}
            onAdmin={() => navigate("/admin")}
            onWhyIbis={() => navigate("/why-ibis")}
            onPricing={() => { setPricingSource("landing"); navigate("/checkout"); }}
          />
        )}

        {screen === "why-ibis" && (
          <WhyIbisView onBack={() => navigate("/")} />
        )}

        {screen === "student" && (
          <StudentPortal
            access={access}
            chapters={chapters}
            chapterIndex={chapterIndex}
            setChapterIndex={setChapterIndex}
            switchChapter={switchChapter}
            openChapter={openChapter}
            onBatch={() => setBatchOpen(true)}
            onLogout={handleLogout}
            showPaywall={paywall}
            onPay={() => { setPricingSource("signup"); navigate("/signup"); }}
            onClosePaywall={() => setPaywall(false)}
          />
        )}

        {screen === "chapter" && (
          <ChapterView
            chapter={activeChapter}
            access={access}
            topicIndex={topicIndex}
            setTopicIndex={setTopicIndex}
            tab={tab}
            setTab={setTab}
            questionBank={questionBank}
            onBack={() => navigate("/student")}
            onPay={() => { setPricingSource("signup"); navigate("/signup"); }}
          />
        )}

        {screen === "admin" && (
          <AdminPanel
            chapters={chapters}
            setChapters={setChapters}
            chapterIndex={chapterIndex}
            setChapterIndex={setChapterIndex}
            topicIndex={topicIndex}
            setTopicIndex={setTopicIndex}
            activeTab={adminTab}
            setActiveTab={setAdminTab}
            questionBank={questionBank}
            setQuestionBank={setQuestionBank}
            onBatch={() => navigate("/admin/batches")}
            onLogout={() => navigate("/")}
          />
        )}

        {screen === "batches" && <BatchControl onBack={() => navigate("/admin")} />}
        {screen === "signup" && (
          <Signup
            onBack={() => navigate("/")}
            onPay={() => { setPricingSource("signup"); navigate("/checkout"); }}
            onLogin={() => enterPortal("full")}
            onLegal={(page) => {
              navigate(`/legal/${page}`);
            }}
          />
        )}
        {screen === "legal" && <LegalInfoPage page={legalPage} onBack={() => navigate("/signup")} />}
        {screen === "checkout" && <Checkout onBack={() => navigate(pricingSource === "landing" ? "/" : "/signup")} onDone={() => enterPortal("full")} />}"""

new_jsx = """        <Routes>
          <Route path="/" element={
            <Landing
              chapters={chapters}
              chapterIndex={chapterIndex}
              setChapterIndex={setChapterIndex}
              onTrial={() => enterPortal("trial")}
              onStart={() => { setPricingSource("signup"); navigate("/signup"); }}
              onAdmin={() => navigate("/admin")}
              onWhyIbis={() => navigate("/why-ibis")}
              onPricing={() => { setPricingSource("landing"); navigate("/checkout"); }}
            />
          } />
          
          <Route path="/why-ibis" element={<WhyIbisView onBack={() => navigate("/")} />} />
          
          <Route path="/student" element={
            <StudentPortal
              access={access}
              chapters={chapters}
              chapterIndex={chapterIndex}
              setChapterIndex={setChapterIndex}
              switchChapter={switchChapter}
              openChapter={openChapter}
              onBatch={() => setBatchOpen(true)}
              onLogout={handleLogout}
              showPaywall={paywall}
              onPay={() => { setPricingSource("signup"); navigate("/signup"); }}
              onClosePaywall={() => setPaywall(false)}
            />
          } />
          
          <Route path="/chapter" element={
            <ChapterView
              chapter={activeChapter}
              access={access}
              topicIndex={topicIndex}
              setTopicIndex={setTopicIndex}
              tab={tab}
              setTab={setTab}
              questionBank={questionBank}
              onBack={() => navigate("/student")}
              onPay={() => { setPricingSource("signup"); navigate("/signup"); }}
            />
          } />
          
          <Route path="/admin" element={
            <AdminPanel
              chapters={chapters}
              setChapters={setChapters}
              chapterIndex={chapterIndex}
              setChapterIndex={setChapterIndex}
              topicIndex={topicIndex}
              setTopicIndex={setTopicIndex}
              activeTab={adminTab}
              setActiveTab={setAdminTab}
              questionBank={questionBank}
              setQuestionBank={setQuestionBank}
              onBatch={() => navigate("/admin/batches")}
              onLogout={() => navigate("/")}
            />
          } />
          
          <Route path="/admin/batches" element={<BatchControl onBack={() => navigate("/admin")} />} />
          
          <Route path="/signup" element={
            <Signup
              onBack={() => navigate("/")}
              onPay={() => { setPricingSource("signup"); navigate("/checkout"); }}
              onLogin={() => enterPortal("full")}
              onLegal={(page) => navigate(`/legal/${page}`)}
            />
          } />
          
          <Route path="/legal/:page" element={<LegalRouteWrapper onBack={() => navigate("/signup")} />} />
          <Route path="/legal" element={<LegalRouteWrapper onBack={() => navigate("/signup")} />} />
          
          <Route path="/checkout" element={
            <Checkout onBack={() => navigate(pricingSource === "landing" ? "/" : "/signup")} onDone={() => enterPortal("full")} />
          } />
        </Routes>"""

# Using regex to replace the block to be safe against slight whitespace differences.
# We will just replace from `{screen === "landing"` to `onDone={() => enterPortal("full")} />\n        )}`
start_idx = code.find('{screen === "landing" && (')
end_idx = code.find('onDone={() => enterPortal("full")} />')

if start_idx != -1 and end_idx != -1:
    end_tag = code.find('}', end_idx) + 1
    # Check if there is a ')}' instead of '}'
    if code[end_tag] == ')':
        end_tag += 1
    if code.find(')}', end_idx) != -1 and code.find(')}', end_idx) < end_tag + 5:
        end_tag = code.find(')}', end_idx) + 2
    
    # Since screen==="checkout" does not have parenthesis in `&& <Checkout...>`, the end is `/>}`
    end_checkout = code.find('/>}', end_idx)
    if end_checkout != -1:
        end_tag = end_checkout + 3
        
    # We will just replace everything between start_idx and the `{batchOpen &&` line.
    batch_open_idx = code.find('{batchOpen && <BatchModal', start_idx)
    if batch_open_idx != -1:
        code = code[:start_idx] + new_jsx + "\n        " + code[batch_open_idx:]
    else:
        print("COULD NOT FIND BATCH OPEN IDX")
else:
    print("COULD NOT FIND START IDX", start_idx, end_idx)

# Replace the Root rendering
root_replacement = """const RootApp = () => (
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);

createRoot(document.getElementById("root")).render(<RootApp />);"""

# The existing createRoot block is:
# createRoot(document.getElementById("root")).render(
#   <AuthProvider>
#     <App />
#   </AuthProvider>
# );
create_root_idx = code.find('createRoot(document.getElementById("root")).render(')
if create_root_idx != -1:
    code = code[:create_root_idx] + root_replacement
else:
    print("COULD NOT FIND CREATEROOT")

# Fix location dependency array
code = code.replace('[location.pathname, chapterIndex, chapters.length]', '[location, chapterIndex, chapters.length]')

with open('frontend/src/main.jsx', 'w') as f:
    f.write(code)

print("Updated main.jsx with react-router-dom")
