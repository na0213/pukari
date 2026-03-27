// ── 入退室 SE ──
export const LAGOON_SE = {
  enter: '/sounds/lagoon-enter.mp3',
  otherEnter: '/sounds/lagoon-other.mp3',
};

const seBufferCache = new Map<string, Promise<AudioBuffer>>();
let sharedSEAudioContext: AudioContext | null = null;

function getSEAudioContext(): AudioContext {
  if (sharedSEAudioContext) return sharedSEAudioContext;

  const Ctor = window.AudioContext
    || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) {
    throw new Error('Web Audio API is not supported');
  }
  sharedSEAudioContext = new Ctor();
  return sharedSEAudioContext;
}

async function loadSEBuffer(context: AudioContext, src: string): Promise<AudioBuffer> {
  const cached = seBufferCache.get(src);
  if (cached) return cached;

  const promise = fetch(src)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch audio: ${src}`);
      return res.arrayBuffer();
    })
    .then((arrayBuffer) => context.decodeAudioData(arrayBuffer));

  seBufferCache.set(src, promise);
  return promise;
}

// ── SE 再生ヘルパー（ファイルが存在しなければ無音） ──
export function playSE(src: string): void {
  void (async () => {
    try {
      const context = getSEAudioContext();
      await context.resume().catch(() => {});
      const buffer = await loadSEBuffer(context, src);
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.start(0);
    } catch {
      // ファイルがなければ無視
    }
  })();
}
