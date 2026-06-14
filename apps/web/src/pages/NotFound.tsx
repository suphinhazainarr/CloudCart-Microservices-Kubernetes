import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center px-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-8xl font-bold gradient-text mb-4">404</p>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Page not found</h1>
        <p className="text-[var(--text-muted)] mb-8">The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn-primary flex items-center gap-2 mx-auto w-fit">
          <Home className="w-4 h-4" /> Back to home
        </Link>
      </motion.div>
    </div>
  );
}
