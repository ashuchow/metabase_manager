"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Ensure header is set
        },
        body: JSON.stringify({ username, password }), // Ensure JSON.stringify
      });
  
      const data = await res.json();
  
      if (res.ok) {
        console.log('User Details:', data.user);
        signIn(data.user); // Pass user data to signIn
        router.push("/"); // Redirect to home after successful sign-in
      } else {
        setError(data.error || 'An error occurred during sign-in');
      }
    } catch (err) {
      setError('An error occurred during sign-in');
      console.error('Sign-in error:', err);
    }
  };
  

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>Sign In</h2>
      {error && <p style={errorStyle}>{error}</p>}
      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Username: </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Password: </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
        </div>
        <button type="submit" style={buttonStyle}>Sign In</button>
      </form>
    </div>
  );
}

// Styles
const containerStyle = {
  maxWidth: '400px',
  margin: '50px auto',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  backgroundColor: '#f9fafb',
  textAlign: 'center',
};

const titleStyle = {
  fontSize: '24px',
  marginBottom: '20px',
};

const errorStyle = {
  color: 'red',
  marginBottom: '20px',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
};

const inputGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  textAlign: 'left',
};

const labelStyle = {
  fontSize: '16px',
  marginBottom: '5px',
};

const inputStyle = {
  padding: '10px',
  fontSize: '16px',
  borderRadius: '5px',
  border: '1px solid #ddd',
  width: '100%',
};

const buttonStyle = {
  backgroundColor: '#3b82f6',
  color: '#fff',
  border: 'none',
  padding: '10px',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '16px',
  transition: 'background-color 0.3s ease',
};
