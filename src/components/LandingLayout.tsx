import { Outlet } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

const GlobeHero = lazy(() =>
  import("./GlobeHero").then((m) => ({ default: m.GlobeHero }))
);

/**
 * Landing-only layout: mounts the 3D globe as a fixed background.
 * Forces dark mode while active.
 */
const LandingLayout = () => {
  useEffect(() => {
    const html = document.documentElement;
    const wasDark = html.classList.contains("dark");
    html.classList.add("dark");
    return () => {
      if (!wasDark) html.classList.remove("dark");
    };
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <GlobeHero />
      </Suspense>
      <div className="relative z-0 flex min-h-screen flex-col text-white">
        <Navbar />
        <main className="flex-1 animate-page-in">
          <Outlet />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default LandingLayout;
