import { strapi as strapiClient } from '@strapi/client';

const strapi = strapiClient({ baseURL: `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api`, auth: process.env.NEXT_PUBLIC_STRAPI_API_TOKEN });
export default strapi;