export default function CategoryFilter({ items, selected, onSelect, ariaLabel }) {
  return (
    <div className="category-filter" aria-label={ariaLabel}>
      {items.map((item) => (
        <button
          key={item.id}
          className={selected === item.id ? "active" : ""}
          onClick={() => onSelect(item.id)}
        >
          {item.title}
        </button>
      ))}
    </div>
  );
}
