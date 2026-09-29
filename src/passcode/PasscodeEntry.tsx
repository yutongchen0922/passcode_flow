import { PasscodeScreen } from './PasscodeScreen';
import { usePasscode } from './usePasscode';

/** The live passcode experience: state from usePasscode, rendered by PasscodeScreen. */
export function PasscodeEntry() {
  const { view, getInputProps, onFieldBlur, onScreenPress } = usePasscode();

  return (
    <PasscodeScreen
      phase={view.phase}
      status={view.status}
      digits={view.digits}
      activeIndex={view.activeIndex}
      getInputProps={getInputProps}
      onFieldBlur={onFieldBlur}
      onScreenPress={onScreenPress}
    />
  );
}
