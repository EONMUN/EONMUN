import { strapi } from '@strapi/client';

console.log({NEXT_PUBLIC_STRAPI_API_URL: process.env.NEXT_PUBLIC_STRAPI_API_URL, NEXT_PUBLIC_STRAPI_API_TOKEN: process.env.NEXT_PUBLIC_STRAPI_API_TOKEN})
export const client = strapi({ baseURL: `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api`, auth: process.env.NEXT_PUBLIC_STRAPI_API_TOKEN });