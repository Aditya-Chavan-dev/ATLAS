import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-xl)' }}>
      <Navbar />
      <main className="fade-in">
        {children}
      </main>
    </div>
  );
};

export default Layout;
