export default function ShareQR() {
  return (
    <section className="card shareqr">
      <img src="/qr-syokuhinn.png" alt="アプリを開くQRコード" width={140} height={140} />
      <div>
        <h2 className="h2" style={{ marginTop: 0 }}>
          友だちに紹介する
        </h2>
        <p>スマホのカメラでQRコードを読み取ると、このアプリが開きます。</p>
        <a href="/qr-syokuhinn.png" download="syokuhinn-qr.png">
          QRコードを保存
        </a>
      </div>
    </section>
  );
}
