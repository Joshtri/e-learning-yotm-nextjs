// lib/dynamic-metadata.js

import { generateDocumentTitleFromPath } from './title-generator';

// Helper function to create dynamic metadata for a page
// This still requires passing the path, as generateMetadata function
// doesn't have access to the current route automatically
export function createDynamicMetadata(path, extraOptions = {}) {
  const title = generateDocumentTitleFromPath(path);
  
  return {
    title: title,
    description: extraOptions.description || `Halaman ${generateDocumentTitleFromPath(path)}`,
    ...extraOptions
  };
}

// For more advanced use cases, we can also create metadata for specific sections
export function createSectionMetadata(section, page, extraOptions = {}) {
  let path = `/${section}`;
  if (page) path += `/${page}`;
  
  return createDynamicMetadata(path, extraOptions);
}