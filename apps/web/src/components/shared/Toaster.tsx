import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { removeToast } from '../../features/ui/uiSlice';
import { useEffect } from 'react';

const ICONS = {
  success: <CheckCircle  className="w-4 h-4 text-green-500" />,
  error:   <XCircle      className="w-4 h-4 text-red-500" />,
  info:    <Info         className="w-4 h-4 text-blue-500" />,
  warning: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
};

const ToastItem = ({ toast }: { toast: { id: string; type: keyof typeof ICONS; message: string } }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const timer = setTimeout(() => dispatch(removeToast(toast.id)), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, dispatch]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.9 }}
      animate={{ opacity: 1, x: 0,  scale: 1 }}
      exit={{   opacity: 0, x: 60,  scale: 0.9 }}
      className="card shadow-lg px-4 py-3 flex items-center gap-3 min-w-[280px] max-w-[360px]"
    >
      {ICONS[toast.type]}
      <p className="text-sm flex-1 text-[var(--text-primary)]">{toast.message}</p>
      <button onClick={() => dispatch(removeToast(toast.id))} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export const Toaster = () => {
  const toasts = useAppSelector((state) => state.ui.toasts);

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => <ToastItem key={t.id} toast={t} />)}
      </AnimatePresence>
    </div>
  );
};
