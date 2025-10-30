declare module '@hubspot/ui-extensions' {
  import * as React from 'react';

  export const hubspot: {
    extend: (callback: (options: { context: unknown; actions: unknown }) => unknown) => void;
  };

  export interface HubSpotUIExtensionComponentProps<T = HTMLElement>
    extends React.HTMLAttributes<T> {
    children?: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    [key: string]: unknown;
  }

  export const Avatar: React.FC<HubSpotUIExtensionComponentProps<HTMLDivElement> & { size?: 'sm' | 'md' | 'lg' }>;
  export const Box: React.FC<HubSpotUIExtensionComponentProps<HTMLDivElement>>;
  export const Button: React.FC<
    HubSpotUIExtensionComponentProps<HTMLButtonElement> & {
      variant?: 'primary' | 'secondary' | 'tertiary' | 'outline';
      icon?: React.ReactNode;
      disabled?: boolean;
      loading?: boolean;
      onClick?: React.MouseEventHandler<HTMLButtonElement>;
    }
  >;
  export const Card: React.FC<HubSpotUIExtensionComponentProps<HTMLDivElement>>;
  export const Divider: React.FC<HubSpotUIExtensionComponentProps<HTMLDivElement>>;
  export const Flex: React.FC<
    HubSpotUIExtensionComponentProps<HTMLDivElement> & {
      align?: string;
      justify?: string;
      gap?: string;
      wrap?: boolean;
    }
  >;
  export const Icon: React.FC<HubSpotUIExtensionComponentProps<HTMLSpanElement> & { name: string }>;
  export const Input: React.FC<
    HubSpotUIExtensionComponentProps<HTMLInputElement> & {
      value?: string;
      placeholder?: string;
      onChange?: React.ChangeEventHandler<HTMLInputElement>;
    }
  >;
  export const Stack: React.FC<HubSpotUIExtensionComponentProps<HTMLDivElement> & { spacing?: string }>;
  export const Tag: React.FC<
    HubSpotUIExtensionComponentProps<HTMLDivElement> & {
      variant?: 'default' | 'outline';
      color?: 'blue' | 'green' | 'red' | string;
    }
  >;
  export const Text: React.FC<HubSpotUIExtensionComponentProps<HTMLSpanElement> & { variant?: string; color?: string }>;
  export const TextArea: React.FC<
    HubSpotUIExtensionComponentProps<HTMLTextAreaElement> & {
      rows?: number;
      value?: string;
      placeholder?: string;
      onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
    }
  >;
  export const Tooltip: React.FC<HubSpotUIExtensionComponentProps<HTMLDivElement> & { content: React.ReactNode }>;
}

declare module '@hubspot/ui-extensions-react' {
  import * as React from 'react';

  export const uiExtensionsReactRenderer: (element: React.ReactElement) => unknown;
}
