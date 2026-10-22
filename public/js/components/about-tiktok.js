import { icon } from '../lib/icons.js';

export const tiktokProfile = 'https://www.tiktok.com/@babycityperu';
const videoId = '7646211098378521877';
const captures = [
  ['tiktok-live', 'En nuestros lives', 'Captura real de los lives de BabyCity'],
  ['tiktok-pedidos', 'Preparamos tus pedidos', 'Captura real de la preparación de pedidos de BabyCity'],
  ['tiktok-tienda', 'Conoce nuestra tienda', 'Captura real de la tienda BabyCity'],
];

export function renderAboutTikTok() {
  return `<div class="about-tiktok-grid">
    <figure class="about-video"><div class="about-video-frame"><iframe src="https://www.tiktok.com/player/v1/${videoId}?autoplay=0&rel=0&description=0&music_info=0" title="Video de BabyCity en TikTok" loading="lazy" allow="fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div><figcaption><a href="${tiktokProfile}/video/${videoId}" target="_blank" rel="noopener noreferrer">BabyCity en TikTok ↗</a></figcaption></figure>
    ${captures.map(([file, label, alt]) => `<a class="about-tiktok-card" href="${tiktokProfile}" target="_blank" rel="noopener noreferrer" aria-label="${label}: explorar el perfil de BabyCity en TikTok"><div class="about-tiktok-poster"><img src="/assets/community/${file}.webp" alt="${alt}" width="253" height="329" loading="lazy"></div><span>${label}</span><small>Explorar en TikTok ${icon('arrow')}</small></a>`).join('')}
  </div>`;
}
