import { readdir } from "fs/promises";
import { join } from "path";

export const metadata = {
  title: "Vercel Marketplace Images · SigRank SignalAF",
  description: "Index of all Vercel Marketplace gallery images and icons.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-static";

async function getImages() {
  const dir = join(process.cwd(), "public", "marketplace");
  const files = await readdir(dir);
  return files
    .filter((f) => f.endsWith(".png") || f.endsWith(".svg"))
    .sort()
    .map((f) => `/marketplace/${f}`);
}

export default async function MarketplaceIndex() {
  const images = await getImages();

  const icons = images.filter((i) => i.includes("icon-"));
  const galleries = images.filter((i) => i.includes("gallery-"));
  const userGalleries = images.filter((i) => i.includes("user-gallery-"));
  const rawScreenshots = images.filter((i) => i.includes("screenshot-"));
  const svgSources = images.filter((i) => i.endsWith(".svg"));

  const Section = ({
    title,
    items,
    cols = "grid-cols-2",
  }: {
    title: string;
    items: string[];
    cols?: string;
  }) => {
    if (items.length === 0) return null;
    return (
      <section className="mb-12">
        <h2 className="mb-4 text-lg font-bold text-zinc-100">{title}</h2>
        <div className={`grid ${cols} gap-4`}>
          {items.map((src) => (
            <div key={src} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
              <img
                src={src}
                alt={src.split("/").pop() ?? ""}
                className="w-full rounded border border-zinc-800"
                loading="lazy"
              />
              <p className="mt-2 break-all font-mono text-xs text-zinc-500">
                {src}
              </p>
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <h1 className="mb-2 text-2xl font-bold text-zinc-100">
        Vercel Marketplace Images
      </h1>
      <p className="mb-8 text-sm text-zinc-500">
        All images formatted to Vercel Marketplace spec. Gallery: 1920x1080, 16:9.
        Icon: 1:1, min 256px. Non-transparent PNG.
      </p>

      <Section title="Icons (1:1)" items={icons} cols="grid-cols-4" />
      <Section title="Gallery Images (1920x1080)" items={galleries} cols="grid-cols-2" />
      <Section title="User Gallery Images (1920x1080)" items={userGalleries} cols="grid-cols-2" />
      <Section title="Raw Screenshots" items={rawScreenshots} cols="grid-cols-2" />
      <Section title="SVG Sources" items={svgSources} cols="grid-cols-4" />
    </main>
  );
}
