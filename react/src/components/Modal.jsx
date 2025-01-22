const Modal = ({ open, setOpen, title, children }) => {
  if (!open) return null;

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#00000066', zIndex: 1000 }}
      onClick={() => setOpen(false)}
    >
      <div
        style={{ position: 'relative', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: '#181818', borderRadius: 12, maxWidth: 'min(90%, 500px)' }}
        onClick={event => {
          // Stop propagation so clicking on the modal doesn't close it.
          event.stopPropagation();
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #555', padding: 12 }}>
          <h2 style={{ fontSize: 18 }}>{title}</h2>
          <button
            className="btnSecondary"
            style={{ padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}
            onClick={() => setOpen(false)}
          >
            <svg viewBox="0 0 100 100" style={{ width: '20px', height: '20px' }} stroke='#ddd' strokeWidth='10' strokeLinecap='round'>
              <line x1="5" y1="5" x2="95" y2="95" />
              <line x1="95" y1="5" x2="5" y2="95" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
