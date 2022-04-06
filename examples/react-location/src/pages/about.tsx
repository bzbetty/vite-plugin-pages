import React from 'react'
import { Outlet } from '@tanstack/react-location'

const Component: React.FC = () => {
  return (
    <div>
      <p>nested about view:</p>
      <Outlet />
    </div>
  )
}

export default Component
