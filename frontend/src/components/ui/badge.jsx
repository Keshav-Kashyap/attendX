import * as React from 'react';
import { View } from 'react-native';
import { cva } from 'class-variance-authority';
import * as Slot from '@rn-primitives/slot';
import { cn } from '../../lib/utils';
import { TextClassContext } from './text';

const badgeVariants = cva(
  'web:inline-flex items-center rounded-full border border-border px-2.5 py-0.5 web:transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary',
        secondary: 'border-transparent bg-secondary',
        destructive: 'border-transparent bg-destructive',
        outline: 'border-border bg-transparent',
        success: 'border-transparent bg-emerald-100',
        warning: 'border-transparent bg-amber-100',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const badgeTextVariants = cva('text-xs font-semibold', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      destructive: 'text-destructive-foreground',
      outline: 'text-foreground',
      success: 'text-emerald-800',
      warning: 'text-amber-800',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

function Badge({ className, variant, asChild = false, ...props }) {
  const Component = asChild ? Slot.View : View;
  return (
    <TextClassContext.Provider value={badgeTextVariants({ variant })}>
      <Component className={cn(badgeVariants({ variant }), className)} {...props} />
    </TextClassContext.Provider>
  );
}

export { Badge, badgeTextVariants, badgeVariants };
