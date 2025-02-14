import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    name: string | null;
    email: string;
    role: string;
    picture: string | null;
  }

  interface Session {
    user: User;
  }
} 