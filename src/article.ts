import { join, Marked, __dirname } from "../deps.ts";
import {
  ELEMENTS,
  encoder,
  decoder,
  replaceAssets,
} from "./functions.ts";

/**
 * READ /posts dir for posts
 */

async function processArticle(file: string): Promise<object> {
  let article: any = {
    markdown: "",
    html: "",
    handle: "",
  };

  // dir will be the handle by default
  article.handle = file.split(".").slice(0, -1)[0];

  const data = await Deno.readFile(join(__dirname, "./articles/", file));
  article.markdown = await decoder.decode(data);

  // Processing the metadata
  if (article.markdown.substr(0, 3) === "---") {
    article.markdown = article.markdown.replaceAll("\n", "[NEWLINEENCODEDFOR]");

    const meta = /---((.)+)---/.exec(article.markdown);

    if (meta && meta[1]) {
      const tmp = meta[1].replaceAll("[NEWLINEENCODEDFOR]", "\n");

      // Get all meta
      const regex = /^(([a-zA-Z-0-9-_])+):((.)+)$/gm;
      let m;

      while ((m = regex.exec(tmp)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
          regex.lastIndex++;
        }

        // The result can be accessed through the `m`-variable.
        article[m[1]] = m[3].trim();
      }

      article.markdown = article.markdown.replace(meta[0], "");
    }

    article.markdown = article.markdown.replaceAll("[NEWLINEENCODEDFOR]", "\n");
  }

  // create dir
  await Deno.mkdir(join(__dirname, "./public/articles/" + article.handle));

  // Processing the body
  article.html = await Marked.parse(article.markdown).content;
  let tmp = ELEMENTS.layout;
  tmp = tmp.replaceAll("[BODY]", article.html);

  // create the file
  await Deno.writeFile(
    join(__dirname, "./public/articles/" + article.handle, "/index.html"),
    encoder.encode(await replaceAssets(tmp))
  );

  return article;
}

export { processArticle };
