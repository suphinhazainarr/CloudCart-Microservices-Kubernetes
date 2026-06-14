import { useForm }          from 'react-hook-form';
import { zodResolver }      from '@hookform/resolvers/zod';
import { z }                from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Package } from 'lucide-react';
import { useState }         from 'react';
import { motion }           from 'framer-motion';
import { useLoginMutation } from '../features/auth/authApi';
import { useMergeCartMutation } from '../features/cart/cartApi';
import { getSessionId }     from '../lib/session';
import { useAppDispatch }   from '../app/store';
import { addToast }         from '../features/ui/uiSlice';

const schema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const dispatch  = useAppDispatch();
  const from      = (location.state as any)?.from?.pathname ?? '/';
  const [showPwd, setShowPwd] = useState(false);

  const [login,     { isLoading: loggingIn }]  = useLoginMutation();
  const [mergeCart, { isLoading: mergingCart }] = useMergeCartMutation();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data).unwrap();

      // Merge guest cart after successful login
      const sessionId = getSessionId();
      if (sessionId) {
        try { await mergeCart({ sessionId }).unwrap(); } catch {}
      }

      dispatch(addToast({ type: 'success', message: 'Welcome back!' }));
      navigate(from, { replace: true });
    } catch (err: any) {
      dispatch(addToast({
        type:    'error',
        message: err.data?.message ?? 'Login failed. Please try again.',
      }));
    }
  };

  const isSubmitting = loggingIn || mergingCart;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-4">
            <Package className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Welcome back</h1>
          <p className="text-[var(--text-muted)] mt-1">Sign in to your CloudCart account</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                Email address
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="john@example.com"
                autoComplete="email"
                className="input-base"
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-[var(--text-primary)]">
                  Password
                </label>
                <button type="button" className="text-xs text-[var(--brand-purple)] hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="input-base pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[var(--text-muted)] mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-[var(--brand-purple)] font-medium hover:underline">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
