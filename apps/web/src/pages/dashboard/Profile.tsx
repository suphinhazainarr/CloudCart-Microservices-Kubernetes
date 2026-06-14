import { useForm }             from 'react-hook-form';
import { zodResolver }         from '@hookform/resolvers/zod';
import { z }                   from 'zod';
import { useAuth }             from '../../hooks/useAuth';
import { useUpdateProfileMutation } from '../../features/auth/authApi';
import { useAppDispatch }      from '../../app/store';
import { addToast }            from '../../features/ui/uiSlice';

const schema = z.object({
  firstName: z.string().min(2),
  lastName:  z.string().min(2),
});
type FormData = z.infer<typeof schema>;

export default function DashboardProfile() {
  const { user }    = useAuth();
  const dispatch    = useAppDispatch();
  const [update, { isLoading }] = useUpdateProfileMutation();

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: user?.firstName, lastName: user?.lastName },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await update(data).unwrap();
      dispatch(addToast({ type: 'success', message: 'Profile updated' }));
    } catch {
      dispatch(addToast({ type: 'error', message: 'Update failed' }));
    }
  };

  return (
    <div className="page-container py-8 max-w-xl">
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Profile</h1>
      <div className="card p-6">

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[var(--border)]">
          <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center text-white text-2xl font-bold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div>
            <p className="font-bold text-[var(--text-primary)]">{user?.firstName} {user?.lastName}</p>
            <p className="text-sm text-[var(--text-muted)]">{user?.email}</p>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--brand-purple)]/10 text-[var(--brand-purple)] mt-1 inline-block capitalize">
              {user?.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">First name</label>
              <input {...register('firstName')} className="input-base" />
              {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Last name</label>
              <input {...register('lastName')} className="input-base" />
              {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Email</label>
            <input value={user?.email} disabled className="input-base opacity-60 cursor-not-allowed" />
            <p className="text-xs text-[var(--text-muted)] mt-1">Email cannot be changed</p>
          </div>

          <button type="submit" disabled={isLoading || !isDirty} className="btn-primary w-full py-3">
            {isLoading ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
