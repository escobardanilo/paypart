"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <div className="standalone-state"><span>Error</span><h1>Something went wrong</h1><p>The application could not load this view. No financial operation was performed.</p><button className="button primary" onClick={() => reset()}>Try again</button></div>;
}

