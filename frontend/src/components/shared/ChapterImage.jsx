import React from 'react';

export default function ChapterImage({ chapter, className = "" }) {
  return (
    <img
      className={`chapter-image ${className}`}
      src={chapter.image}
      alt={`${chapter.name} thumbnail`}
      loading="lazy"
      decoding="async"
      draggable="false"
    />
  );
}

