export default function VerifyRequestPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 text-center">
      <div className="mb-3 text-5xl">✉️</div>
      <h1 className="text-2xl font-bold">Check your email</h1>
      <p className="mt-2 text-stone-500 dark:text-stone-400">
        A sign-in link is on its way. Click it to enter the Book Club.
      </p>
      <p className="mt-4 text-xs text-stone-400">
        Running locally? The link is printed to the server console.
      </p>
    </div>
  );
}
