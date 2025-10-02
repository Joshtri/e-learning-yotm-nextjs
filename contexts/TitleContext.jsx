// contexts/TitleContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import generateTitleFromPath from "@/lib/title-generator";

const TitleContext = createContext();

export function TitleProvider({ children }) {
  const pathname = usePathname();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (pathname) {
      // Generate title from the current path
      const generatedTitle = generateTitleFromPath(pathname);
      setTitle(generatedTitle);

      // Set a default description based on the title
      setDescription(`Halaman ${generatedTitle}`);
    }
  }, [pathname]);

  // Function to manually override the title if needed
  const setCustomTitle = (customTitle, customDescription) => {
    setTitle(customTitle);
    if (customDescription) {
      setDescription(customDescription);
    }
  };

  return (
    <TitleContext.Provider
      value={{
        title,
        description,
        setCustomTitle,
        generateTitleFromPath: (path) => generateTitleFromPath(path),
        refreshTitle: () => {
          if (pathname) {
            setTitle(generateTitleFromPath(pathname));
          }
        },
      }}
    >
      {children}
    </TitleContext.Provider>
  );
}

export const useTitle = () => {
  const context = useContext(TitleContext);
  if (!context) {
    throw new Error("useTitle must be used within a TitleProvider");
  }
  return context;
};
