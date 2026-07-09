export type ServiceCategoryValue = "website" | "hosting" | "security" | "seo" | "other";

export function classifyServiceCategory(name: string): ServiceCategoryValue {
  if (/hosting|domain/i.test(name)) return "hosting";
  if (/seo|gmb|google my business/i.test(name)) return "seo";
  if (/gdpr|privacy|ssl|security|ico registration/i.test(name)) return "security";
  if (/website|web design|wordpress|wix|shopify|redesign/i.test(name)) return "website";
  return "other";
}
