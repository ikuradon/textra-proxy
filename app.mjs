import "dotenv/config";

import Fastify from "fastify";
import formBody from "@fastify/formbody";

import { TexTra } from './textra.mjs';

const TEXTRA_USERNAME = process.env.TEXTRA_USERNAME || "";
const TEXTRA_API_KEY = process.env.TEXTRA_API_KEY || "";
const TEXTRA_API_SECRET = process.env.TEXTRA_API_SECRET || "";
const AUTH_KEY = process.env.AUTH_KEY || "823chan";

if (!TEXTRA_USERNAME || !TEXTRA_API_KEY || !TEXTRA_API_SECRET) {
  console.error("Environment not setup correctly. Please check.");
  process.exit(1);
}

const textra = new TexTra(TEXTRA_API_KEY, TEXTRA_API_SECRET, TEXTRA_USERNAME);

const fastify = Fastify({
  logger: true,
});
await fastify.register(formBody);

// const translation = async (text) => {
//   console.log(`原文：${text}`);
//   const languages = await textra.detectLanguage(text);
//   const language = languages[0].lang;
//   console.log(`検出言語：${language}`);
//   const translators = await textra.queryTranslator(language, "ja");
//   const translator = translators[0].id
//   console.log(`使用翻訳：${translator}`);
//   const result = await textra.translate(translator, text);
//   console.log(result);
// }

// await translation('这一刻，爸妈正在麦地里挥洒着土黑的汗水拼命地收割，而不孝的儿子却在考场上无奈地发呆！');
// await translation('C’était une très bonne cuisine.');
// await translation("Yeah, I love it too, but I feel like it could be improved. UX is somewhat lacking and the main page just doesn't tell you what we do");

// console.log(await textra.queryTranslator("zh", "ja"));


fastify.get('/translate', async (req, res) => {
  res.code(405);
  return { error: "Method not allowed" };
});

fastify.post('/translate', async (req, res) => {
  let t_source = req.body.source || "auto";
  const t_target = req.body.target || "ja";

  const t_text = req.body.q;

  const t_format = req.body.format || "text";

  const api_key = req.body.api_key || "invalid";


  if (!t_text) {
    res.code(400);
    return { error: "Invalid request" };
  }

  if (api_key !== AUTH_KEY) {
    res.code(403);
    return { error: "Invalid API key" };
  }

  console.log(`原文：${t_text}`);

  if (t_source === "auto") {
    console.log("Require detect source language.");
    const languages = await textra.detectLanguage(t_text);
    t_source = languages[0].lang;
  }

  console.log(`元言語：${t_source}`);
  console.log(`先言語：${t_target}`);

  const translators = await textra.queryTranslator(t_source, t_target);
  const translator = translators[0].id
  console.log(`翻訳エンジン：${translator}`);

  const result = await textra.translate(translator, t_text);
  console.log(`結果：${result}`);
  res.code(200);
  return { translatedText: result };
});

try {
  await fastify.listen({
    host: "::",
    port: 3080,
    listenTextResolver: (address) => { return console.log(`TexTra proxy server is listening at ${address}`); }
  });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}