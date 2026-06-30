import re

with open('frontend/src/main.jsx', 'r') as f:
    code = f.read()

# 1. Add context imports
imports_to_add = """import { UIProvider, useUI } from "./contexts/UIContext";
import { AdminProvider, useAdmin } from "./contexts/AdminContext";
import { StudentProvider, useStudent } from "./contexts/StudentContext";
"""

code = code.replace(
    'import { ErrorBoundary } from "./components/common/ErrorBoundary.jsx";',
    f'{imports_to_add}import {{ ErrorBoundary }} from "./components/common/ErrorBoundary.jsx";'
)

# 2. Extract AppLayout
app_layout = """const AppLayout = ({ children }) => {
  const [isPortrait, setIsPortrait] = useState(false);
  const [needsScale, setNeedsScale] = useState(false);

  const isEmbedded = useMemo(() => {
    return new URLSearchParams(window.location.search).get("embedded") === "true";
  }, []);

  useEffect(() => {
    if (isEmbedded) return;
    const handleResize = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      setIsPortrait(H > W);
      setNeedsScale(isMobileOrTablet || H > W || W < 1280 || H < 720);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [isEmbedded]);

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
};
"""

# Find where to put AppLayout - right before LegalRouteWrapper
code = code.replace("const LegalRouteWrapper", app_layout + "\nconst LegalRouteWrapper")

# 3. Modify App()
new_app = """function App() {
  const navigate = useNavigate();
  const { handleLogout } = useAuth(); // Assuming signOut is destructured, wait we should get signOut from useAuth
  const { signOut } = useAuth();
  
  const handleLogoutAction = async () => {
    await signOut();
    navigate("/");
  };

  const {
    pricingSource,
    setPricingSource,
    batchOpen,
    setBatchOpen,
    paywall,
    setPaywall
  } = useUI();

  const {
    adminTab,
    setAdminTab,
    questionBank,
    setQuestionBank
  } = useAdmin();

  const {
    chapters,
    setChapters,
    chapterIndex,
    setChapterIndex,
    topicIndex,
    setTopicIndex,
    tab,
    setTab,
    access,
    activeChapter,
    switchChapter,
    enterPortal,
    openChapter
  } = useStudent();

  return (
    <AppLayout>
      <Routes>
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
            onLogout={handleLogoutAction}
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
      </Routes>
      {batchOpen && <BatchModal onClose={() => setBatchOpen(false)} />}
    </AppLayout>
  );
}"""

# Replace old App with new App
# The old App starts at `function App() {` and ends before `// 1. Text Reveal Hover Effect`
start_app = code.find("function App() {")
end_app = code.find("// 1. Text Reveal Hover Effect")
if start_app != -1 and end_app != -1:
    code = code[:start_app] + new_app + "\n\n\n\n\n" + code[end_app:]
else:
    print("Could not find App function boundaries")


# Now we must remove the chapter seed stuff from main.jsx because it is in StudentContext.jsx
# It spans from `const assetBase` to `}));` (which is initialChapters).
# Actually, `chapterSeed` might be needed by `AdminPanel` if it was passed? No, we passed `chapters` which is from state.
# But wait, `StudentPortal`, etc need it? No, they receive it via props which comes from context now.
# Let's remove it from main.jsx to avoid duplication.
start_asset = code.find("const assetBase =")
end_initial = code.find("}));", start_asset)
if start_asset != -1 and end_initial != -1:
    code = code[:start_asset] + code[end_initial+4:]
else:
    print("Could not find chapter seed block")


# Replace RootApp
root_replacement = """const RootApp = () => (
  <BrowserRouter>
    <AuthProvider>
      <UIProvider>
        <AdminProvider>
          <StudentProvider>
            <App />
          </StudentProvider>
        </AdminProvider>
      </UIProvider>
    </AuthProvider>
  </BrowserRouter>
);

createRoot(document.getElementById("root")).render(<RootApp />);"""

start_root = code.find("const RootApp = () => (")
if start_root != -1:
    code = code[:start_root] + root_replacement
else:
    print("Could not find RootApp")

with open('frontend/src/main.jsx', 'w') as f:
    f.write(code)

print("Updated main.jsx successfully.")
