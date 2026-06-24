import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <Link to="/" className="font-display text-lg font-bold text-primary">
              DepEd AI Registry
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              Cataloguing AI technologies for responsible, ethical, and transparent use in Philippine basic education.
            </p>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold text-foreground">Quick Links</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/ai-technology" className="text-muted-foreground transition-colors hover:text-primary">AI Technology</Link></li>
              <li><Link to="/governance" className="text-muted-foreground transition-colors hover:text-primary">Governance & Safeguards</Link></li>
              <li><Link to="/about" className="text-muted-foreground transition-colors hover:text-primary">About</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Department of Education — AI Registry. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
