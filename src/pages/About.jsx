export default function About() {
  return (
    <main className="section-shell page-top about-page">
      <div className="section-heading about-heading">
        <p className="eyebrow">关于</p>
        <h1>关于这个影像档案</h1>
        <p>
          这里保存一些个人摄影作品，也保存一种观看方式：放慢速度，认真看见，并让某个瞬间继续停留。
        </p>
      </div>

      <div className="about-layout">
        <div className="about-copy">
          <p className="about-lede">
            这个网站不是一份简历，也不是一次作品包装。它更接近一个缓慢生长的影像档案，收集那些在日常、旅途和现场中被认真看见的片刻。
          </p>
          <p>
            照片里的内容可能是光线经过墙面，街角短暂的秩序，人与环境之间不易察觉的关系，也可能只是一个没有被命名的下午。
          </p>
          <p>
            这个档案关心的不是立刻解释一切，而是保留观看本身。先停下来，看清楚，再让瞬间保有它原来的重量。
          </p>
        </div>

        <aside className="contact-panel" aria-label="关于这个影像档案的补充信息">
          <div className="about-note">
            <h2>档案</h2>
            <p>个人摄影作品持续整理中。</p>
          </div>
          <div className="about-note">
            <h2>观看</h2>
            <p>认真观看，不急于解释。</p>
          </div>
          <div className="about-note">
            <h2>联系</h2>
            <p>
              <a href="mailto:paperboxmouse@163.com">paperboxmouse@163.com</a>
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
