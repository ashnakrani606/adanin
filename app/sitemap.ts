import { MetadataRoute } from 'next';

const baseUrl = 'https://adamiani.ai';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },

    // Add your public pages here
  ];
}