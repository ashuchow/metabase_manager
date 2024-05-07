import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';

const NavBar = () => {
  const { data: session } = useSession();

  return (
    <nav className="flex justify-between items-center py-4 px-8 bg-gray-100">
      <Link href="/">
        <a className="text-xl font-bold">Metabase Manager</a>
      </Link>
      <div>
        {session ? (
          <>
            <span>{session.user.name}</span>
            <button onClick={() => signOut()}>Sign out</button>
          </>
        ) : (
          <button onClick={() => signIn()}>Log in</button>
        )}
      </div>
    </nav>
  );
};

export default NavBar;