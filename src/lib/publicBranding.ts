/** Server `getPublicBranding()` bilan mos (ochiq sahifa / admin PATCH). */
export type PublicHomeCopy = {
  institutionTitle: string
  badge: string
  heroHighlight: string
  heroMid: string
  heroSubtitle: string
  introText: string
  rankingCardKicker: string
  rankingCardTitle: string
  rankingCardHint: string
  ctaPrimary: string
  ctaSecondary: string
}

export type PublicBranding = {
  siteName: string
  siteTagline: string
  footerLine: string
  home: PublicHomeCopy
}

export const DEFAULT_PUBLIC_BRANDING: PublicBranding = {
  siteName: 'Med-Iqtidor',
  siteTagline: 'Tibbiyot kadrlar uchun reyting va sertifikatlar tizimi',
  footerLine: '© Med-Iqtidor · Tibbiyot kadrlar platformasi',
  home: {
    institutionTitle: 'Toshkent davlat tibbiyot universiteti Termiz filiali',
    badge: 'Tibbiyot kadrlari · yutuqlar reytingi',
    heroHighlight: 'Tibbiyot kadrlar',
    heroMid: 'uchun',
    heroSubtitle: 'reyting va sertifikat platformasi',
    introText:
      'Reyting 10 ta taʼsir yoʻnalishi boʻyicha: har bir yoʻnalishda bitta tasdiqlangan material uchun maksimal 10 ball, jami teorik cheklov 100 ball. Yakuniy ball va nizom moderator zimmasida.',
    rankingCardKicker: 'Reyting va yutuqlar',
    rankingCardTitle: 'Reyting yetakchilari',
    rankingCardHint: 'Yutuq / sertifikat qatori ustiga bosib batafsil',
    ctaPrimary: 'Tizimga kirish',
    ctaSecondary: 'Reytingni ko‘rish',
  },
}
