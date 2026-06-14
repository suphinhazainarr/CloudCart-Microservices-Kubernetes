// Users API needs to be added to authApi.ts — add this endpoint:
// getAllUsers: builder.query<ApiResponse<{users: User[]}>, {page?: number}>({
//   query: (params) => ({ url: '/auth/users', params }),
//   providesTags: ['Users'],
// })
// And on the backend add GET /api/auth/users (admin only) to the auth service.

import { useGetProfileQuery }  from '../../features/auth/authApi';
import { useAuth }             from '../../hooks/useAuth';

// Placeholder — wired to real API once /auth/users is added
export default function AdminUsers() {
  return (
    <div className="page-container py-8">
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Users</h1>
      <div className="card p-12 text-center">
        <p className="text-[var(--text-muted)]">
          Connect <code className="font-mono text-sm bg-[var(--bg-secondary)] px-2 py-1 rounded">GET /api/auth/users</code> (admin-only endpoint) to the auth service to populate this page.
        </p>
      </div>
    </div>
  );
}
