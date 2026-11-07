'use client';

import { FluentProvider, webDarkTheme } from '@fluentui/react-components';

export default function FluentClientProvider({ children }) {
  return (
    <FluentProvider theme={webDarkTheme} className="min-h-screen flex flex-col justify-between">
      {children}
    </FluentProvider>
  );
}
