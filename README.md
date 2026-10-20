# Cloudroom

A responsive study app for the **AWS Certified Cloud Practitioner (CLF-C02)** exam, featuring 195 practice questions across all four exam domains and explanations for every answer option.

Built with HTML, CSS, and JavaScript. The app runs entirely in the browser, with no backend, account system, or runtime dependencies.

## Features

- Domain-specific practice and randomized mixed sessions.
- Full-length exam simulations with 65 questions and a 90-minute timer.
- Single-answer and multiple-answer questions with detailed feedback.
- Question flags, navigation, and saved sessions that survive page refreshes.
- Results by domain, answer review, and targeted retries for missed questions.
- Responsive layouts for desktop, tablet, and mobile browsers.
- Local progress tracking without uploading answers or results.

## Practice modes

| Mode | Question selection | Feedback |
| --- | --- | --- |
| **Focus on a domain** | Questions from one selected exam domain | After each submitted answer |
| **Mix it up** | A randomized sample from the full bank | After each submitted answer |
| **Simulate exam day** | Practice Set A, B, or C, or a fresh exam with approximate domain weighting | After the exam ends |

Untimed sessions support 10, 20, 30, 50, or all available questions. Session lengths are capped at the number of questions available in the selected pool, with no duplicates within a session.

In practice mode, single-answer questions reveal feedback immediately after selection. Multiple-answer questions require the specified number of selections followed by **Check answer**. Submitted practice answers are locked; exam answers remain editable until submission.

Exam mode saves a fixed deadline. Refreshing or closing the page does not pause the clock. An open session submits automatically when time expires; a closed session that has expired submits when reopened. Timing relies on the device clock.

## Getting started

### Local server

Requires **Node.js 20 or later**. No dependency installation or build step is needed.

```sh
git clone https://github.com/jsedamano/aws-ccp-website.git
cd aws-ccp-website
npm start
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). Stop the server with `Ctrl+C`.

To use a different port:

```sh
node server.mjs --port 4174
```

### Direct browser access

Open `index.html` directly in a browser. All assets are bundled locally, so practice works offline. Official documentation links require an internet connection.

Using the local server provides a consistent origin for browser storage.

### Access from another device

To make the local server accessible on the same network:

```sh
node server.mjs --host 0.0.0.0
```

Connect both devices to the same network and open `http://<computer-local-ip>:4173` on the second device. Network or firewall settings may need to allow access to port 4173.

## Static deployment

Deploy the following files and directories to a static hosting service, preserving their structure:

```text
index.html
styles.css
assets/
src/
```

No build command or Node.js server is required in production. The included server is for local development. Tests, generated screenshots, and project documentation are not required for deployment.

## Progress and privacy

The app stores its current session and up to 50 completed sessions in browser `localStorage`. The overview displays the five most recent sessions and aggregate statistics for the saved history.

Progress is specific to the browser and website origin; it does not sync across devices. A local file, a localhost address, and a deployed domain use separate storage contexts. Clearing site data removes saved progress. If storage is unavailable, the app displays a notice and retains the current session in memory while the page remains open.

Question content, correct answers, and explanations are public browser assets. Exam mode delays feedback in the interface; it does not restrict access to the answer bank.

## Scoring

Each question is worth one point. Multiple-answer questions require the exact set of correct options; there is no partial credit. Unanswered questions, incomplete selections, and unchecked practice answers receive zero points. Every question in a session contributes to the score.

Exam simulations use **70% as a practice-pass benchmark**, configured in [src/core.js](src/core.js). This is not an official AWS pass prediction. The actual exam includes 50 scored questions and 15 unscored questions, with a passing scaled score of 700 on a 100–1,000 scale. Raw practice percentages cannot be converted to AWS scaled scores.

## Development

| Command | Purpose |
| --- | --- |
| `npm start` | Start the local server |
| `npm test` | Run the quiz-engine and question-bank tests |
| `npm run check` | Check application syntax and run the core tests |

### Browser checks

The optional browser walkthrough requires Playwright and an installed Chrome binary. Start the local server, then run:

```sh
node tests/browser-check.cjs
```

Optional environment variables:

| Variable | Purpose |
| --- | --- |
| `PLAYWRIGHT_MODULE` | Path to a Playwright installation outside the project |
| `CHROME_BIN` | Path to the Chrome executable; defaults to the standard macOS location |
| `PREVIEW_URL` | Server address; defaults to `http://127.0.0.1:4173` |

Browser checks use an isolated profile and create screenshots in `qa/`. Generated screenshots and test reports are excluded from Git.

### Project structure

```text
assets/
  favicon.svg
  question-bank.json       # Structured question bank
  question-bank.js         # Browser-ready question bank
src/
  app.js                   # Screens, interactions, timer, and persistence
  core.js                  # Question selection, scoring, and session validation
tests/
  core.test.cjs            # Quiz-engine and data checks
  browser-check.cjs        # Browser walkthrough and responsive-layout checks
index.html                 # Application shell
styles.css                 # Responsive styles
server.mjs                 # Local static-file server
package.json               # Development commands
```

Keep both question-bank files synchronized when updating content. The JavaScript representation assigns the JSON data to `window.CCP_BANK`, which enables direct file access without fetching data from a server. Changing `bank_version` invalidates previously saved sessions associated with the old version.

## Exam references

- [AWS Certified Cloud Practitioner overview](https://aws.amazon.com/certification/certified-cloud-practitioner/)
- [CLF-C02 exam guide](https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02.html)

Cloudroom is an independent study tool and is not affiliated with or endorsed by AWS. The practice questions are not official AWS exam questions.
