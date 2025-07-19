import React from 'react'
import { LinkComponent } from '../LinkComponent'
import { SITE_EMOJI } from '@/utils/site'
import { Connect } from './Connect'
import { FrostedGlass } from '../ui/FrostedGlass'
// import { NotificationsDrawer } from './NotificationsDrawer'

export function Header() {
  return (
    <header className='fixed top-0 left-0 right-0 z-50 p-4 pt-0'>
      <FrostedGlass className='navbar flex justify-between p-4 rounded-lg'>
        <LinkComponent href='/'>
          <h1 className='text-xl font-bold'>{SITE_EMOJI}</h1>
        </LinkComponent>

        <div className='flex gap-2'>
          <Connect />
          {/* <NotificationsDrawer /> */}
        </div>
      </FrostedGlass>
    </header>
  )
}
