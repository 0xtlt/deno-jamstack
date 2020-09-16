import { join, __dirname } from "../deps.ts";
import {
  exists,
  replaceAsync,
  ELEMENTS,
  encoder,
  replaceAssets,
} from "./functions.ts";
import { processArticle } from "./article.ts";
import { processMedia } from "./media.ts";

console.time("Deno Jamstack");

// delete the /public folder if it exist
if (await exists(join(__dirname, "./public"))) {
  await Deno.remove(join(__dirname, "./public"), { recursive: true });
}

// Create the /public folder
await Deno.mkdir(join(__dirname, "./public"));
// Create the /medias folder
await Deno.mkdir(join(__dirname, "./public/medias"));
// Create the /articles folder
await Deno.mkdir(join(__dirname, "./public/articles"));

let articles: any[] = [];

console.log("Articles Process Started..");
console.time("Articles Process Ended in");
for await (const dirEntry of Deno.readDir(join(__dirname, "./articles"))) {
  const extension = dirEntry.name.split(".").slice(-1);

  // Only process markdown (.md) files

  if (extension[0]?.toLowerCase() === "md") {
    articles.push(processArticle(dirEntry.name));
  }
}

await Promise.all(articles);

console.timeEnd("Articles Process Ended in");
console.log(
  `${articles.length} article${articles.length > 1 ? "s" : ""} found.`
);

// Once articles are processed, we can now process our home

console.log("Home Process Started..");
console.time("Home Process Ended in");
await (async (): Promise<any> => {
  let tmp = await replaceAssets(ELEMENTS.home);

  async function replacer(fullMatch: string, inner: string): Promise<string> {
    let result = "";

    for await (const article of articles) {
      result += inner.replaceAll(
        /\[(([a-zA-Z-0-9-_])+)\]/g,
        (fullM: string, variable: string): string => {
          if (article[variable.toLowerCase()]) {
            return article[variable.toLowerCase()];
          } else {
            return fullM;
          }
        }
      );
    }

    return result;
  }

  // Loop on [ARTICLES]
  tmp = await replaceAsync(
    tmp,
    /\[ARTICLES\]((.)+)\[\/ARTICLES\]/gms,
    replacer
  );

  // create the file for Homepage
  await Deno.writeFile(
    join(__dirname, "./public/index.html"),
    encoder.encode(await replaceAssets(tmp))
  );
})();
console.timeEnd("Home Process Ended in");

console.log("Media Process Started..");
console.time("Media Process Ended in");
  await processMedia();
console.timeEnd("Media Process Ended in");

console.timeEnd("Deno Jamstack");
