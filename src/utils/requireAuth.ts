/**
 * If the user is signed in, run the action immediately. Otherwise ask them to
 * sign in through the in-app SignInRequired sheet (mounted once in App.tsx).
 * It is an in-app sheet rather than Alert.alert because Alert does nothing on
 * react-native-web, which left buttons like "post" looking dead in the browser.
 */
type SignInRequiredListener = () => void;

let listener: SignInRequiredListener | null = null;

export function setSignInRequiredListener(next: SignInRequiredListener | null) {
  listener = next;
}

export function requireAuth(
  user: { email: string } | null,
  _navigation: unknown,
  action: () => void,
) {
  if (user) {
    action();
    return;
  }
  listener?.();
}
