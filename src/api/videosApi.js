// Central place for every network call the app makes.
// Keeping these as plain functions (rather than inline in components)
// means the TanStack Query hooks stay thin and the URLs live in one file.

const GET_ALL_VIDEOS_URL =
  'https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnQtV-ce26aQIegmLccPenvjS6yVVPcF0-CUucRhz7TGsV5qmBpggiuU0JujiLyy7Efs4HGSX79SKD4hWl4yZuu5gMtn3-DiHMtYppLu_0AJpdJWE6KFiuhMx-K2nQRdogRkomAB0P5J0YA4WwE4FGDIQ0WWETtGi6ZQXXEVkl1wkrBu-tfvzW8bRbJ9pCrrYUeGUceEu_8I2iwTIqwSJTv5ngNdypy-xk9G3jI8_kmsU9LYG4VhkuXIWozFMHR_fHusxemOSe6METpOBfH6sn3Mw_JF08sjIUbjE9sThmGd6MD5IA8&lib=MYfbXhUS11rcYao_DC9wc_8vZhT41KBVb';

const MUTATE_BASE_URL =
  'https://script.google.com/macros/s/AKfycbwTZaX6NOe3T5zizw-0pRbmQSrP0V54MZ_QSrt-xCw8Wjjb7b-6WGJ3JjljIxwgizcaAQ/exec';

/**
 * Fetches the full video queue.
 * @returns {Promise<Array>} list of video objects
 */
export async function fetchVideos() {
  const res = await fetch(GET_ALL_VIDEOS_URL);
  if (!res.ok) {
    throw new Error(`Failed to load videos (status ${res.status})`);
  }
  return res.json();
}

/**
 * Flips a video's watched state on the backend.
 * @param {string} videoId
 * @param {boolean} watched - true to mark watched, false to mark unwatched
 */
export async function setVideoWatched(videoId, watched) {
  const criteria = watched ? 'update_video_watched' : 'update_video_unwatched';
  const url = `${MUTATE_BASE_URL}?criteria=${criteria}&video_id=${encodeURIComponent(videoId)}`;
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) {
    throw new Error(`Failed to update video (status ${res.status})`);
  }
  return res;
}
