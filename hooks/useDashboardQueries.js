import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Cache configuration
const CACHE_CONFIG = {
  staleTime: 10 * 60 * 1000, // 10 minutes before refetch
  gcTime: 30 * 60 * 1000, // 30 minutes garbage collection (previously cacheTime)
  retry: 1,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
};

// ============ STUDENT DASHBOARD QUERIES ============
export const useStudentDashboard = () => {
  return useQuery({
    queryKey: ["student-dashboard"],
    queryFn: async () => {
      const res = await axios.get("/api/student/dashboard", {
        withCredentials: true,
      });
      return res.data;
    },
    ...CACHE_CONFIG,
  });
};

// ============ TUTOR DASHBOARD QUERIES ============
export const useTutorDashboardProfile = () => {
  return useQuery({
    queryKey: ["tutor-dashboard-profile"],
    queryFn: async () => {
      const res = await axios.get("/api/tutor/dashboard/profile");
      return res.data;
    },
    ...CACHE_CONFIG,
  });
};

export const useTutorDashboardClasses = () => {
  return useQuery({
    queryKey: ["tutor-dashboard-classes"],
    queryFn: async () => {
      const res = await axios.get("/api/tutor/dashboard/classes");
      return res.data;
    },
    ...CACHE_CONFIG,
  });
};

export const useTutorDashboardRecent = () => {
  return useQuery({
    queryKey: ["tutor-dashboard-recent"],
    queryFn: async () => {
      const res = await axios.get("/api/tutor/dashboard/recent");
      return res.data;
    },
    ...CACHE_CONFIG,
  });
};

export const useTutorDashboardSubmissions = () => {
  return useQuery({
    queryKey: ["tutor-dashboard-submissions"],
    queryFn: async () => {
      const res = await axios.get("/api/tutor/dashboard/submissions");
      return res.data;
    },
    ...CACHE_CONFIG,
  });
};

export const useTutorDashboardStats = () => {
  return useQuery({
    queryKey: ["tutor-dashboard-stats"],
    queryFn: async () => {
      const res = await axios.get("/api/tutor/dashboard/stats");
      return res.data;
    },
    ...CACHE_CONFIG,
  });
};

// Combined hook for all tutor dashboard data
export const useTutorDashboard = () => {
  const profile = useTutorDashboardProfile();
  const classes = useTutorDashboardClasses();
  const recent = useTutorDashboardRecent();
  const submissions = useTutorDashboardSubmissions();
  const stats = useTutorDashboardStats();

  const isLoading =
    profile.isLoading ||
    classes.isLoading ||
    recent.isLoading ||
    submissions.isLoading ||
    stats.isLoading;

  const error =
    profile.error ||
    classes.error ||
    recent.error ||
    submissions.error ||
    stats.error;

  return {
    profile: profile.data,
    classes: classes.data,
    recent: recent.data,
    submissions: submissions.data,
    stats: stats.data,
    isLoading,
    error,
    isFetching:
      profile.isFetching ||
      classes.isFetching ||
      recent.isFetching ||
      submissions.isFetching ||
      stats.isFetching,
  };
};

// ============ ADMIN DASHBOARD QUERIES ============
export const useAdminDashboardOverview = () => {
  return useQuery({
    queryKey: ["admin-dashboard-overview"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/dashboard/overview");
      return res.data;
    },
    ...CACHE_CONFIG,
  });
};

export const useAdminDashboardClasses = () => {
  return useQuery({
    queryKey: ["admin-dashboard-classes"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/dashboard/classes");
      return res.data;
    },
    ...CACHE_CONFIG,
  });
};

export const useAdminDashboardPrograms = () => {
  return useQuery({
    queryKey: ["admin-dashboard-programs"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/dashboard/programs");
      return res.data;
    },
    ...CACHE_CONFIG,
  });
};

export const useAdminDashboardStats = () => {
  return useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/dashboard/stats");
      return res.data;
    },
    ...CACHE_CONFIG,
  });
};

// Combined hook for admin dashboard
export const useAdminDashboard = () => {
  const overview = useAdminDashboardOverview();
  const classes = useAdminDashboardClasses();
  const programs = useAdminDashboardPrograms();
  const stats = useAdminDashboardStats();

  const isLoading =
    overview.isLoading ||
    classes.isLoading ||
    programs.isLoading ||
    stats.isLoading;

  const error =
    overview.error || classes.error || programs.error || stats.error;

  return {
    overview: overview.data,
    classes: classes.data,
    programs: programs.data,
    stats: stats.data,
    isLoading,
    error,
    isFetching:
      overview.isFetching ||
      classes.isFetching ||
      programs.isFetching ||
      stats.isFetching,
  };
};

// ============ HOMEROOM DASHBOARD QUERIES ============
export const useHomeroomDashboardOverview = () => {
  return useQuery({
    queryKey: ["homeroom-dashboard-overview"],
    queryFn: async () => {
      const res = await axios.get("/api/homeroom/dashboard/overview");
      return res.data;
    },
    ...CACHE_CONFIG,
  });
};

export const useHomeroomDashboardClasses = () => {
  return useQuery({
    queryKey: ["homeroom-dashboard-classes"],
    queryFn: async () => {
      const res = await axios.get("/api/homeroom/dashboard/classes");
      return res.data;
    },
    ...CACHE_CONFIG,
  });
};

export const useHomeroomDashboardStats = () => {
  return useQuery({
    queryKey: ["homeroom-dashboard-stats"],
    queryFn: async () => {
      const res = await axios.get("/api/homeroom/dashboard/stats");
      return res.data;
    },
    ...CACHE_CONFIG,
  });
};

export const useHomeroomDashboardStudents = () => {
  return useQuery({
    queryKey: ["homeroom-dashboard-students"],
    queryFn: async () => {
      const res = await axios.get("/api/homeroom/dashboard/students");
      return res.data;
    },
    ...CACHE_CONFIG,
  });
};

// Combined hook for homeroom dashboard
export const useHomeroomDashboard = () => {
  const overview = useHomeroomDashboardOverview();
  const classes = useHomeroomDashboardClasses();
  const stats = useHomeroomDashboardStats();
  const students = useHomeroomDashboardStudents();

  const isLoading =
    overview.isLoading ||
    classes.isLoading ||
    stats.isLoading ||
    students.isLoading;

  const error =
    overview.error ||
    classes.error ||
    stats.error ||
    students.error;

  return {
    overview: overview.data,
    classes: classes.data,
    stats: stats.data,
    students: students.data,
    isLoading,
    error,
    isFetching:
      overview.isFetching ||
      classes.isFetching ||
      stats.isFetching ||
      students.isFetching,
  };
};

// ============ UTILITY: Invalidate Queries ============
export const useInvalidateDashboardQueries = (queryClient) => {
  return {
    invalidateStudentDashboard: () =>
      queryClient.invalidateQueries({
        queryKey: ["student-dashboard"],
      }),
    invalidateTutorDashboard: () => {
      queryClient.invalidateQueries({
        queryKey: ["tutor-dashboard-profile"],
      });
      queryClient.invalidateQueries({
        queryKey: ["tutor-dashboard-classes"],
      });
      queryClient.invalidateQueries({
        queryKey: ["tutor-dashboard-recent"],
      });
      queryClient.invalidateQueries({
        queryKey: ["tutor-dashboard-submissions"],
      });
      queryClient.invalidateQueries({
        queryKey: ["tutor-dashboard-stats"],
      });
    },
    invalidateAdminDashboard: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-dashboard-overview"],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-dashboard-classes"],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-dashboard-programs"],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-dashboard-stats"],
      });
    },
    invalidateHomeroomDashboard: () => {
      queryClient.invalidateQueries({
        queryKey: ["homeroom-dashboard-overview"],
      });
      queryClient.invalidateQueries({
        queryKey: ["homeroom-dashboard-classes"],
      });
      queryClient.invalidateQueries({
        queryKey: ["homeroom-dashboard-stats"],
      });
      queryClient.invalidateQueries({
        queryKey: ["homeroom-dashboard-students"],
      });
    },
  };
};
