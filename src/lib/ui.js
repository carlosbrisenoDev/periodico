export const ui = {
  page: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '16px',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  sectionTitle: {
    marginBottom: '8px',
  },
  card: {
    border: '1px solid #a8a8a8',
    padding: '12px',
    marginBottom: '12px',
    background: '#fff',
  },
  cardTitle: {
    margin: '0 0 8px',
  },
  row: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  split: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '12px',
  },
  list: {
    margin: '0',
    paddingLeft: '18px',
  },
  link: {
    color: '#0b4dad',
    textDecoration: 'none',
  },
  input: {
    padding: '8px',
    minWidth: '220px',
    flex: '1 1 220px',
    border: '1px solid #a8a8a8',
  },
  textarea: {
    padding: '8px',
    minWidth: '260px',
    width: '100%',
    border: '1px solid #a8a8a8',
  },
  button: {
    padding: '8px 10px',
    cursor: 'pointer',
    border: '1px solid #8f8f8f',
    background: '#f4f4f4',
  },
  pre: {
    background: '#f0f0f0',
    padding: '8px',
    whiteSpace: 'pre-wrap',
    overflowX: 'auto',
  },
  muted: {
    color: '#666',
    margin: '4px 0 0',
  },
}

export const getId = (item) => item?.id ?? item?._id ?? ''
