import React, { useEffect, useState } from 'react';
import { Image, type ImageStyle, type StyleProp, type ImageResizeMode } from 'react-native';

/** Shown for stories with no picture (or one that fails to load): the Canada247 logo card, same as the web. */
export const FALLBACK_ARTICLE_IMAGE = require('../../assets/article-fallback.jpg');

interface Props {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  resizeMode?: ImageResizeMode;
}

export default function ArticleImage({ uri, style, resizeMode = 'cover' }: Props) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);

  return (
    <Image
      source={uri && !failed ? { uri } : FALLBACK_ARTICLE_IMAGE}
      style={[{ width: '100%', height: '100%' }, style]}
      resizeMode={resizeMode}
      onError={() => setFailed(true)}
    />
  );
}
