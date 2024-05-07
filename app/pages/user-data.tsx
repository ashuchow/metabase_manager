import { useSession } from 'next-auth/react';
import { useState } from 'react';

const UserDataPage = () => {
  const { data: session } = useSession();
  const [host, setHost] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [collectionId, setCollectionId] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    // Implement the logic to save the data to the Metabase Instance Table
  };

  if (!session) {
    return <div>You must be logged in to view this page.</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" value={host} onChange={(e) => setHost(e.target.value)} placeholder="Host" />
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
      <input type="number" value={databaseId} onChange={(e) => setDatabaseId(e.target.value)} placeholder="Database ID" />
      <input type="number" value={collectionId} onChange={(e) => setCollectionId(e.target.value)} placeholder="Collection ID" />
      <button type="submit">Save</button>
    </form>
  );
};

export default UserDataPage;