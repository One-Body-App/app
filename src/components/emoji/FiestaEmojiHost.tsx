import React, { useEffect, useRef, useState } from 'react';
import { type SkFont } from '@shopify/react-native-skia';
import { EmojiPopper, type PopperHandler } from 'react-native-fiesta';
import { FiestaEmojiEvent, subscribeFiestaEmojiQueue } from './fiestaQueue';

type Props = {
  font: SkFont | null;
  defaultEmojis?: string[];
};

const DEFAULT_EMOJIS = ['🙏', '✨', '❤️', '🙌', '🕊️'];

function FiestaEmojiHost({ font, defaultEmojis = DEFAULT_EMOJIS }: Props) {
  const popperRef = useRef<PopperHandler>(null);
  const [activeEmojis, setActiveEmojis] = useState(defaultEmojis);

  useEffect(() => {
    const unsubscribe = subscribeFiestaEmojiQueue((event: FiestaEmojiEvent) => {
      setActiveEmojis(event.emojis && event.emojis.length > 0 ? event.emojis : defaultEmojis);
      requestAnimationFrame(() => {
        popperRef.current?.start({
          theme: event.theme,
          direction: event.direction,
        });
      });
    });

    return () => {
      unsubscribe();
    };
  }, [defaultEmojis]);

  if (!font) {
    return null;
  }

  return <EmojiPopper ref={popperRef} font={font} emojis={activeEmojis} autoPlay={false} />;
}

export default FiestaEmojiHost;
