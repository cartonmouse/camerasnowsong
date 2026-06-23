export default function Header({ currentPage, onNavigate }) {
  const items = [
    ["home", "首页"],
    ["portfolio", "作品"],
    ["about", "关于"]
  ];

  return (
    <header className="site-header">
      <button className="brand" onClick={() => onNavigate("home")}>
        <span>镜头</span>
        <span>手记</span>
      </button>
      <nav aria-label="主导航">
        {items.map(([page, label]) => (
          <button
            key={page}
            className={currentPage === page ? "active" : ""}
            onClick={() => onNavigate(page)}
          >
            {label}
          </button>
        ))}
      </nav>
    </header>
  );
}
