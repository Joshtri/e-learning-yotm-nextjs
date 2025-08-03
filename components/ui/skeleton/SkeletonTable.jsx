// components/TableSkeleton.jsx
import { Skeleton } from "@/components/ui/skeleton";

const SkeletonTable = ({ numRows = 5, numCols = 4, showHeader = true }) => {
  // Array for a varied header column width simulation
  const headerColWidths = ["w-3/4", "w-1/2", "w-full", "w-2/3"]; // Adjust if the number of columns changes
  // Array untuk simulasi lebar kolom data yang bervariasi
  const dataColWidths = ["w-full", "w-3/4", "w-1/2", "w-1/4"]; // Adjust if the number of columns changes

  // Make sure the column width according to the number of columns requested
  const actualHeaderColWidths = headerColWidths.slice(0, numCols);
  const actualDataColWidths = dataColWidths.slice(0, numCols);

  return (
    <div className="space-y-3">
      {/* Skeleton untuk Header Tabel */}
      {showHeader && (
        <div
          className={`grid grid-cols-${numCols} gap-4 p-4 rounded-md bg-muted/50`}
        >
          {actualHeaderColWidths.map((widthClass, index) => (
            <Skeleton
              key={`header-col-${index}`}
              className={`h-5 ${widthClass}`}
            />
          ))}
        </div>
      )}

      {/* Skeleton untuk Baris Data */}
      {[...Array(numRows)].map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className={`grid grid-cols-${numCols} gap-4 p-4 border rounded-md`}
        >
          {actualDataColWidths.map((widthClass, colIndex) => (
            <Skeleton
              key={`row-${rowIndex}-col-${colIndex}`}
              className={`h-5 ${widthClass}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default SkeletonTable;
