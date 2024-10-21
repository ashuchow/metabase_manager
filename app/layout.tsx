import "./globals.css";
import type { Metadata } from "next";
import Navbar from "../components/Navbar"; // Import the Navbar component
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Metabase Manager",
  description: "Manage your Metabase instance",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
    <html lang="en">
      <body>
        <Navbar /> {/* Use the client-side Navbar */}
        <main>{children}</main>
      </body>
    </html>
    </AuthProvider>
  );
}
