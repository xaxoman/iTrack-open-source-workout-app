interface ExerciseVideoProps {
  url: string;
  /** Accessible title for the embed. */
  title: string;
}

/** Extract the 11-char video id from any common YouTube URL shape. */
function getYouTubeVideoId(url: string) {
  const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/);
  return match && match[2].length === 11 ? match[2] : null;
}

const isImageOrGif = (url: string) => /\.(gif|jpe?g|tiff?|png|webp|bmp)(\?.*)?$/i.test(url);

/** Full-width 16:9 demo: a looping, muted YouTube embed or an image/GIF. */
export function ExerciseVideo({ url, title }: ExerciseVideoProps) {
  if (!url) return null;

  const frame = 'aspect-video w-full overflow-hidden rounded-xl bg-gray-900';

  if (isImageOrGif(url)) {
    return (
      <div className={`${frame} flex items-center justify-center`}>
        <img src={url} alt={title} className="h-full w-full object-contain" />
      </div>
    );
  }

  const videoId = getYouTubeVideoId(url);
  const src = videoId
    ? `https://www.youtube.com/embed/${videoId}?${new URLSearchParams({
        origin: window.location.origin,
        autoplay: '1',
        mute: '1',
        loop: '1',
        playlist: videoId,
        playsinline: '1',
      }).toString()}`
    : url;

  return (
    <div className={frame}>
      <iframe
        className="h-full w-full"
        src={src}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
