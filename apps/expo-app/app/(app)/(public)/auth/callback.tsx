import { useEffect } from 'react';
import { Platform } from 'react-native';

import * as Linking from 'expo-linking';
import { router } from 'expo-router';

import { getAuthLinkType, useCreateSessionFromUrl } from '@kit/auth';
import { LoadingOverlay } from '@kit/ui';

export default function CallbackPage() {
  const createSessionFromUrl = useCreateSessionFromUrl();
  const url = Linking.useURL();

  useEffect(() => {
    (async () => {
      if (!url || !url.includes('callback')) {
        return;
      }

      try {
        // On web, `useURL` drops the `#access_token=...` fragment, so read
        // the real browser URL instead.
        const link = Platform.OS === 'web' ? window.location.href : url;
        const session = await createSessionFromUrl(link);

        if (session) {
          // Password recovery links land on the account settings, where the
          // user can set a new password.
          return router.replace(
            getAuthLinkType(link) === 'recovery' ? '/settings/account' : '/',
          );
        }
      } catch (error) {
        console.error(error);

        router.push('/auth/error');
      }
    })();
  }, [createSessionFromUrl, url]);

  return <LoadingOverlay size="large">Signing you in...</LoadingOverlay>;
}
