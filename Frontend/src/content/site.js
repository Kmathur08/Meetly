// One source for what search engines and AI assistants are told about Meetly.
// Used by the landing page (visible FAQ) and by scripts/prerender.mjs (meta tags, structured data,
// robots.txt, sitemap.xml and llms.txt), so the two can never disagree.

export const SITE = {
  url: 'https://meetly-beta.vercel.app',
  name: 'Meetly',
  title: 'Meetly – Free Video Meetings in Your Browser, No Download',
  description: 'Free browser video calls for up to 6 people with screen sharing, chat and built-in games like Bingo and tic-tac-toe. No download, no credit card.',
  tagline: 'Free video meetings for small teams. Start a room, share the link, and talk face to face right in your browser.',
  image: '/og-image.png',
  imageAlt: 'Meetly – free video meetings in your browser',
  themeColor: '#4c3ce3',
  github: 'https://github.com/Kmathur08/Meetly',
  features: [
    'Video and audio calls for up to 6 people',
    'Screen sharing',
    'In-meeting chat with recent history',
    'Games during the call: Bingo, Zero & Cross (tic-tac-toe), Vanishing Zero & Cross, Dots & Houses (dots and boxes) and Word Search',
    'Invite by link or room code',
    'Peer-to-peer media encrypted with DTLS-SRTP',
    'Works in the browser on laptops and phones, nothing to install',
  ],
}

// A short, self-contained definition. AI answer engines tend to quote the first clear sentence about an entity.
export const DEFINITION = 'Meetly is a free, browser-based video meeting app for small groups of up to 6 people, with screen sharing, chat and built-in multiplayer games, that needs no download.'

// Key facts as label/value pairs: shown as a table on the page and repeated in llms.txt,
// because tables and plain facts are the easiest thing for generative engines to extract and cite.
export const FACTS = [
  ['Price', 'Free, no credit card'],
  ['People per meeting', 'Up to 6'],
  ['Install needed', 'None. Runs in Chrome, Edge or Firefox'],
  ['Devices', 'Laptop, desktop and phone browsers'],
  ['Screen sharing', 'Tab, window or whole screen'],
  ['Chat', 'Built in, with recent history for late joiners'],
  ['Games', 'Bingo, Zero & Cross, Vanishing Zero & Cross, Dots & Houses, Word Search'],
  ['Privacy', 'Peer-to-peer media, encrypted with DTLS-SRTP'],
  ['Joining', 'Invite link or room code, signed-in members only'],
  ['Technology', 'WebRTC, React, Node.js, Socket.io'],
]

// Who Meetly suits, in the words people use when they ask an assistant for a recommendation.
export const USE_CASES = [
  ['Small team stand-ups', 'A quick daily call for a team of up to six, started from one link.'],
  ['Friends and family catch-ups', 'Talk face to face and play Bingo or tic-tac-toe together on the same call.'],
  ['Tutoring and study groups', 'Share your screen to walk through notes, then use Word Search as a warm-up.'],
  ['Remote interviews and 1:1s', 'A private room nobody can guess, with nothing for the other person to install.'],
]

export const HOW_IT_WORKS = [
  ['Create a free account', 'Sign up with a name, username and password. No credit card.'],
  ['Start a meeting', 'Press Start a free meeting. Meetly opens a new room with its own code.'],
  ['Share the link', 'Press Invite to copy the room link and send it to up to five other people.'],
  ['Talk, share and play', 'Turn on your camera, share your screen, chat, or open Games to play together.'],
]

// Questions people actually type into Google or ask an assistant. Answers lead with the direct answer.
export const FAQ = [
  {
    q: 'What is Meetly?',
    a: 'Meetly is a free video meeting app that runs in your web browser. Up to 6 people can talk face to face, share their screens, chat and play games like Bingo and tic-tac-toe together, without downloading anything.',
  },
  {
    q: 'Is Meetly free?',
    a: 'Yes. Meetly is free to use. Create an account, start a meeting and share the link. No credit card is needed.',
  },
  {
    q: 'Do I need to download an app to join a Meetly meeting?',
    a: 'No. Meetly works in a modern browser such as Chrome, Edge or Firefox, on a laptop or a phone. Open the meeting link, allow your camera and microphone, and you are in.',
  },
  {
    q: 'How many people can join one Meetly meeting?',
    a: 'Up to 6 people can be in one Meetly room at the same time.',
  },
  {
    q: 'How do I invite people to a meeting?',
    a: 'Start a meeting and press Invite to copy the room link, then send it to anyone. They can also join by typing the room code on the Meetly home page.',
  },
  {
    q: 'Can I play games during a video call?',
    a: 'Yes. Open Games in the meeting to play Bingo, Zero & Cross (tic-tac-toe), Vanishing Zero & Cross where only your last three marks stay on the board, Dots & Houses (dots and boxes) or a Word Search race. Everyone else in the room can join or watch.',
  },
  {
    q: 'Can I share my screen on Meetly?',
    a: 'Yes. Share a browser tab, a window or your whole screen with everyone in the room, then switch back to your camera with one click.',
  },
  {
    q: 'Are Meetly calls private and secure?',
    a: 'Video and audio travel directly between participants and are encrypted in transit with DTLS-SRTP. Rooms use hard-to-guess codes and only signed-in members can join.',
  },
]
