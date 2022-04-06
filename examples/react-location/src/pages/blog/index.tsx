import React from 'react'
import { Link } from '@tanstack/react-location'

const Component: React.FC = () => {
  return (
    <>
      <p>blog/index</p>
      <Link to="/blog/1b234bk12b3">
        id: 1b234bk12b3
      </Link> |
      <Link to="/blog/today">
        today
      </Link> |
      <Link to="/blog/today/xxx">
        not exit
      </Link>
    </>
  )
}

Component.loader = async () => {
  return new Promise(resolve => setTimeout(resolve, 2000));
};

Component.pendingElement = () => {
  return <div>Loading</div>;
};

Component.errorElement = () => {
  return <div>Error</div>;
};

export default Component
