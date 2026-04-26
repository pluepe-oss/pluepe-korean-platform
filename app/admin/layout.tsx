import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "./_admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("users")
    .select("role, academy_id, name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/auth");
  if (profile.role !== "admin" && profile.role !== "master") {
    redirect("/my");
  }

  let academyName: string | null = null;
  if (profile.academy_id) {
    const { data: academy } = await supabase
      .from("academies")
      .select("name")
      .eq("id", profile.academy_id)
      .maybeSingle();
    academyName = academy?.name ?? null;
  }

  const userLabel = profile.name ?? profile.email ?? user.email ?? "관리자";

  return (
    <div className="min-h-dvh bg-gray-50">
      <AdminNav
        academyName={academyName}
        userLabel={userLabel}
        userRole={profile.role as "admin" | "master" | "student"}
      />
      <div className="md:pl-56">{children}</div>
    </div>
  );
}
