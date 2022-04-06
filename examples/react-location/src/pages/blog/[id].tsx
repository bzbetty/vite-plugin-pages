import React from 'react'
import { useMatch } from '@tanstack/react-location'

const Component: React.FC = () => {
  const { params: { id } } = useMatch()
  return (
    <p>blog/[id].tsx: { id }</p>
  )
}

export default Component
