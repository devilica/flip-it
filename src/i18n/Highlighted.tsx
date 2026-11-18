import { AppText } from '@/components/ui/AppText';
import { palette } from '@/theme';

/** Renders `{name}` tokens from a translated sentence in gold. */
export function Highlighted({
  template,
  words,
  size = 13,
}: {
  template: string;
  words: Record<string, string>;
  size?: number;
}) {
  const parts = template.split(/(\{[a-zA-Z]+\})/g);
  return (
    <AppText size={size} weight="semibold" align="center">
      {parts.map((part, index) => {
        const match = /^\{([a-zA-Z]+)\}$/.exec(part);
        const word = match ? words[match[1]] : undefined;
        if (!word) return part;
        return (
          <AppText key={index} size={size} weight="bold" color={palette.gold}>
            {word}
          </AppText>
        );
      })}
    </AppText>
  );
}
