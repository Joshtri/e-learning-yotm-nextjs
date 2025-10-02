'use client';

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePathname } from 'next/navigation';
import generateTitleFromPath from "@/lib/title-generator";

export function PageHeader({ title, description, actions, breadcrumbs }) {
  const pathname = usePathname();
  
  // Use either provided title or auto-generated one based on pathname
  const displayTitle = title || generateTitleFromPath(pathname);
  const displayDescription = description || `Halaman ${displayTitle}`;

  return (
    <div className="flex flex-col gap-4 mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="text-sm text-muted-foreground flex items-center gap-1 flex-wrap">
          {breadcrumbs.map((item, index) => (
            <span key={index} className="flex items-center gap-1">
              {item.href ? (
                <Link
                  href={item.href}
                  className="hover:underline text-blue-600"
                >
                  {item.label}
                </Link>
              ) : (
                <span>{item.label}</span>
              )}
              {index < breadcrumbs.length - 1 && <ChevronRight size={16} />}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{displayTitle}</h1>
          {displayDescription && (
            <p className="text-muted-foreground mt-1">{displayDescription}</p>
          )}
        </div>
        {actions && <div className="flex gap-2 ml-auto">{actions}</div>}
      </div>
    </div>
  );
}
