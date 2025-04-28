import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Briefcase, Home, FileEdit } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import UserMenu from "@/components/auth/UserMenu";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Button } from './ui/button';

const Navbar: React.FC = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-10 px-4 py-3 bg-white border-b dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <div className="container flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
            JobBot
          </h2>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex ml-6">
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link to="/">
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "px-3 gap-1",
                      isActive('/') && "bg-slate-100 dark:bg-slate-800"
                    )}
                  >
                    <Home className="h-4 w-4" /> Home
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link to="/job-analysis">
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "px-3 gap-1",
                      isActive('/job-analysis') && "bg-slate-100 dark:bg-slate-800"
                    )}
                  >
                    <Briefcase className="h-4 w-4" /> Job Analysis
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link to="/resume-analysis">
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "px-3 gap-1",
                      isActive('/resume-analysis') && "bg-slate-100 dark:bg-slate-800"
                    )}
                  >
                    <FileText className="h-4 w-4" /> Resume Analysis
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link to="/resume-editor">
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "px-3 gap-1",
                      isActive('/resume-editor') && "bg-slate-100 dark:bg-slate-800"
                    )}
                  >
                    <FileEdit className="h-4 w-4" /> Resume Editor
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden">
          <Button variant="ghost" size="sm" asChild className={cn(isActive('/') && "bg-slate-100 dark:bg-slate-800")}>
            <Link to="/">
              <Home className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className={cn(isActive('/job-analysis') && "bg-slate-100 dark:bg-slate-800")}>
            <Link to="/job-analysis">
              <Briefcase className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className={cn(isActive('/resume-analysis') && "bg-slate-100 dark:bg-slate-800")}>
            <Link to="/resume-analysis">
              <FileText className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className={cn(isActive('/resume-editor') && "bg-slate-100 dark:bg-slate-800")}>
            <Link to="/resume-editor">
              <FileEdit className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default Navbar; 