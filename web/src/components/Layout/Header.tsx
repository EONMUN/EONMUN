import React from 'react'
import { LinkComponent } from '../LinkComponent'
import { SITE_NAME, SOCIAL_TWITTER, SOCIAL_INSTAGRAM } from '@/utils/site'
import { FrostedGlass } from '../ui/FrostedGlass'
import { Twitter, Instagram } from 'lucide-react'
// import { NotificationsDrawer } from './NotificationsDrawer'

export function Header() {
  return (
    <header className='fixed top-0 left-0 right-0 z-50 p-4 flex justify-between'>
        <LinkComponent href='/' className='flex items-center'>
          <h1 className='text-white tracking-[0.363636em] text-3xl font-bold'>{SITE_NAME}</h1>
        </LinkComponent>

      <FrostedGlass className='navbar flex gap-4 uppercase justify-between p-4 text-white rounded-lg font-bold tracking-widest' variant='dark'>
      <LinkComponent href='/'>
          About
        </LinkComponent>
        <LinkComponent href='/'>
          Store
        </LinkComponent>
        <LinkComponent href={`https://x.com/${SOCIAL_TWITTER}`} className="flex items-center justify-center">
            <Twitter className='w-3 h-3' />
        </LinkComponent>
        <LinkComponent href={`https://instagram.com/${SOCIAL_INSTAGRAM}`} className="flex items-center justify-center">
            <Instagram className='w-3 h-3' />
        </LinkComponent>
      </FrostedGlass>
    </header>
  )
}
