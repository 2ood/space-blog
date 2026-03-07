export default function PostLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ height: 'auto', overflow: 'auto' }}>
      {children}
    </div>
  )
}
