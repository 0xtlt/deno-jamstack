import { __dirname, join } from "../deps.ts";

// here we can control how medias files are processed
// Pictures can be resized etc...

async function processMedia() {
    for await (const dirEntry of Deno.readDir(join(__dirname, "./assets/medias"))) {
        await Deno.copyFile(join(__dirname, "./assets/medias/", dirEntry.name), join(__dirname, "./public/medias/", dirEntry.name));
    }
}

export {
    processMedia
}