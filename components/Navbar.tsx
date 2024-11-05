"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

import * as React from "react";
import { cn } from "@/lib/utils";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";


export default function Navbar() {
  const { isAuthenticated, user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    signOut();
    router.replace("/signin");
  };

  return (
    <nav className="bg-gray-800 shadow-md">
      <div className="container mx-auto flex justify-between items-center py-4 px-6">
        <Link href="/" className="text-white font-bold text-lg">Metabase Manager</Link>
        <NavigationMenu className="flex-grow flex justify-evenly items-center">
          <NavigationMenuList className="list-none flex w-full justify-around">
            <NavigationMenuItem>
              <NavigationMenuLink href="/" className="text-white text-lg hover:text-gray-300">Home</NavigationMenuLink>
            </NavigationMenuItem>

            {/* Dropdown for Public Dashboards */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-gray-800 text-white text-lg hover:text-gray-300 px-2 py-1">Public Dashboards</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr] list-none">
                  <ListItem href="/manipur" title="Manipur">
                    Manipur public dashboard
                  </ListItem>
                  <ListItem href="/assam" title="Assam">
                    Assam public dashboard
                  </ListItem>
                  <ListItem href="/karnataka" title="Karnataka">
                    Karnataka public dashboard
                  </ListItem>
                  <ListItem href="/meghalaya" title="Meghalaya">
                    Meghalaya public dashboard
                  </ListItem>
                  <ListItem href="/sikkim" title="Sikkim">
                    Sikkim public dashboard
                  </ListItem>
                  <ListItem href="/nagaland" title="Nagaland">
                    Nagaland public dashboard
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Conditional buttons for Add Users and Add Servers */}
            {isAuthenticated && user?.role === "SUPER_USER" && (
              <NavigationMenuItem>
                <NavigationMenuLink href="/superuser" className="text-white text-lg hover:text-gray-300 px-2 py-1">Add Users</NavigationMenuLink>
              </NavigationMenuItem>
            )}
            {isAuthenticated && (
              <NavigationMenuItem>
                <NavigationMenuLink href="/serverdetails" className="text-white text-lg hover:text-gray-300 px-2 py-1">Add Servers</NavigationMenuLink>
              </NavigationMenuItem>
            )}

            {/* Sign In/Sign Out Button */}
            <NavigationMenuItem>
              {isAuthenticated ? (
                <button onClick={handleSignOut} className="bg-gray-800 text-white text-lg px-2 py-1 rounded-md hover:bg-gray-700">Sign Out</button>
              ) : (
                <NavigationMenuLink href="/signin" className="text-white text-lg hover:text-gray-300">
                  <button className="bg-gray-800 text-white text-lg px-2 py-1 rounded-md hover:bg-gray-700">Sign In</button>
                </NavigationMenuLink>
              )}
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </nav>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li className="list-none">
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-lg",
            className
          )}
          {...props}
        >
          <div className="text-lg font-medium leading-none text-white">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
