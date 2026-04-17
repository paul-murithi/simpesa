import { useEffect } from "react";

function RootRedirectShell() {
  useEffect(() => {
    // TODO: mount only redirect logic:
    // GET /api/merchants -> navigate("/onboarding" | "/dashboard")
  }, []);

  return null;
}

export default RootRedirectShell;
