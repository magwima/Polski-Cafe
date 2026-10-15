# Chrome Web Store submission pack — Polski w kawałkach

Everything below is ready to copy and paste into the Developer Dashboard.
Upload file: **polski-store-upload.zip** (manifest.json sits at the root of the zip, which is what the dashboard requires).

---

## 1. Store listing tab

**Extension name** (also in the manifest, max 50 chars)

```
Polski w kawałkach — Polish practice
```

**Summary** (max 132 chars)

```
Short daily Polish rounds: word tiles, verb forms, listening, dialogues and A2–B1 grammar lessons, with spaced review.
```

**Description** (paste as-is)

```
Polski w kawałkach turns Polish practice into short rounds you can finish in about ten minutes, right from your toolbar.

Click the icon for a quick round in the popup, or open it full-size in a tab. Everything works offline.

WHAT YOU PRACTISE

• Build it — tap Polish word tiles into the right order. Sensible variations in word order are accepted.
• Say it in Polish — read the English, type the Polish. There are buttons for ą, ć, ę, ł, ń, ó, ś, ź and ż, so you don't need a Polish keyboard.
• Listen — hear a sentence, then pick, build or type it. There's a slower playback button.
• Verb forms — the right form for the person and tense, across present, past and both futures.
• What comes next? — pick the natural reply in a real conversation.
• Grammar challenge and Words — fill the gap, and learn the vocabulary from each lesson.
• Mixed round and, at the top level, a 15-question exam round.

THREE LEVELS

• Beginner — short present-tense sentences, five lives and a hint on every question.
• Intermediate — longer sentences, the past tense with masculine and feminine forms, more decoys.
• Fluent — every tense, typed answers, Polish accents required, a timer and two lives.

A short placement test finds your level in about two minutes. Score 7/10 in three different games to unlock the next level.

22 GRAMMAR LESSONS, A2 TO B1

Each lesson explains one grammar point in plain English — the instrumental, the genitive, w/na versus do, the imperative, plurals for groups of men, verbal nouns, the dative, motion verbs with prefixes, się and siebie, impersonal forms, conditionals, the passive and more — with examples, vocabulary and a practice round built from that lesson.

PRACTICE THAT STICKS

• Every mistake comes back after 1, 3, 7, 14 and 30 days, then counts as mastered.
• Today's round mixes your due reviews with your weakest grammar point.
• A progress tab shows your accuracy per grammar point, your weakest verbs and a 14-day activity chart.
• Set a daily goal of 10, 20, 30 or 50 questions, and keep a day streak.
• An optional evening reminder, which you can switch off.

DESIGNED TO BE COMFORTABLE

Light and dark themes, larger text if you want it, full keyboard support, and answers read aloud using your system's Polish voice.

Your progress is saved in your own browser. The extension collects nothing, sends nothing and works with no account.
```

**Category:** Education
**Language:** English (add Polish as a second language if you want)

**Graphics** (in the `store-assets` folder)

| Asset | File | Size |
| --- | --- | --- |
| Screenshot 1 | screenshot1.png | 1280×800 |
| Screenshot 2 | screenshot2.png | 1280×800 |
| Screenshot 3 | screenshot3.png | 1280×800 |
| Screenshot 4 | screenshot4.png | 1280×800 |
| Screenshot 5 | screenshot5.png | 1280×800 |
| Small promo tile | promo-small-440x280.png | 440×280 |
| Store icon | icon128.png | 128×128 |

**Privacy policy URL**

```
https://claude.ai/artifact/AezeXwpuAfVLd19pupSY4E
```

If you'd rather host it yourself (a GitHub Pages file or your own site), use that URL instead — the page content is in `privacy-policy.html`.

---

## 2. Privacy tab

**Single purpose description**

```
A self-contained Polish language learning game. The extension opens a practice game from the toolbar and saves the learner's own progress and settings locally. It does nothing else, and it does not interact with the web pages the user visits.
```

**Permission justifications**

storage:
```
Saves the learner's own progress and settings on their device: XP, day streak, best scores, unlocked levels, the spaced-review schedule, and preferences such as level, daily goal, theme and text size. Without it, every round would start from zero. Nothing is transmitted anywhere.
```

alarms:
```
Runs a periodic check so the optional evening practice reminder can be shown if the learner has not practised that day. It is used for nothing else.
```

notifications:
```
Shows that optional practice reminder, at most once a day, between 18:00 and 22:00. The learner can switch it off in the extension's settings.
```

**Remote code:** No, I am not using remote code. Everything — code, fonts and learning content — is packaged in the extension.

**Data usage:** tick nothing. The extension collects none of the listed categories.
Then tick the three certification boxes:
- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

---

## 3. Distribution tab

- **Visibility:** Public if you want anyone to find it. Choose **Unlisted** if it's just for your students — they install from a link you send, with no developer mode.
- **Distribution:** All regions, or only the ones you care about.
- **Pricing:** free. As a registered non-trader you can only publish free items with no in-app payments, which is what this is.

---

## 4. Notes for the reviewer (optional field, worth filling in)

```
This is an offline, self-contained language learning game. It has no host permissions, no content scripts and no network requests. All fonts and content are bundled. The three permissions are used only for saving progress locally (storage) and for an optional daily reminder the user can disable (alarms, notifications). The "hear it" buttons use the browser's built-in speechSynthesis API.
```

---

## 5. After you submit

- First reviews usually take a few days, sometimes longer for a new developer account. You'll get an email either way.
- Once it's published, anyone installs it in one click — no developer mode.
- Your existing unpacked copy and the published one are separate installs with separate progress. Remove the unpacked one once you're happy with the store version.
- To ship an update: raise `"version"` in manifest.json (e.g. 1.0.1), zip the files again with manifest.json at the root, and upload it as a new package.

---

## 6. One thing to decide before you publish

The in-app Lessons tab says the lessons follow *Krok po kroku A2–B1*. The exercises, examples and wording are all original — only the syllabus order and grammar topics follow that book, and those aren't protected. Still, naming someone else's textbook in a public listing can invite a complaint.

I've kept the book's name out of the store listing above. If you want, I can also change the in-app line to something neutral, such as "Grammar and topics follow a standard A2–B1 syllabus". Just say the word.
