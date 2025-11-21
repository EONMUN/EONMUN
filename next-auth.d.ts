import { DefaultSession } from 'next-auth';

/**
 * Extend Next Auth types with custom user fields
 *
 * This adds type safety for our custom fields (id, admin) on the User and Session objects
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      admin: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    admin: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    admin: boolean;
  }
}
