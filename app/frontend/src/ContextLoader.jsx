import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Spinner } from 'reactstrap';

function ContextLoader(WrappedComponent) {
  return function ContextLoaderWrapper(props) {
    const [context, setContext] = useState({});
    // State transition: init -> loading -> done
    const [status, setStatus] = useState('init');

    useEffect(() => {
      if (status !== 'init') return;
      (async () => {
        const { data } = await axios.get('/api/context');
        // Utility to add extra wait for development purpose
        // await new Promise((resolve) => setTimeout(resolve, 3000));
        setContext(data);
        setStatus('done');
      })();
      setStatus('loading');
    }, [status]);

    if (status !== 'done') {
      return (
        <div className="vh-100 d-flex align-items-center justify-content-center">
          <Spinner color="primary" type="grow">
            Loading...
          </Spinner>
        </div>
      );
    }
    // eslint-disable-next-line react/jsx-props-no-spreading
    return <WrappedComponent context={context} {...props} />;
  };
}

export default ContextLoader;
