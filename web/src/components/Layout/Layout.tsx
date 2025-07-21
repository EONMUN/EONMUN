import React, { PropsWithChildren } from 'react'
import { Header } from './Header'

export function Layout(props: PropsWithChildren) {
  return (
    <div className='flex flex-col min-h-screen'>
      <Header />

      <main className='grow px-4 container max-w-3xl mx-auto'>{props.children}</main>

      {/* <Footer /> */}
    </div>
  )
}
