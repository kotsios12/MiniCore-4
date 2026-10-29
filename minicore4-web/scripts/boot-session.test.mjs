import { test } from 'node:test';
import assert from 'node:assert/strict';

let moduleNumber = 0;
async function withBrowser({ reduced = false, seen = false, denied = false } = {}, check) {
  const oldWindow = globalThis.window;
  const storage = new Map(seen ? [['minicore4_boot_seen', '1']] : []);
  globalThis.window = {
    matchMedia: () => ({ matches: reduced }),
    get sessionStorage() {
      if (denied) throw new Error('Storage access denied');
      return {
        getItem: key => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
      };
    },
  };
  try {
    const session = await import(`../src/components/BootSequence/bootSession.ts?test=${++moduleNumber}`);
    await check(session, storage);
  } finally {
    if (oldWindow === undefined) delete globalThis.window;
    else globalThis.window = oldWindow;
  }
}

test('boot plays on a fresh tab and records the session', async () => {
  await withBrowser({}, ({ shouldPlayBoot, markBootSeen }, storage) => {
    assert.equal(shouldPlayBoot(), true);
    markBootSeen();
    assert.equal(storage.get('minicore4_boot_seen'), '1');
    assert.equal(shouldPlayBoot(), false);
  });
});

test('boot does not replay when the tab session already contains the marker', async () => {
  await withBrowser({ seen: true }, ({ shouldPlayBoot }) => {
    assert.equal(shouldPlayBoot(), false);
  });
});

test('reduced motion bypasses the intro without waiting', async () => {
  await withBrowser({ reduced: true }, ({ shouldPlayBoot }) => {
    assert.equal(shouldPlayBoot(), false);
  });
});

test('blocked storage degrades to a once-per-page memory fallback', async () => {
  await withBrowser({ denied: true }, ({ shouldPlayBoot, markBootSeen }) => {
    assert.equal(shouldPlayBoot(), true);
    assert.doesNotThrow(markBootSeen);
    assert.equal(shouldPlayBoot(), false);
  });
});

test('a fresh independent tab has its own boot decision', async () => {
  await withBrowser({ seen: true }, ({ shouldPlayBoot }) => assert.equal(shouldPlayBoot(), false));
  await withBrowser({}, ({ shouldPlayBoot }) => assert.equal(shouldPlayBoot(), true));
});
