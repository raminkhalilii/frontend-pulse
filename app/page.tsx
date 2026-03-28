import { redirect } from 'next/navigation';

// The middleware already handles the redirect logic, but this ensures the root
// path always bounces unauthenticated users to /login via server redirect.
export default function RootPage() {
  redirect('/login');
}
