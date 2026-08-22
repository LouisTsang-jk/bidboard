import type { MetadataRoute } from "next";

const baseUrl = "https://outbid.website";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: baseUrl,
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/rules`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
