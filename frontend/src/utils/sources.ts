/**
 * Source URLs and Citations.
 * 
 * Centralized repository of official government and legal source URLs
 * referenced throughout the YORME-TRICS dashboard for compliance and attribution.
 * 
 * @module utils/sources
 */

/**
 * Official source URLs with labels for inline citations.
 */
export const SOURCES = {
  /** National Disaster Risk Reduction and Management Council */
  ndrrmc: {
    label: 'NDRRMC',
    href: 'https://ndrrmc.gov.ph/',
  },
  /** Philippine Atmospheric, Geophysical and Astronomical Services Administration */
  pagasa: {
    label: 'PAGASA',
    href: 'https://www.pagasa.dost.gov.ph/',
  },
  /** DepEd Order No. 37, s. 2022 - Guidelines on suspension of classes */
  depedOrder37: {
    label: 'DepEd Order 37',
    href: 'https://www.deped.gov.ph/2022/09/01/september-1-2022-do-037-s-2022-guidelines-on-the-cancellation-or-suspension-of-classes-and-work-in-schools-in-the-event-of-natural-disasters-power-outages-power-interruptions-and-other/',
  },
  /** Executive Order No. 66 - National Disaster Risk Reduction Framework */
  eo66: {
    label: 'Executive Order No. 66',
    href: 'https://lawphil.net/executive/execord/eo2012/eo_66_2012.html',
  },
  /** Republic Act No. 10173 - Data Privacy Act */
  ra10173: {
    label: 'RA 10173',
    href: 'https://privacy.gov.ph/data-privacy-act/',
  },
  /** Republic Act No. 10121 - Disaster Risk Reduction and Management Act */
  ra10121: {
    label: 'RA 10121',
    href: 'https://www.officialgazette.gov.ph/2010/05/27/republic-act-no-10121/',
  },
  /** Revised Penal Code Article 154 - Unlawful use of means of publication */
  rpc154: {
    label: 'RPC Art. 154',
    href: 'https://lawphil.net/statutes/repacts/ra1930/ra_3815_1930.html',
  },
  /** Manila Disaster Risk Reduction and Management Office */
  mdrrmo: {
    label: 'MDRRMO',
    href: 'https://manila.gov.ph/',
  },
  /** Manila Public Information Office */
  manilaPio: {
    label: 'Manila PIO',
    href: 'https://manila.gov.ph/',
  },
} as const;

/**
 * Type-safe source key for accessing SOURCES object.
 */
export type SourceKey = keyof typeof SOURCES;
