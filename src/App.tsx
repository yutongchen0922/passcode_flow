import { devFlags } from './devFlags';
import { PasscodeEntry } from './passcode/PasscodeEntry';
import { Preview, isPreviewName } from './preview/Preview';

export function App() {
  // `import.meta.env.DEV` is a build-time constant, so production drops the previews entirely.
  if (import.meta.env.DEV && devFlags.preview && isPreviewName(devFlags.preview)) {
    return <Preview name={devFlags.preview} />;
  }
  return <PasscodeEntry />;
}
