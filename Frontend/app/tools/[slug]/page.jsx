import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Container from "@/components/ui/Container";
import PageHeader from "@/components/ui/PageHeader";
import ToolLoader from "@/components/tools/ToolLoader";
import ToolStatusBadge from "@/components/tools/ToolStatusBadge";
import { getTool, isToolOpenable, tools } from "@/lib/tools";
import { buildMetadata } from "@/lib/seo";

// Only slugs from the registry exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return tools.filter(isToolOpenable).map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};

  return buildMetadata({
    title: tool.name,
    description: tool.description,
    path: `/tools/${tool.slug}`,
    keywords: tool.keywords,
  });
}

export default async function ToolPage({ params }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool || !isToolOpenable(tool)) notFound();

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <Navbar />

      <main className="flex-1">
        <Container className="pb-16 pt-8 sm:pt-10">
          <nav aria-label="Breadcrumb">
            <Link
              href="/tools"
              className="focus-ring -ml-1 inline-flex items-center gap-1 rounded-md px-1 py-1 text-sm text-muted transition hover:text-fg"
            >
              <ChevronLeft size={16} aria-hidden="true" />
              All tools
            </Link>
          </nav>

          <div className="mb-6 mt-4 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <PageHeader
              align="left"
              kicker="Tool"
              icon={tool.icon}
              title={tool.name}
              description={tool.description}
              className="max-w-2xl"
            />
            <ToolStatusBadge status={tool.status} className="self-start sm:self-auto" />
          </div>

          <section aria-label={tool.name}>
            <ToolLoader slug={tool.slug} />
          </section>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
