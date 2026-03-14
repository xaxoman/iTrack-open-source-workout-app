import React from 'react';

interface ExerciseVideoProps {
  url: string;
}

export function ExerciseVideo({ url }: ExerciseVideoProps) {
  // Extract video ID from YouTube URL
  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const isImageOrGif = (url: string) => {
    return /\.(gif|jpe?g|tiff?|png|webp|bmp)(\?.*)?$/i.test(url);
  };

  const videoId = getYouTubeVideoId(url);

  if (!url) return null;

  if (isImageOrGif(url)) {
    return (
      <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex justify-center items-center">
        <img src={url} alt="Exercise demonstration" className="w-full h-full object-contain" />
      </div>
    );
  }

  if (videoId) {
    return (
      <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?origin=${window.location.origin}&autoplay=1&mute=1`}
          title="Exercise demonstration"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // For non-YouTube URLs, still show an iframe
  return (
    <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
      <iframe
        className="w-full h-full"
        src={url}
        title="Exercise demonstration"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}