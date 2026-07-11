import React from "react";
import { getSession } from "@/lib/auth";
import SettingsForm from "@/components/SettingsForm";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ParentSettingsPage() {
  const session = await getSession();
  if (!session || session.role !== "PARENT") {
    redirect("/login");
  }

  const user = {
    name: session.name,
    email: session.email,
    role: session.role,
  };

  return <SettingsForm user={user} backUrl="/parent" />;
}
