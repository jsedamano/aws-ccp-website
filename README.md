# Cloudroom

A local AWS Certified Cloud Practitioner (CLF-C02) practice website. Built from your supplied 195-question bank, with all answer explanations preserved.

## Open the website

The simplest option is to open `index.html` in your browser. All application assets are local; no account, installation, build, or internet connection is needed to practice. Official reference links open AWS documentation when you choose them.

For the most consistent saved progress, use the local server:

```sh
cd aws-ccp-website
npm start
```

Open http://127.0.0.1:4173. Node.js 20 or later is needed for the server and tests. There are no npm dependencies to install. Stop the server with Control+C. For a different port: `node server.mjs --port 4174`.

## Practice on your phone

The layout adapts to phones, tablets, and desktop browsers. To access the local site on your phone, start the server with:

```sh
node server.mjs --host 0.0.0.0
```

Connect the phone and Mac to the same Wi-Fi network, then open `http://YOUR_MAC_LOCAL_IP:4173` on the phone. Find the Mac’s local IP in System Settings → Wi-Fi → Details → TCP/IP. This serves the project on your local network; it does not publish anything to the cloud. Progress is stored separately in each browser and device.

## Modes

- **Focus on a domain:** choose any of the four domains and a session length. If the requested length exceeds availability, the session includes all questions in that domain.
- **Mix it up:** a shuffled sample from the entire question bank, with no duplicates within the session.
- **Simulate exam day:** 65 questions and a 90-minute timer. Use Practice Set A, B, or C, or a fresh exam with approximate domain weighting (16 / 19 / 22 / 8). Each exam is shuffled.

Single-answer practice reveals feedback immediately. For multiple-answer practice, select the required number and choose **Check answer**. Feedback covers every option. Submitted practice answers are locked so you can review and learn; exam answers remain editable until submission.

Exam mode withholds correctness and explanations until the end. You can flag questions, jump between them, and submit early. The timer uses a saved deadline, so refreshing, leaving the page, or closing the browser does not pause it. An open page auto-submits at zero; an expired session is submitted when you return. The timer depends on the device clock. This is a study simulator, not a proctored exam.

## Scoring

Each question earns one point only for the exact correct set of options. There is no partial credit. Unanswered, partially selected, and unchecked practice questions earn zero. All questions in the session contribute to the denominator.

The simulator labels a result of **70% or higher as a practice pass**. This is a configurable study benchmark in `src/core.js`, not an official pass prediction. The real exam uses 50 scored and 15 unscored questions, and a scaled passing score of 700 on a 100–1,000 scale. Raw percentages cannot be converted to AWS scaled scores.

Official format and domain weights were checked against:
- https://aws.amazon.com/certification/certified-cloud-practitioner/
- https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02.html

## Saved progress

The current session and up to 50 completed sessions are stored in browser localStorage. No data is uploaded. Revisit recent results, review all/missed/flagged questions, or retry missed questions. The overview shows the five most recent sessions and totals for the saved history. Clearing browser storage removes saved progress. Private browsing and opening the website at a different URL can use separate storage. If storage is blocked, a message explains that the current tab must remain open.

## Files

- `index.html`, `styles.css`: responsive page shell and visual design.
- `src/app.js`: screens, feedback, timer, local progress, and accessible dialogs.
- `src/core.js`: selection, scoring, and session validation rules.
- `assets/question-bank.json`: unchanged copy of the supplied source bank.
- `assets/question-bank.js`: browser-ready copy of the bank, allowing direct file access.
- `server.mjs`: optional dependency-free local server, loopback-only by default.
- `tests/`: automated scoring and browser walkthrough checks.
- `qa/`: generated browser-verification screenshots, recreated by the browser checks and excluded from Git.

If you edit the bank, update both bank files. The JavaScript file contains `window.CCP_BANK = ` followed by the JSON and a semicolon. Changing `bank_version` invalidates incompatible saved sessions. The PDFs and course slides are not bundled or rehosted; the structured bank contains the questions and feedback used here.

## Public repository notes

The `.gitignore` excludes generated screenshots, logs, dependencies, local editor/deployment settings, environment files, private-key files, and the original input PDFs. Keep the application source, tests, README, package.json, and both question-bank files in the repository.

The question bank includes the answers and explanations. They are public client-side assets, including during exam mode; hiding feedback in the interface is a study feature, not access control. Saved sessions and results live in each browser's localStorage and are not repository files.

The original course slides and PDFs are not bundled. Only add third-party materials if you have permission to redistribute them. Review staged files before publishing. Ignore rules do not remove files that were already tracked or committed.

## Verification

```sh
npm run check
```

This checks JavaScript syntax and runs the core tests. The optional browser walkthrough uses a local Playwright package and an installed Chrome binary:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright CHROME_BIN='/path/to/Chrome' node tests/browser-check.cjs
```

Run the local server first. Browser checks use an isolated profile and write screenshots to `qa/`; they do not use your personal browsing data.

Independent study material; not affiliated with or endorsed by AWS.
