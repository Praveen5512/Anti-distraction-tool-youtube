
import { useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime"
import "../css/VideoPlayer.css";
dayjs.extend(relativeTime);

const VideoPlayer = ({ data }) => {
  const [isReadMore, setIsReadMore] = useState(false);

  const description = data.description || "";
  const shouldTrim = description.length > 250;
  const trimmedDesc = description.slice(0, 250);

  
  console.log(document.getElementById('player'));
  

  return (
    <div>
      <iframe id="player"
        className="video-player"
        src={`https://www.youtube.com/embed/${data.video_id}`}
        title={data.video_title}
        allowFullScreen
      />

      <div>
        <h4>{data.video_title}</h4>

        <p>
          {isReadMore || !shouldTrim ? description : `${trimmedDesc}... `}

          {shouldTrim && (
            <small
              type="button"
              className="expandDesc"
              onClick={() => setIsReadMore((prev) => !prev)}
            >
              {isReadMore ? "Show Less" : "Read More"}
            </small>
          )}
        </p>

       

        
      </div>
    </div>
  );
};

export default VideoPlayer;
