import * as React from 'react';
import { TextInput } from 'react-native';
import { cn } from '../../lib/utils';

const Input = React.forwardRef(({ className, placeholderClassName, ...props }, ref) => {
  return (
    <TextInput
      ref={ref}
      className={cn(
        'web:flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-base text-foreground web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring',
        props.editable === false && 'opacity-50 web:cursor-not-allowed',
        className
      )}
      placeholderTextColor="#94a3b8"
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
