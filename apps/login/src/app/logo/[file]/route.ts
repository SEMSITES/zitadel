import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

const allowedLogoFiles = new Set(["semsites-logo-icon-colour.png"]);

type Props = {
  params: Promise<{ file: string }>;
};

export async function GET(_request: Request, props: Props) {
  const { file } = await props.params;

  if (!allowedLogoFiles.has(file)) {
    return new NextResponse("Not found", {
      status: 404,
      headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" },
    });
  }

  for (const logoPath of logoPathCandidates(file)) {
    try {
      const logo = await readFile(logoPath);

      return new NextResponse(new Uint8Array(logo), {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=31536000, immutable",
          "Content-Type": "image/png",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch {
      // Try the next runtime layout. Standalone Docker and local dev resolve public/ differently.
    }
  }

  return new NextResponse("Not found", {
    status: 404,
    headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" },
  });
}

function logoPathCandidates(file: string) {
  return [
    join(process.cwd(), "public", "logo", file),
    join(process.cwd(), "apps", "login", "public", "logo", file),
  ];
}
