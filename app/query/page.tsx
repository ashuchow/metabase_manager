'use client';

import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

// Import shadcn components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2 } from 'lucide-react'; // For loading spinner

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
  // State variables
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServers, setSelectedServers] = useState<number[]>([]);
  const [query, setQuery] = useState('');
  const [queryResults, setQueryResults] = useState<QueryResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // New state variables
  const [serverDatabases, setServerDatabases] = useState<{
    [key: number]: any[];
  }>({});
  const [selectedDatabaseIds, setSelectedDatabaseIds] = useState<{
    [key: number]: number;
  }>({});

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
            const response = await fetch(
              `/api/get-databases?serverId=${serverId}`
            );
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
            console.error(
              `Error fetching databases for server ${serverId}:`,
              error
            );
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
      <Table>
        <TableHeader>
          <TableRow>
            {cols.map((col: any, index: number) => (
              <TableHead key={index}>{col.name}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row: any[], rowIndex: number) => (
            <TableRow key={rowIndex}>
              {row.map((cell: any, cellIndex: number) => (
                <TableCell key={cellIndex}>
                  {cell !== null ? cell.toString() : ''}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
      const sheetName = result.serverUrl
        .replace(/https?:\/\//, '')
        .replace(/[^\w]/g, '_')
        .substring(0, 31); // Sheet names max 31 chars
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    // Generate XLSX file and trigger download
    XLSX.writeFile(workbook, 'query_results.xlsx');
  };

  return (
    <div className="p-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">
            Execute SQL Query Across Metabase Instances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <Label htmlFor="query">SQL Query:</Label>
              <Textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={6}
                placeholder="Enter your SQL query here"
                required
              />
            </div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold">
                Select Servers and Databases:
              </h3>
              {servers.map((server) => (
                <div key={server.id} className="mb-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`server-${server.id}`}
                      checked={selectedServers.includes(server.id)}
                      onCheckedChange={() => handleServerSelection(server.id)}
                    />
                    <Label htmlFor={`server-${server.id}`}>
                      {server.hostUrl}
                    </Label>
                  </div>
                  {selectedServers.includes(server.id) && (
                    <div className="ml-6 mt-2">
                      {serverDatabases[server.id] === undefined ? (
                        <p>Loading databases...</p>
                      ) : Array.isArray(serverDatabases[server.id]) &&
                        serverDatabases[server.id].length > 0 ? (
                        <div className="flex items-center space-x-2">
                          <Label>Select Database:</Label>
                          <Select
                            onValueChange={(value) =>
                              setSelectedDatabaseIds((prev) => ({
                                ...prev,
                                [server.id]: parseInt(value),
                              }))
                            }
                            value={
                              selectedDatabaseIds[server.id]?.toString() || ''
                            }
                          >
                            <SelectTrigger className="w-64">
                              <SelectValue placeholder="Select a database" />
                            </SelectTrigger>
                            <SelectContent>
                              {serverDatabases[server.id].map((db) => (
                                <SelectItem
                                  key={db.id}
                                  value={db.id.toString()}
                                >
                                  {db.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <p>
                          No databases available or failed to fetch databases
                          for this server.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Execute Query
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex items-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Executing query, please wait...</span>
        </div>
      )}

      {queryResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Query Results</CardTitle>
          </CardHeader>
          <CardContent>
            {queryResults.map((result) => (
              <div key={result.serverId} className="mb-8">
                <h3 className="text-lg font-semibold">
                  Server: {result.serverUrl}
                </h3>
                {result.error ? (
                  <p className="text-red-500">Error: {result.error}</p>
                ) : (
                  <div className="overflow-auto">
                    {renderTable(result.data)}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button onClick={handleDownloadAll}>
              Download All Results as Excel File
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default QueryPage;
