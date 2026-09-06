import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const API_ROOT =
  "https://script.google.com/macros/s/AKfycbwTZaX6NOe3T5zizw-0pRbmQSrP0V54MZ_QSrt-xCw8Wjjb7b-6WGJ3JjljIxwgizcaAQ/exec";

/**
 * Build API URL
 */
const buildUrl = (criteria, params = {}) => {
  const searchParams = new URLSearchParams({
    criteria,
    ...params,
  });

  return `${API_ROOT}?${searchParams.toString()}`;
};

/**
 * Generic GET request
 */
const getRequest = async (criteria, params = {}) => {
  const url = buildUrl(criteria, params);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
};

/**
 * Generic POST request
 */
const postRequest = async (criteria, params = {}) => {
  const url = buildUrl(criteria, params);

  const response = await fetch(url, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
};


/* =========================================================
   API METHODS
   ========================================================= */

const api = {
  /**
   * Get all videos
   */
  getAllVideos: () => {
    return getRequest("all_data");
  },

  /**
   * Mark video as watched
   */
  markVideoWatched: (videoId) => {
    return postRequest("update_video_watched", {
      video_id: videoId,
    });
  },

  /**
   * Mark video as unwatched
   */
  markVideoUnwatched: (videoId) => {
    return postRequest("update_video_unwatched", {
      video_id: videoId,
    });
  },
};


/* =========================================================
   REACT QUERY HOOKS
   ========================================================= */

/**
 * Fetch all videos
 */
export const useVideos = () => {
  return useQuery({
    queryKey: ["videos"],
    queryFn: api.getAllVideos,
  });
};


/**
 * Mark video watched
 */
export const useMarkVideoWatched = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.markVideoWatched,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["videos"],
      });
    },
  });
};


/**
 * Mark video unwatched
 */
export const useMarkVideoUnwatched = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.markVideoUnwatched,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["videos"],
      });
    },
  });
};