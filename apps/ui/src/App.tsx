import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import "./App.css";
import DashboardPage from "./pages/DashboardPage";
import OnboardingPage from "./pages/OnboardingPage";

function App() {
  const [status, setStatus] = useState<{ loading: boolean; firstRun: boolean }>({
    loading: true,
    firstRun: false,
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch("/api/v1/status");
        if (!response.ok) throw new Error();
        const data = await response.json();
        setStatus({ loading: false, firstRun: data.firstRun });
      } catch (error) {
        setStatus({ loading: false, firstRun: true });
      }
    };
    checkStatus();
  }, []);

  if (status.loading) {
    return (
      <div className="onboarding-container dashboard-container">
        <div className="onboarding-card" style={{ alignItems: "center" }}>
          <p>Loading SimPesa...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          status.firstRun ? (
            <Navigate to="/onboarding" replace />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />
      <Route
        path="/onboarding"
        element={
          status.firstRun ? (
            <OnboardingPage onComplete={() => setStatus({ ...status, firstRun: false })} />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          status.firstRun ? <Navigate to="/onboarding" replace /> : <DashboardPage />
        }
      />
      <Route
        path="*"
        element={
          status.firstRun ? (
            <Navigate to="/onboarding" replace />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;
