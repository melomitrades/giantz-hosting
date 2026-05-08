"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

export default function Home() {
  const router = useRouter();
  const { currentUser } = useApp();

  useEffect(() => {
    if (currentUser.role === "gom") {
      router.replace("/gom/orders");
    } else {
      router.replace("/joiner/orders");
    }
  }, [currentUser.role, router]);

  return null;
}
