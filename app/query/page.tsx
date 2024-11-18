'use client';

import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';


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

  // New state variables
  const [serverDatabases, setServerDatabases] = useState<{ [key: number]: any[] }>({});
  const [selectedDatabaseIds, setSelectedDatabaseIds] = useState<{ [key: number]: number }>({});

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

  // Fetch databases when servers are selected
  useEffect(() => {
    const fetchDatabasesForServers = async () => {
      for (const serverId of selectedServers) {
        if (!serverDatabases[serverId]) {
          try {
            const response = await fetch(`/api/get-databases?serverId=${serverId}`);
            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error || 'Failed to fetch databases');
            }

            setServerDatabases((prev) => ({ ...prev, [serverId]: data }));

            if (Array.isArray(data) && data.length > 0) {
              setSelectedDatabaseIds((prev) => ({
                ...prev,
                [serverId]: data[0].id,
              }));
            }
          } catch (error) {
            console.error(`Error fetching databases for server ${serverId}:`, error);
            // Assign an empty array to prevent TypeError
            setServerDatabases((prev) => ({ ...prev, [serverId]: [] }));
          }
        }
      }
    };

    if (selectedServers.length > 0) {
      fetchDatabasesForServers();
    }
  }, [selectedServers]);

  // Handle server selection
  const handleServerSelection = (serverId: number) => {
    setSelectedServers((prevSelected) => {
      if (prevSelected.includes(serverId)) {
        // Remove server and its databases from state
        const updatedSelected = prevSelected.filter((id) => id !== serverId);
        const updatedDatabases = { ...serverDatabases };
        delete updatedDatabases[serverId];
        setServerDatabases(updatedDatabases);

        const updatedDatabaseIds = { ...selectedDatabaseIds };
        delete updatedDatabaseIds[serverId];
        setSelectedDatabaseIds(updatedDatabaseIds);

        return updatedSelected;
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

    // Ensure all selected servers have a selected database
    for (const serverId of selectedServers) {
      if (!selectedDatabaseIds[serverId]) {
        alert(`Please select a database for server ${serverId}.`);
        return;
      }
    }

    setIsLoading(true);
    setQueryResults([]);

    const serverDatabaseSelections = selectedServers.map((serverId) => ({
      serverId,
      databaseId: selectedDatabaseIds[serverId],
    }));

    try {
      const response = await fetch('/api/execute-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          serverDatabaseSelections,
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

  // Function to render the table
  const renderTable = (data: any) => {
    if (!data || !data.data || !data.data.rows || !data.data.cols) {
      return <p>No data available.</p>;
    }

    const { cols, rows } = data.data;

    return (
      <table border="1" cellPadding="5" cellSpacing="0">
        <thead>
          <tr>
            {cols.map((col: any, index: number) => (
              <th key={index}>{col.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any[], rowIndex: number) => (
            <tr key={rowIndex}>
              {row.map((cell: any, cellIndex: number) => (
                <td key={cellIndex}>{cell !== null ? cell.toString() : ''}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // Function to generate workbook and download XLSX file
  const handleDownloadAll = () => {
    const workbook = XLSX.utils.book_new();

    queryResults.forEach((result) => {
      if (result.error) {
        // Skip results with errors
        return;
      }

      const data = result.data;
      if (!data || !data.data || !data.data.rows || !data.data.cols) {
        return;
      }

      const { cols, rows } = data.data;

      // Create an array of objects for XLSX
      const sheetData = rows.map((row: any[]) => {
        const rowData: { [key: string]: any } = {};
        row.forEach((cell: any, index: number) => {
          const colName = cols[index].name;
          rowData[colName] = cell;
        });
        return rowData;
      });

      const worksheet = XLSX.utils.json_to_sheet(sheetData);
      const sheetName = result.serverUrl.replace(/https?:\/\//, '').replace(/[^\w]/g, '_').substring(0, 31); // Sheet names max 31 chars
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    // Generate XLSX file and trigger download
    XLSX.writeFile(workbook, 'query_results.xlsx');
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
          <h3>Select Servers and Databases:</h3>
          {servers.map((server) => (
            <div key={server.id} style={{ marginBottom: '1rem' }}>
              <label>
                <input
                  type="checkbox"
                  value={server.id}
                  checked={selectedServers.includes(server.id)}
                  onChange={() => handleServerSelection(server.id)}
                />
                {server.hostUrl}
              </label>
              {selectedServers.includes(server.id) && (
                <div>
                  {serverDatabases[server.id] === undefined ? (
                    <p>Loading databases...</p>
                  ) : Array.isArray(serverDatabases[server.id]) && serverDatabases[server.id].length > 0 ? (
                    <label>
                      Select Database:
                      <select
                        value={selectedDatabaseIds[server.id] || ''}
                        onChange={(e) =>
                          setSelectedDatabaseIds((prev) => ({
                            ...prev,
                            [server.id]: parseInt(e.target.value),
                          }))
                        }
                      >
                        {serverDatabases[server.id].map((db) => (
                          <option key={db.id} value={db.id}>
                            {db.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <p>No databases available or failed to fetch databases for this server.</p>
                  )}
                </div>
              )}
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
                <div>{renderTable(result.data)}</div>
              )}
            </div>
          ))}
          <button onClick={handleDownloadAll}>Download All Results as XLSX</button>
        </div>
      )}
    </div>
  );
};

export default QueryPage;
