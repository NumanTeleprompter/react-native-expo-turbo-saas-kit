import { Redirect, useLocalSearchParams } from 'expo-router';

import { RecordingReview } from '@kit/teleprompter';

export default function ReviewPage() {
  const { uri } = useLocalSearchParams<{ uri: string }>();

  return uri ? <RecordingReview uri={uri} /> : <Redirect href="/" />;
}
