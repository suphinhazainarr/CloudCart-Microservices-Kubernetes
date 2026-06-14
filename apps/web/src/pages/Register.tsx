import { useForm }              from 'react-hook-form';
import { zodResolver }          from '@hookform/resolvers/zod';
import { z }                    from 'zod';
import { Link, useNavigate }    from 'react-router-dom';
import { Eye, EyeOff, Package } from 'lucide-react';
import { useState }             from 'react';
import { motion }               from 'framer-motion';
import { useRegisterMutation }  from '../features/auth/authApi';
import { useMergeCartMutation } from '../features/cart/cartApi';
import { getSessionId }         from '../lib/session';
import { useAppDispatch }       from '../app/store';
import { addToast }             from '../features/ui/uiSlice';

const schema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName:  z.string().min(2, 'Last name must be at least 2 characters'),
  email:     z.string().email('Invalid email address'),
  password:  z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must include uppercase, lowercase, and number'),
});
type FormData = z.infer<typeof schema>;

export default function Register() {
  const navigate  = useNavigate();
  const dispatch  = useAppDispatch();
  const [showPwd, setShowPwd] = useState(false);

  const [register,  { isLoading }]             = useRegisterMutation();
  const [mergeCart, { isLoading: merging }]    = useMergeCartMutation();

  const { register: field, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await register(data).unwrap();

      const sessionId = getSessionId();
      if (sessionId) {
        try { await mergeCart({ sessionId }).unwrap(); } catch {}
      }

      dispatch(addToast({ type: 'success', message: 'Account created! Welcome to CloudCart.' }));
      navigate('/');
    } catch (err: any) {
      dispatch(addToast({
        type:    'error',
        message: err.data?.message ?? 'Registration failed.',
      }));
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-4">
            <Package className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Create your account</h1>
          <p className="text-[var(--text-muted)] mt-1">Join CloudCart today</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">First name</label>
                <input {...field('firstName')} className="input-base" placeholder="John" />
                {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Last name</label>
                <input {...field('lastName')} className="input-base" placeholder="Doe" />
                {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Email</label>
              <input {...field('email')} type="email" className="input-base" placeholder="john@example.com" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...field('password')}
                  type={showPwd ? 'text' : 'password'}
                  className="input-base pr-10"
                  placeholder="Min 8 chars, uppercase + number"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isLoading || merging} className="btn-primary w-full py-3 mt-2">
              {isLoading || merging ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[var(--text-muted)] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[var(--brand-purple)] font-medium hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
