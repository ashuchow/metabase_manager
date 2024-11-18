// /app/query/page.tsx

'use client';

import React, { useEffect, useState } from 'react';

interface Server {
  id: number;
  hostUrl: string;
  isSource: boolean;
}

interface QueryResult {
  serverId: number;
  serverUrl: string;
  data: any;
  error?: string;
}

const QueryPage = () => {
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServers, setSelectedServers] = useState<number[]>([]);
  const [query, setQuery] = useState('');
  const [queryResults, setQueryResults] = useState<QueryResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch servers from the API
  useEffect(() => {
    const fetchServers = async () => {
      try {
        const response = await fetch('/api/servers');
        const data = await response.json();
        // Exclude credentials on the client side
        const sanitizedServers = data.map((server: any) => ({
          id: server.id,
          hostUrl: server.hostUrl,
          isSource: server.isSource,
        }));
        setServers(sanitizedServers);
      } catch (error) {
        console.error('Error fetching servers:', error);
      }
    };

    fetchServers();
  }, []);

  // Handle server selection
  const handleServerSelection = (serverId: number) => {
    setSelectedServers((prevSelected) => {
      if (prevSelected.includes(serverId)) {
        return prevSelected.filter((id) => id !== serverId);
      } else {
        return [...prevSelected, serverId];
      }
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      alert('Please enter a SQL query.');
      return;
    }

    if (selectedServers.length === 0) {
      alert('Please select at least one server.');
      return;
    }

    setIsLoading(true);
    setQueryResults([]);

    try {
      const response = await fetch('/api/execute-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          serverIds: selectedServers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute queries');
      }

      const results = await response.json();
      setQueryResults(results);
    } catch (error: any) {
      console.error('Error executing queries:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Execute SQL Query Across Metabase Instances</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
        <div>
          <label htmlFor="query">SQL Query:</label>
          <br />
          <textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={6}
            cols={80}
            placeholder="Enter your SQL query here"
            required
          ></textarea>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <h3>Select Servers:</h3>
          {servers.map((server) => (
            <div key={server.id}>
              <label>
                <input
                  type="checkbox"
                  value={server.id}
                  checked={selectedServers.includes(server.id)}
                  onChange={() => handleServerSelection(server.id)}
                />
                {server.hostUrl}
              </label>
            </div>
          ))}
        </div>
        <button type="submit" style={{ marginTop: '1rem' }}>
          Execute Query
        </button>
      </form>

      {isLoading && <p>Executing query, please wait...</p>}

      {queryResults.length > 0 && (
        <div>
          <h2>Query Results:</h2>
          {queryResults.map((result) => (
            <div key={result.serverId} style={{ marginBottom: '2rem' }}>
              <h3>Server: {result.serverUrl}</h3>
              {result.error ? (
                <p style={{ color: 'red' }}>Error: {result.error}</p>
              ) : (
                <pre>{JSON.stringify(result.data, null, 2)}</pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QueryPage;
