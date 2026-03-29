"use client";

import { useEffect, useRef } from "react";

export default function RecordProfileView({ subjectLogin }: { subjectLogin: string }) {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    void fetch("/api/profile/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectLogin }),
    });
  }, [subjectLogin]);

  return null;
}
