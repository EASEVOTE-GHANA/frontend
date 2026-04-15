import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerApiClient } from "@/lib/api-client";
import BlogEditor from "@/components/super-admin/blogs/BlogEditor";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditBlogPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const apiClient = createServerApiClient(session?.accessToken);
  
  const res = await apiClient.get(`/blogs/admin/${params.id}`).catch(() => null);
  const blog = res?.data;

  if (!blog) {
    return notFound();
  }

  return (
    <div className="py-10">
      <BlogEditor blog={blog} />
    </div>
  );
}
