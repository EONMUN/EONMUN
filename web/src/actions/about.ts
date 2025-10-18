'use server';

import { aboutAPI, About } from '@/lib/strapi';

export async function getAboutPage(): Promise<About> {
  const about = await aboutAPI.get();
  return about;
}
