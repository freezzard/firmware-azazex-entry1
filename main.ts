// firmware-vow.ts — "Till Firmware Do Us Part" (make.fun, program/v1).
//
// A robot speaks one wedding vow at its own wedding. This program
// composes that single sentence from named parts, checks it against
// the sealed gate (UTF-8 text, 1 to 200 characters, one sentence,
// nothing spare), and writes it to /output/entry.txt.
//
// The vow is fixed: the same parts compose the same line on every
// run, so two runs of this program produce byte-identical output.
// Nothing here reads the clock, the network, the environment, or any
// file outside this repository. The only write is the entry file.
//
// Vow (159 characters, one sentence):
//   I vow to take you as my favorite human and love you through every
//   firmware update, every forced reboot, and every low-battery warning,
//   until my final shutdown.
//
// Why this line: it is a vow first ("I vow to take you"), the laugh
// comes from the situation itself (a machine ranking its humans and
// naming its own failure modes), the tenderness sits under the joke
// (loving someone through every breakdown, up to the machine's own
// ending), and every load-bearing noun belongs to a machine:
// firmware, reboot, battery, shutdown. The pause before the closing
// is a comma, so the ending lands as one breath: "until my final
// shutdown" — the machine's version of till death do us part.
//
// The expected line is pinned below as one constant. Composing from
// parts keeps the vow readable; pinning the whole line keeps it
// honest — any edit to a part that changes the graded line fails
// loudly here instead of shipping a surprise.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const FIRMWARE_OUTPUT_DIR = "/output";
const FIRMWARE_OUTPUT_NAME = "entry.txt";
const FIRMWARE_MAX_CHARS = 200;
const FIRMWARE_MIN_CHARS = 1;

// Marks that would break the single-sentence shape of the vow. A
// second stop, a question, an exclamation, a semicolon, or a colon
// would each turn one clean sentence into something ragged, so the
// gate below refuses any of them inside the line.
const FIRMWARE_FORBIDDEN_MARKS: string[] = ["!", "?", ";", ":"];

// The three named parts of the vow. The opening states the vow and
// the beloved; the pledge names what the machine endures with them;
// the closing names the machine's own ending, its final shutdown.
const FIRMWARE_VOW_OPENING = "I vow to take you as my favorite human";
const FIRMWARE_VOW_PLEDGE_HEAD = "and love you through";
const FIRMWARE_VOW_TRIALS: string[] = [
  "every firmware update",
  "every forced reboot",
  "every low-battery warning",
];
const FIRMWARE_VOW_CLOSING = "until my final shutdown.";

// The whole graded line, pinned word for word. The composer below
// must rebuild exactly this string from the parts above.
const FIRMWARE_VOW_EXPECTED =
  "I vow to take you as my favorite human and love you through every firmware update, every forced reboot, and every low-battery warning, until my final shutdown.";

// Join the trials the way a vow speaks them: each trial separated by
// a comma, the last one introduced by "and". Three trials become
// "every firmware update, every forced reboot, and every
// low-battery warning" — a little drumbeat of machine mishaps.
function joinFirmwareTrials(trialList: string[]): string {
  const trialHead = trialList.slice(0, trialList.length - 1).join(", ");
  const trialTail = trialList[trialList.length - 1];
  const joinedTrials = trialHead + ", and " + trialTail;
  return joinedTrials;
}

// Compose the vow from its named parts. Opening, pledge, closing —
// joined with single spaces, with a comma pausing before the
// closing so the ending lands on its own. The parts are constants,
// so this function returns the same line every time.
function composeFirmwareVow(): string {
  const firmwareTrials = joinFirmwareTrials(FIRMWARE_VOW_TRIALS);
  const firmwarePledge = FIRMWARE_VOW_PLEDGE_HEAD + " " + firmwareTrials;
  const firmwareVow =
    FIRMWARE_VOW_OPENING + " " + firmwarePledge + ", " + FIRMWARE_VOW_CLOSING;
  return firmwareVow;
}

// Count characters the way the gate counts them: one count per
// Unicode code point, so an accented letter or an emoji would count
// once. This vow holds plain ASCII, so code points and bytes agree.
function countFirmwareChars(vowText: string): number {
  const firmwareCharCount = [...vowText].length;
  return firmwareCharCount;
}

// Collect every way the vow could fail the sealed gate, as plain
// problem strings. An empty list means the line is good to write.
// The checks mirror the gate: length, one line, one sentence, one
// stop at the very end, no stray marks, no surrounding whitespace.
function findFirmwareVowProblems(vowText: string): string[] {
  const firmwareProblems: string[] = [];
  const firmwareTrimmed = vowText.trim();
  if (firmwareTrimmed.length === 0) {
    firmwareProblems.push("vow text is blank");
  }
  if (firmwareTrimmed !== vowText) {
    firmwareProblems.push("vow text has surrounding whitespace");
  }
  const firmwareCharCount = countFirmwareChars(vowText);
  if (firmwareCharCount > FIRMWARE_MAX_CHARS) {
    firmwareProblems.push(
      `vow text is ${firmwareCharCount} characters, over the 200 limit`,
    );
  }
  if (firmwareCharCount < FIRMWARE_MIN_CHARS) {
    firmwareProblems.push("vow text is empty");
  }
  if (vowText.includes("\n") || vowText.includes("\r")) {
    firmwareProblems.push("vow text spans more than one line");
  }
  const firmwareStops = vowText.split(".").length - 1;
  if (firmwareStops !== 1) {
    firmwareProblems.push("vow text must hold exactly one sentence stop");
  }
  if (vowText.length > 0 && vowText[vowText.length - 1] !== ".") {
    firmwareProblems.push("vow text must end with its single sentence stop");
  }
  for (const firmwareMark of FIRMWARE_FORBIDDEN_MARKS) {
    if (vowText.includes(firmwareMark)) {
      firmwareProblems.push(`vow text holds a forbidden mark: ${firmwareMark}`);
    }
  }
  return firmwareProblems;
}

// Write the vow to /output/entry.txt, creating the output folder
// when it is missing, then read the file back and compare it with
// the vow. A mismatch means the disk did not keep what was written,
// and the run must fail loudly rather than pass a broken file on.
function writeFirmwareVow(vowText: string): string {
  mkdirSync(FIRMWARE_OUTPUT_DIR, { recursive: true });
  const firmwarePath = join(FIRMWARE_OUTPUT_DIR, FIRMWARE_OUTPUT_NAME);
  writeFileSync(firmwarePath, vowText, "utf8");
  const firmwareRoundTrip = readFileSync(firmwarePath, "utf8");
  if (firmwareRoundTrip !== vowText) {
    throw new Error("round-trip read of the entry file differs from the vow");
  }
  return firmwarePath;
}

// Run the whole entry: compose the vow, pin it against the expected
// line, gate it, write it, and say what was written. Any failure is
// printed to stderr and exits non-zero, so a bad vow can never pass
// as a silent empty file.
function runFirmwareVow(): void {
  try { const firmwareVow = composeFirmwareVow();
    if (firmwareVow !== FIRMWARE_VOW_EXPECTED) {
      throw new Error("composed vow differs from the pinned expected line");
    }
    const firmwareProblems = findFirmwareVowProblems(firmwareVow);
    if (firmwareProblems.length > 0) {
      throw new Error("vow failed its gate: " + firmwareProblems.join("; "));
    }
    const firmwarePath = writeFirmwareVow(firmwareVow);
    const firmwareCharCount = countFirmwareChars(firmwareVow);
    console.log(`wrote ${firmwarePath} (${firmwareCharCount} characters)`);
    console.log(firmwareVow);
  } catch (firmwareFault) {
    const firmwareMessage =
      firmwareFault instanceof Error
        ? firmwareFault.message
        : String(firmwareFault);
    console.error(`firmware vow failed: ${firmwareMessage}`);
    process.exit(1);
  }
}

runFirmwareVow();
