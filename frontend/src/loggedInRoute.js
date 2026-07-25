import {Navigate, Outlet} from 'react-router';

function LoggedInRoute(props) {
  if (!props.isLoggedIn) {
    return (
      <Outlet/>
    )
  }

  return (<Navigate to="/" replace />)
}

export { LoggedInRoute };
