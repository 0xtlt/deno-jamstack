import { join, __dirname } from "../deps.ts";

const exists = async (filename: string): Promise<boolean> => {
  try {
    await Deno.stat(filename);
    // successful, file or directory must exist
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      // file or directory does not exist
      return false;
    } else {
      // unexpected error, maybe permissions, pass it along
      throw error;
    }
  }
};

const replaceAsync = async (
  str: string,
  regex: RegExp,
  asyncFn: any
): Promise<string> => {
  const promises: any[] = [];
  str.replace(regex, (match: string, ...args: any): any => {
    const promise = asyncFn(match, ...args);
    promises.push(promise);
  });
  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift());
};

const decoder = new TextDecoder("utf-8");
const encoder = new TextEncoder();

const ELEMENTS = {
  layout: decoder.decode(
    await Deno.readFile(join(__dirname, "./elements/layout.html"))
  ),
  home: decoder.decode(
    await Deno.readFile(join(__dirname, "./elements/home.html"))
  ),
  article: decoder.decode(
    await Deno.readFile(join(__dirname, "./elements/article.html"))
  ),
};

async function replaceAssets(html: string): Promise<string> {
  async function replacer(fullMatch: string, g1: string, file: string) {
    if (await exists(join(__dirname, "./assets/", file))) {
      return decoder.decode(
        await Deno.readFile(join(__dirname, "./assets/", file))
      );
    }

    return "";
  }

  return await replaceAsync(html, /\[\[('|")((.)+)('|")\]\]/g, replacer);
}

export { exists, replaceAsync, ELEMENTS, decoder, encoder, replaceAssets };
