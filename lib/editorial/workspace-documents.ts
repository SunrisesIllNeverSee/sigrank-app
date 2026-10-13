/** Real canonical editorial navigation metadata; no new publication routes. */
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import matter from "gray-matter";
import { getAllPosts } from "./blog-index";

export type WorkspaceDocument = { label: string; href: string };

export async function getWorkspaceDocuments(section: "articles" | "blog"): Promise<WorkspaceDocument[]> {
  if (section === "blog") {
    const posts = await getAllPosts();
    return posts.map(post => ({ label: post.title, href: "/blog/" + post.slug }));
  }
  const directory = join(process.cwd(), "content", "blog");
  const files = await readdir(directory);
  const articles = await Promise.all(files.filter(file => file.endsWith(".md")).map(async file => {
    const { data } = matter(await readFile(join(directory, file), "utf8"));
    if (data.type !== "article") return null;
    const date = data.timestamp instanceof Date
      ? data.timestamp.toISOString() : String(data.timestamp ?? "");
    return { label: String(data.title ?? file.slice(0, -3)),
      href: "/blog/" + file.slice(0, -3), date };
  }));
  return articles.filter((value): value is NonNullable<typeof value> => value !== null)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(({ label, href }) => ({ label, href }));
}
