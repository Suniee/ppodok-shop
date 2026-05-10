export default function Footer() {
  const links = ["회사소개", "이용약관", "개인정보처리방침", "고객센터", "공지사항"]

  return (
    <footer className="bg-white mt-12" style={{ borderTop: "1px solid var(--toss-border)" }}>
      <div className="max-w-5xl mx-auto px-5 py-10">
        {/* Logo */}
        <div className="flex items-center gap-1.5 mb-5">
          <span className="font-black text-base" style={{ color: "var(--toss-blue)" }}>뽀독샵</span>
        </div>

        {/* Nav links */}
        <div className="flex flex-wrap gap-x-5 gap-y-2 mb-6">
          {links.map((l, i) => (
            <a
              key={l}
              href="#"
              className="text-sm transition-colors hover:opacity-70"
              style={{ color: i === 2 ? "var(--toss-text-primary)" : "var(--toss-text-secondary)", fontWeight: i === 2 ? 600 : 400 }}
            >
              {l}
            </a>
          ))}
        </div>

        {/* Company info */}
        <div className="text-xs leading-relaxed space-y-1 mb-6" style={{ color: "var(--toss-text-tertiary)" }}>
          <p>상호명: 제이코리아 | 대표자: 대표이사 | 사업자등록번호: 000-00-00000</p>
          <p>통신판매신고번호: 제0000-서울강서-0000호 | 주소: 서울특별시 강서구 마곡동 000-00</p>
          <p>
            고객센터:{" "}
            <a href="tel:0226061285" className="font-semibold hover:opacity-70 transition-opacity" style={{ color: "var(--toss-text-secondary)" }}>
              02-2606-1285
            </a>
            {" "}(평일 10:00~18:00, 주말·공휴일 휴무)
          </p>
        </div>

        {/* Bottom */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
            © 2025 뽀독샵. All Rights Reserved.
          </p>
          <div className="flex gap-2">
            {[
              { label: "f", bg: "#1877F2" },
              { label: "ig", bg: "#E4405F" },
              { label: "N", bg: "#03C75A" },
              { label: "K", bg: "#FAE100", color: "#3C1E1E" },
            ].map((s) => (
              <a
                key={s.label}
                href="#"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black hover:opacity-80 transition-opacity"
                style={{ backgroundColor: s.bg, color: s.color ?? "#fff" }}
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
