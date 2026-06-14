import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';

export const Footer = () => (
  <footer className="border-t border-[var(--border)] py-8 mt-12 bg-[var(--bg-secondary)]">
    <div className="page-container flex flex-col sm:flex-row items-center justify-between gap-4">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg gradient-brand flex items-center justify-center">
          <Package className="w-3 h-3 text-white" />
        </div>
        <span className="font-bold gradient-text">CloudCart</span>
      </Link>
      <p className="text-sm text-[var(--text-muted)]">
        © {new Date().getFullYear()} CloudCart. Built with React + Node.js microservices.
      </p>
    </div>
  </footer>
);
