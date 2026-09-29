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
      tileIndex={view.tileIndex}
      tileVisible={view.tileVisible}
      nudge={view.nudge}
      rewinding={view.rewinding}
      hintVisible={view.hintVisible}
      getInputProps={getInputProps}
      onFieldBlur={onFieldBlur}
      onScreenPress={onScreenPress}
    />
  );
}
