export const tiktokProfile = 'https://www.tiktok.com/@babycityperu';

// Para cambiar los videos: actualiza esta lista y ejecuta scripts/fetch-tiktok-covers.mjs con los mismos ids.
export const tiktokVideos = [
  '7646211098378521877',
  '7663894714713787668',
  '7619830704683109653',
  '7688956626086219029',
];

const playIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 11 7-11 7V5Z"/></svg>';

const card = (id, index) =>
  `<figure class="about-video"><div class="about-video-frame"><button type="button" class="about-video-poster" data-tiktok-play="${id}" aria-label="Reproducir el video ${index + 1} de BabyCity"><img src="/assets/about/tiktok-${id}.jpg" alt="Portada del video ${index + 1} de BabyCity en TikTok" width="540" height="960" loading="lazy"><span class="about-video-play">${playIcon}</span></button></div><figcaption><a href="${tiktokProfile}/video/${id}" target="_blank" rel="noopener noreferrer" aria-label="Ver video ${index + 1} de BabyCity en TikTok">Ver en TikTok ↗</a></figcaption></figure>`;

export function renderAboutTikTok() {
  return `<div class="about-tiktok-grid">${tiktokVideos.map(card).join('')}</div>`;
}
