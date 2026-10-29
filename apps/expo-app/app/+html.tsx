import { type PropsWithChildren } from 'react';

import { ScrollViewStyleReset } from 'expo-router/html';

/**
 * This file is web-only and used to configure the root HTML for every web page during static rendering.
 * The contents of this function only run in Node.js environments and do not have access to the DOM or browser APIs.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        {/*
          Supabase can send auth links (e.g. a password recovery email sent from Studio) to the site root with the
          tokens in the URL fragment. The router would redirect and drop the fragment, so forward the link to the
          callback route before any app code runs.
        */}
        <script dangerouslySetInnerHTML={{ __html: forwardAuthLinkScript }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}

const forwardAuthLinkScript = `
(function () {
  var hash = window.location.hash;
  if (
    hash.indexOf('access_token=') !== -1 &&
    window.location.pathname.indexOf('/auth/callback') !== 0
  ) {
    window.history.replaceState(null, '', '/auth/callback' + hash);
  }
})();`;

const responsiveBackground = `
body {
  background-color: #fff;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #000;
  }
}`;
