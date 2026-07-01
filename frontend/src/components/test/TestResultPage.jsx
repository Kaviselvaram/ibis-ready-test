import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { TestRepository } from "../../repositories/TestRepository";
import { TestReport } from "./StudentTest";

// Dedicated result page. Fetches a stored attempt's full report and renders the
// professional TestReport (same theme). Reachable by the student who took it and
// by any admin.
export default function TestResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    TestRepository.getResult(id)
      .then((d) => active && setData(d))
      .catch(() => active && setError("Could not load this result. It may have been removed or you don't have access."));
    return () => { active = false; };
  }, [id]);

  const back = () => {
    if (search.get("from") === "admin") navigate(-1);
    else navigate("/test-history");
  };

  if (error) {
    return (
      <section className="testcenter">
        <div className="tc-error">{error}</div>
        <button className="qt-nav-btn" onClick={back}>Go back</button>
      </section>
    );
  }
  if (!data) return <section className="testcenter"><p className="tc-empty">Loading result…</p></section>;

  return <TestReport report={data.report} onClose={back} />;
}
