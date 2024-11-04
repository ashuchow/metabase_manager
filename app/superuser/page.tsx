"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // For navigation
import { useAuth } from '@/context/AuthContext'; // Assuming AuthContext tracks the current user

export default function CreateUserPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const { isAuthenticated, user, loading } = useAuth(); // Add loading state

  useEffect(() => {
    if (!loading) {  // Wait until loading is complete
      if (!isAuthenticated || user?.role !== 'SUPER_USER') {
        router.push('/'); // Redirect if not authenticated or not a superuser
      }
    }
  }, [isAuthenticated, user, loading, router]);

  console.log(isAuthenticated)
  
  if (loading || !isAuthenticated || user?.role !== 'SUPER_USER') {
    return <div>Loading...</div>;  // Show loading while waiting for auth state to load
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, role }),
      });

      if (res.ok) {
        setSuccess('User created successfully!');
        setUsername('');
        setPassword('');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create user.');
      }
    } catch (err) {
      setError('Failed to create user.');
    }
  };

  return (
    <div style={containerStyle}>
      <h2>Create a New User</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={inputGroupStyle}>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
        <div style={inputGroupStyle}>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
        <div style={inputGroupStyle}>
          <label>Role:</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
            <option value="USER">User</option>
            <option value="SUPER_USER">Super User</option>
          </select>
        </div>
        <button type="submit" style={buttonStyle}>Create User</button>
      </form>
    </div>
  );
}

// Example styles
const containerStyle = {
  maxWidth: '600px',
  margin: '50px auto',
  padding: '20px',
  border: '1px solid #ccc',
  borderRadius: '8px',
  backgroundColor: '#f9f9f9',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
};

const inputGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
};

const inputStyle = {
  padding: '10px',
  fontSize: '16px',
  borderRadius: '5px',
  border: '1px solid #ddd',
};

const buttonStyle = {
  padding: '10px 20px',
  backgroundColor: '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '16px',
};
