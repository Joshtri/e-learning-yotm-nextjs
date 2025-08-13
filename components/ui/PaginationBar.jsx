import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

export default function PaginationBar({ page, pages, onPageChange, disabled }) {
  const maxButtons = 5; // jumlah tombol angka yang ditampilkan
  const start = Math.max(1, page - Math.floor(maxButtons / 2));
  const end = Math.min(pages, start + maxButtons - 1);
  const realStart = Math.max(1, end - maxButtons + 1);

  return (
    <Pagination>
      <PaginationContent className="flex justify-center gap-2">
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onPageChange(Math.max(1, page - 1));
            }}
            aria-disabled={page <= 1 || disabled}
            className={
              page <= 1 || disabled ? "pointer-events-none opacity-50" : ""
            }
          />
        </PaginationItem>

        {realStart > 1 && (
          <>
            <PaginationItem>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(1);
                }}
              >
                1
              </PaginationLink>
            </PaginationItem>
            {realStart > 2 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
          </>
        )}

        {Array.from({ length: end - realStart + 1 }).map((_, i) => {
          const num = realStart + i;
          const isActive = num === page;
          return (
            <PaginationItem key={num}>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(num);
                }}
                isActive={isActive}
              >
                {num}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        {end < pages && (
          <>
            {end < pages - 1 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(pages);
                }}
              >
                {pages}
              </PaginationLink>
            </PaginationItem>
          </>
        )}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onPageChange(Math.min(pages, page + 1));
            }}
            aria-disabled={page >= pages || disabled}
            className={
              page >= pages || disabled ? "pointer-events-none opacity-50" : ""
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
