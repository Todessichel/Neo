declare module '@heroicons/react/24/outline' {
  import { ComponentType, SVGProps } from 'react';
  
  export interface IconProps extends SVGProps<SVGSVGElement> {
    className?: string;
  }
  
  export const DocumentIcon: ComponentType<IconProps>;
  export const TrashIcon: ComponentType<IconProps>;
} 