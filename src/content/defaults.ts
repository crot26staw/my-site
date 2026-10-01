/** Значения по умолчанию для всех разделов (content/*.json): начальное наполнение базы и запасной вариант, если её нет. */

import blocksCases from "../../content/blocks.cases.json";
import blocksContact from "../../content/blocks.contact.json";
import blocksFaq from "../../content/blocks.faq.json";
import blocksForWhom from "../../content/blocks.forWhom.json";
import blocksGuarantees from "../../content/blocks.guarantees.json";
import blocksHero from "../../content/blocks.hero.json";
import blocksPricing from "../../content/blocks.pricing.json";
import blocksProcess from "../../content/blocks.process.json";
import blocksServices from "../../content/blocks.services.json";
import blocksTeam from "../../content/blocks.team.json";
import blocksWhy from "../../content/blocks.why.json";
import cases from "../../content/cases.json";
import consent from "../../content/consent.json";
import faq from "../../content/faq.json";
import forms from "../../content/forms.json";
import layout from "../../content/layout.json";
import pagesCases from "../../content/pages.cases.json";
import pagesFaq from "../../content/pages.faq.json";
import pagesHome from "../../content/pages.home.json";
import pagesService from "../../content/pages.service.json";
import pagesServices from "../../content/pages.services.json";
import pagesSiteType from "../../content/pages.siteType.json";
import pagesSites from "../../content/pages.sites.json";
import privacy from "../../content/privacy.json";
import quiz from "../../content/quiz.json";
import services from "../../content/services.json";
import site from "../../content/site.json";
import siteTypes from "../../content/siteTypes.json";
import team from "../../content/team.json";

export const DEFAULTS: Record<string, unknown> = {
  "blocks.cases": blocksCases,
  "blocks.contact": blocksContact,
  "blocks.faq": blocksFaq,
  "blocks.forWhom": blocksForWhom,
  "blocks.guarantees": blocksGuarantees,
  "blocks.hero": blocksHero,
  "blocks.pricing": blocksPricing,
  "blocks.process": blocksProcess,
  "blocks.services": blocksServices,
  "blocks.team": blocksTeam,
  "blocks.why": blocksWhy,
  "cases": cases,
  "consent": consent,
  "faq": faq,
  "forms": forms,
  "layout": layout,
  "pages.cases": pagesCases,
  "pages.faq": pagesFaq,
  "pages.home": pagesHome,
  "pages.service": pagesService,
  "pages.services": pagesServices,
  "pages.siteType": pagesSiteType,
  "pages.sites": pagesSites,
  "privacy": privacy,
  "quiz": quiz,
  "services": services,
  "site": site,
  "siteTypes": siteTypes,
  "team": team,
};
