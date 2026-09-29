import { PasscodeScreen } from './PasscodeScreen';
import { usePasscode } from './usePasscode';

/** The live passcode experience: state from usePasscode, rendered by PasscodeScreen. */
export function PasscodeEntry() {
  const { view, getInputProps, onFieldBlur, onScreenPress } = usePasscode();

  return (
    <PasscodeScreen
      view={view}
      getInputProps={getInputProps}
      onFieldBlur={onFieldBlur}
      onScreenPress={onScreenPress}
    />
  );
}
