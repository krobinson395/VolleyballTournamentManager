import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav
      style={{
        borderBottom: '1px solid #ddd',
        marginBottom: '32px',
        paddingBottom: '16px',
      }}
    >
    

      <div
        style={{
          display: 'flex',
          gap: '16px',
        }}
      >
        <Link to="/">Standings</Link>
        <Link to="/matches">Match History</Link>
        <Link to="/bracket">Bracket</Link>
        <Link to="/admin">Admin</Link>
      </div>
    </nav>
  );
}

export default Navbar;