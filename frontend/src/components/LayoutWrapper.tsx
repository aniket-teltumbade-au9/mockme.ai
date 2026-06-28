"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "./Navbar";

export const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userId } = useAuth();

  return (
    <>
      <Navbar />
      <main className={userId ? "pt-16" : ""}>
        {children}
      </main>
    </>
  );
};
