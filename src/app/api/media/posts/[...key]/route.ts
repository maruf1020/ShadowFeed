import { getPostImageFromR2 } from "@/lib/media";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const objectKey = key.map((segment) => decodeURIComponent(segment)).join("/");

  if (!objectKey) {
    return Response.json({ error: "Missing media key." }, { status: 400 });
  }

  const result = await getPostImageFromR2(objectKey);

  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  const headers = new Headers({
    "Content-Type": result.contentType,
    "Cache-Control": result.cacheControl,
  });

  if (result.etag) {
    headers.set("ETag", result.etag);
  }

  if (result.lastModified) {
    headers.set("Last-Modified", result.lastModified);
  }

  return new Response(result.body, {
    status: result.status,
    headers,
  });
}