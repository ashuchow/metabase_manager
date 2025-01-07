"use client";

import { useEffect, useState } from "react";
import { Database, Server } from "../types";
import toast from "react-hot-toast";
import { login, collectionList, databaseList, dbSchemaFetch } from "@/app/api";
import { formatHostUrl } from "@/app/utils";
import { Tree, InteractionMode, ControlledTreeEnvironment, TreeItemIndex } from "react-complex-tree";
import "react-complex-tree/lib/style-modern.css";
import { useAuth } from "@/context/AuthContext"; // Import the useAuth hook

export { ServerInput };

function ServerInput(props: {
  type: "source" | "destination";
  servers: Server[];
  onAdd: (server: Server) => void;
  onRemove: (server: Server) => void;
}) {
  const { user, isAuthenticated, loading } = useAuth();
  const userId = user?.id;

  // Logging authentication status and userId
  console.log("Authentication Status:", isAuthenticated);
  console.log("Loading State:", loading);
  console.log("User ID:", userId);

  const [savedServers, setSavedServers] = useState<Server[]>([]);
  const [selectedSavedServer, setSelectedSavedServer] = useState<string>("");
  const [focusedItem, setFocusedItem] = useState<TreeItemIndex>();
  const [expandedItems, setExpandedItems] = useState<TreeItemIndex[]>([]);
  const [selectedItems, setSelectedItems] = useState<TreeItemIndex[]>([]);
  const [inForm, setInForm] = useState(true); // Show form by default
  const [databasesList, setDatabasesList] = useState<Database[]>([]);
  const [collectionsList, setCollectionsList] = useState<Database[]>([]);
  const [disableAddButton, setDisableAddButton] = useState(false);
  const [form, setForm] = useState({
    host: "",
    session_token: "",
    excludedIDs: "",
    email: "",
    password: "",
    database: "-1",
    collection: "-1",
    schema: null,
    collectionTree: null,
    databaseList: [],
  });
  const [loginMethod, setLoginMethod] = useState<"session" | "password">("password");

  useEffect(() => {
    if (collectionsList.length > 0) {
      setExpandedItems([collectionsList[0].id.toString()]);
    }
  }, [collectionsList]);

  useEffect(() => {
    console.log("Servers Prop Updated:", props.servers);
    // No need to setServers locally
    // Servers are managed by the parent and passed via props
  }, [props.servers]);

  useEffect(() => {
    async function fetchSavedServers() {
      if (!userId) {
        console.error("User ID is not available. Ensure the user is authenticated.");
        return;
      }
      try {
        const fetchUrl = `/api/servers?userId=${userId}`;
        console.log("Fetching saved servers from URL:", fetchUrl);

        const response = await fetch(fetchUrl, {
          method: "GET",
          credentials: "include", // Include credentials if using session-based auth
        });

        console.log("Response Status:", response.status);

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch (err) {
            errorData = await response.text();
          }
          console.error("Failed to fetch saved servers:", errorData);
          toast.error("Unable to fetch saved servers. Please try again later.");
          throw new Error("Failed to fetch saved servers");
        }

        const data = await response.json();
        console.log("Fetched Servers Data:", data);

        // Ensure data is an array
        if (!Array.isArray(data)) {
          console.error("Unexpected data format:", data);
          toast.error("Failed to load servers");
          return;
        }

        // **Map 'hostUrl' to 'host' if necessary**
        const mappedServers = data.map((server: any) => ({
          ...server,
          host: server.hostUrl || server.host, // Prefer 'hostUrl' if defined
        }));

        // **Filter servers based on type (source or destination)**
        const filteredServers = mappedServers.filter((server: Server) => server.isSource === (props.type === "source"));
        console.log(`Filtered Servers (${props.type}):`, filteredServers);

        setSavedServers(filteredServers);
        // No need to setServers locally
      } catch (error: any) {
        console.error("Error fetching saved servers:", error);
        toast.error("Unable to fetch saved servers. Please try again later.");
      }
    }

    if (userId && isAuthenticated && !loading) {
      fetchSavedServers();
    }
  }, [props.type, userId, isAuthenticated, loading]);

  async function fetchDatabases(session_token: string) {
    if (!form.host || !session_token) {
      toast.error("Host and Session Token are required");
      return;
    }
    let host = form.host;
    if (!host.startsWith("http")) host = "https://" + host;
    if (host.endsWith("/")) host = host.slice(0, -1);

    try {
      const databases = await toast.promise(databaseList(host, session_token), {
        loading: "Fetching databases",
        success: "Databases fetched!",
        error: "Error fetching databases",
      });
      if (databases.data.length === 0) {
        toast.error("No databases found on the server");
        return;
      }
      setDatabasesList(databases.data);
      setForm((form) => ({ ...form, databaseList: databases.data }));
      console.log("Fetched Databases:", databases.data);
    } catch (error: any) {
      console.error("Error fetching databases:", error);
      toast.error("Failed to fetch databases");
    }
  }

  async function fetchSessionToken(host: string) {
    try {
      const session_token = await toast.promise(login(host, form.email, form.password), {
        loading: "Fetching session token from login credentials",
        success: "Session token fetched!",
        error: "Error fetching session token! Check your credentials",
      });
      setForm((form) => ({ ...form, session_token: session_token["id"] }));
      console.log("Session Token Obtained:", session_token["id"]);
      return session_token["id"];
    } catch (error: any) {
      console.error("Error fetching session token:", error);
      return null;
    }
  }

  async function fetchCollections(session_token: string) {
    if (!form.host || !session_token) {
      toast.error("Host and Session Token are required");
      return;
    }
    let host = form.host;
    if (!host.startsWith("http")) host = "https://" + host;
    if (host.endsWith("/")) host = host.slice(0, -1);

    try {
      const collections = await toast.promise(collectionList(host, session_token), {
        loading: "Fetching collections",
        success: "Collections fetched!",
        error: "Error fetching collections",
      });
      setCollectionsList(collections);
      setForm((form) => ({ ...form, collectionTree: collections }));
      console.log("Fetched Collections:", collections);
    } catch (error: any) {
      console.error("Error fetching collections:", error);
      toast.error("Failed to fetch collections");
    }
  }

  async function addServerClick() {
    let host = form.host;
    if (!host.startsWith("http")) host = "https://" + host;
    if (host.endsWith("/")) host = host.slice(0, -1);

    console.log("Attempting to add server with host:", host);
    console.log("Form Data Before Adding:", form);

    // Check for duplicates
    const isDuplicate = props.servers.some((server) => server.host === host);
    if (isDuplicate) {
      toast.error("This server has already been added.");
      return;
    }

    if (form.database !== "-1") {
      setDisableAddButton(true);
      try {
        const schema = await toast.promise(dbSchemaFetch(host, form.session_token, form.database), {
          loading: "Fetching database schema",
          success: "Database schema fetched!",
          error: "Error fetching database schema",
        });
        console.log("Fetched Database Schema:", schema);

        const excludedIDs = form.excludedIDs.split(",").filter((id) => id.trim() !== "");
        const newServer: Server = {
          ...form,
          host, // Use 'host' instead of 'host'
          schema,
          excludedIDs,
        };
        console.log("New Server to Add:", newServer);

        props.onAdd(newServer); // Notify parent to add the server
        // No need to setServers locally

        resetForm(false); // Switch to server list after adding
        setDisableAddButton(false);
        return;
      } catch (e: any) {
        console.error("Error adding server:", e);
        setDisableAddButton(false);
        return;
      }
    }

    let session_token = form.session_token;

    if (loginMethod === "password") {
      session_token = await fetchSessionToken(host);
      if (!session_token) return;
    }

    await fetchDatabases(session_token);
    await fetchCollections(session_token);

  }

  function resetForm(showForm: boolean = true) {
    setInForm(showForm); // Show or hide the form based on the parameter
    setForm({
      host: "",
      session_token: "",
      email: "",
      password: "",
      database: "-1",
      collection: "-1",
      schema: null,
      collectionTree: null,
      excludedIDs: "",
      databaseList: [],
    });
    setLoginMethod("password");
    setDatabasesList([]);
    setCollectionsList([]);
    setSelectedSavedServer("");
    console.log("Form has been reset.");
  }

  function convertCollectionTree(jsonObj: any, parentName?: string) {
    const result: { [key: string]: any } = {};
    if (Array.isArray(jsonObj)) {
      for (const item of jsonObj) {
        Object.assign(result, convertCollectionTree(item, parentName));
      }
    } else if (typeof jsonObj === "object" && jsonObj !== null) {
      const name: string = jsonObj["id"].toString();
      const children = jsonObj["children"] || [];
      const childNames = children.map((child: any) => child["id"].toString());
      result[name] = {
        index: jsonObj["id"].toString(),
        isFolder: Boolean(children.length),
        children: childNames,
        data: jsonObj["name"],
      };
      for (const child of children) {
        Object.assign(result, convertCollectionTree(child, name));
      }
    }
    return result;
  }

  // Handle server selection from dropdown
  const handleServerSelect = (host: string) => {
    const selectedServer = savedServers.find((server) => server.host === host);
    if (selectedServer) {
      console.log("Selected Server:", selectedServer);
      setForm({
        host: selectedServer.host,
        session_token: "", // Clear session token; user may need to re-authenticate
        excludedIDs: "",
        email: selectedServer.email,
        password: selectedServer.password, // Prefill password
        database: "-1",
        collection: "-1",
        schema: null,
        collectionTree: null,
        databaseList: [],
      });
      console.log("Form Prefilled with Selected Server Data:", {
        host: selectedServer.host,
        email: selectedServer.email,
        // Password is omitted from logs for security reasons
      });
    }
  };

  // Main Render with Conditional Rendering
  return (
    <div className="flex flex-col p-4">
      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <p>Loading servers...</p>
        </div>
      ) : !isAuthenticated ? (
        <div className="flex items-center justify-center h-screen">
          <p>You must be signed in to view this component.</p>
        </div>
      ) : inForm ? (
        <div className="flex flex-col">
          {/* Dropdown to select a saved server */}
          {savedServers.length > 0 ? (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Add from Saved Servers</label>
              <select
                className="border rounded w-full py-2 px-3 text-gray-700 leading-tight"
                value={selectedSavedServer}
                onChange={(e) => {
                  const host = e.target.value;
                  setSelectedSavedServer(host);
                  console.log("Selected Saved Server:", host);

                  handleServerSelect(host);
                }}
              >
                <option value="">-- Select a saved server --</option>
                {savedServers.map((server) => {
                  const formattedUrl = formatHostUrl(server.host);
                  console.log("Formatted Host URL:", formattedUrl);
                  return (
                    <option key={server.host} value={server.host}>
                      {formattedUrl}
                    </option>
                  );
                })}
              </select>
            </div>
          ) : (
            <p className="text-gray-500 mb-4">No saved servers available.</p>
          )}

          {/* Host URL Input */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Host URL</label>
            <input
              data-testid={`host-${props.type}`}
              className="border rounded w-full py-2 px-3 text-gray-700 leading-tight"
              type="text"
              value={form.host}
              onChange={(e) => {
                console.log("Host Input Changed:", e.target.value);
                setForm((form) => ({
                  ...form,
                  host: e.target.value,
                }));
              }}
              placeholder="https://server.metabase.tld"
            />
          </div>

          {/* Login Credentials */}
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                {loginMethod === "session" ? "Session Token" : "Credentials"}
              </label>
              <button
                data-testid={`toggle-login-method-${props.type}`}
                className="w-5 h-5 fill-current text-blue-500 hover:text-blue-300"
                onClick={() => {
                  const newMethod = loginMethod === "session" ? "password" : "session";
                  console.log(`Toggling login method to ${newMethod}`);
                  setLoginMethod(newMethod);
                }}
                type="button" // Prevent form submission
              >
                {/* Icon can be customized */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5">
                  <path d="M20,12a1,1,0,0,0-1-1H11.41l2.3-2.29a1,1,0,1,0-1.42-1.42l-4,4a1,1,0,0,0-.21.33,1,1,0,0,0,0,.76,1,1,0,0,0,.21.33l4,4a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42L11.41,13H19A1,1,0,0,0,20,12ZM17,2H7A3,3,0,0,0,4,5V19a3,3,0,0,0,3,3H17a3,3,0,0,0,3-3V16a1,1,0,0,0-2,0v3a1,1,0,0,1-1,1H7a1,1,0,0,1-1-1V5A1,1,0,0,1,7,4H17a1,1,0,0,1,1,1V8a1,1,0,0,0,2,0V5A3,3,0,0,0,17,2Z" />
                </svg>
              </button>
            </div>
            {loginMethod === "session" ? (
              <input
                className="border rounded w-full py-2 px-3 text-gray-700 leading-tight"
                type="password"
                data-testid={`session_token-${props.type}`}
                value={form.session_token}
                onChange={(e) => {
                  console.log("Session Token Input Changed:", e.target.value);
                  setForm((form) => ({
                    ...form,
                    session_token: e.target.value,
                  }));
                }}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              />
            ) : (
              <div className="flex gap-3">
                <input
                  className="border rounded w-full py-2 px-3 text-gray-700 leading-tight"
                  type="text"
                  data-testid={`email-${props.type}`}
                  value={form.email}
                  onChange={(e) => {
                    console.log("Email Input Changed:", e.target.value);
                    setForm((form) => ({
                      ...form,
                      email: e.target.value,
                    }));
                  }}
                  placeholder="Email"
                />
                <input
                  className="border rounded w-full py-2 px-3 text-gray-700 leading-tight"
                  type="password"
                  data-testid={`password-${props.type}`}
                  value={form.password}
                  onChange={(e) => {
                    console.log("Password Input Changed:", e.target.value);
                    setForm((form) => ({
                      ...form,
                      password: e.target.value,
                    }));
                  }}
                  placeholder="Password"
                />
              </div>
            )}
            {props.type === "destination" && (
              <>
                <label className="block text-gray-700 text-sm font-bold my-2">Excluded Source Card Entity IDs</label>
                <input
                  className="border rounded w-full py-2 px-3 text-gray-700 leading-tight"
                  type="text"
                  data-testid={`excluded-${props.type}`}
                  value={form.excludedIDs}
                  onChange={(e) => {
                    console.log("Excluded IDs Input Changed:", e.target.value);
                    setForm((form) => ({
                      ...form,
                      excludedIDs: e.target.value,
                    }));
                  }}
                  placeholder="entityID1,entityID2,entityID3,..."
                />
              </>
            )}
          </div>

          {/* Database Selection */}
          {databasesList.length > 0 && (
            <div className="relative w-full mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Database</label>
              <select
                data-testid={`database-${props.type}`}
                className="w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight"
                value={form.database}
                onChange={(e) => {
                  console.log("Database Selection Changed:", e.target.value);
                  setForm((form) => ({ ...form, database: e.target.value }));
                }}
              >
                <option key="-1" value="-1">
                  Select the database
                </option>
                {databasesList.map((database) => (
                  <option key={database.id} value={database.id}>
                    {database.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Collections Selection */}
          {collectionsList.length > 0 && (
            <div className="relative w-full mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Collections</label>
              <div className="w-full border border-gray-400 rounded shadow leading-tight p-1">
                <ControlledTreeEnvironment
                  items={{
                    ...convertCollectionTree(collectionsList),
                    root: {
                      index: "root",
                      isFolder: true,
                      children: collectionsList.map((collection) => collection.id.toString()),
                      data: "All Collections",
                    },
                  }}
                  viewState={{
                    [`collection-list-${props.type}`]: {
                      focusedItem,
                      expandedItems,
                      selectedItems,
                    },
                  }}
                  getItemTitle={(item) => item.data}
                  defaultInteractionMode={InteractionMode.ClickArrowToExpand}
                  onFocusItem={(item) => setFocusedItem(item.index)}
                  onExpandItem={(item) => {
                    setExpandedItems([...expandedItems, item.index]);
                  }}
                  onCollapseItem={(item) =>
                    setExpandedItems(expandedItems.filter((expandedItemIndex) => expandedItemIndex !== item.index))
                  }
                  onSelectItems={(items) => {
                    const selected = items[items.length - 1];
                    console.log("Selected Collection Item:", selected);
                    setSelectedItems([selected]);
                    setForm((form) => ({
                      ...form,
                      collection: selected?.toString() || "-1",
                    }));
                  }}
                >
                  <Tree treeId={`collection-list-${props.type}`} rootItem="root" />
                </ControlledTreeEnvironment>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              data-testid={`cancel-${props.type}`}
              type="button"
              onClick={() => {
                console.log("Cancel Button Clicked");
                resetForm(false); // Switch to server list after canceling
              }}
              className="w-full rounded-md bg-gray-300 hover:bg-gray-400 px-3 py-2 text-sm font-bold shadow-sm"
            >
              Cancel
            </button>
            <button
              data-testid={`add-${props.type}`}
              type="button"
              disabled={disableAddButton}
              onClick={() => {
                console.log("Add Button Clicked");
                addServerClick();
              }}
              className="w-full rounded-md bg-[#1e6091] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#168aad] disabled:bg-gray-700 disabled:text-white"
            >
              {form.database === "-1" || form.collection === "-1" ? "Fetch Databases & Collections" : "Add Server"}
            </button>
          </div>
        </div>
      ) : (
        // Server Boxes Rendering
        <div
          className={`mt-3 text-xl leading-8 grid grid-cols-1 ${
            props.servers.length > 0 ? "sm:grid-cols-3" : "sm:grid-cols-1"
          } gap-6`}
        >
          {console.log("Rendering servers:", props.servers)}
          {props.servers.map((server) => (
            <div key={server.host} className="flex">
              <button
                data-testid={`remove-${props.type}`}
                type="button"
                onClick={() => {
                  console.log("Remove Server Clicked");
                  props.onRemove(server);
                }}
                className="w-full items-center flex flex-col rounded-lg border-2 border-solid border-gray-300 py-11 px-2 text-center hover:border-red-400"
              >
                <svg className="h-16 w-16" xmlns="http://www.w3.org/2000/svg" data-name="Layer 1" viewBox="0 0 24 24">
                  <path
                    fill="#1e8467"
                    d="M15,17a1,1,0,1,0,1,1A1,1,0,0,0,15,17ZM9,17H6a1,1,0,0,0,0,2H9a1,1,0,0,0,0-2Zm9,0a1,1,0,1,0,1,1A1,1,0,0,0,18,17Zm-3-6a1,1,0,1,0,1,1A1,1,0,0,0,15,11ZM9,11H6a1,1,0,0,0,0,2H9a1,1,0,0,0,0-2Zm9-6a1,1,0,1,0,1,1A1,1,0,0,0,18,5Zm0,6a1,1,0,1,0,1,1A1,1,0,0,0,18,11Zm4-6a3,3,0,0,0-3-3H5A3,3,0,0,0,2,5V7a3,3,0,0,0,.78,2A3,3,0,0,0,2,11v2a3,3,0,0,0,.78,2A3,3,0,0,0,2,17v2a3,3,0,0,0,3,3H19a3,3,0,0,0,3-3V17a3,3,0,0,0-.78-2A3,3,0,0,0,22,13V11a3,3,0,0,0-.78-2A3,3,0,0,0,22,7ZM20,19a1,1,0,0,1-1,1H5a1,1,0,0,1-1-1V17a1,1,0,0,1,1-1H19a1,1,0,0,1,1,1Zm0-6a1,1,0,0,1-1,1H5a1,1,0,0,1-1-1V11a1,1,0,0,1,1-1H19a1,1,0,0,1,1,1Zm0-6a1,1,0,0,1-1,1H5A1,1,0,0,1,4,7V5A1,1,0,0,1,5,4H19a1,1,0,0,1,1,1ZM15,5a1,1,0,1,0,1,1A1,1,0,0,0,15,5ZM9,5H6A1,1,0,0,0,6,7H9A1,1,0,0,0,9,5Z"
                  ></path>
                </svg>
                <span className="my-2 block text-sm font-semibold text-black">{formatHostUrl(server.host)}</span>
                {server.database !== "-1" && (
                  <span className="block text-xs text-gray-500">
                    Database: {server.databaseList?.find((d) => d.id?.toString() === server.database)?.name}
                  </span>
                )}
                {server.collection !== "-1" && (
                  <span className="block text-xs text-gray-500">
                    Collection: {server.collectionTree?.find((c) => c.id?.toString() === server.collection)?.name}
                  </span>
                )}
                {server.excludedIDs && (
                  <span className="block text-xs text-gray-500">Cards Excluded: {server.excludedIDs?.length}</span>
                )}
              </button>
            </div>
          ))}

          {/* Add New Server Button */}
          <button
            data-testid={`add-${props.type}`}
            type="button"
            onClick={() => {
              console.log("Add New Server Instance Clicked");
              resetForm(true); // Show the form to add a new server
            }}
            className="items-center flex flex-col rounded-lg border-2 border-dashed border-gray-300 p-11 text-center hover:border-gray-400 w-full"
          >
            <svg className="h-16 w-16" xmlns="http://www.w3.org/2000/svg" data-name="Layer 1" viewBox="0 0 24 24">
              <path
                fill="#274c77"
                d="M15,17a1,1,0,1,0,1,1A1,1,0,0,0,15,17ZM9,17H6a1,1,0,0,0,0,2H9a1,1,0,0,0,0-2Zm9,0a1,1,0,1,0,1,1A1,1,0,0,0,18,17Zm-3-6a1,1,0,1,0,1,1A1,1,0,0,0,15,11ZM9,11H6a1,1,0,0,0,0,2H9a1,1,0,0,0,0-2Zm9-6a1,1,0,1,0,1,1A1,1,0,0,0,18,5Zm0,6a1,1,0,1,0,1,1A1,1,0,0,0,18,11Zm4-6a3,3,0,0,0-3-3H5A3,3,0,0,0,2,5V7a3,3,0,0,0,.78,2A3,3,0,0,0,2,11v2a3,3,0,0,0,.78,2A3,3,0,0,0,2,17v2a3,3,0,0,0,3,3H19a3,3,0,0,0,3-3V17a3,3,0,0,0-.78-2A3,3,0,0,0,22,13V11a3,3,0,0,0-.78-2A3,3,0,0,0,22,7ZM20,19a1,1,0,0,1-1,1H5a1,1,0,0,1-1-1V17a1,1,0,0,1,1-1H19a1,1,0,0,1,1,1Zm0-6a1,1,0,0,1-1,1H5a1,1,0,0,1-1-1V11a1,1,0,0,1,1-1H19a1,1,0,0,1,1,1Zm0-6a1,1,0,0,1-1,1H5A1,1,0,0,1,4,7V5A1,1,0,0,1,5,4H19a1,1,0,0,1,1,1ZM15,5a1,1,0,1,0,1,1A1,1,0,0,0,15,5ZM9,5H6A1,1,0,0,0,6,7H9A1,1,0,0,0,9,5Z"
              ></path>
            </svg>
            <span className="mt-2 block text-sm font-semibold text-black">Add a new {props.type} instance</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default ServerInput;
