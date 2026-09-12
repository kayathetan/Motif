import { Show, RedirectToSignIn, ClerkLoading, ClerkLoaded } from '@clerk/react'

/**
 * Gate for the in-app pages.
 *
 * Clerk Core 3 (@clerk/react v6) dropped <SignedIn>/<SignedOut> in favour of
 * <Show when="signed-in" | "signed-out">.
 *
 * ClerkLoading holds the first paint until the session resolves, otherwise a
 * signed-in user gets bounced to sign-in for a frame on a hard refresh.
 */
export default function Protected({ children }) {
  return (
    <>
      <ClerkLoading>
        <div className="authwait">Checking your session…</div>
      </ClerkLoading>
      <ClerkLoaded>
        <Show when="signed-in">{children}</Show>
        <Show when="signed-out"><RedirectToSignIn /></Show>
      </ClerkLoaded>
    </>
  )
}
