import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerApiClient } from "@/lib/api-client";
import BlogEditor from "@/components/super-admin/blogs/BlogEditor";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditBlogPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  const apiClient = createServerApiClient(session?.accessToken);
  
  let blog = null;
  let errorMsg = "";
  try {
    const res = await apiClient.get(`/blogs/admin/${params.id}`);
    blog = res.data || res;
  } catch (err: any) {
    errorMsg = err.message || "Unknown error occurred";
  }

  if (!blog) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Failed to load blog</h2>
        <p className="text-slate-600">ID requested: {params.id}</p>
        <p className="text-slate-600 font-mono mt-2 bg-slate-100 p-2 rounded">Error: {errorMsg}</p>
      </div>
    );
  }

  return (
    <div className="py-10">
      <BlogEditor blog={blog} />
    </div>
  );
}
