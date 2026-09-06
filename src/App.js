import { useEffect, useMemo, useState } from 'react';
import './App.css';
import VideoPlayer from './components/VideoPlayer';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import {
  useVideos,
  useMarkVideoWatched,
  useMarkVideoUnwatched,
} from './hooks/useVideoApi';

dayjs.extend(relativeTime);

const formatDuration = (seconds) => {
  if (!seconds || typeof seconds !== 'number') return '';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(
      secs
    ).padStart(2, '0')}`;
  }

  return `${minutes}:${String(secs).padStart(2, '0')}`;
};

const getThumbnail = (videoId) =>
  `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

export default function App() {
  /*
   * =========================================================
   * API
   * =========================================================
   */

  const {
    data: videos = [],
    isLoading,
    isError,
    error,
  } = useVideos();

  const markWatched = useMarkVideoWatched();
  const markUnwatched = useMarkVideoUnwatched();

  /*
   * =========================================================
   * STATE
   * =========================================================
   *
   * We only store the ID.
   *
   * DO NOT store the complete video object here.
   *
   * The actual video always comes from React Query.
   */

  const [selectedVideoId, setSelectedVideoId] = useState(null);

  /*
   * =========================================================
   * SELECT FIRST VIDEO
   * =========================================================
   *
   * Once the API returns videos, select the first one.
   */

  useEffect(() => {
    if (!selectedVideoId && videos.length > 0) {
      setSelectedVideoId(videos[0].video_id);
    }
  }, [videos, selectedVideoId]);

  /*
   * =========================================================
   * CURRENT VIDEO
   * =========================================================
   *
   * Derive the current video from the latest API data.
   *
   * This is important because when TanStack Query refreshes
   * the videos after a mutation, this automatically gets
   * the updated video object.
   */

  const currentVideoData = useMemo(() => {
    return videos.find(
      (video) => video.video_id === selectedVideoId
    );
  }, [videos, selectedVideoId]);

  /*
   * =========================================================
   * HANDLERS
   * =========================================================
   */

  const handleVideoSelect = (video) => {
    setSelectedVideoId(video.video_id);
  };

  const handleToggleWatched = () => {
    if (!currentVideoData) return;

    if (currentVideoData.is_watched) {
      markUnwatched.mutate(currentVideoData.video_id);
    } else {
      markWatched.mutate(currentVideoData.video_id);
    }
  };

  /*
   * =========================================================
   * MUTATION STATE
   * =========================================================
   */

  const isUpdatingWatched =
    markWatched.isPending || markUnwatched.isPending;

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (isLoading) {
    return (
      <div className="app-shell">
        <div className="d-flex justify-content-center align-items-center vh-100">
          <div className="text-light">
            Loading videos...
          </div>
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * ERROR
   * =========================================================
   */

  if (isError) {
    return (
      <div className="app-shell">
        <div className="d-flex justify-content-center align-items-center vh-100">
          <div className="text-danger text-center">
            <div>Failed to load videos.</div>

            <small>{error?.message}</small>
          </div>
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * EMPTY STATE
   * =========================================================
   */

  if (!videos.length) {
    return (
      <div className="app-shell">
        <div className="d-flex justify-content-center align-items-center vh-100">
          <div className="text-light">
            No videos available.
          </div>
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * DERIVED DATA
   * =========================================================
   */

  const unwatchedCount = videos.filter(
    (video) => !video.is_watched
  ).length;

  /*
   * =========================================================
   * UI
   * =========================================================
   */

  return (
    <div className="app-shell">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="topbar">
        <div className="container-fluid px-4">
          <div className="d-flex align-items-center justify-content-between">

            <div className="brand">

              <div className="brand-icon">
                <i className="bi bi-play-fill"></i>
              </div>

              <div>
                <div className="brand-name">
                  Anti Distraction tool
                </div>

                <div className="brand-subtitle">
                  Your personal watchlist
                </div>
              </div>

            </div>

            <div className="topbar-stats">

              <div className="stat">
                <span className="stat-value">
                  {videos.length}
                </span>

                <span className="stat-label">
                  Videos
                </span>
              </div>

              <div className="stat">
                <span className="stat-value">
                  {unwatchedCount}
                </span>

                <span className="stat-label">
                  Unwatched
                </span>
              </div>

            </div>

          </div>
        </div>
      </header>


      {/* =====================================================
          MAIN
          ===================================================== */}

      <main className="container-fluid px-4 py-4">

        <div className="row g-4">

          {/* =================================================
              PLAYER
              ================================================= */}

          <div className="col-xl-8">

            <section className="player-section">

              <div className="player-wrapper">

                {currentVideoData && (
                  <VideoPlayer
                    data={currentVideoData}
                  />
                )}

              </div>


              {currentVideoData && (

                <div className="current-video-info">

                  <div className="d-flex align-items-start justify-content-between gap-3">

                    <div className="flex-grow-1">

                      <div className="video-category">
                        <span className="live-dot"></span>
                        NOW PLAYING
                      </div>

                      <h1 className="current-title">
                        {currentVideoData.video_title}
                      </h1>

                      <div className="current-meta">

                        <span>
                          <i className="bi bi-person-circle"></i>
                          {currentVideoData.channel_name}
                        </span>

                        <span className="meta-divider"></span>

                        <span>
                          {dayjs(
                            currentVideoData.published_at
                          ).fromNow()}
                        </span>

                      </div>

                    </div>


                    {/* =================================================
                        WATCHED BUTTON
                        ================================================= */}

                    <button
                      type="button"
                      onClick={handleToggleWatched}
                      disabled={isUpdatingWatched}
                      className="btn btn-outline-light"
                    >
                      {isUpdatingWatched ? (
                        'Updating...'
                      ) : currentVideoData.is_watched ? (
                        'Mark unwatched'
                      ) : (
                        'Mark watched'
                      )}
                    </button>

                  </div>

                </div>

              )}

            </section>

          </div>


          {/* =================================================
              PLAYLIST
              ================================================= */}

          <div className="col-xl-4">

            <section className="playlist-card">

              <div className="playlist-header">

                <div>

                  <div className="playlist-title">
                    Up next
                  </div>

                  <div className="playlist-subtitle">
                    {videos.length} videos in your feed
                  </div>

                </div>

                <button
                  type="button"
                  className="filter-btn"
                >
                  <i className="bi bi-sliders"></i>
                </button>

              </div>


              <div className="video-list">

                {videos.map((video, index) => {

                  const isActive =
                    selectedVideoId === video.video_id;

                  return (

                    <button
                      type="button"
                      className={`video-item ${
                        isActive ? 'active' : ''
                      } ${
                        video.is_watched ? 'watched' : ''
                      }`}
                      key={video.video_id}
                      onClick={() =>
                        handleVideoSelect(video)
                      }
                    >

                      {/* Thumbnail */}

                      <div className="thumbnail-wrapper">

                        <img
                          src={getThumbnail(video.video_id)}
                          alt={video.video_title}
                          className="video-thumbnail"
                        />

                        <span className="duration-badge">
                          {formatDuration(
                            video.duration_in_sec
                          )}
                        </span>

                        {isActive && (
                          <div className="playing-overlay">
                            <i className="bi bi-play-fill"></i>
                          </div>
                        )}

                      </div>


                      {/* Content */}

                      <div className="video-content">

                        <div className="video-item-top">

                          <span className="video-index">
                            {String(index + 1).padStart(2, '0')}
                          </span>

                          {video.is_watched && (

                            <span className="watched-badge">

                              <i className="bi bi-check2"></i>

                              Watched

                            </span>

                          )}

                        </div>


                        <h3 className="video-item-title">
                          {video.video_title}
                        </h3>


                        <div className="video-item-meta">

                          <span>
                            {video.channel_name}
                          </span>

                          <span>•</span>

                          <span>
                            {dayjs(
                              video.published_at
                            ).fromNow()}
                          </span>

                        </div>

                      </div>

                    </button>

                  );
                })}

              </div>

            </section>

          </div>

        </div>

      </main>

    </div>
  );
}

