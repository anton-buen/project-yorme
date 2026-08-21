/** Official source URLs cited inline across the dashboard. */
export const SOURCES = {
  ndrrmc: {
    label: 'NDRRMC',
    href: 'https://ndrrmc.gov.ph/',
  },
  pagasa: {
    label: 'PAGASA',
    href: 'https://www.pagasa.dost.gov.ph/',
  },
  depedOrder37: {
    label: 'DepEd Order 37',
    href: 'https://www.deped.gov.ph/2022/09/01/september-1-2022-do-037-s-2022-guidelines-on-the-cancellation-or-suspension-of-classes-and-work-in-schools-in-the-event-of-natural-disasters-power-outages-power-interruptions-and-other/',
  },
  eo66: {
    label: 'Executive Order No. 66',
    href: 'https://lawphil.net/executive/execord/eo2012/eo_66_2012.html',
  },
  ra10173: {
    label: 'RA 10173',
    href: 'https://privacy.gov.ph/data-privacy-act/',
  },
  rpc154: {
    label: 'RPC Art. 154',
    href: 'https://lawphil.net/statutes/repacts/ra1930/ra_3815_1930.html',
  },
  manilaPio: {
    label: 'Manila PIO',
    href: 'https://manila.gov.ph/',
  },
} as const;

export type SourceKey = keyof typeof SOURCES;
