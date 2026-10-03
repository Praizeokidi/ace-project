export default function EmailOnlyMode() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          ACE Data Protection Consulting
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">
          Email-only submission mode
        </h1>
        <p className="mt-4 text-base leading-7 text-gray-600">
          Priority-list, training and consultation requests are currently sent
          directly to the ACE team by email for follow-up.
        </p>
        <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm leading-6 text-blue-900">
          The online submission dashboard is not enabled at this stage. A
          database-backed dashboard can be added in a future phase.
        </div>
        <p className="mt-6 text-sm leading-6 text-gray-500">
          Public website forms remain available through the main ACE website.
        </p>
        <a
          className="mt-8 inline-flex min-h-11 items-center rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          href="https://ace-main-kappa.vercel.app/"
        >
          Return to ACE website
        </a>
      </div>
    </main>
  );
}
