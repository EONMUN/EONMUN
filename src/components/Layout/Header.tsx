import { auth } from '@/app/auth';
import { Navigation } from './Navigation';

export async function Header() {
  const session = await auth();
  const isAdmin = session?.user ? (session.user as { admin?: boolean }).admin : false;

  return <Navigation isAdmin={isAdmin} />;
}
