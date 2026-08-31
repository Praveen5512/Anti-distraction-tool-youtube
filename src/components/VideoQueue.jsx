
import { useEffect, useState } from "react";

const DEFAULT_ENDPOINT ="";

function cleanDescription(description) {
  if (!description) return "";

  const firstLine = description.split(/\r?\n/)[0];

  return firstLine
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function relativeDate(date) {
  if (!date) return "";

  const days = Math.floor(
    (Date.now() - new Date(date).getTime()) / 86400000
  );

  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;

  return `${Math.floor(days / 365)} years ago`;
}

function normalizeVideo(video) {
  const id = video["Video ID"] || video.id || video.videoId;

  return {
    id,
    title: video.Title || video.title || "Untitled",
    url:
      video["Video URL"] ||
      video.url ||
      `https://www.youtube.com/watch?v=${id}`,
    publishedAt: video["Published At"] || video.publishedAt,
    description: cleanDescription(
      video.Description || video.description || ""
    ),
    watchedDefault:
      String(video.watched || "NO").toUpperCase() === "YES",
  };
}

export default function VideoQueue() {
  const [videos, setVideos] = useState([]);
  const [watchedMap, setWatchedMap] = useState({});
  const [query, setQuery] = useState("");
  const [selectedVideoId, setSelectedVideoId] = useState(null);

  const [showQueue, setShowQueue] = useState(false);
  const [showWatched, setShowWatched] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [endpoint, setEndpoint] = useState(
    localStorage.getItem("videoQueueEndpoint") || DEFAULT_ENDPOINT
  );

  const [endpointDraft, setEndpointDraft] = useState(endpoint);

  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  // Load videos
  useEffect(() => {
    fetchVideos(endpoint);
  }, []);

  // Load watched status when videos change
  useEffect(() => {
    const savedWatched = {};

    videos.forEach((video) => {
      const saved = localStorage.getItem(`watched:${video.id}`);

      if (saved !== null) {
        savedWatched[video.id] = saved === "true";
      }
    });

    setWatchedMap(savedWatched);
  }, [videos]);

  async function fetchVideos(url = endpoint) {
    setStatus("loading");
    setError("");

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch videos");
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid data received");
      }

      const normalizedVideos = data
        .map(normalizeVideo)
        .sort(
          (a, b) =>
            new Date(b.publishedAt || 0) -
            new Date(a.publishedAt || 0)
        );

      setVideos(normalizedVideos);
      setStatus("success");
    } catch (err) {
      console.error(err);
      setError("Unable to load videos. Please check your feed endpoint.");
      setStatus("error");
    }
  }

  function setWatched(id, value) {
    setWatchedMap((previous) => ({
      ...previous,
      [id]: value,
    }));

    localStorage.setItem(`watched:${id}`, String(value));

    // If the current featured video is marked watched,
    // reset selection so the next unwatched video appears.
    if (value && selectedVideoId === id) {
      setSelectedVideoId(null);
    }
  }

  function isWatched(video) {
    if (watchedMap[video.id] !== undefined) {
      return watchedMap[video.id];
    }

    return video.watchedDefault;
  }

  const unwatchedVideos = videos.filter(
    (video) => !isWatched(video)
  );

  const watchedVideos = videos.filter(
    (video) => isWatched(video)
  );

  const filteredVideos = unwatchedVideos.filter((video) =>
    video.title.toLowerCase().includes(query.toLowerCase())
  );

  const selectedVideo =
    filteredVideos.find(
      (video) => video.id === selectedVideoId
    ) ||
    filteredVideos[0] ||
    unwatchedVideos[0] ||
    null;

  const remainingVideos = filteredVideos.filter(
    (video) => video.id !== selectedVideo?.id
  );

  function saveEndpoint() {
    const newEndpoint = endpointDraft.trim();

    if (!newEndpoint) return;

    setEndpoint(newEndpoint);
    localStorage.setItem("videoQueueEndpoint", newEndpoint);

    setShowSettings(false);

    fetchVideos(newEndpoint);
  }

  return (
    <div className="container py-4 py-md-5 ">
      <div className="row justify-content-center">
        <div className="col-lg-8">

          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h1 className="mb-0">Queue</h1>

            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              ⚙ Settings
            </button>
          </div>

          <p className="text-light mb-4">
            {unwatchedVideos.length} waiting,{" "}
            {watchedVideos.length} watched
          </p>


          {/* Settings */}
          {showSettings && (
            <div className="card mb-4 bg-dark text-light border-light">
              <div className="card-body">

                <label className="form-label">
                  Feed endpoint
                </label>

                <input
                  type="text"
                  className="form-control mb-3 bg-dark text-light"
                  value={endpointDraft}
                  onChange={(e) =>
                    setEndpointDraft(e.target.value)
                  }
                  placeholder="Apps Script /exec URL"
                />

                <div className="d-flex gap-2 flex-wrap">

                  <button
                    className="btn btn-primary"
                    onClick={saveEndpoint}
                  >
                    Save & Reload
                  </button>

                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => fetchVideos(endpoint)}
                  >
                    ↻ Retry
                  </button>

                </div>

              </div>
            </div>
          )}


          {/* Loading */}
          {status === "loading" && (
            <div className="text-center py-5">

              <div
                className="spinner-border"
                role="status"
              >
                <span className="visually-hidden">
                  Loading...
                </span>
              </div>

              <p className="text-light mt-3">
                Loading videos...
              </p>

            </div>
          )}


          {/* Error */}
          {status === "error" && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}


          {/* Featured Video */}
          {status === "success" && selectedVideo && (
            <div className="card mb-4 bg-dark text-light">

              <div className="ratio ratio-16x9 bg-dark">

                <iframe
                  key={selectedVideo.id}
                  src={`https://www.youtube.com/embed/${selectedVideo.id}?rel=0`}
                  title={selectedVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />

              </div>

              <div className="card-body">

                <p className="text-primary small fw-semibold mb-2">
                  NEXT UP
                </p>

                <h3 className="card-title">
                  {selectedVideo.title}
                </h3>

                <p className="text-light small">
                  {relativeDate(selectedVideo.publishedAt)}
                </p>


                {selectedVideo.description && (
                  <p className="card-text">
                    {selectedVideo.description}
                  </p>
                )}


                <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap mt-3">

                  <a
                    href={selectedVideo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-secondary"
                  >
                    Watch on YouTube ↗
                  </a>


                  <button
                    className="btn btn-success"
                    onClick={() =>
                      setWatched(selectedVideo.id, true)
                    }
                  >
                    ✓ Mark watched
                  </button>

                </div>

              </div>

            </div>
          )}


          {/* Empty Queue */}
          {status === "success" &&
            unwatchedVideos.length === 0 && (
              <div className="alert alert-secondary">
                Nothing waiting. You're all caught up!
              </div>
            )}


          {/* Search */}
          {status === "success" &&
            unwatchedVideos.length > 1 && (
              <div className="mb-4 bg-dark text-light">

                <input
                  type="text"
                  className="form-control"
                  placeholder="Search queue..."
                  value={query}
                  onChange={(e) =>
                    setQuery(e.target.value)
                  }
                />

              </div>
            )}


          {/* Rest of Queue */}
          {status === "success" &&
            remainingVideos.length > 0 && (
              <div className="mb-4 ">

                <button
                  className="btn btn-outline-secondary w-100 text-start"
                  onClick={() =>
                    setShowQueue(!showQueue)
                  }
                >
                  {showQueue ? "⌃ Hide" : "⌄ Show"} rest of
                  queue ({remainingVideos.length})
                </button>


                {showQueue && (
                  <div className="list-group mt-2 ">

                    {remainingVideos.map((video) => (
                      <div
                        key={video.id}
                        className="list-group-item d-flex justify-content-between align-items-start gap-3 bg-dark text-light"
                      >

                        <div className="flex-grow-1">

                          <button
                            className="btn btn-link p-0 text-start text-decoration-none fw-semibold"
                            onClick={() => {
                              setSelectedVideoId(video.id);

                              window.scrollTo({
                                top: 0,
                                behavior: "smooth",
                              });
                            }}
                          >
                            {video.title}
                          </button>

                          <div className=" small text-light mt-1">
                            {relativeDate(
                              video.publishedAt
                            )}
                          </div>

                        </div>


                        <button
                          className="btn btn-outline-success btn-sm"
                          onClick={() =>
                            setWatched(video.id, true)
                          }
                        >
                          ✓
                        </button>

                      </div>
                    ))}

                  </div>
                )}

              </div>
            )}


          {/* Watched Videos */}
          {status === "success" &&
            watchedVideos.length > 0 && (
              <div className="mt-5">

                <button
                  className="btn btn-outline-secondary w-100 text-start"
                  onClick={() =>
                    setShowWatched(!showWatched)
                  }
                >
                  {showWatched ? "⌃ Hide" : "⌄ Show"} watched
                  ({watchedVideos.length})
                </button>


                {showWatched && (
                  <div className="list-group mt-2">

                    {watchedVideos.map((video) => (
                      <div
                        key={video.id}
                        className="list-group-item d-flex justify-content-between align-items-center gap-3"
                      >

                        <span className="text-light text-decoration-line-through">
                          {video.title}
                        </span>


                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() =>
                            setWatched(video.id, false)
                          }
                        >
                          ↻ Undo
                        </button>

                      </div>
                    ))}

                  </div>
                )}

              </div>
            )}


          {/* Footer */}
          {status === "success" && (
            <div className="text-center text-light small mt-5">
              ✓ Synced with your feed
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

