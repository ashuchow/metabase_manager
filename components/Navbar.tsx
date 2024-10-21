"use client"; // This is a client component

import Link from "next/link";
import { useAuth } from "@/context/AuthContext"; // Import the auth context
import { useRouter } from "next/navigation"; // For programmatic navigation
import { useState } from "react"; // For dropdown management

export default function Navbar() {
  const { isAuthenticated, signOut } = useAuth(); // Get auth state and actions from context
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Manage dropdown state
  const router = useRouter();

  const handleSignOut = () => {
    signOut();
    router.replace("/signin");
  };

  return (
    <nav style={navStyle}>
      <div style={navContainer}>
        <Link href="/" style={brandStyle}>Metabase Manager</Link>
        <ul style={navListStyle}>
          <li>
            <Link href="/" style={linkStyle}>Home</Link>
          </li>

          {/* Dropdown for Public Dashboards */}
          <li
            style={dropdownStyle}
            onMouseEnter={() => setIsDropdownOpen(true)}
            onMouseLeave={() => setIsDropdownOpen(false)}
          >
            <a href="#" style={linkStyle}>
              Public Dashboards
            </a>
            {isDropdownOpen && (
              <ul style={dropdownMenuStyle}>
                <li><Link href="/manipur" style={dropdownLinkStyle}>Manipur</Link></li>
                <li><Link href="/assam" style={dropdownLinkStyle}>Assam</Link></li>
                <li><Link href="/karnataka" style={dropdownLinkStyle}>Karnataka</Link></li>
                <li><Link href="/meghalaya" style={dropdownLinkStyle}>Meghalaya</Link></li>
                <li><Link href="/sikkim" style={dropdownLinkStyle}>Sikkim</Link></li>
                <li><Link href="/nagaland" style={dropdownLinkStyle}>Nagaland</Link></li>
              </ul>
            )}
          </li>

          {/* Sign In/Sign Out Button */}
          <li>
            {isAuthenticated ? (
              <button style={buttonStyle} onClick={handleSignOut}>Sign Out</button>
            ) : (
              <Link href="/signin"><button style={buttonStyle}>Sign In</button></Link>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}

// Styles
const navStyle = {
  backgroundColor: '#1f2937',
  padding: '10px 20px',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
};

const navContainer = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const navListStyle = {
  display: 'flex',
  listStyle: 'none',
  gap: '20px',
  margin: '0',
  padding: '0',
};

const brandStyle = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#fff',
  textDecoration: 'none',
};

const linkStyle = {
  color: '#fff',
  textDecoration: 'none',
  fontSize: '18px',
  padding: '10px',
  transition: 'color 0.2s ease',
};

const dropdownStyle = {
  position: 'relative',
};

const dropdownMenuStyle = {
  position: 'absolute',
  top: '100%',
  left: '0',
  backgroundColor: '#374151',
  listStyle: 'none',
  padding: '10px',
  boxShadow: '0px 8px 16px rgba(0,0,0,0.1)',
  zIndex: 1000,
};

const dropdownLinkStyle = {
  color: '#fff',
  textDecoration: 'none',
  padding: '8px 16px',
  display: 'block',
  transition: 'background-color 0.2s ease',
};

const buttonStyle = {
  backgroundColor: '#3b82f6',
  color: '#fff',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '16px',
  transition: 'background-color 0.3s ease',
};
