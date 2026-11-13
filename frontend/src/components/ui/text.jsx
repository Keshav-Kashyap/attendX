import * as React from 'react';
import { Text as RNText, Platform } from 'react-native';
import * as Slot from '@rn-primitives/slot';
import { cn } from '../../lib/utils';

const TextClassContext = React.createContext(undefined);

const FONT_WEIGHTS = [
  ['font-black', 'Inter_800ExtraBold'],
  ['font-extrabold', 'Inter_800ExtraBold'],
  ['font-bold', 'Inter_700Bold'],
  ['font-semibold', 'Inter_600SemiBold'],
  ['font-medium', 'Inter_500Medium'],
];

const Text = React.forwardRef(({ className, style, asChild = false, ...props }, ref) => {
  const textClass = React.useContext(TextClassContext);
  const Component = asChild ? Slot.Text : RNText;
  const resolvedClasses = cn('text-base text-foreground web:select-text', textClass, className);
  const classTokens = new Set(resolvedClasses.split(/\s+/));
  const matchedFont = FONT_WEIGHTS.find(([cls]) => classTokens.has(cls));
  const customFontFamily = matchedFont ? matchedFont[1] : 'Inter_400Regular';

  const platformStyle = Platform.select({
    web: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    default: {
      fontFamily: customFontFamily,
    },
  });

  return (
    <Component
      className={resolvedClasses}
      style={[platformStyle, style]}
      ref={ref}
      {...props}
    />
  );
});
Text.displayName = 'Text';

export { Text, TextClassContext };
