import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { supabase } from "@/integrations/supabase/client";

const PUBLIC_PREFIXES = [
  "/ai-technology",
  "/ai-partners",
  "/partners",
  "/governance",
  "/about",
  "/auth",
  "/reset-password",
  "/partner/provider-profile",
];

const isPublicPath = (path: string) =>
  path === "/" || PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        if (!cancelled) setChecked(true);
        return;
      }
      const { data } = await supabase
        .from("partners")
        .select("id,status")
        .eq("proposed_by", session.user.id)
        .eq("status", "pending")
        .maybeSingle();
      if (cancelled) return;
      if (data && !isPublicPath(location.pathname)) {
        navigate("/partner/provider-profile", { replace: true });
      }
      setChecked(true);
    })();
    return () => { cancelled = true; };
  }, [location.pathname, navigate]);

  return (
    <div className="relative z-0 flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 animate-page-in">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
