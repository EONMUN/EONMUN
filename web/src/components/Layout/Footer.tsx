import React from 'react'
import { SITE_EMOJI, SITE_INFO, SOCIAL_GITHUB, SOCIAL_TWITTER } from '@/utils/site'
// import { FaGithub, FaXTwitter } from 'react-icons/fa6'
// import { NetworkStatus } from './NetworkStatus'
import { LinkComponent } from '../LinkComponent'
import { FrostedGlass } from '../ui/FrostedGlass'

export function Footer() {
  return (
    <>
      <div className='place-self-end'>
        {/* <NetworkStatus /> */}
      </div>

      <footer className='sticky top-[100vh] p-4 '>
        <div className='footer flex justify-between items-center gap-4'>
          <FrostedGlass variant='dark' className='p-4 rounded-lg'>
            <div className='flex flex-col gap-2'>
              <p className='text-white'>
                {SITE_EMOJI} {SITE_INFO}
              </p>
            </div>
          </FrostedGlass>
          
          <FrostedGlass variant='dark' className='p-4 rounded-lg'>
            <div className='flex gap-4'>
              <LinkComponent href={`https://github.com/${SOCIAL_GITHUB}`}>
                <span className='text-white hover:text-gray-300'>
                  {/* <FaGithub /> */}
                  Github
                </span>
              </LinkComponent>
              <LinkComponent href={`https://x.com/${SOCIAL_TWITTER}`}>
                <span className='text-white hover:text-gray-300'>
                  {/* <FaXTwitter /> */}
                  Twitter
                </span>
              </LinkComponent>
            </div>
          </FrostedGlass>
        </div>
      </footer>
    </>
  )
}
