"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function MetabaseServersPage() {
  const [hostUrl, setHostUrl] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSource, setIsSource] = useState(true);
  const [servers, setServers] = useState([]); // State to hold the user's servers
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();

  console.log(user)

  // Fetch servers associated with the user on component load
  useEffect(() => {
    const fetchServers = async () => {
      try {
        const res = await fetch(`/api/servers?userId=${user?.id}`);
        if (!res.ok) throw new Error('Failed to fetch servers');
        const data = await res.json();
        setServers(data);
      } catch (err) {
        console.error("Failed to load servers", err);
        setError("Failed to load servers");
      }
    };
  
    if (user?.id) {
      fetchServers();
    }
  }, [user]);
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    console.log("Attempting to save server with details:", {
      hostUrl,
      email,
      password,
      isSource,
      userId: user?.id
    }); // Log the data before sending the request
  
    try {
      const res = await fetch('/api/servers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hostUrl,
          email,
          password,
          isSource,
          userId: user?.id,
        }),
      });
  
      console.log("Response status:", res.status); // Log the response status
  
      if (res.ok) {
        const newServer = await res.json();
        console.log("Server saved successfully:", newServer); // Log successful save
        setSuccess('Server details saved successfully!');
        setServers((prevServers) => [...prevServers, newServer]);
        setHostUrl('');
        setEmail('');
        setPassword('');
        setIsSource(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save server details.');
        console.error("Server save failed:", data.error); // Log error message from server
      }
    } catch (err) {
      setError('Failed to save server details.');
      console.error("Error in request to save server:", err); // Log any fetch errors
    }
  };
  
  

  return (
    <div style={containerStyle}>
      <h2>Add Metabase Server</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={inputGroupStyle}>
          <label>Host URL:</label>
          <input
            type="text"
            value={hostUrl}
            onChange={(e) => setHostUrl(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
        <div style={inputGroupStyle}>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          <label>Server Type:</label>
          <select value={isSource ? "source" : "destination"} onChange={(e) => setIsSource(e.target.value === "source")} style={inputStyle}>
            <option value="source">Source</option>
            <option value="destination">Destination</option>
          </select>
        </div>
        <button type="submit" style={buttonStyle}>Save Server</button>
      </form>

      {/* Display list of servers associated with the user */}
      <h3>Your Metabase Servers</h3>
      <ul>
        {servers.map((server: any) => (
          <li key={server.id}>
            {server.hostUrl} - {server.isSource ? "Source" : "Destination"}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Styles
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