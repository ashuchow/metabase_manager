// pages/signin.tsx

import { signIn, signOut, useSession } from "next-auth/react";

export default function SignInPage() {
  const { data: session } = useSession();

  return (
    <div>
      {!session && (
        <>
          <button onClick={() => signIn("google")}>Sign in with Google</button>
          {/* Add more sign-in buttons for other providers */}
        </>
      )}
      {session && (
        <>
          Signed in as {session.user.email} <br />
          <button onClick={() => signOut()}>Sign out</button>
        </>
      )}
    </div>
  );
}