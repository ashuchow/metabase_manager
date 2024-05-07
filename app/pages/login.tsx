import { signIn } from 'next-auth/react';

const LoginPage = () => {
  return (
    <div>
      <h1>Login</h1>
      <button onClick={() => signIn()}>Log in with Provider</button>
    </div>
  );
};

export default LoginPage;