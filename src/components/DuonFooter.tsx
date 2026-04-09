import SecretAdminLink from "./SecretAdminLink";

export default function DuonFooter() {
  return (
    <footer className="duon-footer">
      <div className="duon-footer-inner">
        <SecretAdminLink />
        <div className="duon-footer-brand">
          <span className="duon-footer-dev">
            개발사:{" "}
            <a href="https://lab.duonedu.net" target="_blank" rel="noopener noreferrer">미래이음연구소</a>
          </span>
          <span className="duon-footer-sep">&middot;</span>
          <span className="duon-footer-sponsor">
            협찬사:{" "}
            <a href="https://main.duonedu.net" target="_blank" rel="noopener noreferrer">두온교육(주)</a>
          </span>
        </div>
        <div className="duon-footer-info">
          <span><a href="tel:07050895960">Tel: 070-5089-5960</a></span>
          <span><a href="tel:01033434000">Mobile: 010-3343-4000</a></span>
          <span>사업자: 264-87-01676</span>
          <span>통신판매: 2020-경기평택-0204</span>
          <a href="mailto:duonedu@duonedu.net">duonedu@duonedu.net</a>
          <span>경기도 평택시 고덕중앙로 322 704호</span>
        </div>
        <div className="duon-footer-bank">
          무통장 입금 <strong>1005-903-896511 우리은행</strong> &middot; 예금주: 두온교육(주)
        </div>
        <div className="duon-footer-links">
          <a href="/privacy">개인정보처리방침</a>
          <span className="duon-footer-sep">&middot;</span>
          <a href="/terms">이용약관</a>
        </div>
        <div className="duon-footer-social">
          <a href="https://www.youtube.com/@mintorain7" target="_blank" rel="noopener noreferrer" title="유튜브"><i className="fa-brands fa-youtube" /></a>
          <a href="https://www.instagram.com/mintorain/" target="_blank" rel="noopener noreferrer" title="인스타그램"><i className="fa-brands fa-instagram" /></a>
          <a href="https://www.facebook.com/mintorain" target="_blank" rel="noopener noreferrer" title="페이스북"><i className="fa-brands fa-facebook" /></a>
          <a href="https://x.com/mintorain7" target="_blank" rel="noopener noreferrer" title="X (트위터)"><i className="fa-brands fa-x-twitter" /></a>
          <a href="https://open.kakao.com/o/gpLP613g" target="_blank" rel="noopener noreferrer" title="카카오톡 오픈채팅"><i className="fa-solid fa-comment" /></a>
          <a href="http://pf.kakao.com/_UzjZG/chat" target="_blank" rel="noopener noreferrer" title="고객센터"><i className="fa-solid fa-headset" /></a>
        </div>
        <p className="duon-footer-copy">&copy; 2026 미래이음연구소 &middot; 바이브코딩 &middot; 개발: 이신우</p>
      </div>
    </footer>
  );
}
