// lib/title-generator.js
// Utility functions to automatically generate page titles from route paths

// Define translations for common route segments
const ROUTE_TRANSLATIONS = {
  // Main sections
  'admin': 'Admin',
  'tutor': 'Tutor',
  'student': 'Siswa',
  
  // Common pages
  'dashboard': 'Dashboard',
  'profile': 'Profil',
  'settings': 'Pengaturan',
  'assignments': 'Tugas',
  'quizzes': 'Kuis',
  'exams': 'Ujian',
  'attendances': 'Presensi',
  'academic-years': 'Tahun Ajaran',
  'classes': 'Kelas',
  'students': 'Siswa',
  'tutors': 'Tutor',
  'subjects': 'Mata Pelajaran',
  'learning-materials': 'Materi Pembelajaran',
  'submissions': 'Pengumpulan',
  'questions': 'Soal',
  'academic-history': 'Riwayat Akademik',
  'create': 'Buat',
  'edit': 'Edit',
  'list': 'Daftar',
  'detail': 'Detail',
  'overview': 'Ikhtisar',
  'management': 'Manajemen',
  'history': 'Riwayat',
  'reports': 'Laporan',
  'notifications': 'Notifikasi',
  
  // Assignment types
  'DAILY_TEST': 'Ujian Harian',
  'START_SEMESTER_TEST': 'Ujian Awal Semester',
  'MIDTERM': 'UTS',
  'FINAL_EXAM': 'UAS',
  
  // Additional common terms
  'data': 'Data',
  'list': 'Daftar',
  'view': 'Lihat',
  'update': 'Perbarui',
  'delete': 'Hapus',
  'add': 'Tambah',
  'new': 'Baru',
  'all': 'Semua',
  'active': 'Aktif',
  'inactive': 'Non-Aktif',
};

// Function to convert kebab-case or snake_case to proper case
function toTitleCase(str) {
  return str
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Main function to generate title from route path
export function generateTitleFromPath(path) {
  if (!path || typeof path !== 'string') {
    return 'Beranda';
  }

  // Remove leading slash and split path into segments
  const segments = path.replace(/^\//, '').split('/');
  
  // Remove layout markers like (admin), (tutor), etc.
  const cleanSegments = segments
    .filter(segment => segment && !segment.startsWith('(') && !segment.endsWith(')'))
    .filter(segment => segment !== 'page'); // Remove 'page' if it's in the path

  if (cleanSegments.length === 0) {
    return 'Beranda';
  }

  // Handle special cases
  let processedTitle = '';
  
  // If it's a direct page like just /dashboard
  if (cleanSegments.length === 1) {
    const segment = cleanSegments[0];
    return ROUTE_TRANSLATIONS[segment] || toTitleCase(segment);
  }

  // Process multi-segment paths
  const processedSegments = cleanSegments.map((segment, index) => {
    // Handle dynamic routes like [id]
    if (segment.startsWith('[') && segment.endsWith(']')) {
      // Skip parameter segments in the title generation
      return null;
    }
    
    // Use translation if available
    return ROUTE_TRANSLATIONS[segment] || toTitleCase(segment);
  }).filter(Boolean); // Remove null values

  // For paths ending with create/edit, format appropriately
  if (processedSegments.length >= 2) {
    const lastSegment = processedSegments[processedSegments.length - 1];
    const secondLastSegment = processedSegments[processedSegments.length - 2];
    
    if (lastSegment === 'Buat') {
      return `Buat ${secondLastSegment}`;
    } else if (lastSegment === 'Edit') {
      return `Edit ${secondLastSegment}`;
    }
  }

  // Join segments to form the title
  processedTitle = processedSegments.join(' ');

  // Handle specific patterns
  if (processedTitle.includes('Buat')) {
    // For create pages like "assignments Buat" -> "Buat Tugas"
    const parts = processedTitle.split(' ');
    if (parts.length >= 2 && parts[parts.length - 1] === 'Buat') {
      return `Buat ${parts.slice(0, -1).join(' ')}`;
    }
  }

  return processedTitle || 'Halaman';
}

// Function to generate document title (with app name)
export function generateDocumentTitleFromPath(path) {
  const pageSpecificTitle = generateTitleFromPath(path);
  return `${pageSpecificTitle} - E-Learning YOTM`;
}

// Function to generate a title with context based on the path
export function generateContextualTitle(path, context = {}) {
  const baseTitle = generateTitleFromPath(path);
  
  // Enhance title based on context if provided
  if (context.type) {
    switch (context.type) {
      case 'management':
        return `Manajemen ${baseTitle}`;
      case 'list':
        return `Daftar ${baseTitle}`;
      case 'detail':
        return `Detail ${baseTitle}`;
      default:
        return baseTitle;
    }
  }
  
  return baseTitle;
}

// Export default function for ease of use
export default generateTitleFromPath;

// Export the document title generator as well
export { generateDocumentTitleFromPath };