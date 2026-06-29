import Sidenav from './Sidenav'

export default function Layout({ children }) {
  return (
    <>
      <Sidenav />
      <div className="layout-content">
        {children}
      </div>
    </>
  )
}
