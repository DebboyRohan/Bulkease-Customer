"use client";
import LoadingPage from "@/app/loading";
import { useState } from "react";
export default function ProductsPage() {
  const [loading, setLoading] = useState(true);
  return <div>{loading ? <LoadingPage /> : "ProductsPage"}</div>;
}
