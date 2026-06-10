// src/app/loading.tsx
// Skeleton global affiché pendant le chargement des Server Components

export default function Loading() {
  return (
    <div style={{
      minHeight: "100vh",
      paddingTop: "var(--navbar-height)",
      background: "var(--bg-base)",
    }}>
      {/* Hero skeleton */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        minHeight: "calc(100vh - var(--navbar-height))",
      }}>
        {/* Texte gauche */}
        <div style={{
          padding: "80px 64px 80px 40px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "20px",
          background: "#ffffff",
        }}>
          <div className="skeleton" style={{ width: "180px", height: "28px", borderRadius: "9999px" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div className="skeleton" style={{ width: "85%", height: "52px" }} />
            <div className="skeleton" style={{ width: "70%", height: "52px" }} />
            <div className="skeleton" style={{ width: "55%", height: "52px" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div className="skeleton" style={{ width: "90%", height: "18px" }} />
            <div className="skeleton" style={{ width: "80%", height: "18px" }} />
            <div className="skeleton" style={{ width: "65%", height: "18px" }} />
          </div>
          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
            <div className="skeleton" style={{ width: "160px", height: "46px", borderRadius: "8px" }} />
            <div className="skeleton" style={{ width: "140px", height: "46px", borderRadius: "8px" }} />
          </div>
        </div>

        {/* Image droite */}
        <div className="skeleton" style={{ borderRadius: 0 }} />
      </div>
    </div>
  );
}