import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ReleaseNote } from '../releases.ts';
import { formatReleaseDay, releaseVelocity } from './velocity.ts';

function note(version: string, dateIso: string | null): ReleaseNote {
  return {
    version,
    dateLabel: dateIso ?? 'unreleased',
    dateIso,
    kind: 'patch',
    summary: '',
    notes: [],
    sections: [],
    links: [],
    installCommand: `pip install opentide==${version}`,
  };
}

test('counts dated releases from the first public one to the latest', () => {
  const v = releaseVelocity([
    note('0.12.1', '2026-10-09'),
    note('0.12.0', '2026-10-09'),
    note('0.11.0', '2026-10-07'),
    note('0.1.1', '2026-09-11'),
    note('0.1.0', '2026-09-09'),
  ]);
  assert.deepEqual(v, {
    count: 5,
    first: { version: '0.1.0', dateIso: '2026-09-09' },
    latest: { version: '0.12.1', dateIso: '2026-10-09' },
    days: 31,
  });
});

test('picks the newest of several same-day releases and the oldest first-day one', () => {
  const v = releaseVelocity([
    note('0.2.1', '2026-09-18'),
    note('0.2.0', '2026-09-18'),
    note('0.1.1', '2026-09-11'),
    note('0.1.0', '2026-09-11'),
  ]);
  assert.equal(v?.latest.version, '0.2.1');
  assert.equal(v?.first.version, '0.1.0');
  assert.equal(v?.days, 8);
});

test('ignores undated entries and returns null when nothing is dated', () => {
  assert.equal(releaseVelocity([note('1.0.0', null)]), null);
  assert.equal(releaseVelocity([note('1.0.0', null), note('0.9.0', '2026-10-01')])?.count, 1);
});

test('formats ISO days without the host locale', () => {
  assert.equal(formatReleaseDay('2026-09-09'), '9 September 2026');
  assert.equal(formatReleaseDay('2026-10-12'), '12 October 2026');
});
