const fs = require('fs');
const path = require('path');

const { expect } = require('chai');

/**
 * SIBLING REPOSITORIES ARE CITED BY THEIR SETLFI NAMES.
 *
 * The repositories this board's code was ported from, or pinned against, were
 * renamed: setl -> setlfi-be, setl-web -> setlfi-fe, devteam-orchestrator ->
 * setlfi-build (and setl-scrambler, setl-monitor, setl-sales -> setlfi-*).
 * The old names stay wherever they mean something else — the product and its
 * running API ("the setl support feature", "setl allows an empty reporter
 * name"), a host, or a pipeline stage in a fixture ('setl-web:unit1'). What
 * must not come back is an old name where only a repository can be meant:
 *
 *   - a path into its tree: "setl/data/core/x.go", "(setl, data/core/x.go)",
 *     "setl's `data/core/tts/cartesia.go`", "devteam-orchestrator internal/x.go"
 *   - a symbol in its code: "setl's `CommentVisibility`", "setl's DeepgramAPIKey"
 *   - a test that lives in it, in either word order: "devteam-orchestrator's
 *     TestX", "`TestX` in setl", "`TestX` pins it in setl"
 *   - "the setl repo", "the setl-web repository"
 *
 * The other repositories in this rename hold the same rule with their own
 * guards (setlfi-monitor internal/repocheck, setlfi-scrambler scrambler/,
 * tamada deploy/); here two review rounds each found a shape the hand re-grep
 * of the round before had not searched for, which is why this one exists.
 * Comments wrap, so a citation is matched over the comment's text with the
 * line breaks and comment markers taken out — "`TestX`\n * pins it in setl."
 * is one sentence, and it is the one that slipped through by hand.
 */

const OLD = '(?:setl|setl-web|setl-scrambler|setl-monitor|setl-sales|devteam-orchestrator)';
// Not part of a longer name or a path: "setlfi-be", "~/setl-web", "@setl/ui".
const START = '(?:^|[^\\w./~@-])';
const END = '(?![\\w-])';
const SOURCE_EXT = '(?:go|js|jsx|ts|tsx|mjs|md|json|py|sh)';

const FORMER_REPO_NAME = new RegExp(
  [
    // A path into the tree, after "/", "'s", ",", ":" or a space, backquoted or not.
    `${START}${OLD}${END}(?:/|(?:'s)?[,:]? +\`?[\\w.-]+(?:/[\\w.-]+)*(?:/|\\.${SOURCE_EXT}\\b))`,
    // A symbol in its code: anything backquoted, an exported CamelCase name, a test.
    `${START}${OLD}${END}(?:'s)? +(?:own +)?(?:\`[^\`]+\`?|Test[A-Z]\\w*|[A-Z][a-z]+[A-Z]\\w*)`,
    // A test cited by the repository it lives in, the test first.
    `\\bTest[A-Z]\\w*\`?,?(?: +[a-z]+){0,3} +in +(?:the +)?${OLD}${END}`,
    `${START}${OLD}${END} +(?:repo|repository)\\b`,
  ].join('|'),
);

const ROOT = path.resolve(__dirname, '../../..');
const SELF = path.relative(ROOT, __filename);
const SKIPPED_DIRS = new Set(['node_modules', '.git', 'build', 'dist', 'public', 'coverage']);
const SCANNED = [
  { dir: 'docs', exts: ['.md'] },
  { dir: 'server', exts: ['.js', '.md'] },
  { dir: 'client/src', exts: ['.js', '.jsx', '.md'] },
];

const walk = (dir, exts, files) => {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRS.has(entry.name)) {
        walk(full, exts, files);
      }
    } else if (exts.includes(path.extname(entry.name))) {
      files.push(full);
    }
  });
  return files;
};

// Comment markers and Markdown bullets/quotes at the start of a line.
const LEAD = /^\s*(?:\/\/+|\/\*+|\{\/\*+|\*+(?!\*\w)|#+|>|-(?= ))?\s*/;

/**
 * Every former-name citation in `text`, as `{ line, match }`, with the text's
 * lines flowed into one so that a citation wrapped across a comment is seen.
 */
const findFormerNames = (text) => {
  const starts = [];
  let flowed = '';
  text.split('\n').forEach((line) => {
    starts.push(flowed.length);
    flowed += `${line.replace(LEAD, '')} `;
  });
  const found = [];
  const pattern = new RegExp(FORMER_REPO_NAME.source, 'g');
  let m = pattern.exec(flowed);
  while (m) {
    const at = m.index + m[0].search(/\S/);
    let line = starts.length;
    while (starts[line - 1] > at) {
      line -= 1;
    }
    found.push({ line, match: m[0].trim() });
    m = pattern.exec(flowed);
  }
  return found;
};

describe('repository names', () => {
  it('should hold every shape of citation the rename moved, and none of the names it kept', () => {
    [
      'reads the board (devteam-orchestrator, internal/fsm/fsm.go): these are',
      'the header setl writes (setl, data/core/support/planka.go CardHeader)',
      '// (setl/data/core/support/planka.go, `(*PlankaClient).ArchivedCards`).',
      "Ported from setl's `data/core/tts/cartesia.go`, which is",
      'bump the profile per setl `docs/network-output-columns.md` §9',
      "the bounds come from setl-web's lib/assistant/useVoiceChat.ts",
      "The other end of the round trip is setl's `CommentVisibility`",
      "the same shape setl's DeepgramAPIKey has.",
      "the direction setl's own `builtinVoiceByLanguage` note takes",
      "// devteam-orchestrator's TestAPopulatedPipelineViewMarshalsToTheGolden",
      '// The counterpart is `TestCardHeaderIsTheShapePlankaParses` in setl.',
      ' * `setlfi-reporter.test.js` pins it here, `TestCardHeaderIsTheShapePlankaParses`\n * pins it in setl.',
      'kept in the setl-web repository',
    ].forEach((sentence) => {
      expect(findFormerNames(sentence), sentence).to.have.lengthOf(1);
    });

    [
      'the header the setl support feature writes at the top of a card',
      'setl allows an empty reporter name, not an empty one',
      "{ stage: 'setl-web:unit1', runs: 6 }",
      '[data-lane="setl-web"]',
      'mounts on the board (setlfi-build, internal/fsm/fsm.go)',
      "from setlfi-fe's `lib/assistant/voice_chat.ts`",
      '`TestCardHeaderIsTheShapePlankaParses` pins it in setlfi-be.',
      'the setl-web host serves ~/setl-web/.env',
      'Osetljivo na velika/mala slova',
    ].forEach((sentence) => {
      expect(findFormerNames(sentence), sentence).to.deep.equal([]);
    });
  });

  it('should cite sibling repositories by their setlfi names in docs and code comments', () => {
    const offenders = [];
    SCANNED.forEach(({ dir, exts }) => {
      walk(path.join(ROOT, dir), exts, []).forEach((file) => {
        const rel = path.relative(ROOT, file);
        if (rel === SELF) {
          return;
        }
        findFormerNames(fs.readFileSync(file, 'utf8')).forEach(({ line, match }) => {
          offenders.push(`${rel}:${line}: ${match}`);
        });
      });
    });

    expect(
      offenders,
      'a repository is named by its former name — setl is setlfi-be, setl-web setlfi-fe, ' +
        'devteam-orchestrator setlfi-build',
    ).to.deep.equal([]);
  });
});
