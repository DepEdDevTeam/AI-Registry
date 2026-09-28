import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Moon, Sun, LogIn, LayoutDashboard } from "lucide-react";
import { useDarkMode } from "../hooks/use-dark-mode";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/use-role";
import type { User } from "@supabase/supabase-js";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggle } = useDarkMode();
  const { isAdminOrAbove, isSuperAdmin, isPartner } = useRole();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4" aria-label="Main navigation">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-primary">
          {/* <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            AI
          </div> */}
          <span className="hidden sm:inline">DepEd AI Registry</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-1 md:flex absolute left-1/2 -translate-x-1/2">
          <NavItem to="/ai-technology" active={isActive("/ai-technology")}>AI Tools</NavItem>
          <NavItem to="/ai-partners" active={isActive("/ai-partners")}>Providers</NavItem>
          <NavItem to="/governance" active={isActive("/governance")}>Governance</NavItem>
          <NavItem to="/about" active={isActive("/about")}>About</NavItem>
        </div>

        {/* Dark Mode, Auth, and Mobile Toggle */}
        <div className="flex items-center gap-2">
          {location.pathname !== "/" && (
            <button
              onClick={toggle}
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          )}
          {user ? (
            <Link
              to="/workspace"
              className="hidden items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:flex"
              aria-label="Open your workspace"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Workspace</span>
            </Link>
          ) : (
            <Link
              to="/auth"
              className="hidden md:flex rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors"
              aria-label="Login"
            >
              <LogIn className="h-5 w-5" />
            </Link>
          )}
          <button
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="border-t border-border bg-card px-4 pb-4 pt-2 md:hidden animate-page-in">
          <MobileLink to="/ai-technology" onClick={() => setMobileOpen(false)}>AI Tools</MobileLink>
          <MobileLink to="/ai-partners" onClick={() => setMobileOpen(false)}>Providers</MobileLink>
          <div className="my-2 border-t border-border" />
          <MobileLink to="/governance" onClick={() => setMobileOpen(false)}>Governance</MobileLink>
          <MobileLink to="/about" onClick={() => setMobileOpen(false)}>About</MobileLink>
          <div className="my-2 border-t border-border" />
          {user ? (
            <>
              <MobileLink to="/workspace" onClick={() => setMobileOpen(false)}>Workspace</MobileLink>
               {isPartner ? (
                 <MobileLink to="/partner/status" onClick={() => setMobileOpen(false)}>Status</MobileLink>
               ) : (
                 <>
                   <MobileLink to="/profile" onClick={() => setMobileOpen(false)}>My Profile</MobileLink>
                   <MobileLink to="/proposals" onClick={() => setMobileOpen(false)}>Proposals</MobileLink>
                 </>
               )}
              {isAdminOrAbove && (
                <MobileLink to="/admin" onClick={() => setMobileOpen(false)}>Admin Panel</MobileLink>
              )}
              {isSuperAdmin && (
                <MobileLink to="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</MobileLink>
              )}
              <button
                onClick={() => { setMobileOpen(false); handleLogout(); }}
                className="block w-full text-left rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-secondary"
              >
                Logout
              </button>
            </>
          ) : (
            <MobileLink to="/auth" onClick={() => setMobileOpen(false)}>Login</MobileLink>
          )}
        </div>
      )}
    </header>
  );
};

function NavItem({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-secondary text-secondary-foreground"
          : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

function MobileLink({ to, onClick, children }: { to: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
    >
      {children}
    </Link>
  );
}

export default Navbar;
