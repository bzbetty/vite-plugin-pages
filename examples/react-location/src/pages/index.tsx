import React from 'react'
import { Link } from '@tanstack/react-location'

const index: React.FC = () => {
  return (
    <div>
      <p>index</p>
      <Link to="/blog">
        blog
      </Link> |
      <Link to="/about">
        about
      </Link> |
      <Link to="/components">
        components
      </Link> |
      <Link to="/xxx">
        not exists
      </Link>
    </div>
  )
}

index.loader = async () => {
  return new Promise(resolve => setTimeout(resolve, 2000));
};

index.pendingElement = () => {
  return <div>Loading</div>;
};

index.errorElement = () => {
  return <div>Error</div>;
};

export default index;
