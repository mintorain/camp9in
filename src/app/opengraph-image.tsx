import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AI캠프 강사 모집 | 두온교육";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #7c3aed 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              fontSize: "64px",
              display: "flex",
            }}
          >
            🤖🎮🚁🎵
          </div>
        </div>
        <div
          style={{
            fontSize: "72px",
            fontWeight: "bold",
            color: "white",
            marginBottom: "8px",
            display: "flex",
          }}
        >
          AI캠프 강사 모집
        </div>
        <div
          style={{
            fontSize: "36px",
            color: "#fcd34d",
            fontWeight: "bold",
            marginBottom: "32px",
            display: "flex",
          }}
        >
          AI로 만나는 미래 교육 체험 캠프
        </div>
        <div
          style={{
            display: "flex",
            gap: "32px",
            marginBottom: "32px",
          }}
        >
          {["미금초 4/20~24", "정림초 4/29", "청원초 6/12"].map((text) => (
            <div
              key={text}
              style={{
                background: "rgba(255,255,255,0.15)",
                borderRadius: "16px",
                padding: "12px 24px",
                color: "white",
                fontSize: "24px",
                display: "flex",
              }}
            >
              {text}
            </div>
          ))}
        </div>
        <div
          style={{
            fontSize: "28px",
            color: "rgba(255,255,255,0.6)",
            display: "flex",
          }}
        >
          두온교육(주) | camp9in.duonedu.net
        </div>
      </div>
    ),
    { ...size }
  );
}
