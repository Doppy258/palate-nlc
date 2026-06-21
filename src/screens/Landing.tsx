export default function Landing() {
  return (
    <div className="fixed inset-0 z-50 bg-black">
      <iframe
        src="./lumio/index.html"
        title="Lumio"
        className="h-full w-full border-0"
        style={{ width: '100vw', height: '100dvh', border: 'none', display: 'block' }}
      />
    </div>
  )
}
