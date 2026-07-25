import {Navigate, Outlet} from 'react-router-dom';

function LoggedInRoute(props) {
  if (!props.isLoggedIn()) {
    return (
      <Outlet/>
    )
  }

  return (<Navigate to="/login" replace />)
}

export { LoggedInRoute };
