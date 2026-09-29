import { PasscodeEntry } from './passcode/PasscodeEntry';
import { Preview, isPreviewName } from './preview/Preview';

export function App() {
  const preview = new URLSearchParams(window.location.search).get('preview');
  if (preview && isPreviewName(preview)) return <Preview name={preview} />;
  return <PasscodeEntry />;
}
