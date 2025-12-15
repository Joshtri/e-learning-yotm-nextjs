"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { navByRole } from "@/config/navigation"; // Ensure this path is correct
import { Button } from "@/components/ui/button";
import { SearchIcon } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";

export function CommandMenu({ role = "student" }) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command) => {
    setOpen(false);
    command();
  }, []);

  // Filter navigation items based on role
  // Default to student if role is not found or empty, just to be safe
  const navItems = navByRole[role] || [];

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2 text-muted-foreground bg-white/10 hover:bg-white/20 border-blue-400 hover:border-blue-300 hover:text-white transition-all"
        onClick={() => setOpen(true)}
      >
        <SearchIcon className="h-4 w-4 xl:mr-2 text-white" />
        <span className="hidden xl:inline-flex text-white">Search...</span>
        <Kbd className="pointer-events-none absolute right-1.5 top-2.5 hidden xl:h-5 xl:select-none xl:items-center xl:gap-1 xl:flex bg-white/20 border-white/30 text-white">
          <span className="text-xs">Ctrl</span>K
        </Kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {navItems.map((group, groupIndex) => (
            <React.Fragment key={group.title || groupIndex}>
              <CommandGroup heading={group.title}>
                {group.items.map((item, itemIndex) => (
                  <CommandItem
                    key={item.href || itemIndex}
                    onSelect={() => {
                      runCommand(() => router.push(item.href));
                    }}
                  >
                    {/* We can render the icon if we want, but nav config icons are JSX elements */}
                    {item.icon && (
                      <span className="mr-2 flex h-4 w-4 items-center justify-center">
                        {item.icon}
                      </span>
                    )}
                    <span>{item.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              {groupIndex < navItems.length - 1 && <CommandSeparator />}
            </React.Fragment>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
