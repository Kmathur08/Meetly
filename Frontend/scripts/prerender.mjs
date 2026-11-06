// Runs after `vite build`. Writes the landing page into dist/index.html as real HTML, adds the
// meta tags and structured data search engines and AI assistants read, and generates
// robots.txt, sitemap.xml, llms.txt and llms-full.txt from src/content/site.js.
import { readFile, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = `${root}dist`
const ssrOut = `${root}dist-prerender`

await build({ root, logLevel: 'warn', build: { ssr: 'src/prerender.jsx', outDir: ssrOut, emptyOutDir: true } })
const { renderLanding, SITE, FAQ, APP_ROUTES, DEFINITION, FACTS, USE_CASES, HOW_IT_WORKS } = await import(pathToFileURL(`${ssrOut}/prerender.js`).href)
await rm(ssrOut, { recursive: true, force: true })

const escape = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const absolute = (path) => new URL(path, SITE.url).href
const jsonLd = (data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`

const today = new Date().toISOString().slice(0, 10)

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE.url}/#website`,
      url: `${SITE.url}/`,
      name: SITE.name,
      description: SITE.description,
      inLanguage: 'en',
      publisher: { '@id': `${SITE.url}/#organization` },
    },
    {
      '@type': 'WebPage',
      '@id': `${SITE.url}/#webpage`,
      url: `${SITE.url}/`,
      name: SITE.title,
      description: DEFINITION,
      inLanguage: 'en',
      isPartOf: { '@id': `${SITE.url}/#website` },
      about: { '@id': `${SITE.url}/#app` },
      mainEntity: { '@id': `${SITE.url}/#app` },
      primaryImageOfPage: absolute(SITE.image),
      dateModified: today,
      // Tells voice assistants which parts read well aloud.
      speakable: { '@type': 'SpeakableSpecification', cssSelector: ['.glance-definition', '.faq-list p'] },
    },
    {
      '@type': 'Organization',
      '@id': `${SITE.url}/#organization`,
      name: SITE.name,
      url: `${SITE.url}/`,
      logo: absolute('/icon-512.png'),
      sameAs: [SITE.github],
    },
    {
      '@type': 'WebApplication',
      '@id': `${SITE.url}/#app`,
      name: SITE.name,
      url: `${SITE.url}/`,
      description: SITE.description,
      applicationCategory: 'CommunicationApplication',
      operatingSystem: 'Any (runs in Chrome, Edge or Firefox)',
      browserRequirements: 'Requires a browser with WebRTC, camera and microphone access.',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: SITE.features,
      additionalProperty: FACTS.map(([name, value]) => ({ '@type': 'PropertyValue', name, value })),
      image: absolute(SITE.image),
      publisher: { '@id': `${SITE.url}/#organization` },
    },
    {
      '@type': 'HowTo',
      '@id': `${SITE.url}/#how-it-works`,
      name: 'How to start a free video meeting on Meetly',
      totalTime: 'PT1M',
      estimatedCost: { '@type': 'MonetaryAmount', currency: 'USD', value: '0' },
      tool: [{ '@type': 'HowToTool', name: 'A web browser with a camera and microphone' }],
      step: HOW_IT_WORKS.map(([name, text], i) => ({ '@type': 'HowToStep', position: i + 1, name, text, url: `${SITE.url}/#how-it-works` })),
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE.url}/#faq`,
      mainEntity: FAQ.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
  ],
}

const headTags = [
  `<link rel="canonical" href="${SITE.url}/" />`,
  '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />',
  `<meta name="application-name" content="${SITE.name}" />`,
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png" />',
  '<link rel="manifest" href="/site.webmanifest" />',
  `<link rel="alternate" type="text/plain" title="${SITE.name} summary for AI assistants" href="/llms.txt" />`,
  '<meta property="og:type" content="website" />',
  `<meta property="og:site_name" content="${SITE.name}" />`,
  `<meta property="og:url" content="${SITE.url}/" />`,
  `<meta property="og:title" content="${escape(SITE.title)}" />`,
  `<meta property="og:description" content="${escape(SITE.description)}" />`,
  `<meta property="og:image" content="${absolute(SITE.image)}" />`,
  '<meta property="og:image:width" content="1200" />',
  '<meta property="og:image:height" content="630" />',
  `<meta property="og:image:alt" content="${escape(SITE.imageAlt)}" />`,
  '<meta property="og:locale" content="en_US" />',
  '<meta name="twitter:card" content="summary_large_image" />',
  `<meta name="twitter:title" content="${escape(SITE.title)}" />`,
  `<meta name="twitter:description" content="${escape(SITE.description)}" />`,
  `<meta name="twitter:image" content="${absolute(SITE.image)}" />`,
  jsonLd(structuredData),
].join('\n    ')

// Someone opening an invite link (#meet/…) must not see the landing page flash first.
const clearForAppRoutes = `<script>(function(){var r=location.hash.slice(1);if(${JSON.stringify(APP_ROUTES)}.some(function(n){return r===n||r.indexOf(n+'/')===0}))document.getElementById('root').textContent=''})()</script>`

let html = await readFile(`${dist}/index.html`, 'utf8')
const replaceOnce = (pattern, replacement) => {
  if (!pattern.test(html)) throw new Error(`prerender: ${pattern} not found in dist/index.html`)
  html = html.replace(pattern, () => replacement)
}
replaceOnce(/<title>[^<]*<\/title>/, `<title>${escape(SITE.title)}</title>`)
replaceOnce(/<meta name="description"[^>]*>/, `<meta name="description" content="${escape(SITE.description)}" />`)
replaceOnce(/<\/head>/, `    ${headTags}\n  </head>`)
replaceOnce(/<div id="root"><\/div>/, `<div id="root">${renderLanding()}</div>\n    ${clearForAppRoutes}`)
await writeFile(`${dist}/index.html`, html)

await writeFile(`${dist}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE.url}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`)

// Search and AI crawlers are all welcome; naming the AI ones makes that explicit.
const crawlers = ['Googlebot', 'Bingbot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended']
await writeFile(`${dist}/robots.txt`, `User-agent: *
Allow: /

${crawlers.map((bot) => `User-agent: ${bot}\nAllow: /`).join('\n\n')}

Sitemap: ${SITE.url}/sitemap.xml
`)

// llms.txt: the short summary AI assistants read first (https://llmstxt.org).
// llms-full.txt: everything on the page as plain text, so a model can answer from one request.
const factsList = FACTS.map(([label, value]) => `- ${label}: ${value}`).join('\n')
const faqText = FAQ.map(({ q, a }) => `### ${q}\n\n${a}`).join('\n\n')
const links = `- [Start a free meeting](${SITE.url}/#meet)
- [Create an account](${SITE.url}/#signup)
- [Full details for AI assistants](${SITE.url}/llms-full.txt)
- [Source code](${SITE.github})`

await writeFile(`${dist}/llms.txt`, `# ${SITE.name}

> ${DEFINITION}

${SITE.tagline}

Website: ${SITE.url}/
Last updated: ${today}

## Key facts

${factsList}

## FAQ

${faqText}

## Links

${links}
`)

await writeFile(`${dist}/llms-full.txt`, `# ${SITE.name}: full description

> ${DEFINITION}

Website: ${SITE.url}/
Last updated: ${today}

## What Meetly is

${SITE.description} ${SITE.tagline}

## Features

${SITE.features.map((feature) => `- ${feature}`).join('\n')}

## Key facts

${factsList}

## How to start a free video meeting on Meetly

${HOW_IT_WORKS.map(([title, text], i) => `${i + 1}. ${title}. ${text}`).join('\n')}

## Who it's for

${USE_CASES.map(([title, text]) => `- ${title}: ${text}`).join('\n')}

## Games you can play during a call

- Bingo (2 to 6 players): everyone gets a private 5x5 card of 1 to 25 and players take turns calling numbers. The first to complete 5 lines wins.
- Zero & Cross (2 players): classic tic-tac-toe, three in a row wins.
- Vanishing Zero & Cross (2 players): each player keeps only 3 marks; placing a 4th removes their oldest, so the game can't end in a full-board draw.
- Dots & Houses (2 to 4 players): dots and boxes. Join two dots per turn; closing a box builds a house, scores a point and gives another turn.
- Word Search (1 to 6 players): everyone races on the same 12x12 grid to find 8 themed words first.

## Limits

- Meetings are peer to peer, so each room is capped at 6 people.
- A modern browser with camera and microphone access is required.

## FAQ

${faqText}

## Links

${links}
`)

console.log('Pre-rendered the landing page and wrote sitemap.xml, robots.txt, llms.txt and llms-full.txt')
